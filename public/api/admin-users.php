<?php
declare(strict_types=1);
require_once __DIR__ . '/security.php';
mlt_security_guard(['POST']);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require_once __DIR__.'/booking.php';
function users_reply(array $data,int $status=200):never {http_response_code($status);echo json_encode($data,JSON_UNESCAPED_UNICODE);exit;}
$db=mlt_db(mlt_settings());if(!$db)users_reply(['error'=>'Service unavailable.'],503);
$token=preg_replace('/^Bearer\s+/i','',(string)($_SERVER['HTTP_AUTHORIZATION']??''));
$q=$db->prepare('SELECT id,first_name,last_name,role FROM mlt_users WHERE session_hash=? AND session_expires_at>NOW() LIMIT 1');$q->execute([hash('sha256',$token)]);$actor=$q->fetch();
if(!$actor||$actor['role']!=='admin')users_reply(['error'=>'Administrator access required.'],403);
$body=json_decode(file_get_contents('php://input'),true)?:[];
$fields='id,email,first_name,last_name,phone,locale,role,created_at,updated_at';
$clean=static fn($value,int $limit)=>mb_substr(trim((string)$value),0,$limit);
try {
 $db->exec('CREATE TABLE IF NOT EXISTS mlt_user_email_history (user_id BIGINT UNSIGNED NOT NULL,email VARCHAR(160) NOT NULL,PRIMARY KEY(user_id,email)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
 if(($body['action']??'list')==='save'){
  $id=(int)($body['id']??0);$email=strtolower(trim((string)($body['email']??'')));$first=$clean($body['first_name']??'',80);$last=$clean($body['last_name']??'',80);$role=(string)($body['role']??'traveller');$locale=(string)($body['locale']??'en');$password=(string)($body['password']??'');
  if(!filter_var($email,FILTER_VALIDATE_EMAIL)||strlen($email)>160||$first===''||$last===''||!in_array($role,['traveller','agency','concierge','manager','salesmanager','admin'],true)||!in_array($locale,['en','de','ru','it','pl'],true)||(!$id&&$password==='')||($password!==''&&(strlen($password)<8||strlen($password)>72)))users_reply(['error'=>'Check name, email, role and password (8–72 bytes).'],400);
  if($id===(int)$actor['id']&&($role!=='admin'||$password!==''))users_reply(['error'=>'Use your account settings to change your own password. Your administrator role must remain active.'],400);
  $db->beginTransaction();
  $q=$db->prepare('SELECT role FROM mlt_users WHERE id=? FOR UPDATE');$q->execute([$actor['id']]);if($q->fetchColumn()!=='admin'){$db->rollBack();users_reply(['error'=>'Administrator access required.'],403);}
  $old=null;if($id){$q=$db->prepare('SELECT id,email,role FROM mlt_users WHERE id=?');$q->execute([$id]);$old=$q->fetch();if(!$old){$db->rollBack();users_reply(['error'=>'User not found.'],404);}}
  if($id){
   $revoke=$password!==''||$old['role']!==$role||strtolower($old['email'])!==$email;
   $sql='UPDATE mlt_users SET email=?,first_name=?,last_name=?,phone=?,locale=?,role=?,updated_at=NOW()';$args=[$email,$first,$last,$clean($body['phone']??'',80),$locale,$role];
   if($password!==''){$sql.=',password_hash=?';$args[]=password_hash($password,PASSWORD_DEFAULT);}
   if($revoke)$sql.=',session_hash=NULL,session_expires_at=NULL';
   $args[]=$id;$db->prepare($sql.' WHERE id=?')->execute($args);
   // Attach existing guest activity before an email change so its history remains visible.
   if(strtolower($old['email'])!==$email){
    $db->prepare('INSERT INTO mlt_user_email_history (user_id,email) VALUES (?,?) ON DUPLICATE KEY UPDATE email=email')->execute([$id,$old['email']]);
   }
  }else{$db->prepare('INSERT INTO mlt_users (email,password_hash,first_name,last_name,phone,locale,role) VALUES (?,?,?,?,?,?,?)')->execute([$email,password_hash($password,PASSWORD_DEFAULT),$first,$last,$clean($body['phone']??'',80),$locale,$role]);$id=(int)$db->lastInsertId();}
  $db->commit();users_reply(['ok'=>true,'id'=>$id]);
 }
 if(($body['action']??'list')==='detail'){
  $q=$db->prepare("SELECT $fields FROM mlt_users WHERE id=?");$q->execute([(int)($body['id']??0)]);$user=$q->fetch();if(!$user)users_reply(['error'=>'User not found.'],404);
  $activity=[];
  // Some installations have not received inquiries or chats yet; a missing optional table is empty.
  $queries=[
   'orders'=>['SELECT reference_code,status,collection_name,customer_email,arrival_date,departure_date,amount,paid_amount,currency,notes,created_at FROM mlt_orders WHERE user_id=? OR (user_id IS NULL AND (customer_email=? OR customer_email IN (SELECT email FROM mlt_user_email_history WHERE user_id=?))) ORDER BY created_at DESC LIMIT 200',[$user['id'],$user['email'],$user['id']]],
   'inquiries'=>['SELECT reference_code,source,subject,context_text,notes,phone,created_at FROM mlt_commercial_inquiries WHERE email=? OR email IN (SELECT email FROM mlt_user_email_history WHERE user_id=?) ORDER BY created_at DESC LIMIT 200',[$user['email'],$user['id']]],
   'chats'=>['SELECT id,name,department,status,last_message_at,unread_operator FROM mlt_chat_conversations WHERE user_id=? OR (user_id IS NULL AND (email=? OR email IN (SELECT email FROM mlt_user_email_history WHERE user_id=?))) ORDER BY last_message_at DESC LIMIT 200',[$user['id'],$user['email'],$user['id']]],
  ];
  foreach($queries as $key=>[$sql,$params]){try{$q=$db->prepare($sql);$q->execute($params);$activity[$key]=$q->fetchAll();}catch(PDOException $e){if($e->getCode()!=='42S02'&&!str_contains($e->getMessage(),'no such table'))throw $e;$activity[$key]=[];}}
  users_reply(['user'=>$user,...$activity]);
 }
 if(($body['action']??'list')!=='list')users_reply(['error'=>'Unknown action.'],400);
 $search=$clean($body['search']??'',160);$role=(string)($body['role']??'');$page=max(1,(int)($body['page']??1));$where=[];$params=[];
 if($search!==''){$where[]='(email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR phone LIKE ?)';$params=array_fill(0,4,'%'.$search.'%');}if($role!==''){$where[]='role=?';$params[]=$role;}$condition=$where?' WHERE '.implode(' AND ',$where):'';
 $q=$db->prepare('SELECT COUNT(*) FROM mlt_users'.$condition);$q->execute($params);$total=(int)$q->fetchColumn();$offset=($page-1)*40;
 $q=$db->prepare("SELECT $fields FROM mlt_users".$condition." ORDER BY created_at DESC,id DESC LIMIT 40 OFFSET $offset");$q->execute($params);
 users_reply(['users'=>$q->fetchAll(),'total'=>$total,'page'=>$page,'operator'=>['name'=>trim($actor['first_name'].' '.$actor['last_name']),'role'=>'admin']]);
}catch(Throwable $e){if($db->inTransaction())$db->rollBack();if($e instanceof PDOException&&$e->getCode()==='23000')users_reply(['error'=>'An account with this email already exists.'],409);error_log('MLT admin users: '.$e->getMessage());users_reply(['error'=>'Could not complete the request.'],500);}
