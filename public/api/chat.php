<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
require_once __DIR__ . '/booking.php';

$body=json_decode(file_get_contents('php://input'),true);if(!is_array($body))$body=[];
$db=mlt_db(mlt_settings());if(!$db){http_response_code(503);echo json_encode(['error'=>'Chat service is unavailable.']);exit;}
try{
 $db->exec('CREATE TABLE IF NOT EXISTS mlt_chat_conversations (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id BIGINT UNSIGNED NULL,access_hash CHAR(64) NOT NULL UNIQUE,name VARCHAR(120) NOT NULL,email VARCHAR(160) NOT NULL,locale VARCHAR(8) NOT NULL DEFAULT "en",status VARCHAR(24) NOT NULL DEFAULT "open",unread_client INT UNSIGNED NOT NULL DEFAULT 0,unread_operator INT UNSIGNED NOT NULL DEFAULT 0,last_message_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,INDEX chat_user(user_id),INDEX chat_email(email),INDEX chat_activity(last_message_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
 $db->exec('CREATE TABLE IF NOT EXISTS mlt_chat_messages (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,conversation_id BIGINT UNSIGNED NOT NULL,sender_type VARCHAR(16) NOT NULL,sender_user_id BIGINT UNSIGNED NULL,sender_name VARCHAR(120) NOT NULL,body TEXT NOT NULL,read_at DATETIME NULL,created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,INDEX chat_messages_conversation(conversation_id,id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
 $db->exec('CREATE TABLE IF NOT EXISTS mlt_chat_presence (user_id BIGINT UNSIGNED PRIMARY KEY,last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
}catch(Throwable $error){error_log('MLT chat schema: '.$error->getMessage());http_response_code(503);echo json_encode(['error'=>'Chat database is unavailable.']);exit;}

$clean=static fn($value,$limit)=>mb_substr(trim((string)$value),0,$limit);
$authToken=preg_replace('/^Bearer\s+/i','',(string)($_SERVER['HTTP_AUTHORIZATION']??''));
$user=null;if($authToken!==''){$q=$db->prepare('SELECT id,email,first_name,last_name,role FROM mlt_users WHERE session_hash=? AND session_expires_at>NOW() LIMIT 1');$q->execute([hash('sha256',$authToken)]);$user=$q->fetch()?:null;}
$operator=$user&&in_array($user['role']??'', ['admin','manager'],true)?$user:null;
$action=(string)($body['action']??'sync');

$onlineCount=static function(PDO $db):int{return (int)$db->query("SELECT COUNT(*) FROM mlt_chat_presence p JOIN mlt_users u ON u.id=p.user_id WHERE u.role='manager' AND p.last_seen_at>DATE_SUB(NOW(),INTERVAL 45 SECOND)")->fetchColumn();};
$messages=static function(PDO $db,int $conversationId):array{$q=$db->prepare('SELECT id,sender_type,sender_name,body,created_at FROM mlt_chat_messages WHERE conversation_id=? ORDER BY id ASC LIMIT 250');$q->execute([$conversationId]);return $q->fetchAll();};
$clientPayload=static function(PDO $db,array $conversation,bool $includeToken=false,string $rawToken='')use($onlineCount,$messages):array{$payload=['ok'=>true,'conversation'=>['id'=>(int)$conversation['id'],'name'=>$conversation['name'],'email'=>$conversation['email'],'status'=>$conversation['status']],'messages'=>$messages($db,(int)$conversation['id']),'unread'=>(int)$conversation['unread_client'],'operatorsOnline'=>$onlineCount($db)];if($includeToken)$payload['token']=$rawToken;return $payload;};

if($action==='start'){
 $name=$clean($body['name']??'',120);$email=strtolower($clean($body['email']??'',160));$message=$clean($body['message']??'',4000);$locale=in_array($body['locale']??'',['en','de','ru'],true)?$body['locale']:'en';
 if($user&&!in_array($user['role']??'traveller',['admin','manager','concierge'],true)){$name=trim($user['first_name'].' '.$user['last_name']);$email=strtolower($user['email']);}
 if($name===''||!filter_var($email,FILTER_VALIDATE_EMAIL)||$message===''){http_response_code(400);echo json_encode(['error'=>'Enter your name, email and message.']);exit;}
 $rawToken=bin2hex(random_bytes(32));$hash=hash('sha256',$rawToken);$conversation=null;
 if($user){$q=$db->prepare('SELECT * FROM mlt_chat_conversations WHERE user_id=? AND status="open" ORDER BY last_message_at DESC LIMIT 1');$q->execute([$user['id']]);$conversation=$q->fetch()?:null;}
 if(!$conversation){$q=$db->prepare('INSERT INTO mlt_chat_conversations (user_id,access_hash,name,email,locale) VALUES (?,?,?,?,?)');$q->execute([$user['id']??null,$hash,$name,$email,$locale]);$conversationId=(int)$db->lastInsertId();}
 else{$conversationId=(int)$conversation['id'];$db->prepare('UPDATE mlt_chat_conversations SET access_hash=?,name=?,email=?,locale=? WHERE id=?')->execute([$hash,$name,$email,$locale,$conversationId]);}
 $q=$db->prepare('INSERT INTO mlt_chat_messages (conversation_id,sender_type,sender_user_id,sender_name,body) VALUES (?,"client",?,?,?)');$q->execute([$conversationId,$user['id']??null,$name,$message]);
 $db->prepare('UPDATE mlt_chat_conversations SET unread_operator=unread_operator+1,last_message_at=NOW() WHERE id=?')->execute([$conversationId]);
 $q=$db->prepare('SELECT * FROM mlt_chat_conversations WHERE id=?');$q->execute([$conversationId]);echo json_encode($clientPayload($db,$q->fetch(),true,$rawToken));exit;
}

if(in_array($action,['sync','send'],true)){
 $rawToken=$clean($body['token']??'',128);if(!preg_match('/^[a-f0-9]{64}$/',$rawToken)){http_response_code(401);echo json_encode(['error'=>'Conversation not found.']);exit;}
 $q=$db->prepare('SELECT * FROM mlt_chat_conversations WHERE access_hash=? LIMIT 1');$q->execute([hash('sha256',$rawToken)]);$conversation=$q->fetch();if(!$conversation){http_response_code(404);echo json_encode(['error'=>'Conversation not found.']);exit;}
 if($action==='send'){$message=$clean($body['message']??'',4000);if($message===''){http_response_code(400);echo json_encode(['error'=>'Message is required.']);exit;}$q=$db->prepare('INSERT INTO mlt_chat_messages (conversation_id,sender_type,sender_user_id,sender_name,body) VALUES (?,"client",?,?,?)');$q->execute([$conversation['id'],$user['id']??null,$conversation['name'],$message]);$db->prepare('UPDATE mlt_chat_conversations SET unread_operator=unread_operator+1,last_message_at=NOW(),status="open" WHERE id=?')->execute([$conversation['id']]);}
 if(!empty($body['markRead'])){$db->prepare('UPDATE mlt_chat_messages SET read_at=NOW() WHERE conversation_id=? AND sender_type="operator" AND read_at IS NULL')->execute([$conversation['id']]);$db->prepare('UPDATE mlt_chat_conversations SET unread_client=0 WHERE id=?')->execute([$conversation['id']]);}
 $q=$db->prepare('SELECT * FROM mlt_chat_conversations WHERE id=?');$q->execute([$conversation['id']]);echo json_encode($clientPayload($db,$q->fetch()));exit;
}

if(in_array($action,['operator_sync','operator_send','operator_close'],true)){
 if(!$operator){http_response_code(403);echo json_encode(['error'=>'Manager or administrator access required.']);exit;}
 $db->prepare('INSERT INTO mlt_chat_presence (user_id,last_seen_at) VALUES (?,NOW()) ON DUPLICATE KEY UPDATE last_seen_at=NOW()')->execute([$operator['id']]);
 $conversationId=(int)($body['conversationId']??0);
 if($action==='operator_send'){$message=$clean($body['message']??'',4000);if($conversationId<1||$message===''){http_response_code(400);echo json_encode(['error'=>'Choose a client and enter a message.']);exit;}$q=$db->prepare('INSERT INTO mlt_chat_messages (conversation_id,sender_type,sender_user_id,sender_name,body) SELECT id,"operator",?,?,? FROM mlt_chat_conversations WHERE id=?');$q->execute([$operator['id'],trim($operator['first_name'].' '.$operator['last_name']),$message,$conversationId]);if(!$q->rowCount()){http_response_code(404);echo json_encode(['error'=>'Conversation not found.']);exit;}$db->prepare('UPDATE mlt_chat_conversations SET unread_client=unread_client+1,last_message_at=NOW(),status="open" WHERE id=?')->execute([$conversationId]);}
 if($action==='operator_close'&&$conversationId>0)$db->prepare('UPDATE mlt_chat_conversations SET status="closed" WHERE id=?')->execute([$conversationId]);
 if($conversationId>0){$db->prepare('UPDATE mlt_chat_messages SET read_at=NOW() WHERE conversation_id=? AND sender_type="client" AND read_at IS NULL')->execute([$conversationId]);$db->prepare('UPDATE mlt_chat_conversations SET unread_operator=0 WHERE id=?')->execute([$conversationId]);}
 $conversations=$db->query('SELECT id,user_id,name,email,locale,status,unread_operator,last_message_at,created_at,(SELECT body FROM mlt_chat_messages m WHERE m.conversation_id=c.id ORDER BY m.id DESC LIMIT 1) last_message FROM mlt_chat_conversations c ORDER BY (unread_operator>0) DESC,last_message_at DESC LIMIT 200')->fetchAll();
 $selected=null;$selectedMessages=[];if($conversationId>0){$q=$db->prepare('SELECT id,user_id,name,email,locale,status,unread_operator,last_message_at,created_at FROM mlt_chat_conversations WHERE id=?');$q->execute([$conversationId]);$selected=$q->fetch()?:null;if($selected)$selectedMessages=$messages($db,$conversationId);}
 echo json_encode(['ok'=>true,'operator'=>['name'=>trim($operator['first_name'].' '.$operator['last_name']),'role'=>$operator['role']],'conversations'=>$conversations,'conversation'=>$selected,'messages'=>$selectedMessages,'unread'=>array_sum(array_map(static fn($item)=>(int)$item['unread_operator'],$conversations)),'operatorsOnline'=>$onlineCount($db)]);exit;
}

http_response_code(400);echo json_encode(['error'=>'Unknown chat action.']);
