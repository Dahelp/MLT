<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
require_once __DIR__ . '/booking.php';
$settings = mlt_settings();
$db = mlt_db($settings);
if (!$db) { http_response_code(503); echo json_encode(['error' => 'Inventory unavailable']); exit; }
$db->exec('CREATE TABLE IF NOT EXISTS mlt_acquisitions (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, slug VARCHAR(120) NOT NULL UNIQUE, type VARCHAR(20) NOT NULL, title VARCHAR(180) NOT NULL, subtitle VARCHAR(255) NULL, price DECIMAL(12,2) NOT NULL, year SMALLINT NULL, mileage INT NULL, berths TINYINT NULL, length_m DECIMAL(5,2) NULL, area_m2 DECIMAL(7,2) NULL, description TEXT NULL, included TEXT NULL, images_json TEXT NULL, status VARCHAR(20) NOT NULL DEFAULT "available", certified TINYINT(1) NOT NULL DEFAULT 0, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
$body = json_decode(file_get_contents('php://input'), true); if (!is_array($body)) $body = [];
$action = (string)($body['action'] ?? 'list');
if ($action === 'list') { $rows = $db->query('SELECT * FROM mlt_acquisitions ORDER BY status,updated_at DESC')->fetchAll(PDO::FETCH_ASSOC); echo json_encode(['items' => $rows], JSON_UNESCAPED_UNICODE); exit; }
$token = preg_replace('/^Bearer\s+/i', '', (string)($_SERVER['HTTP_AUTHORIZATION'] ?? ''));
$query = $db->prepare('SELECT role FROM mlt_users WHERE session_hash=? AND session_expires_at>NOW() LIMIT 1');
$query->execute([hash('sha256', $token)]); $operator = $query->fetch(PDO::FETCH_ASSOC);
if (!in_array($operator['role'] ?? '', ['admin','salesmanager'], true)) { http_response_code(403); echo json_encode(['error' => 'Sales manager access required']); exit; }
if ($action === 'session') { echo json_encode(['ok'=>true,'role'=>$operator['role']]); exit; }
if ($action === 'inquiries') { $db->exec('CREATE TABLE IF NOT EXISTS mlt_commercial_inquiries (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, reference_code VARCHAR(80) NOT NULL UNIQUE, source VARCHAR(100) NOT NULL, subject VARCHAR(120) NOT NULL, context_text TEXT NULL, first_name VARCHAR(80) NOT NULL, last_name VARCHAR(80) NOT NULL, email VARCHAR(160) NOT NULL, phone VARCHAR(80) NULL, notes TEXT NULL, privacy_consent_at DATETIME NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'); $rows=$db->query("SELECT reference_code,source,subject,context_text,first_name,last_name,email,phone,notes,created_at FROM mlt_commercial_inquiries WHERE source='acquisitions' OR source LIKE 'listing_ID_%' ORDER BY created_at DESC LIMIT 100")->fetchAll(PDO::FETCH_ASSOC); echo json_encode(['inquiries'=>$rows], JSON_UNESCAPED_UNICODE); exit; }
if ($action === 'save') {
  $id = (int)($body['id'] ?? 0);
  $slug = preg_replace('/[^a-z0-9-]/', '', strtolower((string)($body['slug'] ?? '')));
  $type = in_array($body['type'] ?? '', ['motorhome','capsule'], true) ? $body['type'] : '';
  $title = mb_substr(trim((string)($body['title'] ?? '')), 0, 180);
  $price = filter_var($body['price'] ?? null, FILTER_VALIDATE_FLOAT);
  if (!$slug || !$type || !$title || $price === false || $price < 0) { http_response_code(400); echo json_encode(['error' => 'Valid slug, type, title and price are required']); exit; }
  $images = array_values(array_filter(array_map('strval', is_array($body['images'] ?? null) ? $body['images'] : []), static fn($image) => preg_match('#^/uploads/catalog/[a-f0-9]{24}\.(avif|webp)$#', $image)));
  $status = ($body['status'] ?? '') === 'sold' ? 'sold' : 'available';
  $values = [$slug,$type,$title,mb_substr(trim((string)($body['subtitle'] ?? '')),0,255),$price,($body['year'] ?? '') !== '' ? (int)$body['year'] : null,($body['mileage'] ?? '') !== '' ? (int)$body['mileage'] : null,($body['berths'] ?? '') !== '' ? (int)$body['berths'] : null,($body['length_m'] ?? '') !== '' ? (float)$body['length_m'] : null,($body['area_m2'] ?? '') !== '' ? (float)$body['area_m2'] : null,mb_substr(trim((string)($body['description'] ?? '')),0,6000),mb_substr(trim((string)($body['included'] ?? '')),0,3000),json_encode($images),$status,!empty($body['certified']) ? 1 : 0];
  try { if ($id) { $statement = $db->prepare('UPDATE mlt_acquisitions SET slug=?,type=?,title=?,subtitle=?,price=?,year=?,mileage=?,berths=?,length_m=?,area_m2=?,description=?,included=?,images_json=?,status=?,certified=? WHERE id=?'); $statement->execute([...$values,$id]); } else { $statement = $db->prepare('INSERT INTO mlt_acquisitions(slug,type,title,subtitle,price,year,mileage,berths,length_m,area_m2,description,included,images_json,status,certified) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'); $statement->execute($values); } echo json_encode(['ok'=>true]); } catch (Throwable $error) { http_response_code(409); echo json_encode(['error'=>'Could not save listing. Check that the slug is unique.']); } exit;
}
http_response_code(400); echo json_encode(['error'=>'Unknown action']);
