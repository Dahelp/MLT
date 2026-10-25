<?php
declare(strict_types=1);
require_once __DIR__.'/security.php';
mlt_security_guard(['GET']);
require_once __DIR__.'/booking.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
try {
    $db=mlt_db(mlt_settings());
    if(!$db)throw new RuntimeException('Database unavailable');
    echo json_encode(mlt_protection_settings($db),JSON_THROW_ON_ERROR);
}catch(Throwable $e){http_response_code(503);echo json_encode(['enabled'=>false,'percent'=>5,'terms'=>'']);}
