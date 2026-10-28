<?php
declare(strict_types=1);

function mlt_inquiry_telegram_chat(array $settings, string $source): string {
    $common = (string)($settings['telegram_chat_id'] ?? (getenv('TELEGRAM_CHAT_ID') ?: ''));
    if ($source !== 'acquisitions' && !preg_match('/^listing_ID_[0-9]+$/', $source)) return $common;
    $sales = trim((string)($settings['telegram_sales_chat_id'] ?? (getenv('TELEGRAM_SALES_CHAT_ID') ?: '')));
    return $sales !== '' ? $sales : $common;
}
