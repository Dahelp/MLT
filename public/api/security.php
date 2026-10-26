<?php
declare(strict_types=1);

function mlt_security_error(int $status, string $message): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $message]);
    exit;
}

// Fixed shard count and capped records prevent attacker-controlled file growth.
// REMOTE_ADDR is intentional: forwarded headers are not trusted without a proxy allowlist.
function mlt_security_limit(string $key, int $limit, int $seconds): void {
    $directory = sys_get_temp_dir() . '/mlt-limits-' . substr(hash('sha256', __DIR__), 0, 16);
    if (!is_dir($directory) && !@mkdir($directory, 0700) && !is_dir($directory)) mlt_security_error(503, 'Service temporarily unavailable.');
    $hash = hash('sha256', $key);
    $file = @fopen($directory . '/' . substr($hash, 0, 2) . '.json', 'c+');
    if (!$file || !flock($file, LOCK_EX)) mlt_security_error(503, 'Service temporarily unavailable.');
    $now = time();
    $records = json_decode(stream_get_contents($file), true) ?: [];
    $records = array_filter($records, static fn($record) => is_array($record) && ($record['until'] ?? 0) > $now);
    $record = $records[$hash] ?? ['count' => 0, 'until' => $now + $seconds];
    $blocked = $record['count'] >= $limit;
    $record['count']++;
    if (count($records) >= 2048 && !isset($records[$hash])) {
        flock($file, LOCK_UN); fclose($file);
        mlt_security_error(503, 'Service temporarily unavailable.');
    }
    $records[$hash] = $record;
    rewind($file); ftruncate($file, 0);
    $saved = fwrite($file, json_encode($records)); fflush($file);
    flock($file, LOCK_UN); fclose($file);
    if ($saved === false) mlt_security_error(503, 'Service temporarily unavailable.');
    if ($blocked) {
        header('Retry-After: ' . max(1, $record['until'] - $now));
        mlt_security_error(429, 'Too many requests. Please try again later.');
    }
}

function mlt_security_guard(array $methods = ['POST'], bool $webhook = false): void {
    ini_set('display_errors', '0');
    header('Cache-Control: no-store, max-age=0');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    set_exception_handler(static function (Throwable $error): void {
        error_log('MLT API error: ' . get_class($error));
        mlt_security_error(500, 'Could not complete the request.');
    });
    $method = $_SERVER['REQUEST_METHOD'] ?? '';
    if (!in_array($method, $methods, true)) {
        header('Allow: ' . implode(', ', $methods));
        mlt_security_error(405, 'Method not allowed.');
    }
    $endpoint = basename($_SERVER['SCRIPT_FILENAME'] ?? 'api');
    $address = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    mlt_security_limit('request:' . $endpoint . ':' . $address, 300, 60);
    if ($method !== 'POST') return;
    if (!$webhook) {
        $origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
        $allowed = ['https://mlt-lifestyle.com', 'https://www.mlt-lifestyle.com'];
        // Local development is only allowed when the TCP peer itself is loopback.
        if (in_array($address, ['127.0.0.1', '::1'], true) && preg_match('#^http://(localhost|127\.0\.0\.1)(:[0-9]+)?$#D', $origin)) $allowed[] = $origin;
        if (($origin !== '' && !in_array($origin, $allowed, true)) || ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') mlt_security_error(403, 'Invalid request origin.');
    }
    if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') mlt_security_error(415, 'JSON content type required.');
    $maximum = in_array($endpoint, ['catalog.php', 'scout.php'], true) ? 12 * 1024 * 1024 : 128 * 1024;
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > $maximum) mlt_security_error(413, 'Request is too large.');
    $raw = file_get_contents('php://input', false, null, 0, $maximum + 1);
    if ($raw === false || strlen($raw) > $maximum) mlt_security_error(413, 'Request is too large.');
    try { $body = json_decode($raw, false, 32, JSON_THROW_ON_ERROR); }
    catch (JsonException $error) { mlt_security_error(400, 'Invalid JSON request.'); }
    if (!is_object($body)) mlt_security_error(400, 'JSON object required.');
    $action = is_string($body->action ?? null) ? $body->action : '';
    if ($endpoint === 'account.php' && in_array($action, ['login', 'register'], true)) {
        mlt_security_limit('auth-ip:' . $address, 30, 900);
        $email = is_string($body->email ?? null) ? strtolower(trim($body->email)) : '';
        mlt_security_limit('auth-email:' . $email, 30, 900);
    }
    if ($endpoint === 'concierge.php' || in_array($action, ['start', 'upload'], true) || in_array($endpoint, ['payment.php', 'stripe-payment.php', 'journey-checkout.php'], true)) mlt_security_limit('write:' . $endpoint . ':' . $address, 30, 600);
}
