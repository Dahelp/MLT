<?php
declare(strict_types=1);

function mlt_inquiry_telegram_chat(array $settings, string $source): string {
    $common = (string)($settings['telegram_chat_id'] ?? (getenv('TELEGRAM_CHAT_ID') ?: ''));
    $department = $source === 'investments' ? 'investments' : (($source === 'acquisitions' || preg_match('/^listing_ID_[0-9]+$/', $source)) ? 'sales' : 'tours');
    $departmentFile = __DIR__ . '/telegram-department-destinations.php';
    $destinations = is_file($departmentFile) ? require $departmentFile : [];
    $destinations = is_array($destinations) ? $destinations : [];
    if ($department !== 'sales') {
        $key = 'telegram_' . $department . '_chat_id';
        $destination = trim((string)($settings[$key] ?? (getenv(strtoupper($key)) ?: ($destinations[$department] ?? ''))));
        return $destination !== '' ? $destination : $common;
    }
    $destinationFile = __DIR__ . '/telegram-sales-destination.php';
    $deployedSales = is_file($destinationFile) ? (string)(require $destinationFile) : '';
    $sales = trim((string)($settings['telegram_sales_chat_id'] ?? (getenv('TELEGRAM_SALES_CHAT_ID') ?: $deployedSales)));
    return $sales !== '' ? $sales : $common;
}
