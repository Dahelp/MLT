<?php
declare(strict_types=1);

/** Public fallback data shared with the React sites; existing order quotes stay authoritative. */
function mlt_journey_pricing(): array {
    static $pricing = null;
    if ($pricing === null) {
        $pricing = json_decode((string)file_get_contents(dirname(__DIR__) . '/data/journey-pricing.json'), true, 512, JSON_THROW_ON_ERROR);
    }
    return $pricing;
}

function mlt_journey_rate_tables(bool $includeLegacy = false): array {
    $config = mlt_journey_pricing();
    $tables = [];
    foreach ($config['collections'] as $id => $rows) {
        foreach ($rows as $row) $tables[$id][(int)$row['d']] = (float)$row['p'];
    }
    if ($includeLegacy) {
        foreach ($config['legacyPaymentDurations'] as $id => $rows) {
            foreach ($rows as $days => $price) $tables[$id][(int)$days] = (float)$price;
        }
    }
    return $tables;
}
