<?php
declare(strict_types=1);
require_once __DIR__.'/voucher-core.php';

function mlt_voucher_providers(array $settings):array {
    // Test money must never create spendable credit on the production site by accident.
    $sandbox=!empty($settings['voucher_sandbox_enabled']);
    $stripe=(string)($settings['stripe_secret_key']??'');
    return ['stripe'=>preg_match($sandbox?'/^(sk|rk)_(live|test)_/':'/^(sk|rk)_live_/',$stripe)===1,'paypal'=>!empty($settings['client_id'])&&!empty($settings['client_secret'])&&(($settings['mode']??'sandbox')==='live'||$sandbox)];
}

function mlt_voucher_http(string $url, array $headers, ?string $body=null): array {
    $curl=curl_init($url);curl_setopt_array($curl,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>25,CURLOPT_CONNECTTIMEOUT=>8,CURLOPT_HTTPHEADER=>$headers]);
    if($body!==null)curl_setopt_array($curl,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>$body]);
    $raw=curl_exec($curl);$status=(int)curl_getinfo($curl,CURLINFO_RESPONSE_CODE);curl_close($curl);
    $data=is_string($raw)?json_decode($raw,true):null;
    if($status<200||$status>=300||!is_array($data))throw new RuntimeException('Payment provider is temporarily unavailable. Please retry.',$status);
    return $data;
}
function mlt_voucher_paypal_auth(array $settings): array {
    $base=($settings['mode']??'sandbox')==='live'?'https://api-m.paypal.com':'https://api-m.sandbox.paypal.com';
    if(empty($settings['client_id'])||empty($settings['client_secret']))throw new RuntimeException('PayPal checkout is unavailable.');
    $result=mlt_voucher_http($base.'/v1/oauth2/token',['Authorization: Basic '.base64_encode($settings['client_id'].':'.$settings['client_secret']),'Content-Type: application/x-www-form-urlencoded'],'grant_type=client_credentials');
    return [$base,'Authorization: Bearer '.$result['access_token']];
}
function mlt_voucher_checkout(PDO $db, array $settings, array $user, int $campaign, string $provider, int $quantity=1): string {
    if(empty(mlt_voucher_providers($settings)[$provider]))throw new DomainException('This payment method is not available for voucher sales. Please contact MLT.');
    $p=mlt_voucher_reserve($db,$user,$campaign,$provider,$quantity);
    if($p['checkout_url'])return $p['checkout_url'];
    $origin='https://mlt-lifestyle.com';$ref=$p['reference_code'];
    // Provider idempotency makes retries safe even if the response was lost after creating a session.
    try {
    if($provider==='stripe'){
        $fields=['mode'=>'payment','client_reference_id'=>$ref,'customer_email'=>$user['email'],'metadata[purchase_type]'=>'voucher','metadata[reference]'=>$ref,'expires_at'=>(string)(int)$p['reserved_epoch'],'success_url'=>$origin.'/api/voucher-return.php?provider=stripe&reference='.$ref.'&session_id={CHECKOUT_SESSION_ID}','cancel_url'=>$origin.'/'.($user['locale']??'en').'/vouchers/?payment=cancelled','line_items[0][price_data][currency]'=>'eur','line_items[0][price_data][unit_amount]'=>(string)$p['price_cents'],'line_items[0][price_data][product_data][name]'=>'MLT Journey Voucher · EUR '.number_format((int)$p['face_cents']/100,2,'.',''),'line_items[0][quantity]'=>(string)$p['quantity']];
        $data=mlt_voucher_http('https://api.stripe.com/v1/checkout/sessions',['Authorization: Basic '.base64_encode($settings['stripe_secret_key'].':'),'Content-Type: application/x-www-form-urlencoded','Idempotency-Key: voucher-'.$ref],http_build_query($fields));$id=$data['id']??'';$url=$data['url']??'';
    }else{
        [$base,$auth]=mlt_voucher_paypal_auth($settings);
        $data=mlt_voucher_http($base.'/v2/checkout/orders',[$auth,'Content-Type: application/json','PayPal-Request-Id: '.$ref],json_encode(['intent'=>'CAPTURE','purchase_units'=>[['reference_id'=>$ref,'custom_id'=>$ref,'description'=>'MLT Journey Voucher','amount'=>['currency_code'=>'EUR','value'=>number_format((int)$p['price_cents']*(int)$p['quantity']/100,2,'.','')]]],'application_context'=>['return_url'=>$origin.'/api/voucher-return.php?provider=paypal&reference='.$ref,'cancel_url'=>$origin.'/'.($user['locale']??'en').'/vouchers/?payment=cancelled','user_action'=>'PAY_NOW']],JSON_THROW_ON_ERROR));
        $id=$data['id']??'';$url='';foreach($data['links']??[] as $link)if(($link['rel']??'')==='approve')$url=$link['href'];
    }
    }catch(RuntimeException $e){
        if(in_array($e->getCode(),[400,401,403,404,422],true))$db->prepare('UPDATE mlt_voucher_purchases SET status="failed" WHERE id=? AND status="pending" AND checkout_id IS NULL')->execute([$p['id']]);
        error_log('MLT voucher checkout provider error: HTTP '.$e->getCode());throw $e;
    }
    if(!$id||!preg_match('~^https://(?:checkout\.stripe\.com|(?:www\.)?(?:sandbox\.)?paypal\.com)/~',$url))throw new RuntimeException('Could not create a secure payment link.');
    $db->prepare('UPDATE mlt_voucher_purchases SET checkout_id=?,checkout_url=? WHERE id=? AND status="pending"')->execute([$id,$url,$p['id']]);return $url;
}
function mlt_voucher_stripe_settle(PDO $db, array $session): array {
    if(($session['payment_status']??'')!=='paid'||($session['metadata']['purchase_type']??'')!=='voucher')throw new DomainException('Payment is not confirmed.');
    $voucher=mlt_voucher_issue($db,(string)($session['client_reference_id']??''),'stripe',(string)($session['id']??''),(string)($session['payment_intent']??''),(int)($session['amount_total']??0),(string)($session['currency']??''));
    mlt_voucher_send_receipts($db,mlt_settings(),(int)$voucher['user_id']);return $voucher;
}
function mlt_voucher_paypal_settle(PDO $db, array $settings, string $reference, string $id): array {
    $q=$db->prepare('SELECT checkout_id,provider FROM mlt_voucher_purchases WHERE reference_code=?');$q->execute([$reference]);$p=$q->fetch();
    if(!$p||$p['provider']!=='paypal'||$p['checkout_id']!==$id)throw new DomainException('Invalid voucher checkout.');
    [$base,$auth]=mlt_voucher_paypal_auth($settings);
    $order=mlt_voucher_http($base.'/v2/checkout/orders/'.rawurlencode($id),[$auth]);
    if(($order['status']??'')==='APPROVED')$order=mlt_voucher_http($base.'/v2/checkout/orders/'.rawurlencode($id).'/capture',[$auth,'Content-Type: application/json','PayPal-Request-Id: capture-'.$reference],'{}');
    $unit=$order['purchase_units'][0]??[];$capture=$unit['payments']['captures'][0]??[];
    if(($order['status']??'')!=='COMPLETED'||($capture['status']??'')!=='COMPLETED'||($unit['custom_id']??'')!==$reference)throw new DomainException('PayPal payment is not confirmed.');
    $voucher=mlt_voucher_issue($db,$reference,'paypal',$id,(string)($capture['id']??''),(int)round((float)($capture['amount']['value']??0)*100),(string)($capture['amount']['currency_code']??''));
    mlt_voucher_send_receipts($db,$settings,(int)$voucher['user_id']);return $voucher;
}

