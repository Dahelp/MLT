<?php
declare(strict_types=1);

// Read-only aggregates. Never serialize customer rows or accept a client-defined
// column, dimension, SQL fragment or arbitrary date range.
function mlt_marketing_count(int $count): ?int { return $count === 0 || $count >= 5 ? $count : null; }

function mlt_marketing_groups(PDO $db, string $sql, array $params): array {
    $q = $db->prepare($sql);
    $q->execute($params);
    $rows = $q->fetchAll(PDO::FETCH_ASSOC);
    // Suppress the complete breakdown if any cell is small: a total and other
    // cells must not reveal a suppressed cell through subtraction.
    foreach ($rows as $row) if ((int)$row['count'] < 5) return ['state'=>'suppressed','rows'=>[]];
    return ['state'=>'ready','rows'=>array_map(static fn($row) => ['key'=>(string)$row['bucket'],'count'=>(int)$row['count']], $rows)];
}

function mlt_marketing_optional(callable $read): array {
    try { return $read(); }
    catch (PDOException $error) {
        // An unused optional module may not have created its table yet. Other
        // database failures must fail the request rather than become false zeroes.
        if (in_array((string)$error->getCode(), ['42S02','42S22'], true)) return ['state'=>'unavailable'];
        throw $error;
    }
}

function mlt_marketing_overview(PDO $db, int $days): array {
    if (!in_array($days, [30,90,365], true)) throw new DomainException('Invalid period.');
    // Use database calendar days, matching the timestamps produced by NOW() in
    // existing write paths. Exclude today to keep a stable completed-day window.
    $end = (string)$db->query('SELECT CURRENT_DATE')->fetchColumn();
    $start = (new DateTimeImmutable($end))->modify('-'.$days.' days')->format('Y-m-d');
    $params = [$start, $end];
    $window = 'created_at >= ? AND created_at < ?';
    $q = $db->prepare('SELECT COUNT(*) AS total, SUM(CASE WHEN paid_amount>0 THEN 1 ELSE 0 END) AS paid, AVG(CASE WHEN travel_days>0 THEN travel_days END) AS duration, COUNT(CASE WHEN travel_days>0 THEN 1 END) AS duration_count FROM mlt_orders WHERE '.$window);
    $q->execute($params); $orders = $q->fetch();
    $total = (int)$orders['total']; $paid = (int)$orders['paid'];
    // Both sides of a derived ratio need sufficient observations.
    $conversion = $total >= 5 && $paid >= 5 && ($total-$paid === 0 || $total-$paid >= 5) ? round($paid/$total*100,1) : null;
    $collections = "CASE LOWER(collection_name) WHEN 'freedom' THEN 'freedom' WHEN 'signature' THEN 'signature' WHEN 'concierge' THEN 'concierge' WHEN 'private' THEN 'private' WHEN 'honeymoon' THEN 'honeymoon' WHEN 'proposal' THEN 'proposal' ELSE 'other' END";
    $statuses = "CASE status WHEN 'requested' THEN 'requested' WHEN 'in_progress' THEN 'in_progress' WHEN 'confirmed' THEN 'confirmed' WHEN 'paid' THEN 'paid' WHEN 'completed' THEN 'completed' WHEN 'cancelled' THEN 'cancelled' ELSE 'other' END";
    $groups = static fn(string $table, string $dimension, string $where = '') => mlt_marketing_groups($db, 'SELECT '.$dimension.' AS bucket, COUNT(*) AS count FROM '.$table.' WHERE '.$window.$where.' GROUP BY bucket ORDER BY count DESC, bucket', $params);
    $result = [
        'period'=>['days'=>$days,'start'=>$start,'endExclusive'=>$end,'clock'=>'database'],
        'privacy'=>['minimumGroup'=>5],
        'journeys'=>[
            'state'=>'ready', 'total'=>mlt_marketing_count($total),
            // Do not disclose a complementary small cohort through subtraction.
            'paid'=>($total-$paid > 0 && $total-$paid < 5) ? null : mlt_marketing_count($paid),
            'conversion'=>$conversion,
            'averageDays'=>(int)$orders['duration_count']>=5 ? round((float)$orders['duration'],1) : null,
            'collections'=>$groups('mlt_orders',$collections),
            'statuses'=>$groups('mlt_orders',$statuses),
            'months'=>$groups('mlt_orders','SUBSTRING(created_at,1,7)'),
            'duration'=>$groups('mlt_orders', "CASE WHEN travel_days BETWEEN 1 AND 7 THEN 'short' WHEN travel_days BETWEEN 8 AND 14 THEN 'medium' WHEN travel_days>14 THEN 'long' ELSE 'other' END"),
        ],
        'registrations'=>mlt_marketing_optional(static fn() => $groups('mlt_users', "CASE locale WHEN 'en' THEN 'en' WHEN 'de' THEN 'de' WHEN 'ru' THEN 'ru' WHEN 'it' THEN 'it' WHEN 'pl' THEN 'pl' ELSE 'other' END", " AND role IN ('traveller','agency')")),
        'inquiries'=>mlt_marketing_optional(static fn() => $groups('mlt_commercial_inquiries', "CASE WHEN source='investments' THEN 'investments' WHEN source='acquisitions' OR source LIKE 'listing_ID_%' THEN 'acquisitions' ELSE 'other' END")),
        'chats'=>mlt_marketing_optional(static fn() => $groups('mlt_chat_conversations', "CASE department WHEN 'sales' THEN 'sales' WHEN 'concierge' THEN 'concierge' ELSE 'other' END")),
        'scout'=>mlt_marketing_optional(static fn() => $groups('mlt_scout_submissions', "CASE status WHEN 'pending' THEN 'pending' WHEN 'approved' THEN 'approved' WHEN 'rejected' THEN 'rejected' ELSE 'other' END")),
    ];
    $result['receipts'] = mlt_marketing_optional(static function() use ($db,$params): array {
        $q=$db->prepare("SELECT CASE currency WHEN 'EUR' THEN 'EUR' WHEN 'USD' THEN 'USD' WHEN 'GBP' THEN 'GBP' WHEN 'CHF' THEN 'CHF' WHEN 'PLN' THEN 'PLN' ELSE 'other' END AS bucket, COUNT(DISTINCT order_id) AS count, SUM(amount) AS amount FROM mlt_payments WHERE created_at>=? AND created_at<? AND status='paid' AND provider IN ('stripe','paypal') GROUP BY bucket ORDER BY bucket");
        $q->execute($params); $rows=$q->fetchAll();
        foreach($rows as $row) if((int)$row['count']<5) return ['state'=>'suppressed','rows'=>[]];
        return ['state'=>'ready','rows'=>array_map(static fn($row)=>['currency'=>$row['bucket'],'amount'=>round((float)$row['amount'],2)],$rows)];
    });
    $result['vouchers'] = mlt_marketing_optional(static function() use ($db,$params): array {
        $q=$db->prepare("SELECT COUNT(DISTINCT user_id) AS buyers, COALESCE(SUM(quantity),0) AS units, COALESCE(SUM(price_cents*quantity),0) AS cash FROM mlt_voucher_purchases WHERE paid_at>=? AND paid_at<? AND status='paid'");
        $q->execute($params); $row=$q->fetch();
        if((int)$row['buyers']>0 && (int)$row['buyers']<5) return ['state'=>'suppressed'];
        return ['state'=>'ready','units'=>(int)$row['units'],'cashCents'=>(int)$row['cash']];
    });
    return $result;
}
