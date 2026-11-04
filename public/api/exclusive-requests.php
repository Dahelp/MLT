<?php
declare(strict_types=1);

function mlt_exclusive_request_options(): array {
    static $options = null;
    return $options ??= json_decode(file_get_contents(dirname(__DIR__).'/data/private-exclusive-requests.json'), true, 512, JSON_THROW_ON_ERROR);
}

/** Accept only catalog IDs. Client-supplied labels and prices never enter a quote. */
function mlt_exclusive_requests(array $body): array {
    if (strtolower((string)($body['collection'] ?? '')) !== 'private') return [];
    $ids = $body['exclusiveRequests'] ?? [];
    if (!is_array($ids) || count($ids) > 4) throw new DomainException('Invalid Exclusive Requests selection.');
    $options = mlt_exclusive_request_options();
    foreach ($ids as $id) {
        if (!is_string($id) || !in_array($id, array_column($options, 'id'), true)) throw new DomainException('Invalid Exclusive Requests selection.');
    }
    return array_values(array_map(fn($option) => $option + ['price'=>null], array_filter($options, fn($option) => in_array($option['id'], $ids, true))));
}

function mlt_exclusive_requests_total(?string $raw): float {
    $items = json_decode($raw ?: '[]', true, 512, JSON_THROW_ON_ERROR);
    return round(array_sum(array_map(fn($item) => (float)($item['price'] ?? 0), $items)), 2);
}

/** Called inside the order lock; complete quotes are saved atomically. */
function mlt_exclusive_requests_price(array $saved, $submitted): array {
    if (!$saved || !is_array($submitted) || count($submitted) !== count($saved)) throw new DomainException('Price every selected Exclusive Request.');
    $prices = [];
    foreach ($submitted as $item) {
        if (!is_array($item) || !is_string($item['id'] ?? null) || isset($prices[$item['id']]) || !in_array($item['id'], array_column($saved, 'id'), true)) throw new DomainException('The Exclusive Requests selection has changed. Reload the application.');
        $value = $item['price'] ?? null;
        if ((!is_string($value) && !is_int($value) && !is_float($value)) || !preg_match('/^\d+(?:\.\d{1,2})?$/D', (string)$value) || !is_finite((float)$value) || (float)$value > 100000) throw new DomainException('Enter a price between EUR 0 and 100,000, with at most two decimal places.');
        $prices[$item['id']] = round((float)$value, 2);
    }
    return array_map(fn($item) => array_replace($item, ['price'=>$prices[$item['id']]]), $saved);
}