function mlt_voucher_block_reversed_payment(PDO $db,string $paymentId,string $eventId):void {
    $db->beginTransaction();
    try{
        $q=$db->prepare('SELECT id FROM mlt_voucher_purchases WHERE payment_id=? FOR UPDATE');$q->execute([$paymentId]);$id=$q->fetchColumn();
        if($id){$db->prepare('UPDATE mlt_vouchers SET status="blocked" WHERE purchase_id=?')->execute([$id]);$db->prepare('INSERT INTO mlt_voucher_audit (action,target_id,detail_json) VALUES ("provider_reversal",?,?)')->execute([$id,json_encode(['event'=>$eventId,'payment'=>$paymentId],JSON_THROW_ON_ERROR)]);}
        $db->commit();
    }catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
}

function mlt_voucher_verify_credit(PDO $db,array $settings,int $voucherId,int $userId):void {
    $q=$db->prepare('SELECT p.provider,p.payment_id FROM mlt_vouchers v JOIN mlt_voucher_purchases p ON p.id=v.purchase_id WHERE v.id=? AND v.user_id=?');$q->execute([$voucherId,$userId]);$p=$q->fetch();if(!$p)throw new DomainException('Voucher not found.');
    if($p['provider']==='stripe'){
        $payment=mlt_voucher_http('https://api.stripe.com/v1/payment_intents/'.rawurlencode($p['payment_id']).'?expand%5B%5D=latest_charge',['Authorization: Basic '.base64_encode(($settings['stripe_secret_key']??'').':')]);
        $charge=$payment['latest_charge']??[];$valid=($payment['status']??'')==='succeeded'&&is_array($charge)&&empty($charge['disputed'])&&(int)($charge['amount_refunded']??0)===0;
    }else{
        [$base,$auth]=mlt_voucher_paypal_auth($settings);$capture=mlt_voucher_http($base.'/v2/payments/captures/'.rawurlencode($p['payment_id']),[$auth]);$valid=($capture['status']??'')==='COMPLETED';
    }
    if(!$valid){mlt_voucher_block_reversed_payment($db,$p['payment_id'],'redemption-payment-check');throw new DomainException('The voucher purchase has been refunded or disputed. Please contact MLT.');}
}

