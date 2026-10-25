<?php
declare(strict_types=1);
require_once __DIR__.'/../public/api/booking.php';
require_once __DIR__.'/../public/api/voucher-core.php';
$dsn=(string)getenv('MLT_PRICING_TEST_DSN');
if(!preg_match('/^mysql:host=127\.0\.0\.1;port=\d+$/',$dsn))throw new RuntimeException('An explicit isolated localhost DSN is required.');
$testUser=(string)(getenv('MLT_PRICING_TEST_USER')?:'root');$testPassword=(string)getenv('MLT_PRICING_TEST_PASSWORD');
$db=new PDO($dsn,$testUser,$testPassword,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
$db->exec('CREATE DATABASE IF NOT EXISTS mlt_pricing_test');
$settings=['database'=>['host'=>substr($dsn,11),'name'=>'mlt_pricing_test','user'=>$testUser,'password'=>$testPassword]];
$db=mlt_db($settings);if(!$db)throw new RuntimeException('Test database unavailable.');
mlt_voucher_schema($db);
$mode=$argv[1]??'setup';
if($mode==='setup'){
    foreach(['agency','admin','traveller'] as $i=>$role){$db->prepare('INSERT INTO mlt_users (email,first_name,last_name,role,session_hash,session_expires_at,password_hash) VALUES (?,?,?,?,?,DATE_ADD(NOW(),INTERVAL 1 DAY),?) ON DUPLICATE KEY UPDATE session_hash=VALUES(session_hash),session_expires_at=VALUES(session_expires_at)')->execute([$role.'@pricing.example.test','Pricing','Test',$role,hash('sha256','pricing-test-'.$role),password_hash('PricingTestOnly123!',PASSWORD_DEFAULT)]);}
    echo json_encode($settings);exit;
}
$reference=(string)($argv[2]??'');
if($mode==='quote'){echo json_encode(mlt_payment_quote($db,$reference,1,$argv[3]??'deposit'));exit;}
if($mode==='pay'){
    $quote=mlt_payment_quote($db,$reference,1,'deposit');
    if(!$quote)throw new RuntimeException('No next payment available');
    echo json_encode(mlt_record_payment($db,$reference,'test','pricing-test-'.bin2hex(random_bytes(12)),(float)$quote['amount'],'EUR','deposit'));exit;
}
if($mode==='hold'){$q=$db->prepare('SELECT paid_amount,total_amount FROM mlt_orders WHERE reference_code=?');$q->execute([$reference]);$o=$q->fetch();mlt_voucher_hold_checkout($db,$reference,'stripe',(float)$o['paid_amount'],(float)$o['total_amount']);echo 'true';exit;}
if($mode==='release'){$db->prepare('DELETE h FROM mlt_journey_checkout_holds h JOIN mlt_orders o ON o.id=h.order_id WHERE o.reference_code=?')->execute([$reference]);echo 'true';exit;}
throw new RuntimeException('Unknown test action');
