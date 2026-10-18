<?php
declare(strict_types=1);
require_once __DIR__.'/../public/api/booking.php';
require_once __DIR__.'/../public/api/voucher-payments.php';
$dsn=(string)getenv('MLT_VOUCHER_TEST_DSN');
if(!preg_match('/^mysql:host=127\.0\.0\.1;port=\d+$/',$dsn))throw new RuntimeException('Explicit localhost test DSN required (without a database).');
$pdo=new PDO($dsn.";charset=utf8mb4",(string)(getenv('MLT_VOUCHER_TEST_USER')?:'root'),(string)getenv('MLT_VOUCHER_TEST_PASSWORD'),[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
$pdo->exec('CREATE DATABASE IF NOT EXISTS mlt_vouchers_test');$pdo->exec('USE mlt_vouchers_test');
function check(bool $condition,string $message):void {if(!$condition)throw new RuntimeException($message);}
function denied(callable $call,string $message):void {try{$call();}catch(DomainException $e){return;}throw new RuntimeException($message);}
$mode=$argv[1]??'test';
if($mode==='reserve'){
    try{$p=mlt_voucher_reserve($pdo,['id'=>(int)$argv[2],'role'=>'traveller'],1,'stripe',(int)$argv[3]);echo json_encode(['ok'=>true,'reference'=>$p['reference_code']]);}catch(DomainException $e){echo json_encode(['ok'=>false]);}exit;
}
if($mode==='redeem'){
    try{$r=mlt_voucher_redeem($pdo,['id'=>1,'email'=>'client@example.test'],(int)$argv[2],'MLT-CONCURRENT',(string)$argv[3]);echo json_encode(['ok'=>true,...$r]);}catch(DomainException $e){echo json_encode(['ok'=>false]);}exit;
}
if($mode==='setup'||$mode==='test'){
    foreach(['mlt_voucher_ledger','mlt_voucher_receipts','mlt_vouchers','mlt_voucher_purchases','mlt_voucher_campaigns','mlt_voucher_permissions','mlt_voucher_audit','mlt_journey_checkout_holds','mlt_journey_checkout_cancellations','mlt_payments','mlt_orders','mlt_users'] as $table)$pdo->exec('DROP TABLE IF EXISTS '.$table);
    $pdo=mlt_db(['database'=>['host'=>substr($dsn,11),'name'=>'mlt_vouchers_test','user'=>(string)(getenv('MLT_VOUCHER_TEST_USER')?:'root'),'password'=>(string)getenv('MLT_VOUCHER_TEST_PASSWORD')]]);
    if(!$pdo)throw new RuntimeException('Could not initialize the isolated test schema.');
    mlt_voucher_schema($pdo);mlt_voucher_schema($pdo);
    foreach(['traveller','admin','manager','concierge','salesmanager','agency'] as $i=>$role){$pdo->prepare('INSERT INTO mlt_users (id,email,first_name,last_name,locale,role,session_hash,session_expires_at,password_hash) VALUES (?,?,?,?,?,?,?,DATE_ADD(NOW(),INTERVAL 1 DAY),?)')->execute([$i+1,$i===0?'client@example.test':$role.'@example.test','Test',$role,'en',$role,hash('sha256','voucher-test-'.$role),password_hash('VoucherTestOnly123!',PASSWORD_DEFAULT)]);}
    $pdo->exec('INSERT INTO mlt_orders (id,user_id,reference_code,customer_email,total_amount,status,first_name,last_name) VALUES (1,1,"MLT-FIRST","client@example.test",3200,"requested","Test","Client"),(2,1,"MLT-SECOND","client@example.test",3000,"requested","Test","Client"),(3,1,"MLT-CONCURRENT","client@example.test",1000,"requested","Test","Client"),(4,6,"MLT-OTHER","agency@example.test",1000,"requested","Test","Client")');
}
if($mode==='setup'){echo 'OK';exit;}
if($mode==='prepare-concurrency'){$pdo->exec('UPDATE mlt_voucher_campaigns SET quantity=7 WHERE id=1');echo 'OK';exit;}
if($mode==='cancel-first'){$pdo->exec('UPDATE mlt_orders SET status="cancelled" WHERE id=1');echo 'OK';exit;}
if($mode==='summary'){echo json_encode(['campaign'=>mlt_voucher_campaigns($pdo,true)[0],'concurrentPaid'=>$pdo->query('SELECT paid_amount FROM mlt_orders WHERE id=3')->fetchColumn(),'vouchers'=>$pdo->query('SELECT COUNT(*) FROM mlt_vouchers')->fetchColumn()]);exit;}

check(mlt_voucher_providers(['stripe_secret_key'=>'sk_test_example'])['stripe']===false,'Production voucher sales reject test-money credentials.');
check(mlt_voucher_providers(['stripe_secret_key'=>'sk_live_example'])['stripe']===true,'Live Stripe can sell vouchers.');
check(mlt_voucher_providers(['client_id'=>'test','client_secret'=>'test','mode'=>'sandbox'])['paypal']===false,'PayPal sandbox cannot mint production credit.');
$client=['id'=>1,'email'=>'client@example.test','role'=>'traveller'];
$catalog=mlt_voucher_campaigns($pdo);check($catalog[0]['remaining']===50,'Initial stock must be 50.');
denied(fn()=>mlt_voucher_reserve($pdo,$client,1,'stripe',51),'Cannot reserve more than 50.');
denied(fn()=>mlt_voucher_reserve($pdo,$client,1,'stripe',0),'Zero quantity must fail.');
$purchase=mlt_voucher_reserve($pdo,$client,1,'stripe',3);
check((int)$purchase['quantity']===3,'Multi-voucher checkout quantity.');
check(mlt_voucher_campaigns($pdo)[0]['remaining']===50,'Reservation is not a sale.');
check(mlt_voucher_campaigns($pdo)[0]['available']===47,'Reservation holds all three slots.');
check(mlt_voucher_reserve($pdo,$client,1,'stripe',3)['id']===$purchase['id'],'Checkout retries reuse reservation.');
$pdo->exec('UPDATE mlt_voucher_purchases SET reserved_until=DATE_SUB(NOW(),INTERVAL 1 DAY)');
check(mlt_voucher_campaigns($pdo)[0]['available']===47,'Do not resell stock before reconciling uncertain provider payment.');
denied(fn()=>mlt_voucher_issue($pdo,$purchase['reference_code'],'stripe','cs_test_1','pi_test_1',400000,'EUR'),'Partial purchase payment rejected.');
denied(fn()=>mlt_voucher_issue($pdo,$purchase['reference_code'],'stripe','cs_test_1','pi_test_1',1200000,'USD'),'Wrong currency rejected.');
$v=mlt_voucher_issue($pdo,$purchase['reference_code'],'stripe','cs_test_1','pi_test_1',1200000,'EUR');
check((int)$pdo->query('SELECT COUNT(*) FROM mlt_vouchers')->fetchColumn()===3,'One independently spendable voucher per purchased unit.');
check(mlt_voucher_campaigns($pdo)[0]['remaining']===47,'One paid purchase of three reduces stock by three.');
mlt_voucher_issue($pdo,$purchase['reference_code'],'stripe','cs_test_1','pi_test_1',1200000,'EUR');
check((int)$pdo->query('SELECT COUNT(*) FROM mlt_vouchers')->fetchColumn()===3,'Duplicate webhook must not duplicate vouchers.');
$id=(int)$v['id'];$r=mlt_voucher_redeem($pdo,$client,$id,'MLT-FIRST','first-payment-000001');
check($r['applied_cents']===320000&&$r['balance_cents']===180000,'5000 voucher minus 3200 journey leaves 1800.');
$r=mlt_voucher_redeem($pdo,$client,$id,'MLT-FIRST','first-payment-000001');check($r['balance_cents']===180000,'Retry is idempotent.');
denied(fn()=>mlt_voucher_redeem($pdo,$client,$id,'MLT-OTHER','another-client-00001'),'Cannot pay another customer journey.');
denied(fn()=>mlt_voucher_redeem($pdo,['id'=>6,'email'=>'agency@example.test'],$id,'MLT-OTHER','stolen-voucher-00001'),'Cannot spend another customer voucher.');
$r=mlt_voucher_redeem($pdo,$client,$id,'MLT-SECOND','second-payment-00001');check($r['applied_cents']===180000&&$r['balance_cents']===0,'Remaining voucher credit is reusable.');
$quote=mlt_payment_quote($pdo,'MLT-SECOND',3000,'full');check($quote['amount']===1200.0,'Cash checkout charges only remaining 1200, including full payment option.');
mlt_record_payment($pdo,'MLT-SECOND','stripe','pi_difference',1200,'EUR','balance');
check((float)$pdo->query('SELECT paid_amount FROM mlt_orders WHERE id=2')->fetchColumn()===3000.0,'Voucher plus cash equals tour cost.');
check(mlt_record_payment($pdo,'MLT-SECOND','stripe','pi_difference',1200,'EUR','balance')===null,'Duplicate cash callback is idempotent.');
$pdo->exec('UPDATE mlt_vouchers SET status="blocked" WHERE id=1');denied(fn()=>mlt_voucher_redeem($pdo,$client,1,'MLT-CONCURRENT','blocked-voucher-00001'),'Blocked voucher rejected.');
$pdo->exec('UPDATE mlt_vouchers SET status="active",expires_at=DATE_SUB(NOW(),INTERVAL 1 DAY) WHERE id=1');denied(fn()=>mlt_voucher_redeem($pdo,$client,1,'MLT-CONCURRENT','expired-voucher-00001'),'Expired voucher rejected.');
$pdo->exec('UPDATE mlt_vouchers SET expires_at=NULL WHERE id=1');mlt_voucher_hold_checkout($pdo,'MLT-CONCURRENT','stripe',0);
denied(fn()=>mlt_voucher_redeem($pdo,$client,1,'MLT-CONCURRENT','checkout-in-progress1'),'Active cash checkout prevents double spending journey balance.');
$pdo->exec('UPDATE mlt_journey_checkout_holds SET expires_at=DATE_SUB(NOW(),INTERVAL 1 HOUR)');
denied(fn()=>mlt_voucher_redeem($pdo,$client,1,'MLT-CONCURRENT','expired-cash-hold-001'),'A local timer cannot bypass an unverified provider checkout.');
mlt_voucher_save_journey_checkout($pdo,'MLT-CONCURRENT','https://checkout.stripe.com/c/pay/test','cs_test_existing');
check(mlt_voucher_hold_checkout($pdo,'MLT-CONCURRENT','stripe',0)==='https://checkout.stripe.com/c/pay/test','Cash checkout retries resume the same provider checkout.');
$pdo->exec('INSERT INTO mlt_journey_checkout_cancellations (checkout_id) VALUES ("PAYPAL-CANCELLED")');
denied(fn()=>mlt_journey_paypal_settle($pdo,[],'MLT-CONCURRENT','PAYPAL-CANCELLED'),'A closed PayPal approval cannot later capture money.');
$pdo->exec('DELETE FROM mlt_journey_checkout_holds');
check(!mlt_voucher_rights($pdo,['role'=>'manager'])['manage'],'Manager cannot edit denominations without explicit grant.');
check(mlt_voucher_rights($pdo,['role'=>'admin'])['permissions'],'Only admin assigns role permissions.');
try{$pdo->exec('DELETE FROM mlt_orders WHERE id=1');throw new RuntimeException('Voucher-linked journey history must not be deletable.');}catch(PDOException $e){check($e->getCode()==='23000','Expected foreign key protection.');}
echo "Voucher monetary integration checks passed.\n";
