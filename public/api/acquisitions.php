<?php
declare(strict_types=1);
require_once __DIR__ . '/security.php';
mlt_security_guard(['GET', 'POST']);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
require_once __DIR__ . '/booking.php';
$settings = mlt_settings();
$db = mlt_db($settings);
if (!$db) { http_response_code(503); echo json_encode(['error' => 'Inventory unavailable']); exit; }
$db->exec('CREATE TABLE IF NOT EXISTS mlt_acquisitions (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, slug VARCHAR(120) NOT NULL UNIQUE, type VARCHAR(20) NOT NULL, title VARCHAR(180) NOT NULL, subtitle VARCHAR(255) NULL, price DECIMAL(12,2) NOT NULL, year SMALLINT NULL, mileage INT NULL, berths TINYINT NULL, length_m DECIMAL(5,2) NULL, area_m2 DECIMAL(7,2) NULL, description TEXT NULL, included TEXT NULL, images_json TEXT NULL, status VARCHAR(20) NOT NULL DEFAULT "available", certified TINYINT(1) NOT NULL DEFAULT 0, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
// Add extensible attributes without limiting future vehicles to this model's fields.
foreach (['specifications_json' => 'TEXT', 'equipment_json' => 'TEXT', 'source_url' => 'VARCHAR(2048)', 'seller_description' => 'TEXT'] as $column => $definition) {
  $check = $db->query("SHOW COLUMNS FROM mlt_acquisitions LIKE '$column'");
  if (!$check->fetch()) {
    try { $db->exec("ALTER TABLE mlt_acquisitions ADD COLUMN $column $definition NULL"); }
    catch (PDOException $error) { if ((int)($error->errorInfo[1] ?? 0) !== 1060) throw $error; }
  }
}
// Versioned content import: subsequent requests must preserve sales-manager edits.
$db->exec('CREATE TABLE IF NOT EXISTS mlt_content_migrations (migration_key VARCHAR(120) PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
$migrationKey = 'acquisitions-marco-polo-2026-10-14';
$check = $db->prepare('SELECT migration_key FROM mlt_content_migrations WHERE migration_key=?');
$check->execute([$migrationKey]);
if (!$check->fetch()) {
  $seed = json_decode((string)file_get_contents(__DIR__ . '/../data/acquisitions/mercedes-benz-v-300-marco-polo.json'), true, 512, JSON_THROW_ON_ERROR);
  $db->beginTransaction();
  try {
    $claim = $db->prepare('INSERT IGNORE INTO mlt_content_migrations(migration_key) VALUES(?)');
    $claim->execute([$migrationKey]);
    if ($claim->rowCount()) {
      $columns = ['slug','type','title','subtitle','price','year','mileage','berths','length_m','area_m2','description','included','images_json','status','certified','specifications_json','equipment_json','source_url','seller_description'];
      $statement = $db->prepare('INSERT IGNORE INTO mlt_acquisitions(' . implode(',', $columns) . ') VALUES(' . implode(',', array_fill(0, count($columns), '?')) . ')');
      $statement->execute(array_map(static fn($column) => $seed[$column] ?? null, $columns));
    }
    $db->commit();
  } catch (Throwable $error) { $db->rollBack(); throw $error; }
}
// Apply this requested photo order and capacity update once, preserving other listing edits.
$migrationKey = 'acquisitions-marco-polo-photos-capacity-2026-10-22';
$check = $db->prepare('SELECT migration_key FROM mlt_content_migrations WHERE migration_key=?');
$check->execute([$migrationKey]);
if (!$check->fetch()) {
  $db->beginTransaction();
  try {
    $claim = $db->prepare('INSERT IGNORE INTO mlt_content_migrations(migration_key) VALUES(?)');
    $claim->execute([$migrationKey]);
    if ($claim->rowCount()) {
      $current = $db->prepare('SELECT specifications_json FROM mlt_acquisitions WHERE slug=?');
      $current->execute(['mercedes-benz-v-300-marco-polo']);
      $listing = $current->fetch(PDO::FETCH_ASSOC);
      if ($listing) {
        $seed = json_decode((string)file_get_contents(__DIR__ . '/../data/acquisitions/mercedes-benz-v-300-marco-polo.json'), true, 512, JSON_THROW_ON_ERROR);
        $specifications = json_decode($listing['specifications_json'] ?? '[]', true) ?: [];
        $specifications = array_values(array_filter($specifications, static fn($row) => ($row['label'] ?? '') !== 'Passenger seats'));
        $specifications[] = ['label'=>'Passenger seats','value'=>'2'];
        $update = $db->prepare('UPDATE mlt_acquisitions SET berths=?,images_json=?,specifications_json=? WHERE slug=?');
        $update->execute([5,$seed['images_json'],json_encode($specifications, JSON_UNESCAPED_UNICODE),'mercedes-benz-v-300-marco-polo']);
      }
    }
    $db->commit();
  } catch (Throwable $error) { $db->rollBack(); throw $error; }
}
// Publish the company-owned listing wording once without changing photos, pricing or capacity.
$migrationKey = 'acquisitions-marco-polo-mlt-direct-sale-2026-10-22';
$check = $db->prepare('SELECT migration_key FROM mlt_content_migrations WHERE migration_key=?');
$check->execute([$migrationKey]);
if (!$check->fetch()) {
  $db->beginTransaction();
  try {
    $claim = $db->prepare('INSERT IGNORE INTO mlt_content_migrations(migration_key) VALUES(?)');
    $claim->execute([$migrationKey]);
    if ($claim->rowCount()) {
      $seed = json_decode((string)file_get_contents(__DIR__ . '/../data/acquisitions/mercedes-benz-v-300-marco-polo.json'), true, 512, JSON_THROW_ON_ERROR);
      $update = $db->prepare('UPDATE mlt_acquisitions SET description=?,specifications_json=?,equipment_json=?,seller_description=? WHERE slug=?');
      $update->execute([$seed['description'],$seed['specifications_json'],$seed['equipment_json'],'',$seed['slug']]);
    }
    $db->commit();
  } catch (Throwable $error) { $db->rollBack(); throw $error; }
}
// Refresh the vehicle copy without naming a seller or changing commercial facts.
$migrationKey = 'acquisitions-marco-polo-product-copy-2026-10-22';
$check = $db->prepare('SELECT migration_key FROM mlt_content_migrations WHERE migration_key=?');
$check->execute([$migrationKey]);
if (!$check->fetch()) {
  $db->beginTransaction();
  try {
    $claim = $db->prepare('INSERT IGNORE INTO mlt_content_migrations(migration_key) VALUES(?)');
    $claim->execute([$migrationKey]);
    if ($claim->rowCount()) {
      $seed = json_decode((string)file_get_contents(__DIR__ . '/../data/acquisitions/mercedes-benz-v-300-marco-polo.json'), true, 512, JSON_THROW_ON_ERROR);
      $update = $db->prepare('UPDATE mlt_acquisitions SET description=?,specifications_json=? WHERE slug=?');
      $update->execute([$seed['description'],$seed['specifications_json'],$seed['slug']]);
    }
    $db->commit();
  } catch (Throwable $error) { $db->rollBack(); throw $error; }
}
// Correct the transposed capacities once, preserving all other vehicle data.
$migrationKey = 'acquisitions-marco-polo-correct-capacity-2026-10-22';
$check = $db->prepare('SELECT migration_key FROM mlt_content_migrations WHERE migration_key=?');
$check->execute([$migrationKey]);
if (!$check->fetch()) {
  $db->beginTransaction();
  try {
    $claim = $db->prepare('INSERT IGNORE INTO mlt_content_migrations(migration_key) VALUES(?)');
    $claim->execute([$migrationKey]);
    if ($claim->rowCount()) {
      $q = $db->prepare('SELECT specifications_json FROM mlt_acquisitions WHERE slug=?');
      $q->execute(['mercedes-benz-v-300-marco-polo']);
      $row = $q->fetch(PDO::FETCH_ASSOC);
      if ($row) {
        $specifications = json_decode($row['specifications_json'] ?? '[]', true) ?: [];
        $specifications = array_values(array_filter($specifications, static fn($entry) => ($entry['label'] ?? '') !== 'Passenger seats'));
        $specifications[] = ['label'=>'Passenger seats','value'=>'5'];
        $q = $db->prepare('UPDATE mlt_acquisitions SET berths=?,specifications_json=? WHERE slug=?');
        $q->execute([2,json_encode($specifications, JSON_UNESCAPED_UNICODE),'mercedes-benz-v-300-marco-polo']);
      }
    }
    $db->commit();
  } catch (Throwable $error) { $db->rollBack(); throw $error; }
}
$body = json_decode(file_get_contents('php://input'), true); if (!is_array($body)) $body = [];
$action = (string)($body['action'] ?? 'list');
if ($action === 'list') { $rows = $db->query('SELECT * FROM mlt_acquisitions ORDER BY status,updated_at DESC')->fetchAll(PDO::FETCH_ASSOC); echo json_encode(['items' => $rows], JSON_UNESCAPED_UNICODE); exit; }
$token = preg_replace('/^Bearer\s+/i', '', (string)($_SERVER['HTTP_AUTHORIZATION'] ?? ''));
$query = $db->prepare('SELECT role,first_name,last_name FROM mlt_users WHERE session_hash=? AND session_expires_at>NOW() LIMIT 1');
$query->execute([hash('sha256', $token)]); $operator = $query->fetch(PDO::FETCH_ASSOC);
if ($action === 'session' && in_array($operator['role'] ?? '', ['admin','salesmanager'], true)) { echo json_encode(['ok'=>true,'role'=>$operator['role'],'name'=>trim($operator['first_name'].' '.$operator['last_name']),'canEdit'=>in_array($operator['role'],['admin','salesmanager'],true)]); exit; }
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
  $specifications = []; $equipment = [];
  foreach (array_slice(is_array($body['specifications'] ?? null) ? $body['specifications'] : [], 0, 100) as $row) {
    if (!is_array($row)) continue;
    $label = mb_substr(trim((string)($row['label'] ?? '')),0,120); $value = mb_substr(trim((string)($row['value'] ?? '')),0,1000);
    if ($label !== '' && $value !== '') $specifications[] = ['label'=>$label,'value'=>$value];
  }
  foreach (array_slice(is_array($body['equipment'] ?? null) ? $body['equipment'] : [], 0, 20) as $group) {
    if (!is_array($group)) continue;
    $groupTitle = mb_substr(trim((string)($group['title'] ?? '')),0,120);
    $entries = array_values(array_filter(array_map(static fn($item) => mb_substr(trim((string)$item),0,300), array_slice(is_array($group['items'] ?? null) ? $group['items'] : [],0,150))));
    if ($groupTitle !== '' && $entries) $equipment[] = ['title'=>$groupTitle,'items'=>$entries];
  }
  $sourceUrl = mb_substr(trim((string)($body['source_url'] ?? '')),0,2048);
  if ($sourceUrl !== '' && (!filter_var($sourceUrl,FILTER_VALIDATE_URL) || parse_url($sourceUrl,PHP_URL_SCHEME) !== 'https')) { http_response_code(400); echo json_encode(['error'=>'Source must be an HTTPS URL']); exit; }
  $status = ($body['status'] ?? '') === 'sold' ? 'sold' : 'available';
  $values = [$slug,$type,$title,mb_substr(trim((string)($body['subtitle'] ?? '')),0,255),$price,($body['year'] ?? '') !== '' ? (int)$body['year'] : null,($body['mileage'] ?? '') !== '' ? (int)$body['mileage'] : null,($body['berths'] ?? '') !== '' ? (int)$body['berths'] : null,($body['length_m'] ?? '') !== '' ? (float)$body['length_m'] : null,($body['area_m2'] ?? '') !== '' ? (float)$body['area_m2'] : null,mb_substr(trim((string)($body['description'] ?? '')),0,6000),mb_substr(trim((string)($body['included'] ?? '')),0,3000),json_encode($images),$status,!empty($body['certified']) ? 1 : 0];
  $values = [...$values,json_encode($specifications,JSON_UNESCAPED_UNICODE),json_encode($equipment,JSON_UNESCAPED_UNICODE),$sourceUrl,mb_substr(trim((string)($body['seller_description'] ?? '')),0,12000)];
  try { if ($id) { $statement = $db->prepare('UPDATE mlt_acquisitions SET slug=?,type=?,title=?,subtitle=?,price=?,year=?,mileage=?,berths=?,length_m=?,area_m2=?,description=?,included=?,images_json=?,status=?,certified=?,specifications_json=?,equipment_json=?,source_url=?,seller_description=? WHERE id=?'); $statement->execute([...$values,$id]); } else { $statement = $db->prepare('INSERT INTO mlt_acquisitions(slug,type,title,subtitle,price,year,mileage,berths,length_m,area_m2,description,included,images_json,status,certified,specifications_json,equipment_json,source_url,seller_description) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'); $statement->execute($values); } echo json_encode(['ok'=>true]); } catch (Throwable $error) { http_response_code(409); echo json_encode(['error'=>'Could not save listing. Check that the slug is unique.']); } exit;
}
http_response_code(400); echo json_encode(['error'=>'Unknown action']);
