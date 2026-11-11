<?php
declare(strict_types=1);
require_once __DIR__.'/../public/api/booking.php';
require_once __DIR__.'/../public/api/voucher-core.php';
$dsn=(string)getenv('MLT_FLEET_TEST_DSN');
if(!preg_match('/^mysql:host=127\.0\.0\.1;port=\d+$/',$dsn))throw new RuntimeException('An isolated localhost DSN is required.');
$user=getenv('MLT_FLEET_TEST_USER')?:'root';$password=(string)getenv('MLT_FLEET_TEST_PASSWORD');
$db=new PDO($dsn,$user,$password,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
$mode=$argv[1]??'setup';
if($mode==='setup'){
 $db->exec('CREATE DATABASE IF NOT EXISTS mlt_fleet_test');
 $settings=['database'=>['host'=>substr($dsn,11),'name'=>'mlt_fleet_test','user'=>$user,'password'=>$password]];
 $db=mlt_db($settings);if(!$db)throw new RuntimeException('Test schema failed.');mlt_voucher_schema($db);
 $db->exec('DELETE FROM mlt_payments');$db->exec('DELETE FROM mlt_journey_checkout_holds');$db->exec('DELETE FROM mlt_orders');$db->exec('DELETE FROM mlt_fleet_blocks');
 foreach(['agency','admin','traveller'] as $role)$db->prepare('INSERT INTO mlt_users (email,first_name,last_name,role,password_hash,session_hash,session_expires_at) VALUES (?,"Fleet","Test",?,"!test-only",?,DATE_ADD(NOW(),INTERVAL 1 DAY)) ON DUPLICATE KEY UPDATE session_hash=VALUES(session_hash),session_expires_at=VALUES(session_expires_at)')->execute([$role.'@fleet.example.test',$role,hash('sha256','fleet-test-'.$role)]);
 echo json_encode($settings);exit;
}
$db->exec('USE mlt_fleet_test');
try{
 if($mode==='book'){
  $collection=$argv[2]??'freedom';$start=$argv[3]??'2035-08-10';$end=$argv[4]??'2035-08-17';$reference='MLT-'.strtoupper(bin2hex(random_bytes(8)));
  mlt_create_order($db,$reference,['collection'=>$collection,'days'=>7,'arrival'=>$start,'departure'=>$end,'guests'=>'2','country'=>'Italy','freedomPlus'=>true,'motorhomeModelId'=>mlt_fleet_model()['id']],['firstName'=>'Fleet','lastName'=>'Test','email'=>'agency@fleet.example.test','phone'=>'']);
  $q=$db->prepare('SELECT * FROM mlt_orders WHERE reference_code=?');$q->execute([$reference]);echo json_encode(['ok'=>true,'order'=>$q->fetch()]);exit;
 }
 $ref=$argv[2]??'';
 if($mode==='expire'){$db->prepare('UPDATE mlt_orders SET motorhome_reserved_until=DATE_SUB(NOW(),INTERVAL 1 MINUTE) WHERE reference_code=?')->execute([$ref]);}
 elseif($mode==='pay'){mlt_record_payment($db,$ref,'test','fleet-'.bin2hex(random_bytes(8)),100,'EUR','deposit');}
 elseif($mode==='hold'){$q=$db->prepare('SELECT paid_amount,total_amount FROM mlt_orders WHERE reference_code=?');$q->execute([$ref]);$o=$q->fetch();mlt_voucher_hold_checkout($db,$ref,'stripe',(float)$o['paid_amount'],(float)$o['total_amount']);}
 elseif($mode==='cancel'){$db->prepare('UPDATE mlt_orders SET status="cancelled" WHERE reference_code=?')->execute([$ref]);}
 elseif($mode==='clear'){$db->exec('DELETE FROM mlt_journey_checkout_holds');$db->exec('UPDATE mlt_orders SET status="cancelled"');$db->exec('DELETE FROM mlt_fleet_blocks');}
 elseif($mode==='legacy'){$db->exec('UPDATE mlt_orders SET motorhome_unit_id=NULL,motorhome_json=NULL WHERE status<>"cancelled"');}
 else throw new RuntimeException('Unknown test operation.');
 echo json_encode(['ok'=>true]);
}catch(DomainException $e){echo json_encode(['ok'=>false,'error'=>$e->getMessage()]);}
