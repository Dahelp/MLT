<?php
declare(strict_types=1);
require_once __DIR__ . '/security.php';
mlt_security_guard(['GET']);

require_once __DIR__.'/booking.php';require_once __DIR__.'/voucher-payments.php';
$result='error';
try{
    $settings=mlt_settings();$db=mlt_db($settings);if(!$db)throw new RuntimeException('Database unavailable.');mlt_voucher_schema($db);
    $ref=(string)($_GET['reference']??'');if(!preg_match('/^MLTV-[A-F0-9]{24}$/',$ref))throw new DomainException('Invalid reference.');
    if(($_GET['provider']??'')==='stripe'){
        $id=(string)($_GET['session_id']??'');if(!preg_match('/^cs_[a-zA-Z0-9_]+$/',$id))throw new DomainException('Invalid session.');
        $session=mlt_voucher_http('https://api.stripe.com/v1/checkout/sessions/'.rawurlencode($id),['Authorization: Basic '.base64_encode(($settings['stripe_secret_key']??'').':')]);
        if(($session['client_reference_id']??'')!==$ref)throw new DomainException('Reference mismatch.');mlt_voucher_stripe_settle($db,$session);
    }elseif(($_GET['provider']??'')==='paypal')mlt_voucher_paypal_settle($db,$settings,$ref,(string)($_GET['token']??''));
    else throw new DomainException('Invalid provider.');
    $result='success';
}catch(Throwable $e){error_log('MLT voucher return: '.$e->getMessage());}
header('Cache-Control: no-store');header('Location: https://mlt-lifestyle.com/account/vouchers/?voucher='.$result,true,303);exit;
