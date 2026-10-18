<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
require_once __DIR__.'/booking.php';require_once __DIR__.'/voucher-payments.php';
if($_SERVER['REQUEST_METHOD']!=='POST'){http_response_code(405);echo json_encode(['error'=>'Method not allowed.']);exit;}
$locked=false;$db=null;
try{
    $body=json_decode(file_get_contents('php://input'),true);if(!is_array($body))throw new DomainException('Invalid request.');
    $ref=(string)($body['reference']??'');if(!preg_match('/^MLT-[A-Z0-9-]+$/',$ref))throw new DomainException('Invalid reference.');
    $settings=mlt_settings();$db=mlt_db($settings);if(!$db)throw new RuntimeException('Database unavailable.');mlt_voucher_schema($db);mlt_voucher_authorize_journey($db,$ref);
    // PayPal capture and cancellation share a database advisory lock, including the provider round trip.
    $lock=$db->prepare('SELECT GET_LOCK(?,15)');$lock->execute(['mlt:checkout:'.$ref]);if(!$lock->fetchColumn())throw new RuntimeException('Payment processing in progress.');$locked=true;
    $q=$db->prepare('SELECT h.*,o.reference_code FROM mlt_journey_checkout_holds h JOIN mlt_orders o ON o.id=h.order_id WHERE o.reference_code=?');$q->execute([$ref]);$hold=$q->fetch();
    $result=['active'=>(bool)$hold,'url'=>$hold['checkout_url']??null];
    if($hold&&($body['action']??'status')==='cancel'){
        if(!$hold['checkout_id'])throw new DomainException('Checkout confirmation is pending. Please retry or contact MLT.');
        if($hold['provider']==='stripe'){
            $headers=['Authorization: Basic '.base64_encode(($settings['stripe_secret_key']??'').':')];$url='https://api.stripe.com/v1/checkout/sessions/'.rawurlencode($hold['checkout_id']);$s=mlt_voucher_http($url,$headers);
            if(($s['client_reference_id']??'')!==$ref)throw new DomainException('Checkout reference mismatch.');
            if(($s['payment_status']??'')==='paid'){mlt_mark_stripe_order_paid($db,$ref,$s['id'],(string)($s['payment_intent']??$s['id']),(int)$s['amount_total'],(string)$s['currency'],(string)($s['metadata']['payment_kind']??'full'));}
            elseif(($s['status']??'')!=='expired'){
                // Provider expiration fails safely if payment completed concurrently. A retry then records that payment.
                mlt_voucher_http($url.'/expire',[...$headers,'Content-Type: application/x-www-form-urlencoded'],'');
            }
        }else{
            [$base,$auth]=mlt_voucher_paypal_auth($settings);$s=mlt_voucher_http($base.'/v2/checkout/orders/'.rawurlencode($hold['checkout_id']),[$auth]);
            if(($s['purchase_units'][0]['custom_id']??'')!==$ref)throw new DomainException('Checkout reference mismatch.');
            if(($s['status']??'')==='COMPLETED')mlt_journey_paypal_settle($db,$settings,$ref,$hold['checkout_id']);
            // An uncaptured approval is not a payment. Mark it cancelled before releasing the journey balance.
            if(($s['status']??'')!=='COMPLETED')$db->prepare('INSERT IGNORE INTO mlt_journey_checkout_cancellations (checkout_id) VALUES (?)')->execute([$hold['checkout_id']]);
        }
        $db->prepare('DELETE FROM mlt_journey_checkout_holds WHERE order_id=? AND checkout_id=?')->execute([$hold['order_id'],$hold['checkout_id']]);
        $actor=mlt_voucher_user($db);mlt_voucher_audit($db,(int)$actor['id'],'journey_checkout_closed',(int)$hold['order_id'],['provider'=>$hold['provider']]);$result=['active'=>false,'refresh'=>true];
    }
    echo json_encode($result,JSON_THROW_ON_ERROR);
}catch(DomainException $e){http_response_code(409);echo json_encode(['error'=>$e->getMessage()]);}
catch(Throwable $e){error_log('MLT journey checkout: '.$e->getMessage());http_response_code(503);echo json_encode(['error'=>'Could not check the payment. Please retry.']);}
finally{if($locked&&$db){$q=$db->prepare('SELECT RELEASE_LOCK(?)');$q->execute(['mlt:checkout:'.$ref]);}}
