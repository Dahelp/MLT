<?php
header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow, noarchive');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

$clean = static function ($value, $max = 300) {
    return mb_substr(trim((string)($value ?? '')), 0, $max);
};

if ($clean($body['website'] ?? '')) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

$firstName = $clean($body['firstName'] ?? '', 80);
$lastName = $clean($body['lastName'] ?? '', 80);
$email = $clean($body['email'] ?? '', 160);
if (!$firstName || !$lastName || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Please provide a valid name and email']);
    exit;
}

$reference = 'MLT-' . strtoupper(substr(base_convert((string)round(microtime(true) * 1000), 10, 36), -8));
$token = getenv('TELEGRAM_BOT_TOKEN') ?: '';
$chatId = getenv('TELEGRAM_CHAT_ID') ?: '';

if ($token && $chatId) {
    $route = array_slice(array_filter(array_map($clean, is_array($body['route'] ?? null) ? $body['route'] : [])), 0, 12);
    $lines = [
        '◆ NEW MLT PRIVATE REQUEST',
        'Reference: ' . $reference,
        '',
        'Client: ' . $firstName . ' ' . $lastName,
        'Email: ' . $email,
        'Phone: ' . ($clean($body['phone'] ?? '', 80) ?: 'Not provided'),
        '',
        'Collection: ' . $clean($body['collection'] ?? '', 80),
        'Starting country: ' . $clean($body['country'] ?? '', 80),
        'Travellers: ' . $clean($body['guests'] ?? '', 40),
        'Duration: ' . $clean($body['days'] ?? '', 20) . ' days',
        'Indicative rate: ' . $clean($body['rate'] ?? '', 80),
        'Route: ' . ($route ? implode(' → ', $route) : 'To be curated'),
        '',
        'Notes: ' . ($clean($body['notes'] ?? '', 800) ?: 'No additional notes'),
    ];
    $payload = json_encode([
        'chat_id' => $chatId,
        'text' => implode("\n", $lines),
        'disable_web_page_preview' => true,
    ], JSON_UNESCAPED_UNICODE);
    $context = stream_context_create(['http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => $payload,
        'timeout' => 10,
    ]]);
    $response = @file_get_contents('https://api.telegram.org/bot' . $token . '/sendMessage', false, $context);
    $telegram = $response ? json_decode($response, true) : null;
    if (is_array($telegram) && ($telegram['ok'] ?? false)) {
        echo json_encode(['ok' => true, 'reference' => $reference, 'delivery' => 'telegram']);
        exit;
    }
}

echo json_encode(['ok' => true, 'reference' => $reference, 'delivery' => 'demo']);

