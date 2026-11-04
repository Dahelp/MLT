<?php
declare(strict_types=1);

// Included after authentication. Travellers can read their quote, never assign prices.
if ($action === 'exclusive_requests_quote') {
    if (!isset($operator) || !in_array($operator['role'] ?? '', ['admin','concierge'], true)) {
        http_response_code(403); echo json_encode(['error'=>'Concierge access required.']); exit;
    }
    try {
        require_once __DIR__.'/voucher-core.php';
        mlt_voucher_schema($db);
        $db->beginTransaction();
        $q = $db->prepare('SELECT * FROM mlt_orders WHERE reference_code=? AND archived_at IS NULL FOR UPDATE');
        $q->execute([(string)($body['reference'] ?? '')]);
        $order = $q->fetch();
        if (!$order || $order['collection_name'] !== 'private') throw new DomainException('Private application not found.');
        if (in_array($order['status'], ['paid','completed','cancelled'], true)) throw new DomainException('This journey is closed for quote changes.');
        $q = $db->prepare('SELECT 1 FROM mlt_journey_checkout_holds WHERE order_id=?');
        $q->execute([$order['id']]);
        if ($q->fetchColumn()) throw new DomainException('Close the existing checkout before changing the quote.');
        $terms = mlt_order_terms($order);
        if (!$terms) throw new DomainException('This order uses an earlier quote. Please contact MLT.');
        $saved = json_decode($order['exclusive_requests_json'] ?: '[]', true, 512, JSON_THROW_ON_ERROR);
        $items = mlt_exclusive_requests_price($saved, $body['items'] ?? null);
        $oldExclusive = mlt_exclusive_requests_total($order['exclusive_requests_json']);
        $newExclusive = mlt_exclusive_requests_total(json_encode($items, JSON_THROW_ON_ERROR));
        $extras = round((float)$order['extras_amount'] - $oldExclusive + $newExclusive, 2);
        $terms['total'] = round($terms['tourTotal'] + $terms['planningFee'] + $terms['protectionAmount'] + $extras, 2);
        if ($terms['total'] + .009 < (float)$order['paid_amount']) throw new DomainException('The quote cannot be lower than the amount already paid.');
        $terms['exclusiveQuoteRevision'] = (int)($terms['exclusiveQuoteRevision'] ?? 0) + 1;
        $terms['exclusiveQuotedAt'] = gmdate('c');
        $db->prepare('UPDATE mlt_orders SET exclusive_requests_json=?,extras_amount=?,total_amount=?,journey_terms_json=? WHERE id=?')->execute([
            json_encode($items, JSON_THROW_ON_ERROR), $extras, $terms['total'], json_encode($terms, JSON_THROW_ON_ERROR), $order['id']
        ]);
        mlt_voucher_audit($db, (int)$operator['id'], 'exclusive_requests_quote', (int)$order['id'], ['items'=>$items,'previousItems'=>$saved,'total'=>$terms['total'],'revision'=>$terms['exclusiveQuoteRevision']]);
        $db->commit();
        echo json_encode(['ok'=>true,'items'=>$items,'total'=>$terms['total']]); exit;
    } catch (DomainException $error) {
        if ($db->inTransaction()) $db->rollBack();
        http_response_code(409); echo json_encode(['error'=>$error->getMessage()]); exit;
    } catch (Throwable $error) {
        if ($db->inTransaction()) $db->rollBack();
        error_log('MLT Exclusive Requests: '.$error->getMessage());
        http_response_code(503); echo json_encode(['error'=>'Could not save the individual quote.']); exit;
    }
}
