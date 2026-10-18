<?php
declare(strict_types=1);

require_once __DIR__ . '/booking.php';

http_response_code(200);
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$settings = mlt_settings();
$secret = (string)($settings['stripe_webhook_secret'] ?? '');
$payload = file_get_contents('php://input');
$signature = (string)($_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '');

function stripe_signature_is_valid(string $payload, string $signature, string $secret): bool {
    if ($payload === '' || $secret === '' || $signature === '') return false;
    $parts = [];
    foreach (explode(',', $signature) as $part) {
        [$key, $value] = array_pad(explode('=', trim($part), 2), 2, '');
        if ($key !== '' && $value !== '') $parts[$key][] = $value;
    }
    $timestamp = $parts['t'][0] ?? '';
    if (!ctype_digit($timestamp) || abs(time() - (int)$timestamp) > 300) return false;
    $expected = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);
    foreach ($parts['v1'] ?? [] as $value) {
        if (hash_equals($expected, $value)) return true;
    }
    return false;
}

if (!stripe_signature_is_valid($payload ?: '', $signature, $secret)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid Stripe signature']);
    exit;
}

$event = json_decode($payload, true);
if (!is_array($event)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid event payload']);
    exit;
}

if (in_array($event['type']??'', ['charge.refunded','charge.dispute.created'],true)) {
    require_once __DIR__.'/voucher-payments.php';
    try{$db=mlt_db($settings);if(!$db)throw new RuntimeException('Database unavailable');mlt_voucher_schema($db);mlt_voucher_block_reversed_payment($db,(string)($event['data']['object']['payment_intent']??''),(string)($event['id']??''));}
    catch(Throwable $e){error_log('MLT voucher reversal: '.$e->getMessage());http_response_code(503);echo json_encode(['error'=>'Reversal processing pending']);exit;}
}

if (in_array($event['type']??'', ['checkout.session.completed','checkout.session.async_payment_succeeded'],true)) {
    $session = $event['data']['object'] ?? [];
    if (($session['metadata']['purchase_type'] ?? '') === 'voucher') {
        require_once __DIR__.'/voucher-payments.php';
        try { $db=mlt_db($settings);if(!$db)throw new RuntimeException('Database unavailable');mlt_voucher_schema($db);mlt_voucher_stripe_settle($db,$session);echo json_encode(['received'=>true]);exit; }
        catch(Throwable $e){error_log('MLT voucher webhook: '.$e->getMessage());http_response_code(503);echo json_encode(['error'=>'Voucher confirmation pending']);exit;}
    }
    $reference = (string)($session['client_reference_id'] ?? '');
    $kind = (string)($session['metadata']['payment_kind'] ?? 'full');
    if (!in_array($kind, ['deposit', 'full', 'balance'], true)) $kind = 'full';
    if (($session['payment_status'] ?? '') === 'paid' && preg_match('/^MLT-[A-Z0-9-]+$/', $reference)) {
        $db = mlt_db($settings);
        if ($db) {
            $order = mlt_mark_stripe_order_paid(
                $db,
                $reference,
                (string)($session['id'] ?? ''),
                (string)($session['payment_intent'] ?? $session['id'] ?? ''),
                (int)($session['amount_total'] ?? 0),
                (string)($session['currency'] ?? 'eur'),
                $kind
            );
            if ($order) mlt_notify_paid($order, $settings);
        }
    }
}

echo json_encode(['received' => true]);
