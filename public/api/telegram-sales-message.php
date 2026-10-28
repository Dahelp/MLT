<?php
declare(strict_types=1);

function mlt_sales_telegram_message(array $body, string $reference, ?array $listing = null): string {
    $clean = static fn($value, int $max = 300): string => mb_substr(trim((string)($value ?? '')), 0, $max);
    $title = 'НОВАЯ ЗАЯВКА НА ПОКУПКУ';
    if ($listing) $title .= ($listing['type'] ?? '') === 'capsule' ? ' КАПСУЛЬНОГО ДОМА' : ' АВТОДОМА';
    $lines = ['◆ ' . $title, 'Номер заявки: ' . $reference, ''];

    if ($listing) {
        $lines[] = 'Объект: ' . $clean($listing['title'] ?? '', 180);
        if (isset($listing['price']) && is_numeric($listing['price'])) {
            $price = (float)$listing['price'];
            $lines[] = 'Цена: ' . number_format($price, $price == floor($price) ? 0 : 2, ',', ' ') . ' €';
        }
        if (!empty($listing['year'])) $lines[] = 'Год: ' . (int)$listing['year'];
        if (($listing['type'] ?? '') !== 'capsule' && isset($listing['mileage']) && is_numeric($listing['mileage'])) {
            $lines[] = 'Пробег: ' . number_format((float)$listing['mileage'], 0, ',', ' ') . ' км';
        }
        if (!empty($listing['slug'])) $lines[] = 'Карточка: https://mlt-lifestyle.com/en/acquisitions/' . rawurlencode((string)$listing['slug']) . '/';
    } else {
        $lines[] = 'Запрос: ' . ($clean($body['subject'] ?? '', 120) ?: 'Подбор объекта для покупки');
        $context = $clean($body['context'] ?? '', 800);
        if ($context !== '') $lines[] = 'Детали запроса: ' . $context;
    }

    $notes = $clean($body['notes'] ?? '', 800);
    $context = $clean($body['context'] ?? '', 800);
    // The form starts with listing context; show only the customer's additions here.
    if ($context !== '' && str_starts_with($notes, $context)) $notes = trim(substr($notes, strlen($context)));
    array_push($lines, '',
        'Клиент: ' . trim($clean($body['firstName'] ?? '', 80) . ' ' . $clean($body['lastName'] ?? '', 80)),
        'Email: ' . $clean($body['email'] ?? '', 160),
        'Телефон: ' . ($clean($body['phone'] ?? '', 80) ?: 'Не указан'),
        '', 'Сообщение клиента:', $notes !== '' ? $notes : 'Без дополнительного сообщения.',
        '', 'Заявки в кабинете: https://mlt-lifestyle.com/sales/acquisitions/'
    );
    return implode("\n", $lines);
}