// Call while holding the journey advisory lock. Repeated PayPal returns recover via GET before capture.
function mlt_journey_paypal_settle(PDO $db,array $settings,string $reference,string $id,string $kind='full'):?array {
    $q=$db->prepare('SELECT 1 FROM mlt_journey_checkout_cancellations WHERE checkout_id=?');$q->execute([$id]);if($q->fetchColumn())throw new DomainException('This checkout was cancelled. Please start a new payment from your account.');
    [$base,$auth]=mlt_voucher_paypal_auth($settings);$order=mlt_voucher_http($base.'/v2/checkout/orders/'.rawurlencode($id),[$auth]);
    if(($order['purchase_units'][0]['custom_id']??'')!==$reference)throw new DomainException('Journey payment reference mismatch.');
    if(($order['status']??'')==='APPROVED'){
        $q=$db->prepare('SELECT total_amount,paid_amount FROM mlt_orders WHERE reference_code=?');$q->execute([$reference]);$journey=$q->fetch();
        $captureCents=(int)round((float)($order['purchase_units'][0]['amount']['value']??0)*100);
        $due=$journey?max(0,(int)round(((float)$journey['total_amount']-(float)$journey['paid_amount'])*100)):0;
        if($captureCents<=0||$captureCents>$due)throw new DomainException('The journey balance changed. Please start a new checkout from your account.');
        mlt_voucher_hold_checkout($db,$reference,'paypal',(float)$journey['paid_amount']);
        $approval=(($settings['mode']??'sandbox')==='live'?'https://www.paypal.com':'https://www.sandbox.paypal.com').'/checkoutnow?token='.rawurlencode($id);
        mlt_voucher_save_journey_checkout($db,$reference,$approval,$id);
        $order=mlt_voucher_http($base.'/v2/checkout/orders/'.rawurlencode($id).'/capture',[$auth,'Content-Type: application/json','PayPal-Request-Id: journey-'.$id],'{}');
    }
    $capture=$order['purchase_units'][0]['payments']['captures'][0]??[];
    if(($order['status']??'')!=='COMPLETED'||($capture['status']??'')!=='COMPLETED'||strtoupper((string)($capture['amount']['currency_code']??''))!=='EUR')throw new DomainException('Journey payment is not confirmed.');
    return mlt_mark_order_paid($db,$reference,$id,$order,$kind);
}

// Reconcile abandoned checkouts before releasing stock. Local time alone must not resell a paid voucher.
function mlt_voucher_reconcile(PDO $db, array $settings, ?int $userId=null, int $limit=20): void {
    $q=$db->prepare('SELECT *,UNIX_TIMESTAMP(reserved_until) AS reserved_epoch FROM mlt_voucher_purchases WHERE status="pending" AND checkout_id IS NOT NULL'.($userId?' AND user_id=?':' AND reserved_until<=NOW()').' ORDER BY id LIMIT '.max(1,min(20,$limit)));$q->execute($userId?[$userId]:[]);
    foreach($q->fetchAll() as $p){
        try {
            if(!$p['checkout_id'])continue; // An uncertain provider create response keeps its stock reserved for recovery.
            $expired=false;
            if($p['provider']==='stripe'){
                $s=mlt_voucher_http('https://api.stripe.com/v1/checkout/sessions/'.rawurlencode($p['checkout_id']),['Authorization: Basic '.base64_encode(($settings['stripe_secret_key']??'').':')]);
                if(($s['payment_status']??'')==='paid')mlt_voucher_stripe_settle($db,$s);
                elseif(($s['status']??'')==='expired')$expired=true;
            }else{
                [$base,$auth]=mlt_voucher_paypal_auth($settings);$s=mlt_voucher_http($base.'/v2/checkout/orders/'.rawurlencode($p['checkout_id']),[$auth]);
                if(in_array($s['status']??'',['COMPLETED','APPROVED'],true))mlt_voucher_paypal_settle($db,$settings,$p['reference_code'],$p['checkout_id']);
                // PayPal links have a provider approval window; use a conservative 24h grace after local reservation.
                elseif(in_array($s['status']??'',['VOIDED'],true)||(($s['status']??'')==='CREATED'&&(int)$p['reserved_epoch']<time()-86400))$expired=true;
            }
            if($expired)$db->prepare('UPDATE mlt_voucher_purchases SET status="expired" WHERE id=? AND status="pending"')->execute([$p['id']]);
        }catch(Throwable $e){error_log('MLT voucher reconciliation: '.$e->getMessage());}
    }
}
