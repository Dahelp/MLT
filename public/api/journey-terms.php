<?php
declare(strict_types=1);
require_once __DIR__.'/journey-pricing.php';

function mlt_journey_variant(array $body): string {
    $id = strtolower(trim((string)($body['collection'] ?? '')));
    if ($id === 'freedom' && !empty($body['freedomPlus'])) return 'freedom_plus';
    if ($id === 'signature' && !empty($body['signatureTailored'])) return 'signature_tailored';
    return $id;
}

function mlt_protection_settings(PDO $db): array {
    $raw = $db->query('SELECT settings_json FROM mlt_journey_settings WHERE id=1')->fetchColumn();
    return $raw ? json_decode($raw, true, 512, JSON_THROW_ON_ERROR) : ['percent'=>5, 'enabled'=>true, 'terms'=>'MLT Flexible Protection gives the right to cancellation, rescheduling and a partial refund on preferential terms. The applicable limits are agreed individually with MLT management.'];
}

/** Only the server assigns prices. Security is refundable collateral, outside the tour total. */
function mlt_journey_terms(array $body, array $protection = []): array {
    $config = mlt_journey_pricing();
    $variant = mlt_journey_variant($body);
    $id = ['freedom_plus'=>'freedom', 'signature_tailored'=>'signature'][$variant] ?? $variant;
    $days = (int)($body['days'] ?? 0);
    $tables = mlt_journey_rate_tables();
    $base = $variant === 'freedom_plus' ? ($config['freedomPlus'][$days] ?? 0) : ($tables[$id][$days] ?? 0);
    if ($base <= 0) throw new DomainException('Invalid journey selection.');
    $policy = $config['policies'][$variant] ?? null;
    if (!$policy) return ['version'=>1,'variant'=>$variant,'base'=>$base,'tourTotal'=>$base,'total'=>$base];
    $guests = max(1, min(8, (int)($body['guests'] ?? 2)));
    $tour = $base + max(0, $guests - 2) * $config['extraGuestRate'];
    $selected = !empty($body['flexibleProtection']);
    if ($selected && (empty($protection['enabled']) || trim((string)($protection['terms'] ?? '')) === '')) throw new DomainException('Flexible Protection is not available until its terms are confirmed.');
    $percent = $selected ? (float)($protection['percent'] ?? 5) : 0;
    if ($percent !== 0 && ($percent < 5 || $percent > 8 || !is_finite($percent))) throw new DomainException('Invalid protection rate.');
    $fee = round($base * $percent / 100, 2);
    return ['version'=>1, 'variant'=>$variant, 'base'=>$base, 'tourTotal'=>$tour,
        'protectionPercent'=>$percent, 'protectionAmount'=>$fee, 'protectionTerms'=>$selected ? $protection['terms'] : '',
        'planningFee'=>$variant === 'signature_tailored' ? 500 : 0, 'routeApproved'=>$variant !== 'signature_tailored',
        'contractSigned'=>$variant !== 'private', 'total'=>round($tour+$fee+($variant==='signature_tailored'?500:0),2), 'policy'=>$policy];
}

function mlt_order_terms(array $order): ?array {
    $terms = json_decode((string)($order['journey_terms_json'] ?? ''), true);
    return is_array($terms) && isset($terms['policy']) ? $terms : null;
}

/** Next cumulative milestone, minus actual receipts; partial payments never skip a stage. */
function mlt_journey_next_payment(array $terms, float $paid): float {
    $planning = (float)$terms['planningFee'];
    $total = (float)$terms['total'];
    if ($planning > $paid + .009) return round($planning-$paid,2);
    if (empty($terms['routeApproved']) || empty($terms['contractSigned'])) return 0;
    $cumulative = $planning;
    $tour = (float)$terms['tourTotal'];
    foreach ($terms['policy']['stages'] as $index => $percent) {
        $cumulative += $tour * $percent / 100;
        $target = $index===count($terms['policy']['stages'])-1 ? $total : min($total, round($cumulative, 2));
        if ($target > $paid + .009) return round($target - $paid, 2);
    }
    return 0;
}

/** Cancellation preview only. No provider refund is triggered by changing an order status. */
function mlt_journey_cancellation(array $terms, int $daysBefore, float $paid, ?float $costs = null): array {
    if (!empty($terms['protectionPercent'])) return ['manualReview'=>true,'refund'=>null,'reason'=>'Apply the protection terms saved with this order.'];
    $planning = min($paid, (float)$terms['planningFee']);
    $refundable = max(0, $paid-$planning);
    foreach ($terms['policy']['cancellation'] as $index => $row) {
        // Shared endpoints use the more favourable retention band; no-refund cutoffs stay exclusive.
        if (($index===0 ? $daysBefore > $row[0] : $daysBefore >= $row[0]) || $row[0] === 0) {
            if (!is_numeric($row[1])) {
                $cost = $row[2] ?? $costs;
                return ['manualReview'=>$cost===null,'planningRetained'=>$planning,'refund'=>$cost===null?null:round(max(0,$refundable-max(0,$cost)),2)];
            }
            if ((int)$row[1] === 100) return ['manualReview'=>false,'planningRetained'=>$planning,'refund'=>0];
            $amount = (float)$terms['base'] * $terms['policy']['advance']/100;
            return ['manualReview'=>false,'planningRetained'=>$planning,'refund'=>round(max(0,$refundable-$amount*$row[1]/100),2)];
        }
    }
    throw new DomainException('Cancellation policy unavailable.');
}
