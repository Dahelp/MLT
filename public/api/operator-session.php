<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
require_once __DIR__.'/booking.php';
$db=mlt_db(mlt_settings());if(!$db){http_response_code(503);echo json_encode(['error'=>'Service unavailable.']);exit;}
$token=preg_replace('/^Bearer\s+/i','',(string)($_SERVER['HTTP_AUTHORIZATION']??''));
$q=$db->prepare('SELECT first_name,last_name,role FROM mlt_users WHERE session_hash=? AND session_expires_at>NOW() LIMIT 1');$q->execute([hash('sha256',$token)]);$user=$q->fetch();
if(!$user||!in_array($user['role'],['admin','manager','salesmanager','concierge'],true)){http_response_code(403);echo json_encode(['error'=>'Staff access required.']);exit;}
echo json_encode(['operator'=>['name'=>trim($user['first_name'].' '.$user['last_name']),'role'=>$user['role']]]);
