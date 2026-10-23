<?php
declare(strict_types=1);
require_once __DIR__ . '/security.php';
mlt_security_guard(['GET', 'POST']);

header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store, max-age=0');
require_once __DIR__.'/booking.php';require_once __DIR__.'/voucher-payments.php';
function voucher_reply(array $data,int $status=200): never {http_response_code($status);echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);exit;}
try {
    $settings=mlt_settings();$db=mlt_db($settings);if(!$db)voucher_reply(['error'=>'Voucher service is temporarily unavailable.'],503);
    mlt_voucher_schema($db);
    $method=$_SERVER['REQUEST_METHOD'];if(!in_array($method,['GET','POST'],true))voucher_reply(['error'=>'Method not allowed.'],405);
    if((int)($_SERVER['CONTENT_LENGTH']??0)>20000)voucher_reply(['error'=>'Request is too large.'],413);
    $body=$method==='POST'?json_decode(file_get_contents('php://input'),true):[];if(!is_array($body))voucher_reply(['error'=>'Invalid request.'],400);
    $action=$method==='GET'?($_GET['action']??'catalog'):($body['action']??'');
    if($action==='catalog'){mlt_voucher_reconcile($db,$settings,null,1);voucher_reply(['campaigns'=>mlt_voucher_campaigns($db),'stock'=>mlt_voucher_stock($db),'providers'=>mlt_voucher_providers($settings)]);}
    $user=mlt_voucher_user($db);if(!$user)voucher_reply(['error'=>'Please sign in to your account.'],401);
    $rights=mlt_voucher_rights($db,$user);
    if($action==='mine'){
        mlt_voucher_reconcile($db,$settings,(int)$user['id']);
        mlt_voucher_send_receipts($db,$settings,(int)$user['id']);
        $q=$db->prepare('SELECT v.*,p.price_cents,p.reference_code FROM mlt_vouchers v JOIN mlt_voucher_purchases p ON p.id=v.purchase_id WHERE v.user_id=? ORDER BY v.id DESC');$q->execute([$user['id']]);$vouchers=$q->fetchAll();
        foreach($vouchers as &$v){$h=$db->prepare('SELECT l.id,l.delta_cents,l.balance_cents,l.kind,l.created_at,o.reference_code FROM mlt_voucher_ledger l LEFT JOIN mlt_orders o ON o.id=l.order_id WHERE l.voucher_id=? ORDER BY l.id DESC');$h->execute([$v['id']]);$v['history']=$h->fetchAll();}
        $q=$db->prepare('SELECT reference_code,provider,status,reserved_until,checkout_url FROM mlt_voucher_purchases WHERE user_id=? AND status="pending" ORDER BY id DESC');$q->execute([$user['id']]);voucher_reply(['vouchers'=>$vouchers,'pending'=>$q->fetchAll()]);
    }
    if($method!=='POST')voucher_reply(['error'=>'Use POST for this action.'],405);
    $origin=(string)($_SERVER['HTTP_ORIGIN']??'');if($origin!==''&&!in_array($origin,['https://mlt-lifestyle.com','https://www.mlt-lifestyle.com'],true))voucher_reply(['error'=>'Invalid request origin.'],403);
    if($action==='checkout'){
        if(empty($body['consent']))voucher_reply(['error'=>'Please accept the voucher conditions and privacy terms.'],400);
        mlt_voucher_reconcile($db,$settings);
        $url=mlt_voucher_checkout($db,$settings,$user,(int)($body['campaignId']??0),(string)($body['provider']??''),(int)($body['quantity']??1));voucher_reply(['url'=>$url]);
    }
    if($action==='redeem'){
        if(empty($body['consent']))voucher_reply(['error'=>'Please confirm the voucher payment.'],400);
        mlt_voucher_verify_credit($db,$settings,(int)($body['voucherId']??0),(int)$user['id']);
        voucher_reply(mlt_voucher_redeem($db,$user,(int)($body['voucherId']??0),(string)($body['reference']??''),(string)($body['requestId']??'')));
    }
    if(!$rights['view']&&!$rights['manage'])voucher_reply(['error'=>'Voucher access is not granted for your role.'],403);
    if($action==='admin'){
        $q=$db->query('SELECT v.id,v.code,v.face_cents,v.balance_cents,v.status,v.expires_at,v.created_at,p.reference_code,p.price_cents,p.provider,p.campaign_id,u.email,u.first_name,u.last_name FROM mlt_vouchers v JOIN mlt_voucher_purchases p ON p.id=v.purchase_id JOIN mlt_users u ON u.id=v.user_id ORDER BY v.id DESC LIMIT 1000');
        $permissions=$rights['permissions']?$db->query('SELECT * FROM mlt_voucher_permissions')->fetchAll():[];
        voucher_reply(['providers'=>mlt_voucher_providers($settings),'sandbox'=>!empty($settings['voucher_sandbox_enabled']),'stock'=>mlt_voucher_stock($db),'analytics'=>mlt_voucher_analytics($db),'summary'=>['cash_cents'=>(int)$db->query('SELECT COALESCE(SUM(price_cents*quantity),0) FROM mlt_voucher_purchases WHERE status="paid"')->fetchColumn(),'balance_cents'=>(int)$db->query('SELECT COALESCE(SUM(balance_cents),0) FROM mlt_vouchers')->fetchColumn()],'rights'=>$rights,'campaigns'=>mlt_voucher_campaigns($db,true),'vouchers'=>$q->fetchAll(),'permissions'=>$permissions,'audit'=>$rights['permissions']?$db->query('SELECT a.id,a.action,a.target_id,a.detail_json,a.created_at,u.email AS actor FROM mlt_voucher_audit a LEFT JOIN mlt_users u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT 100')->fetchAll():[]]);
    }
    if($action==='history'){
        $q=$db->prepare('SELECT l.*,o.reference_code FROM mlt_voucher_ledger l LEFT JOIN mlt_orders o ON o.id=l.order_id WHERE l.voucher_id=? ORDER BY l.id DESC');$q->execute([(int)($body['voucherId']??0)]);voucher_reply(['history'=>$q->fetchAll()]);
    }
    if($action==='permissions'){
        if(!$rights['permissions'])voucher_reply(['error'=>'Only administrators can assign permissions.'],403);
        $role=(string)($body['role']??'');if(!in_array($role,['manager','concierge','salesmanager'],true))voucher_reply(['error'=>'Invalid staff role.'],400);
        $manage=!empty($body['manage']);$view=$manage||!empty($body['view']);
        $db->beginTransaction();$db->prepare('INSERT INTO mlt_voucher_permissions (role,can_view,can_manage) VALUES (?,?,?) ON DUPLICATE KEY UPDATE can_view=VALUES(can_view),can_manage=VALUES(can_manage)')->execute([$role,(int)$view,(int)$manage]);mlt_voucher_audit($db,(int)$user['id'],'permissions',0,['role'=>$role,'view'=>$view,'manage'=>$manage]);$db->commit();voucher_reply(['ok'=>true]);
    }
    if(!$rights['manage'])voucher_reply(['error'=>'Voucher management permission required.'],403);
    if($action==='save_stock'){
        $quantity=filter_var($body['quantity']??null,FILTER_VALIDATE_INT);
        if($quantity===false||$quantity<1||$quantity>50)voucher_reply(['error'=>'The shared edition must contain between 1 and 50 vouchers.'],400);
        $db->beginTransaction();$db->query('SELECT quantity FROM mlt_voucher_stock WHERE id=1 FOR UPDATE')->fetch();
        $stock=mlt_voucher_stock($db);
        if($quantity<$stock['sold']+$stock['reserved'])throw new DomainException('The shared limit cannot be lower than paid and reserved vouchers.');
        $db->prepare('UPDATE mlt_voucher_stock SET quantity=? WHERE id=1')->execute([$quantity]);
        mlt_voucher_audit($db,(int)$user['id'],'shared_stock_saved',1,['quantity'=>$quantity]);$db->commit();voucher_reply(['ok'=>true]);
    }
    if($action==='save_campaign'){
        $id=(int)($body['id']??0);$face=filter_var($body['faceCents']??null,FILTER_VALIDATE_INT);$price=filter_var($body['priceCents']??null,FILTER_VALIDATE_INT);$months=empty($body['validityMonths'])?null:filter_var($body['validityMonths'],FILTER_VALIDATE_INT);$title=trim((string)($body['title']??''));
        if(!$face||!$price||$face<100||$face>10000000||$price>$face||$price<100||!$title||mb_strlen($title)>120||($months!==null&&($months===false||$months<1||$months>120)))voucher_reply(['error'=>'Check title, nominal, price, and validity.'],400);
        $db->beginTransaction();$quantity=(int)$db->query('SELECT quantity FROM mlt_voucher_stock WHERE id=1 FOR UPDATE')->fetchColumn();
        $all=$db->query('SELECT id FROM mlt_voucher_campaigns ORDER BY id FOR UPDATE')->fetchAll();
        $values=[$title,$face,$price,$quantity,$months,!empty($body['active'])?1:0];
        if($id){if(!in_array($id,array_map('intval',array_column($all,'id')),true))throw new DomainException('Edition not found.');$db->prepare('UPDATE mlt_voucher_campaigns SET title=?,face_cents=?,price_cents=?,quantity=?,validity_months=?,is_active=? WHERE id=?')->execute([...$values,$id]);}
        else{$db->prepare('INSERT INTO mlt_voucher_campaigns (title,face_cents,price_cents,quantity,validity_months,is_active) VALUES (?,?,?,?,?,?)')->execute($values);$id=(int)$db->lastInsertId();}
        mlt_voucher_audit($db,(int)$user['id'],'campaign_saved',$id,$body);$db->commit();voucher_reply(['ok'=>true]);
    }
    if($action==='set_status'){
        $id=(int)($body['voucherId']??0);$status=(string)($body['status']??'');$reason=trim((string)($body['reason']??''));if(!in_array($status,['active','blocked'],true)||mb_strlen($reason)<5||mb_strlen($reason)>500)throw new DomainException('A reason (5–500 characters) is required.');
        $db->beginTransaction();$q=$db->prepare('SELECT status,balance_cents FROM mlt_vouchers WHERE id=? FOR UPDATE');$q->execute([$id]);$v=$q->fetch();if(!$v||!in_array($v['status'],['active','blocked'],true)||(int)$v['balance_cents']<=0)throw new DomainException('Voucher status cannot be changed.');
        $db->prepare('UPDATE mlt_vouchers SET status=? WHERE id=?')->execute([$status,$id]);mlt_voucher_audit($db,(int)$user['id'],'status_changed',$id,['from'=>$v['status'],'to'=>$status,'reason'=>$reason]);$db->commit();voucher_reply(['ok'=>true]);
    }
    // Re-credit only actual voucher payments on a cancelled journey. Never mint arbitrary credit.
    if($action==='restore'){
        if($user['role']!=='admin')voucher_reply(['error'=>'Only an administrator can reverse a journey payment.'],403);
        $ref=(string)($body['reference']??'');$reason=trim((string)($body['reason']??''));if(mb_strlen($reason)<5||mb_strlen($reason)>500)throw new DomainException('A reason (5–500 characters) is required.');
        $db->beginTransaction();$q=$db->prepare('SELECT * FROM mlt_orders WHERE reference_code=? FOR UPDATE');$q->execute([$ref]);$o=$q->fetch();if(!$o||$o['status']!=='cancelled')throw new DomainException('Cancel the journey before restoring voucher credit.');
        $q=$db->prepare('SELECT * FROM mlt_voucher_ledger WHERE order_id=? AND kind="redeemed" ORDER BY voucher_id,id');$q->execute([$o['id']]);$total=0;
        foreach($q->fetchAll() as $l){$key='restore:'.$l['id'];$q=$db->prepare('SELECT 1 FROM mlt_voucher_ledger WHERE operation_key=?');$q->execute([$key]);if($q->fetchColumn())continue;$q=$db->prepare('SELECT * FROM mlt_vouchers WHERE id=? FOR UPDATE');$q->execute([$l['voucher_id']]);$v=$q->fetch();$credit=-(int)$l['delta_cents'];$balance=(int)$v['balance_cents']+$credit;if($balance>(int)$v['face_cents'])throw new DomainException('Balance reconciliation required.');$db->prepare('UPDATE mlt_vouchers SET balance_cents=?,status=? WHERE id=?')->execute([$balance,$v['status']==='blocked'?'blocked':'active',$v['id']]);$db->prepare('INSERT INTO mlt_voucher_ledger (voucher_id,order_id,actor_id,operation_key,delta_cents,balance_cents,kind,note) VALUES (?,?,?,?,?,?,"restored",?)')->execute([$v['id'],$o['id'],$user['id'],$key,$credit,$balance,$reason]);$db->prepare('UPDATE mlt_payments SET status="reversed" WHERE provider="voucher" AND provider_payment_id=?')->execute([$l['operation_key']]);$total+=$credit;}
        $paid=max(0,(int)round((float)$o['paid_amount']*100)-$total);$db->prepare('UPDATE mlt_orders SET paid_amount=? WHERE id=?')->execute([number_format($paid/100,2,'.',''),$o['id']]);mlt_voucher_audit($db,(int)$user['id'],'journey_restored',(int)$o['id'],['credit_cents'=>$total,'reason'=>$reason]);$db->commit();voucher_reply(['ok'=>true,'restored_cents'=>$total]);
    }
    voucher_reply(['error'=>'Unknown action.'],400);
}catch(DomainException $e){if(isset($db)&&$db->inTransaction())$db->rollBack();voucher_reply(['error'=>$e->getMessage()],409);}
catch(Throwable $e){if(isset($db)&&$db->inTransaction())$db->rollBack();error_log('MLT vouchers: '.$e->getMessage());voucher_reply(['error'=>'Voucher service could not complete this request. Please retry.'],503);}
