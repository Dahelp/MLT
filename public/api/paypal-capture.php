<?php
declare(strict_types=1);
require_once __DIR__ . '/security.php';
mlt_security_guard(['GET']);

require_once __DIR__.'/booking.php';
require_once __DIR__.'/voucher-payments.php';
$reference=substr(trim((string)($_GET['reference']??'')),0,80);
$orderId=substr(trim((string)($_GET['token']??'')),0,128);
$kind=in_array($_GET['kind']??'',['deposit','full','balance'],true)?$_GET['kind']:'full';
$result='error';$locked=false;$db=null;
try{
    if(!preg_match('/^MLT-[A-Z0-9-]+$/',$reference)||!preg_match('/^[A-Za-z0-9_-]{6,128}$/',$orderId))throw new DomainException('Invalid payment reference.');
    $settings=mlt_settings();$db=mlt_db($settings);if(!$db)throw new RuntimeException('Database unavailable.');mlt_voucher_schema($db);
    $q=$db->prepare('SELECT GET_LOCK(?,15)');$q->execute(['mlt:checkout:'.$reference]);if(!$q->fetchColumn())throw new RuntimeException('Payment processing in progress.');$locked=true;
    $order=mlt_journey_paypal_settle($db,$settings,$reference,$orderId,$kind);if($order)mlt_notify_paid($order,$settings);
    $result=$kind==='deposit'?'partial':'success';
}catch(Throwable $e){error_log('MLT PayPal journey confirmation: '.$e->getMessage());}
finally{if($locked&&$db){$q=$db->prepare('SELECT RELEASE_LOCK(?)');$q->execute(['mlt:checkout:'.$reference]);}}
header('Cache-Control: no-store');header('Location: https://mlt-lifestyle.com/account/?payment='.$result.'&reference='.rawurlencode($reference).'&kind='.rawurlencode($kind),true,303);exit;
