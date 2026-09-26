<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$settingsPath = dirname(__DIR__) . '/paypal-config.php';
if (!is_file($settingsPath)) {
    http_response_code(503);
    echo json_encode(['error' => 'PayPal is not configured yet.']);
    exit;
}
$settings = require $settingsPath;
$clientId = is_array($settings) ? (string)($settings['client_id'] ?? '') : '';
$secret = is_array($settings) ? (string)($settings['client_secret'] ?? '') : '';
$mode = is_array($settings) ? (string)($settings['mode'] ?? 'sandbox') : 'sandbox';
if (!$clientId || !$secret) {
    http_response_code(503);
    echo json_encode(['error' => 'PayPal is not configured yet.']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payment request']);
    exit;
}

$prices = [
    'freedom' => [7 => 1490, 10 => 1990, 14 => 2590, 21 => 3690, 30 => 4990],
    'signature' => [7 => 2490, 10 => 4290, 14 => 5890],
    'concierge' => [7 => 4990, 10 => 6590, 14 => 8990],
    'private' => [7 => 19900, 10 => 28429, 14 => 39800, 21 => 59700, 30 => 85286],
];
$signatureTailored = [7 => 2990, 10 => 4290, 14 => 5890];
$collection = strtolower(substr(trim((string)($body['collection'] ?? '')), 0, 30));
$days = (int)($body['days'] ?? 0);
$reference = substr(trim((string)($body['reference'] ?? '')), 0, 80);
$amount = !empty($body['signatureTailored']) && $collection === 'signature'
    ? ($signatureTailored[$days] ?? 0)
    : ($prices[$collection][$days] ?? 0);
if (($body['provider'] ?? '') !== 'paypal' || !$amount || !preg_match('/^MLT-[A-Z0-9-]+$/', $reference)) {
    http_response_code(400);
    echo json_encode(['error' => 'This journey cannot be paid online yet. Please contact MLT Concierge.']);
    exit;
}

$apiBase = $mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
$request = static function (string $url, array $headers, string $payload): array {
    $curl = curl_init($url);
    curl_setopt_array($curl, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload, CURLOPT_HTTPHEADER => $headers, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20]);
    $response = curl_exec($curl);
    $status = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);
    return [$status, is_string($response) ? json_decode($response, true) : null];
};
[$tokenStatus, $tokenResult] = $request($apiBase . '/v1/oauth2/token', ['Authorization: Basic ' . base64_encode($clientId . ':' . $secret), 'Content-Type: application/x-www-form-urlencoded'], 'grant_type=client_credentials');
$token = is_array($tokenResult) ? ($tokenResult['access_token'] ?? '') : '';
if ($tokenStatus < 200 || $tokenStatus >= 300 || !$token) {
    http_response_code(502);
    echo json_encode(['error' => 'Unable to authenticate with PayPal.']);
    exit;
}
$origin = 'https://mlt-lifestyle.com';
$order = ['intent' => 'CAPTURE', 'purchase_units' => [['reference_id' => $reference, 'custom_id' => $reference, 'description' => 'MLT ' . ucfirst($collection) . ' Collection · ' . $days . ' days', 'amount' => ['currency_code' => 'EUR', 'value' => number_format((float)$amount, 2, '.', '')]]], 'application_context' => ['return_url' => $origin . '/api/paypal-capture.php?reference=' . rawurlencode($reference), 'cancel_url' => $origin . '/account/?payment=cancelled&reference=' . rawurlencode($reference), 'user_action' => 'PAY_NOW']];
[$orderStatus, $orderResult] = $request($apiBase . '/v2/checkout/orders', ['Authorization: Bearer ' . $token, 'Content-Type: application/json'], json_encode($order));
$approvalUrl = '';
foreach ((is_array($orderResult) ? ($orderResult['links'] ?? []) : []) as $link) if (($link['rel'] ?? '') === 'approve') $approvalUrl = (string)($link['href'] ?? '');
if ($orderStatus < 200 || $orderStatus >= 300 || !$approvalUrl) {
    http_response_code(502);
    echo json_encode(['error' => 'Unable to start PayPal checkout.']);
    exit;
}
echo json_encode(['url' => $approvalUrl]);
