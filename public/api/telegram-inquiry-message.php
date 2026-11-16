<?php
declare(strict_types=1);

function mlt_inquiry_telegram_message(array $body, string $reference): string {
    $clean = static fn($value, int $max = 300): string => mb_substr(trim((string)($value ?? '')), 0, $max);
    $investment = ($body['source'] ?? '') === 'investments';
    $lines = [
        '◆ ' . ($investment ? 'НОВАЯ ЗАЯВКА НА ИНВЕСТИЦИИ' : 'НОВАЯ ЗАЯВКА НА ТУР / КОНСЬЕРЖ'),
        'Номер заявки: ' . $reference, '',
        'Клиент: ' . trim($clean($body['firstName'] ?? '', 80) . ' ' . $clean($body['lastName'] ?? '', 80)),
        'Email: ' . $clean($body['email'] ?? '', 160),
        'Телефон: ' . ($clean($body['phone'] ?? '', 80) ?: 'Не указан'),
    ];
    $subject = $clean($body['subject'] ?? '', 120);
    if ($subject !== '') $lines[] = 'Тема: ' . $subject;
    $context = $clean($body['context'] ?? '', 800);
    if ($context !== '') $lines[] = ($investment ? 'Параметры запроса / расчёта: ' : 'Детали запроса: ') . $context;
    if (!$investment) {
        foreach (['collection'=>'Коллекция','vehicle'=>'Автодом','country'=>'Страна старта','guests'=>'Путешественники','days'=>'Количество дней','rate'=>'Ориентировочная стоимость'] as $key=>$label) {
            $value = $clean($body[$key] ?? '', 100);
            if ($value !== '') $lines[] = $label . ': ' . $value;
        }
        $arrival = $clean($body['arrival'] ?? '', 20);
        $departure = $clean($body['departure'] ?? '', 20);
        if ($arrival !== '' || $departure !== '') $lines[] = 'Даты поездки: ' . ($arrival ?: '—') . ' — ' . ($departure ?: '—');
        foreach (['route'=>'Маршрут','extras'=>'Дополнительные услуги'] as $key=>$label) {
            $values = array_slice(array_values(array_filter(array_map($clean, is_array($body[$key] ?? null) ? $body[$key] : []))), 0, 12);
            if ($values) $lines[] = $label . ': ' . implode($key === 'route' ? ' → ' : ', ', $values);
        }
    }
    $notes = $clean($body['notes'] ?? '', 800);
    if ($context !== '' && str_starts_with($notes, $context)) $notes = trim(substr($notes, strlen($context)));
    array_push($lines, '', 'Сообщение клиента:', $notes ?: 'Без дополнительного сообщения.', '',
        'Заявки в кабинете: https://mlt-lifestyle.com/' . ($investment ? 'sales/investments/' : 'concierge/'));
    return implode("\n", $lines);
}
