<?php
declare(strict_types=1);

$settingsPath = dirname(__DIR__, 2) . '/paypal-config.php';
$reference = substr(trim((string)($_GET['reference'] ?? '')), 0, 80);
$orderId = substr(trim((string)($_GET['token'] ?? '')), 0, 128);
$redirect = static function (string $result) use ($reference): void {
    header('Location: https://mlt-lifestyle.com/plan/?payment=' . $result . '&reference=' . rawurlencode($reference), true, 303);
    exit;
};
if (!is_file($settingsPath) || !$orderId || !preg_match('/^MLT-[A-Z0-9-]+$/', $reference)) $redirect('error');
$settings = require $settingsPath;
$clientId = is_array($settings) ? (string)($settings['client_id'] ?? '') : '';
$secret = is_array($settings) ? (string)($settings['client_secret'] ?? '') : '';
$mode = is_array($settings) ? (string)($settings['mode'] ?? 'sandbox') : 'sandbox';
if (!$clientId || !$secret) $redirect('error');
$apiBase = $mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
$call = static function (string $url, array $headers, string $body): array {
    $curl = curl_init($url);
    curl_setopt_array($curl, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_HTTPHEADER => $headers, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20]);
    $response = curl_exec($curl); $status = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE); curl_close($curl);
    return [$status, is_string($response) ? json_decode($response, true) : null];
};
[$tokenStatus, $tokenResult] = $call($apiBase . '/v1/oauth2/token', ['Authorization: Basic ' . base64_encode($clientId . ':' . $secret), 'Content-Type: application/x-www-form-urlencoded'], 'grant_type=client_credentials');
$token = is_array($tokenResult) ? ($tokenResult['access_token'] ?? '') : '';
if ($tokenStatus < 200 || $tokenStatus >= 300 || !$token) $redirect('error');
[$captureStatus] = $call($apiBase . '/v2/checkout/orders/' . rawurlencode($orderId) . '/capture', ['Authorization: Bearer ' . $token, 'Content-Type: application/json'], '{}');
$redirect($captureStatus >= 200 && $captureStatus < 300 ? 'success' : 'error');
