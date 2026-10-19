<?php
declare(strict_types=1);

// All voucher money is stored in integer cents. No client supplied prices or balances.
function mlt_voucher_schema(PDO $db): void {
    $db->exec('CREATE TABLE IF NOT EXISTS mlt_voucher_campaigns (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, title VARCHAR(120) NOT NULL, face_cents BIGINT NOT NULL, price_cents BIGINT NOT NULL, quantity INT NOT NULL, validity_months INT NULL, is_active TINYINT NOT NULL DEFAULT 1, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    $db->exec('CREATE TABLE IF NOT EXISTS mlt_voucher_purchases (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, reference_code VARCHAR(80) NOT NULL UNIQUE, campaign_id BIGINT UNSIGNED NOT NULL, user_id BIGINT UNSIGNED NOT NULL, face_cents BIGINT NOT NULL, price_cents BIGINT NOT NULL, validity_months INT NULL, quantity INT NOT NULL DEFAULT 1, status VARCHAR(24) NOT NULL DEFAULT "pending", provider VARCHAR(16) NOT NULL, checkout_id VARCHAR(160) NULL UNIQUE, checkout_url TEXT NULL, payment_id VARCHAR(160) NULL UNIQUE, reserved_until DATETIME NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, paid_at DATETIME NULL, INDEX voucher_stock (campaign_id,status,reserved_until), INDEX voucher_buyer (user_id), FOREIGN KEY (campaign_id) REFERENCES mlt_voucher_campaigns(id), FOREIGN KEY (user_id) REFERENCES mlt_users(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    $db->exec('CREATE TABLE IF NOT EXISTS mlt_vouchers (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, purchase_id BIGINT UNSIGNED NOT NULL, sequence_no INT NOT NULL DEFAULT 1, user_id BIGINT UNSIGNED NOT NULL, code VARCHAR(60) NOT NULL UNIQUE, face_cents BIGINT NOT NULL, balance_cents BIGINT NOT NULL, status VARCHAR(20) NOT NULL DEFAULT "active", expires_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY voucher_purchase_serial (purchase_id,sequence_no), INDEX voucher_owner (user_id), FOREIGN KEY (purchase_id) REFERENCES mlt_voucher_purchases(id), FOREIGN KEY (user_id) REFERENCES mlt_users(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    $db->exec('CREATE TABLE IF NOT EXISTS mlt_voucher_ledger (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, voucher_id BIGINT UNSIGNED NOT NULL, order_id BIGINT UNSIGNED NULL, actor_id BIGINT UNSIGNED NULL, operation_key VARCHAR(160) NOT NULL UNIQUE, delta_cents BIGINT NOT NULL, balance_cents BIGINT NOT NULL, kind VARCHAR(24) NOT NULL, note VARCHAR(500) NOT NULL DEFAULT "", created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX voucher_history (voucher_id,id), FOREIGN KEY (voucher_id) REFERENCES mlt_vouchers(id), FOREIGN KEY (order_id) REFERENCES mlt_orders(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    $db->exec('CREATE TABLE IF NOT EXISTS mlt_voucher_permissions (role VARCHAR(24) PRIMARY KEY, can_view TINYINT NOT NULL DEFAULT 0, can_manage TINYINT NOT NULL DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    $db->exec('CREATE TABLE IF NOT EXISTS mlt_voucher_audit (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, actor_id BIGINT UNSIGNED NULL, action VARCHAR(40) NOT NULL, target_id BIGINT UNSIGNED NULL, detail_json TEXT NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    $db->exec('CREATE TABLE IF NOT EXISTS mlt_voucher_receipts (purchase_id BIGINT UNSIGNED PRIMARY KEY, sent_at DATETIME NULL, next_attempt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, attempts INT NOT NULL DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    $db->exec('CREATE TABLE IF NOT EXISTS mlt_journey_checkout_holds (order_id BIGINT UNSIGNED PRIMARY KEY, provider VARCHAR(16) NOT NULL DEFAULT "stripe", checkout_url TEXT NULL, checkout_id VARCHAR(160) NULL, expires_at DATETIME NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    $db->exec('CREATE TABLE IF NOT EXISTS mlt_journey_checkout_cancellations (checkout_id VARCHAR(160) PRIMARY KEY,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    $db->exec('CREATE TABLE IF NOT EXISTS mlt_voucher_stock (id TINYINT PRIMARY KEY, quantity INT NOT NULL DEFAULT 50, denominations_seeded TINYINT NOT NULL DEFAULT 0) ENGINE=InnoDB');
    $db->exec('INSERT IGNORE INTO mlt_voucher_stock (id,quantity) VALUES (1,50)');
    // A fixed seed ID makes concurrent first requests safe without recreating sold stock.
    $db->exec('INSERT IGNORE INTO mlt_voucher_campaigns (id,title,face_cents,price_cents,quantity) VALUES (1,"MLT Journey Voucher · Limited Edition",500000,400000,50)');
    // Migrate once, without rewriting existing denominations or purchased terms.
    $db->beginTransaction();
    try {
        $stock=$db->query('SELECT * FROM mlt_voucher_stock WHERE id=1 FOR UPDATE')->fetch();
        if(!$stock['denominations_seeded']){
            if(!$db->query('SELECT id FROM mlt_voucher_campaigns WHERE face_cents=400000 AND price_cents=300000 LIMIT 1')->fetchColumn())
                $db->exec('INSERT INTO mlt_voucher_campaigns (title,face_cents,price_cents,quantity) VALUES ("MLT Journey Voucher · EUR 4,000",400000,300000,50)');
            $db->exec('UPDATE mlt_voucher_stock SET denominations_seeded=1 WHERE id=1');
        }
        $db->commit();
    }catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}

}

function mlt_voucher_user(PDO $db): ?array {
    $token = preg_replace('/^Bearer\s+/i', '', (string)($_SERVER['HTTP_AUTHORIZATION'] ?? ''));
    if (!$token) return null;
    $q = $db->prepare('SELECT id,email,first_name,last_name,locale,role FROM mlt_users WHERE session_hash=? AND session_expires_at>NOW() LIMIT 1');
    $q->execute([hash('sha256', $token)]);
    return $q->fetch() ?: null;
}

function mlt_voucher_rights(PDO $db, array $user): array {
    if ($user['role'] === 'admin') return ['view'=>true,'manage'=>true,'permissions'=>true];
    if (!in_array($user['role'], ['manager','concierge','salesmanager'], true)) return ['view'=>false,'manage'=>false,'permissions'=>false];
    $q=$db->prepare('SELECT can_view,can_manage FROM mlt_voucher_permissions WHERE role=?');$q->execute([$user['role']]);$row=$q->fetch();
    return ['view'=>(bool)($row['can_view']??false),'manage'=>(bool)($row['can_manage']??false),'permissions'=>false];
}

function mlt_voucher_audit(PDO $db, int $actor, string $action, int $target, array $detail): void {
    $db->prepare('INSERT INTO mlt_voucher_audit (actor_id,action,target_id,detail_json) VALUES (?,?,?,?)')->execute([$actor,$action,$target,json_encode($detail,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)]);
}

function mlt_voucher_stock(PDO $db): array {
    $row=$db->query('SELECT s.quantity, COALESCE(SUM(CASE WHEN p.status="paid" THEN p.quantity ELSE 0 END),0) AS sold, COALESCE(SUM(CASE WHEN p.status="pending" THEN p.quantity ELSE 0 END),0) AS reserved FROM mlt_voucher_stock s LEFT JOIN mlt_voucher_purchases p ON p.status IN ("paid","pending") WHERE s.id=1 GROUP BY s.quantity')->fetch();
    foreach(['quantity','sold','reserved'] as $key)$row[$key]=(int)$row[$key];
    $row['remaining']=max(0,$row['quantity']-$row['sold']);$row['available']=max(0,$row['remaining']-$row['reserved']);
    return $row;
}

function mlt_voucher_campaigns(PDO $db, bool $all=false): array {
    $stock=mlt_voucher_stock($db);
    $rows=$db->query('SELECT c.*, (SELECT COALESCE(SUM(p.quantity),0) FROM mlt_voucher_purchases p WHERE p.campaign_id=c.id AND p.status="paid") AS sold, (SELECT COALESCE(SUM(p.quantity),0) FROM mlt_voucher_purchases p WHERE p.campaign_id=c.id AND p.status="pending") AS reserved FROM mlt_voucher_campaigns c'.($all?'':' WHERE c.is_active=1').' ORDER BY c.id')->fetchAll();
    foreach($rows as &$row){foreach(['id','face_cents','price_cents','sold','reserved','is_active'] as $key)$row[$key]=(int)$row[$key];$row['quantity']=$stock['quantity'];$row['remaining']=$stock['remaining'];$row['available']=$stock['available'];}
    return $rows;
}

function mlt_voucher_analytics(PDO $db): array {
    // Group by the immutable purchased terms, not today's editable campaign price.
    $rows=$db->query('SELECT p.face_cents,p.price_cents,SUM(p.quantity) AS sold,SUM(p.price_cents*p.quantity) AS cash_cents FROM mlt_voucher_purchases p WHERE p.status="paid" GROUP BY p.face_cents,p.price_cents ORDER BY p.face_cents DESC,p.price_cents DESC')->fetchAll();
    $balances=$db->query('SELECT v.face_cents,p.price_cents,SUM(v.balance_cents) AS balance_cents,SUM(v.face_cents-v.balance_cents) AS used_cents,SUM(CASE WHEN v.status="blocked" THEN 1 ELSE 0 END) AS blocked FROM mlt_vouchers v JOIN mlt_voucher_purchases p ON p.id=v.purchase_id GROUP BY v.face_cents,p.price_cents')->fetchAll();
    foreach($rows as &$row){$row['balance_cents']=0;$row['used_cents']=0;$row['blocked']=0;foreach($balances as $balance)if($balance['face_cents']==$row['face_cents']&&$balance['price_cents']==$row['price_cents']){foreach(['balance_cents','used_cents','blocked'] as $key)$row[$key]=$balance[$key];break;}foreach($row as &$value)$value=(int)$value;unset($value);}
    return $rows;
}

function mlt_voucher_reserve(PDO $db, array $user, int $campaignId, string $provider, int $quantity=1): array {
    if($quantity<1||$quantity>50)throw new DomainException('Choose between 1 and 50 vouchers.');
    if (!in_array($provider,['stripe','paypal'],true)) throw new DomainException('Invalid payment provider.');
    if (!in_array($user['role'],['traveller','agency'],true)) throw new DomainException('Please purchase from a client account.');
    $db->beginTransaction();
    try {
        // One shared row serializes reservations across EVERY denomination.
        $db->query('SELECT quantity FROM mlt_voucher_stock WHERE id=1 FOR UPDATE')->fetch();
        $q=$db->prepare('SELECT * FROM mlt_voucher_campaigns WHERE id=? FOR UPDATE');$q->execute([$campaignId]);$c=$q->fetch();
        if(!$c||!$c['is_active'])throw new DomainException('This voucher edition is not on sale.');
        $q=$db->prepare('SELECT *,UNIX_TIMESTAMP(reserved_until) AS reserved_epoch FROM mlt_voucher_purchases WHERE user_id=? AND campaign_id=? AND provider=? AND status="pending" ORDER BY id DESC LIMIT 1');$q->execute([$user['id'],$campaignId,$provider]);$existing=$q->fetch();
        if($existing){if((int)$existing['quantity']!==$quantity)throw new DomainException('You already have a pending checkout with a different quantity. Resume it in My vouchers, or wait for it to expire.');$db->commit();return $existing;}
        $stock=mlt_voucher_stock($db);
        if($quantity>$stock['available'])throw new DomainException('All available vouchers are sold or temporarily reserved. Please try again later.');
        $ref='MLTV-'.strtoupper(bin2hex(random_bytes(12)));
        // Stripe is explicitly set to 31 minutes (above its 30 minute minimum). PayPal approval links last 3 hours.
        $minutes=$provider==='stripe'?31:180;
        $db->prepare('INSERT INTO mlt_voucher_purchases (reference_code,campaign_id,user_id,face_cents,price_cents,validity_months,provider,quantity,reserved_until) VALUES (?,?,?,?,?,?,?,?,DATE_ADD(NOW(),INTERVAL '.$minutes.' MINUTE))')->execute([$ref,$campaignId,$user['id'],$c['face_cents'],$c['price_cents'],$c['validity_months'],$provider,$quantity]);
        $q=$db->prepare('SELECT *,UNIX_TIMESTAMP(reserved_until) AS reserved_epoch FROM mlt_voucher_purchases WHERE reference_code=?');$q->execute([$ref]);$row=$q->fetch();$db->commit();return $row;
    } catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
}

function mlt_voucher_issue(PDO $db, string $reference, string $provider, string $checkoutId, string $paymentId, int $cents, string $currency): array {
    $db->beginTransaction();
    try {
        $q=$db->prepare('SELECT * FROM mlt_voucher_purchases WHERE reference_code=? FOR UPDATE');$q->execute([$reference]);$p=$q->fetch();
        if(!$p||$p['provider']!==$provider||($p['checkout_id']&&$p['checkout_id']!==$checkoutId)||$paymentId===''||strtoupper($currency)!=='EUR'||(int)$p['price_cents']*(int)$p['quantity']!==$cents)throw new DomainException('Voucher payment verification failed.');
        // Expired reservations never discard a real, verified payment; the provider paid timestamp is authoritative.
        if($p['status']==='paid'){$q=$db->prepare('SELECT * FROM mlt_vouchers WHERE purchase_id=?');$q->execute([$p['id']]);$v=$q->fetch();$db->commit();return $v;}
        $db->prepare('UPDATE mlt_voucher_purchases SET status="paid",checkout_id=?,payment_id=?,paid_at=NOW() WHERE id=?')->execute([$checkoutId,$paymentId,$p['id']]);
        $id=0;
        for($serial=1;$serial<=(int)$p['quantity'];$serial++){
            $code='MLT-V-'.strtoupper(bin2hex(random_bytes(12)));
            $expires=$p['validity_months']?gmdate('Y-m-d H:i:s',strtotime('+'.(int)$p['validity_months'].' months')):null;
            $db->prepare('INSERT INTO mlt_vouchers (purchase_id,sequence_no,user_id,code,face_cents,balance_cents,expires_at) VALUES (?,?,?,?,?,?,?)')->execute([$p['id'],$serial,$p['user_id'],$code,$p['face_cents'],$p['face_cents'],$expires]);$id=(int)$db->lastInsertId();
            $db->prepare('INSERT INTO mlt_voucher_ledger (voucher_id,actor_id,operation_key,delta_cents,balance_cents,kind) VALUES (?,?,?,?,?,"issued")')->execute([$id,$p['user_id'],'issue:'.$reference.':'.$serial,$p['face_cents'],$p['face_cents']]);
        }
        $db->prepare('INSERT IGNORE INTO mlt_voucher_receipts (purchase_id) VALUES (?)')->execute([$p['id']]);
        $q=$db->prepare('SELECT * FROM mlt_vouchers WHERE id=?');$q->execute([$id]);$v=$q->fetch();$db->commit();return $v;
    }catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
}

function mlt_voucher_expired(?string $expires):bool { return $expires!==null&&strtotime($expires.' UTC')<=time(); }

function mlt_voucher_redeem(PDO $db, array $user, int $voucherId, string $reference, string $key): array {
    if(!preg_match('/^[a-zA-Z0-9-]{16,80}$/',$key))throw new DomainException('Invalid request identifier.');
    $db->beginTransaction();
    try {
        // Same lock order as cash payment recording: journey first, then voucher.
        $q=$db->prepare('SELECT * FROM mlt_orders WHERE reference_code=? FOR UPDATE');$q->execute([$reference]);$order=$q->fetch();
        if(!$order||((int)$order['user_id']!==(int)$user['id']&&strcasecmp($order['customer_email'],$user['email'])!==0))throw new DomainException('Journey not found.');
        $q=$db->prepare('SELECT * FROM mlt_vouchers WHERE id=? AND user_id=? FOR UPDATE');$q->execute([$voucherId,$user['id']]);$v=$q->fetch();if(!$v)throw new DomainException('Voucher not found.');
        $operation='redeem:'.$user['id'].':'.$key;
        $q=$db->prepare('SELECT voucher_id,order_id,delta_cents,balance_cents FROM mlt_voucher_ledger WHERE operation_key=?');$q->execute([$operation]);$previous=$q->fetch();
        if($previous){if((int)$previous['voucher_id']!==$voucherId||(int)$previous['order_id']!==(int)$order['id'])throw new DomainException('Request identifier has already been used.');$db->commit();return ['applied_cents'=>-(int)$previous['delta_cents'],'balance_cents'=>(int)$previous['balance_cents']];}
        if(strtoupper((string)$order['currency'])!=='EUR')throw new DomainException('Vouchers can only pay EUR journeys.');
        if(in_array($order['status'],['cancelled','completed'],true)||!empty($order['archived_at']))throw new DomainException('This journey cannot accept payments.');
        $q=$db->prepare('SELECT 1 FROM mlt_journey_checkout_holds WHERE order_id=?');$q->execute([$order['id']]);if($q->fetchColumn())throw new DomainException('A card or PayPal checkout is still active for this journey. Complete it or wait for it to expire before applying a voucher.');
        if($v['status']!=='active'||mlt_voucher_expired($v['expires_at']))throw new DomainException('This voucher is unavailable or expired.');
        $due=max(0,(int)round((float)($order['total_amount']??0)*100)-(int)round((float)$order['paid_amount']*100));
        $amount=min((int)$v['balance_cents'],$due);if($amount<=0)throw new DomainException('No payable balance or available voucher credit.');
        $balance=(int)$v['balance_cents']-$amount;
        $db->prepare('UPDATE mlt_vouchers SET balance_cents=?,status=? WHERE id=?')->execute([$balance,$balance===0?'used':'active',$voucherId]);
        $db->prepare('INSERT INTO mlt_voucher_ledger (voucher_id,order_id,actor_id,operation_key,delta_cents,balance_cents,kind) VALUES (?,?,?,?,?,?,"redeemed")')->execute([$voucherId,$order['id'],$user['id'],$operation,-$amount,$balance]);
        $db->prepare('INSERT INTO mlt_payments (order_id,provider,provider_payment_id,payment_kind,amount,currency) VALUES (?,"voucher",?,"voucher",?,"EUR")')->execute([$order['id'],$operation,number_format($amount/100,2,'.','')]);
        $paid=(int)round((float)$order['paid_amount']*100)+$amount;
        $db->prepare('UPDATE mlt_orders SET paid_amount=?,status=?,payment_provider="voucher",payment_id=?,paid_at=NOW() WHERE id=?')->execute([number_format($paid/100,2,'.',''),$paid>=(int)round((float)$order['total_amount']*100)?'paid':'partially_paid',$operation,$order['id']]);
        $db->commit();return ['applied_cents'=>$amount,'balance_cents'=>$balance];
    }catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
}

// A monetary checkout and voucher redemption must never spend the same journey balance concurrently.
function mlt_voucher_hold_checkout(PDO $db, string $reference, string $provider, float $expectedPaid, ?float $expectedTotal=null): ?string {
    mlt_voucher_schema($db);$db->beginTransaction();
    try {
        $q=$db->prepare('SELECT id,paid_amount,total_amount,status,archived_at FROM mlt_orders WHERE reference_code=? FOR UPDATE');$q->execute([$reference]);$order=$q->fetch();
        if(!$order||in_array($order['status'],['cancelled','completed'],true)||!empty($order['archived_at'])||($expectedTotal!==null&&abs((float)$order['total_amount']-$expectedTotal)>.001)||abs((float)$order['paid_amount']-$expectedPaid)>.001)throw new DomainException('Journey balance changed. Please refresh before paying.');
        $q=$db->prepare('SELECT provider,checkout_url FROM mlt_journey_checkout_holds WHERE order_id=?');$q->execute([$order['id']]);$hold=$q->fetch();if($hold){if($hold['provider']===$provider&&$hold['checkout_url']){$db->commit();return $hold['checkout_url'];}throw new DomainException('A payment checkout is already active. Please complete it or wait for it to expire.');}
        $minutes=$provider==='stripe'?31:180;
        $db->prepare('INSERT INTO mlt_journey_checkout_holds (order_id,provider,expires_at) VALUES (?,?,DATE_ADD(NOW(),INTERVAL '.$minutes.' MINUTE)) ON DUPLICATE KEY UPDATE provider=VALUES(provider),checkout_url=NULL,checkout_id=NULL,expires_at=VALUES(expires_at)')->execute([$order['id'],$provider]);$db->commit();return null;
    }catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
}

function mlt_voucher_authorize_journey(PDO $db,string $reference): array {
    $user=mlt_voucher_user($db);if(!$user)throw new DomainException('Please sign in before paying.');
    $q=$db->prepare('SELECT user_id,customer_email,status,archived_at,collection_name,travel_days FROM mlt_orders WHERE reference_code=?');$q->execute([$reference]);$o=$q->fetch();
    if(!$o||((int)$o['user_id']!==(int)$user['id']&&strcasecmp($o['customer_email'],$user['email'])!==0)||in_array($o['status'],['cancelled','completed'],true)||!empty($o['archived_at']))throw new DomainException('This journey cannot accept payments from your account.');
    return $o;
}

function mlt_voucher_save_journey_checkout(PDO $db,string $reference,string $url,string $checkoutId): void {
    $db->prepare('UPDATE mlt_journey_checkout_holds h JOIN mlt_orders o ON o.id=h.order_id SET h.checkout_url=?,h.checkout_id=? WHERE o.reference_code=?')->execute([$url,$checkoutId,$reference]);
}

function mlt_voucher_send_receipts(PDO $db,array $settings,int $userId): void {
    $q=$db->prepare('SELECT r.purchase_id,p.quantity,p.face_cents,p.price_cents,p.reference_code,u.email FROM mlt_voucher_receipts r JOIN mlt_voucher_purchases p ON p.id=r.purchase_id JOIN mlt_users u ON u.id=p.user_id WHERE p.user_id=? AND r.sent_at IS NULL AND r.next_attempt<=NOW() LIMIT 3');$q->execute([$userId]);
    foreach($q->fetchAll() as $r){
        if(!filter_var($r['email'],FILTER_VALIDATE_EMAIL))continue;
        $claim=$db->prepare('UPDATE mlt_voucher_receipts SET attempts=attempts+1,next_attempt=DATE_ADD(NOW(),INTERVAL 1 HOUR) WHERE purchase_id=? AND sent_at IS NULL AND next_attempt<=NOW()');$claim->execute([$r['purchase_id']]);if(!$claim->rowCount())continue;
        $codes=$db->prepare('SELECT code FROM mlt_vouchers WHERE purchase_id=? ORDER BY sequence_no');$codes->execute([$r['purchase_id']]);
        $body="Thank you for choosing MLT.\n\nVoucher purchase: ".$r['reference_code']."\nQuantity: ".$r['quantity']."\nTravel credit per voucher: EUR ".number_format((int)$r['face_cents']/100,2,'.','')."\nTotal paid: EUR ".number_format((int)$r['price_cents']*(int)$r['quantity']/100,2,'.','')."\n\nVoucher numbers:\n".implode("\n",$codes->fetchAll(PDO::FETCH_COLUMN))."\n\nYour available balances and transaction history:\nhttps://mlt-lifestyle.com/account/vouchers/\n\nMLT Maschinenhandel GmbH Import-Export\ninfo@mlt-lifestyle.com";
        $sent=@mail($r['email'],'MLT journey vouchers · '.$r['reference_code'],$body,"From: bookings@mlt-lifestyle.com\r\nContent-Type: text/plain; charset=UTF-8");
        if($sent)$db->prepare('UPDATE mlt_voucher_receipts SET sent_at=NOW() WHERE purchase_id=?')->execute([$r['purchase_id']]);else error_log('MLT voucher receipt pending: '.$r['reference_code']);
    }
}
