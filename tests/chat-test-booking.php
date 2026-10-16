<?php
/** Isolated SQLite adapter for HTTP tests; never uses production settings. */
declare(strict_types=1);
class ChatTestDatabase extends PDO {
 function __construct(){
  parent::__construct('sqlite:'.__DIR__.'/test.sqlite');
  $this->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
  $this->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE,PDO::FETCH_ASSOC);
  $this->sqliteCreateFunction('NOW',fn()=>gmdate('Y-m-d H:i:s'));
  $this->sqliteCreateFunction('CURDATE',fn()=>gmdate('Y-m-d'));
  parent::exec('CREATE TABLE IF NOT EXISTS mlt_users (id INTEGER PRIMARY KEY,email TEXT UNIQUE,password_hash TEXT,first_name TEXT,last_name TEXT,locale TEXT,role TEXT,session_hash TEXT,session_expires_at TEXT)');
  // The old schema intentionally has no department column: exercise the migration.
  parent::exec('CREATE TABLE IF NOT EXISTS mlt_chat_conversations (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,access_hash TEXT UNIQUE,name TEXT,email TEXT,locale TEXT DEFAULT "en",status TEXT DEFAULT "open",unread_client INTEGER DEFAULT 0,unread_operator INTEGER DEFAULT 0,last_message_at TEXT DEFAULT CURRENT_TIMESTAMP,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP)');
  parent::exec('CREATE TABLE IF NOT EXISTS mlt_chat_messages (id INTEGER PRIMARY KEY AUTOINCREMENT,conversation_id INTEGER,sender_type TEXT,sender_user_id INTEGER,sender_name TEXT,body TEXT,read_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP)');
  parent::exec('CREATE TABLE IF NOT EXISTS mlt_chat_presence (user_id INTEGER PRIMARY KEY,last_seen_at TEXT DEFAULT CURRENT_TIMESTAMP)');
  if(!(int)$this->query('SELECT COUNT(*) FROM mlt_users')->fetchColumn()){
   $q=parent::prepare('INSERT INTO mlt_users (id,email,first_name,last_name,role,session_hash,session_expires_at) VALUES (?,?,?,?,?,?,?)');
   foreach(['admin','manager','concierge','salesmanager','traveller'] as $index=>$role)$q->execute([$index+1,$role.'@mlt-lifestyle.com','MLT',ucfirst($role),$role,hash('sha256','test-'.$role.'-token'),'2099-01-01']);
   parent::prepare('INSERT INTO mlt_chat_conversations (access_hash,name,email) VALUES (?,?,?)')->execute([hash('sha256',str_repeat('a',64)),'Legacy Guest','legacy@example.test']);
   parent::prepare('INSERT INTO mlt_chat_messages (conversation_id,sender_type,sender_name,body) VALUES (1,?,?,?)')->execute(['client','Legacy Guest','Existing history']);
  }
 }
 public function exec(string $statement): int|false {if(str_starts_with($statement,'CREATE TABLE IF NOT EXISTS mlt_chat_'))return 0;return parent::exec($statement);}
 public function prepare(string $query,array $options=[]): PDOStatement|false {
  $query=str_replace('DATE_SUB(NOW(),INTERVAL 45 SECOND)',"datetime('now','-45 seconds')",$query);
  $query=str_replace('ON DUPLICATE KEY UPDATE email=email','ON CONFLICT(email) DO NOTHING',$query);
  $query=str_replace('ON DUPLICATE KEY UPDATE role=VALUES(role)','ON CONFLICT(email) DO UPDATE SET role=excluded.role',$query);
  $query=str_replace('ON DUPLICATE KEY UPDATE last_seen_at=NOW()','ON CONFLICT(user_id) DO UPDATE SET last_seen_at=CURRENT_TIMESTAMP',$query);
  return parent::prepare($query,$options);
 }
}
function mlt_settings():array{return [];}
function mlt_db(array $settings):PDO{return new ChatTestDatabase();}
