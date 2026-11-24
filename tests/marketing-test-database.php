<?php
declare(strict_types=1);
function mlt_settings(): array { return []; }
class MarketingTestDatabase extends PDO {
    public function prepare(string $query,array $options=[]): PDOStatement|false {
        try { return parent::prepare($query,$options); }
        catch(PDOException $error) {
            // Match MySQL's SQLSTATE for a missing optional module table.
            if(str_contains($error->getMessage(),'no such table: mlt_scout_submissions')) {
                $mapped=new PDOException('Optional table not installed.');
                (new ReflectionProperty(Exception::class,'code'))->setValue($mapped,'42S02');
                throw $mapped;
            }
            throw $error;
        }
    }
}
function mlt_db(array $settings): ?PDO {
    $db=new MarketingTestDatabase('sqlite:'.__DIR__.'/marketing.sqlite',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
    $db->sqliteCreateFunction('NOW',static fn()=>gmdate('Y-m-d H:i:s'));
    if(!is_file(__DIR__.'/seeded')) {
        $db->exec('CREATE TABLE mlt_users (id INTEGER PRIMARY KEY,first_name TEXT,last_name TEXT,email TEXT,role TEXT,locale TEXT,session_hash TEXT,session_expires_at TEXT,created_at TEXT)');
        $q=$db->prepare('INSERT INTO mlt_users VALUES (?,?,?,?,?,?,?,?,?)');
        foreach(['admin','marketer','manager','salesmanager','concierge','traveller','agency'] as $i=>$role) $q->execute([$i+1,'Test',ucfirst($role),'PRIVATE_EMAIL_'.$i,$role,'en',hash('sha256','test-'.$role),'2099-01-01','2000-01-01']);
        $date=gmdate('Y-m-d',time()-86400).' 12:00:00';
        for($i=10;$i<15;$i++) $q->execute([$i,'PRIVATE_NAME','Private','PRIVATE_EMAIL_'.$i,'traveller','ru',null,null,$date]);
        $db->exec('CREATE TABLE mlt_orders(id INTEGER PRIMARY KEY,created_at TEXT,collection_name TEXT,status TEXT,paid_amount REAL,travel_days INTEGER,customer_email TEXT,notes TEXT)');
        $db->exec('CREATE TABLE mlt_payments(order_id INTEGER,created_at TEXT,currency TEXT,amount REAL,provider TEXT,status TEXT)');
        $db->exec('CREATE TABLE mlt_commercial_inquiries(created_at TEXT,source TEXT,context_text TEXT)');
        $db->exec('CREATE TABLE mlt_chat_conversations(created_at TEXT,department TEXT,email TEXT)');
        $db->exec('CREATE TABLE mlt_scout_submissions(created_at TEXT,status TEXT,scout_name TEXT)');
        $db->exec('CREATE TABLE mlt_voucher_purchases(paid_at TEXT,user_id INTEGER,quantity INTEGER,price_cents INTEGER,status TEXT,reference_code TEXT)');
        for($i=1;$i<=10;$i++) {
            $first=$i<=5;
            $db->prepare('INSERT INTO mlt_orders VALUES (?,?,?,?,?,?,?,?)')->execute([$i,$date,$first?'freedom':'signature',$first?'paid':'requested',$first?100:0,$first?7:14,'PRIVATE_EMAIL','PRIVATE_NOTE']);
            $db->prepare('INSERT INTO mlt_payments VALUES (?,?,?,?,?,?)')->execute([$i,$date,'EUR',100,$first?'stripe':'voucher','paid']);
            $db->prepare('INSERT INTO mlt_commercial_inquiries VALUES (?,?,?)')->execute([$date,$first?'investments':'listing_ID_23','PRIVATE_CONTEXT']);
            $db->prepare('INSERT INTO mlt_chat_conversations VALUES (?,?,?)')->execute([$date,$first?'sales':'concierge','PRIVATE_EMAIL']);
            $db->prepare('INSERT INTO mlt_scout_submissions VALUES (?,?,?)')->execute([$date,$first?'revision':'accepted','PRIVATE_SCOUT']);
            if($first)$db->prepare('INSERT INTO mlt_voucher_purchases VALUES (?,?,?,?,?,?)')->execute([$date,$i,2,10000,'paid','PRIVATE_VOUCHER']);
        }
        file_put_contents(__DIR__.'/seeded','yes');
    }
    if(is_file(__DIR__.'/small')) {
        $db->exec('DELETE FROM mlt_orders WHERE id>4');
        $db->exec('DELETE FROM mlt_payments WHERE order_id>4');
        $db->exec('DELETE FROM mlt_voucher_purchases WHERE user_id>4');
    }
    if(is_file(__DIR__.'/missing')) $db->exec('DROP TABLE IF EXISTS mlt_scout_submissions');
    if(is_file(__DIR__.'/broken')) $db->exec('DROP TABLE IF EXISTS mlt_orders');
    return $db;
}
