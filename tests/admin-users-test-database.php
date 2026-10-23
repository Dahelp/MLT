<?php
declare(strict_types=1);
class UsersTestDatabase extends ChatTestDatabase {
 function __construct(){parent::__construct();foreach(['phone'=>'TEXT','created_at'=>'TEXT','updated_at'=>'TEXT'] as $column=>$type){try{parent::exec("ALTER TABLE mlt_users ADD COLUMN $column $type");}catch(PDOException $e){}}
  try{parent::exec("ALTER TABLE mlt_chat_conversations ADD COLUMN department TEXT DEFAULT 'concierge'");}catch(PDOException $e){}
  parent::exec("UPDATE mlt_users SET locale='en' WHERE locale IS NULL");
  parent::exec('CREATE TABLE IF NOT EXISTS mlt_orders (reference_code TEXT,user_id INTEGER,status TEXT,collection_name TEXT,customer_email TEXT,arrival_date TEXT,departure_date TEXT,amount NUMERIC,paid_amount NUMERIC,currency TEXT,notes TEXT,created_at TEXT)');
  parent::exec('CREATE TABLE IF NOT EXISTS mlt_commercial_inquiries (reference_code TEXT,source TEXT,subject TEXT,context_text TEXT,email TEXT,notes TEXT,phone TEXT,created_at TEXT)');
  parent::exec("INSERT INTO mlt_orders SELECT 'BOOKING-1',NULL,'requested','Family expedition','traveller@mlt-lifestyle.com','2026-11-01','2026-11-08',2000,0,'EUR','Client request',CURRENT_TIMESTAMP WHERE NOT EXISTS(SELECT 1 FROM mlt_orders)");
  parent::exec("INSERT INTO mlt_commercial_inquiries SELECT 'SALES-1','acquisitions','Capsule request','A capsule home','traveller@mlt-lifestyle.com','Client note','123',CURRENT_TIMESTAMP WHERE NOT EXISTS(SELECT 1 FROM mlt_commercial_inquiries)");
  parent::exec("INSERT INTO mlt_chat_conversations (user_id,access_hash,name,email,department) SELECT 5,'other-hash','Traveller','traveller@mlt-lifestyle.com','sales' WHERE NOT EXISTS(SELECT 1 FROM mlt_chat_conversations WHERE user_id=5)");
 }
 public function exec(string $sql):int|false{if(str_starts_with($sql,'CREATE TABLE IF NOT EXISTS mlt_user_email_history'))return parent::exec('CREATE TABLE IF NOT EXISTS mlt_user_email_history (user_id INTEGER,email TEXT,PRIMARY KEY(user_id,email))');return parent::exec($sql);}
 public function prepare(string $sql,array $options=[]):PDOStatement|false{$sql=str_replace(' FOR UPDATE','',$sql);$sql=str_replace('DATE_ADD(NOW(), INTERVAL 1 DAY)',"datetime('now','+1 day')",$sql);$sql=str_replace('ON DUPLICATE KEY UPDATE email=email','ON CONFLICT DO NOTHING',$sql);return parent::prepare($sql,$options);}
}
