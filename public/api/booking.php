<?php
declare(strict_types=1);

function mlt_settings(): array {
    $path = dirname(__DIR__) . '/paypal-config.php';
    $settings = is_file($path) ? require $path : [];
    return is_array($settings) ? $settings : [];
}

function mlt_db(array $settings): ?PDO {
    $db = $settings['database'] ?? null;
    if (!is_array($db) || empty($db['host']) || empty($db['name']) || empty($db['user']) || !array_key_exists('password', $db)) return null;
    try {
        $pdo = new PDO('mysql:host=' . $db['host'] . ';dbname=' . $db['name'] . ';charset=utf8mb4', $db['user'], $db['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
        $pdo->exec('CREATE TABLE IF NOT EXISTS mlt_users (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, email VARCHAR(160) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, first_name VARCHAR(80) NOT NULL, last_name VARCHAR(80) NOT NULL, phone VARCHAR(80) NULL, locale VARCHAR(8) NOT NULL DEFAULT "en", session_hash CHAR(64) NULL, session_expires_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
        $pdo->exec('CREATE TABLE IF NOT EXISTS mlt_orders (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NULL, reference_code VARCHAR(80) NOT NULL UNIQUE, status VARCHAR(24) NOT NULL DEFAULT "requested", paypal_order_id VARCHAR(128) NULL, paypal_capture_id VARCHAR(128) NULL, amount DECIMAL(12,2) NULL, currency CHAR(3) NOT NULL DEFAULT "EUR", first_name VARCHAR(80) NOT NULL, last_name VARCHAR(80) NOT NULL, customer_email VARCHAR(160) NOT NULL, phone VARCHAR(80) NULL, collection_name VARCHAR(120) NULL, vehicle_name VARCHAR(120) NULL, country_name VARCHAR(80) NULL, guests VARCHAR(40) NULL, travel_days SMALLINT NULL, arrival_date DATE NULL, departure_date DATE NULL, route_json TEXT NULL, extras_json TEXT NULL, notes TEXT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, paid_at DATETIME NULL, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX mlt_orders_user_id (user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
        try { $pdo->exec('ALTER TABLE mlt_orders ADD COLUMN user_id BIGINT UNSIGNED NULL AFTER id, ADD INDEX mlt_orders_user_id (user_id)'); } catch (Throwable $error) {}
        return $pdo;
    } catch (Throwable $error) { error_log('MLT database unavailable: ' . $error->getMessage()); return null; }
}

function mlt_create_order(PDO $db, string $reference, array $body, array $customer): void {
    try {
        $route = array_values(array_filter(is_array($body['route'] ?? null) ? $body['route'] : [], 'is_string'));
        $extras = array_values(array_filter(is_array($body['extras'] ?? null) ? $body['extras'] : [], 'is_string'));
        $user = $db->prepare('SELECT id FROM mlt_users WHERE email = ? LIMIT 1'); $user->execute([$customer['email']]); $userId = $user->fetchColumn() ?: null;
        $statement = $db->prepare('INSERT INTO mlt_orders (user_id, reference_code, first_name, last_name, customer_email, phone, collection_name, vehicle_name, country_name, guests, travel_days, arrival_date, departure_date, route_json, extras_json, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $statement->execute([$userId, $reference, $customer['firstName'], $customer['lastName'], $customer['email'], $customer['phone'], $body['collection'] ?? null, $body['vehicle'] ?? null, $body['country'] ?? null, $body['guests'] ?? null, (int)($body['days'] ?? 0) ?: null, $body['arrival'] ?? null, $body['departure'] ?? null, json_encode($route, JSON_UNESCAPED_UNICODE), json_encode($extras, JSON_UNESCAPED_UNICODE), $body['notes'] ?? null]);
    } catch (Throwable $error) {
        error_log('MLT order could not be saved: ' . $error->getMessage());
    }
}

function mlt_mark_order_paid(PDO $db, string $reference, string $paypalOrderId, array $capture): ?array {
    $amount = $capture['purchase_units'][0]['payments']['captures'][0]['amount']['value'] ?? null;
    $currency = $capture['purchase_units'][0]['payments']['captures'][0]['amount']['currency_code'] ?? 'EUR';
    $captureId = $capture['purchase_units'][0]['payments']['captures'][0]['id'] ?? null;
    $update = $db->prepare('UPDATE mlt_orders SET status = "paid", paypal_order_id = ?, paypal_capture_id = ?, amount = ?, currency = ?, paid_at = NOW() WHERE reference_code = ? AND status <> "paid"');
    $update->execute([$paypalOrderId, $captureId, $amount, $currency, $reference]);
    if ($update->rowCount() !== 1) return null;
    $select = $db->prepare('SELECT * FROM mlt_orders WHERE reference_code = ?'); $select->execute([$reference]);
    return $select->fetch() ?: null;
}

function mlt_notify_paid(array $order, array $settings): void {
    $route = implode(' → ', json_decode($order['route_json'] ?: '[]', true) ?: []) ?: 'To be confirmed';
    $extras = implode(', ', json_decode($order['extras_json'] ?: '[]', true) ?: []) ?: 'None';
    $message = "◆ PAYPAL PAYMENT RECEIVED\nReference: {$order['reference_code']}\nAmount: {$order['amount']} {$order['currency']}\n\nClient: {$order['first_name']} {$order['last_name']}\nEmail: {$order['customer_email']}\nPhone: " . ($order['phone'] ?: 'Not provided') . "\n\nCollection: {$order['collection_name']}\nVehicle: " . ($order['vehicle_name'] ?: 'To be confirmed') . "\nDates: " . ($order['arrival_date'] ?: '—') . ' — ' . ($order['departure_date'] ?: '—') . "\nTravellers: " . ($order['guests'] ?: '—') . "\nRoute: {$route}\nExperiences: {$extras}";
    $token = (string)($settings['telegram_bot_token'] ?? (getenv('TELEGRAM_BOT_TOKEN') ?: ''));
    $chatId = (string)($settings['telegram_chat_id'] ?? (getenv('TELEGRAM_CHAT_ID') ?: ''));
    if ($token && $chatId) {
        $context = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/json\r\n", 'content' => json_encode(['chat_id' => $chatId, 'text' => $message, 'disable_web_page_preview' => true], JSON_UNESCAPED_UNICODE), 'timeout' => 10]]);
        @file_get_contents('https://api.telegram.org/bot' . $token . '/sendMessage', false, $context);
    }
    $to = (string)($settings['notification_email'] ?? '');
    if ($to && filter_var($to, FILTER_VALIDATE_EMAIL)) {
        $from = (string)($settings['notification_from'] ?? 'bookings@mlt-lifestyle.com');
        @mail($to, 'MLT payment received — ' . $order['reference_code'], $message, "From: {$from}\r\nContent-Type: text/plain; charset=UTF-8");
    }
}
