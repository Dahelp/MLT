<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store, max-age=0');
require_once __DIR__ . '/booking.php';
$body=json_decode(file_get_contents('php://input'),true); if(!is_array($body))$body=[];
$db=mlt_db(mlt_settings()); if(!$db){http_response_code(503);echo json_encode(['error'=>'Concierge service unavailable.']);exit;}
$token=preg_replace('/^Bearer\s+/i','',(string)($_SERVER['HTTP_AUTHORIZATION']??''));
$q=$db->prepare('SELECT id,email,first_name,last_name,role FROM mlt_users WHERE session_hash=? AND session_expires_at>NOW() LIMIT 1');$q->execute([hash('sha256',$token)]);$operator=$q->fetch();
if(!$operator||!in_array($operator['role']??'traveller',['concierge','admin'],true)){http_response_code(403);echo json_encode(['error'=>'Concierge access required.']);exit;}
$action=(string)($body['action']??'overview');
if($action==='overview'){$orders=$db->query('SELECT reference_code,status,payment_provider,amount,currency,first_name,last_name,customer_email,phone,collection_name,country_name,guests,travel_days,arrival_date,departure_date,created_at,paid_at FROM mlt_orders WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT 100')->fetchAll();$summary=$db->query('SELECT COUNT(*) total, SUM(status="paid") paid, SUM(status<>"paid") pending, COALESCE(SUM(CASE WHEN status="paid" THEN amount ELSE 0 END),0) revenue FROM mlt_orders WHERE archived_at IS NULL')->fetch();echo json_encode(['ok'=>true,'operator'=>['name'=>$operator['first_name'].' '.$operator['last_name'],'role'=>$operator['role']],'summary'=>$summary,'orders'=>$orders]);exit;}
if($action==='status'){$reference=mb_substr(trim((string)($body['reference']??'')),0,80);$status=(string)($body['status']??'');$allowed=['requested','in_progress','confirmed','paid','completed','cancelled'];if(!preg_match('/^MLT-[A-Z0-9-]+$/',$reference)||!in_array($status,$allowed,true)){http_response_code(400);echo json_encode(['error'=>'Invalid application update.']);exit;}$u=$db->prepare('UPDATE mlt_orders SET status=? WHERE reference_code=?');$u->execute([$status,$reference]);echo json_encode(['ok'=>true]);exit;}
echo json_encode(['ok'=>true]);
