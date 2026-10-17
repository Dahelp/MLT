<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require_once __DIR__.'/booking.php';
function investment_reply(array $data,int $status=200):never{http_response_code($status);echo json_encode($data,JSON_UNESCAPED_UNICODE);exit;}
$db=mlt_db(mlt_settings());if(!$db)investment_reply(['error'=>'Service unavailable.'],503);
$token=preg_replace('/^Bearer\s+/i','',(string)($_SERVER['HTTP_AUTHORIZATION']??''));
$q=$db->prepare('SELECT first_name,last_name,role FROM mlt_users WHERE session_hash=? AND session_expires_at>NOW() LIMIT 1');$q->execute([hash('sha256',$token)]);$operator=$q->fetch();
if(!$operator||!in_array($operator['role'],['admin','salesmanager'],true))investment_reply(['error'=>'Sales manager access required.'],403);
$body=json_decode(file_get_contents('php://input'),true);if(!is_array($body))$body=[];
$action=(string)($body['action']??'session');
if($action==='session')investment_reply(['operator'=>['name'=>trim($operator['first_name'].' '.$operator['last_name']),'role'=>$operator['role']],'annualRate'=>15]);
if($action==='calculate'){
 $amount=filter_var($body['amount']??null,FILTER_VALIDATE_FLOAT);$years=filter_var($body['years']??null,FILTER_VALIDATE_INT);
 if($amount===false||$amount<50000||$amount>500000||fmod($amount,10000)!==0.0||$years===false||$years<1||$years>5)investment_reply(['error'=>'Investment must be €50,000–€500,000 in €10,000 steps, for 1–5 years.'],400);
 // Use the same illustrative simple-interest model as the public investment page.
 $annual=round($amount*0.15,2);$yield=round($annual*$years,2);
 investment_reply(['calculation'=>['amount'=>$amount,'years'=>$years,'annualRate'=>15,'annualYield'=>$annual,'totalYield'=>$yield,'totalReturn'=>round($amount+$yield,2),'currency'=>'EUR']]);
}
if($action==='inquiries'){
 try{$rows=$db->query("SELECT reference_code,first_name,last_name,email,phone,subject,context_text,notes,created_at FROM mlt_commercial_inquiries WHERE source='investments' ORDER BY created_at DESC LIMIT 200")->fetchAll(PDO::FETCH_ASSOC);}
 catch(PDOException $error){if($error->getCode()!=='42S02'&&!str_contains($error->getMessage(),'no such table')){error_log('MLT investment inquiries: '.$error->getMessage());investment_reply(['error'=>'Could not load investment inquiries.'],500);}$rows=[];}
 investment_reply(['inquiries'=>$rows]);
}
investment_reply(['error'=>'Unknown action.'],400);
