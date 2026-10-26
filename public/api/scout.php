<?php
declare(strict_types=1);
require_once __DIR__.'/security.php';
mlt_security_guard(['GET','POST']);
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/booking.php';
require_once __DIR__.'/scout-core.php';
$body=json_decode(file_get_contents('php://input'),true) ?: [];
$action=$_SERVER['REQUEST_METHOD']==='GET' ? (string)($_GET['action']??'points') : (string)($body['action']??'');
if ($_SERVER['REQUEST_METHOD']==='GET' && $action!=='points') mlt_scout_error(405,'usePost');
$db=mlt_db(mlt_settings());
if (!$db) mlt_scout_error(503,'unavailable');
mlt_scout_schema($db);

if ($action==='points') {
    // No scout identity, capability, review note or unpublished card is public.
    $rows=$db->query('SELECT p.slug,p.title,p.country_name,p.latitude,p.longitude,p.description,p.image_path,s.category,s.photos_json,s.parking,s.booking FROM mlt_route_points p LEFT JOIN mlt_scout_submissions s ON s.published_point_id=p.id WHERE p.is_active=1 AND (s.id IS NULL OR s.status="accepted") ORDER BY p.id')->fetchAll();
    echo json_encode(['ok'=>true,'points'=>$rows],JSON_UNESCAPED_UNICODE); exit;
}

if ($action==='read') {
    mlt_security_limit('scout-read:'.($_SERVER['REMOTE_ADDR']??''),60,600);
    $row=mlt_scout_find($db,mlt_scout_text($body,'reference',32,true));
    mlt_scout_authorize($row,mlt_scout_text($body,'editToken',64,true));
    echo json_encode(['ok'=>true,'card'=>mlt_scout_card($row)],JSON_UNESCAPED_UNICODE); exit;
}

if ($action==='submit' || $action==='resubmit') {
    mlt_security_limit('scout-submit:'.($_SERVER['REMOTE_ADDR']??''),20,3600);
    if (mlt_scout_text($body,'website',200)!=='') mlt_scout_error(400,'requestFailed');
    $requestId=mlt_scout_text($body,'requestId',36,true);
    $key=mlt_scout_text($body,'editToken',64,true);
    if (!preg_match('/^[a-f0-9-]{36}$/D',$requestId) || !preg_match('/^[a-f0-9]{64}$/D',$key)) mlt_scout_error(400,'refresh');
    $fields=mlt_scout_fields($body);
    $reference=$action==='resubmit' ? mlt_scout_text($body,'reference',32,true) : '';
    $existing=null;
    if ($reference!=='') { $existing=mlt_scout_find($db,$reference); mlt_scout_authorize($existing,$key); }
    else { $q=$db->prepare('SELECT s.*,(SELECT is_active FROM mlt_route_points WHERE id=s.published_point_id) AS map_active FROM mlt_scout_submissions s WHERE request_id=?'); $q->execute([$requestId]); $existing=$q->fetch() ?: null; if($existing)mlt_scout_authorize($existing,$key); }
    if ($existing && $existing['last_request_id']===$requestId) { echo json_encode(['ok'=>true,'card'=>mlt_scout_card($existing)]); exit; }
    if ($action==='resubmit' && ($existing['status']!=='revision' || (int)($body['version']??0)!==(int)$existing['version'])) mlt_scout_error(409,'statusChanged');
    $photos=mlt_scout_photos($body['photos']??null,$existing?json_decode($existing['photos_json'],true):[]);
    $written=[];
    try {
        $db->beginTransaction();
        if ($action==='resubmit') {
            $locked=mlt_scout_find($db,$reference,true);
            mlt_scout_authorize($locked,$key);
            if($locked['last_request_id']===$requestId){$db->rollBack();echo json_encode(['ok'=>true,'card'=>mlt_scout_card($locked)]);exit;}
            if ($locked['status']!=='revision' || (int)$locked['version']!==(int)($body['version']??0)) { $db->rollBack(); mlt_scout_error(409,'statusChanged'); }
        }
        $directory=dirname(__DIR__).'/uploads/scout';
        if(!is_dir($directory) && !mkdir($directory,0755,true) && !is_dir($directory)) throw new RuntimeException('Scout upload directory');
        $paths=[];
        foreach($photos as $photo){
            if(isset($photo['path'])){$paths[]=$photo['path'];continue;}
            $name=bin2hex(random_bytes(18)).'.'.$photo['extension'];
            $file=$directory.'/'.$name;
            $written[]=$file;
            if(file_put_contents($file,$photo['bytes'],LOCK_EX)===false)throw new RuntimeException('Scout image write');
            $paths[]='/uploads/scout/'.$name;
        }
        $json=json_encode($paths,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
        if($action==='resubmit'){
            $q=$db->prepare('UPDATE mlt_scout_submissions SET scout_name=?,category=?,title=?,country_name=?,latitude=?,longitude=?,description=?,parking=?,booking=?,photos_json=?,last_request_id=?,status="pending",version=version+1,updated_at=NOW() WHERE id=?');
            $q->execute([...$fields,$json,$requestId,$existing['id']]);
        }else{
            $reference='MLT-S-'.strtoupper(bin2hex(random_bytes(6)));
            $q=$db->prepare('INSERT INTO mlt_scout_submissions (scout_name,category,title,country_name,latitude,longitude,description,parking,booking,photos_json,reference_code,request_id,last_request_id,edit_token_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
            $q->execute([...$fields,$json,$reference,$requestId,$requestId,hash('sha256',$key)]);
        }
        $db->commit();
    }catch(Throwable $error){
        if($db->inTransaction())$db->rollBack();
        foreach($written as $file)@unlink($file);
        // A concurrent retry may have won the unique request-id insert.
        if($action==='submit'){$q=$db->prepare('SELECT s.*,(SELECT is_active FROM mlt_route_points WHERE id=s.published_point_id) AS map_active FROM mlt_scout_submissions s WHERE request_id=?');$q->execute([$requestId]);$retry=$q->fetch();if($retry&&hash_equals($retry['edit_token_hash'],hash('sha256',$key))){echo json_encode(['ok'=>true,'card'=>mlt_scout_card($retry)]);exit;}}
        throw $error;
    }
    echo json_encode(['ok'=>true,'card'=>mlt_scout_card(mlt_scout_find($db,$reference))],JSON_UNESCAPED_UNICODE); exit;
}

$token=preg_replace('/^Bearer\s+/i','',(string)($_SERVER['HTTP_AUTHORIZATION']??''));
$q=$db->prepare('SELECT id,role FROM mlt_users WHERE session_hash=? AND session_expires_at>NOW() LIMIT 1');
$q->execute([hash('sha256',$token)]);$operator=$q->fetch();
if(!$token || ($operator['role']??'')!=='admin')mlt_scout_error(403,'adminRequired');

if($action==='list'){
    $status=mlt_scout_text($body,'status',24);
    if($status!==''&&!in_array($status,['pending','accepted','rejected','revision'],true))mlt_scout_error(400,'unknownStatus');
    $search=mlt_scout_text($body,'search',180);
    $page=max(1,min(10000,(int)($body['page']??1)));$offset=($page-1)*24;
    $where=[];$params=[];
    if($status!==''){$where[]='status=?';$params[]=$status;}
    if($search!==''){$where[]='(title LIKE ? OR scout_name LIKE ? OR reference_code LIKE ?)';array_push($params,...array_fill(0,3,'%'.$search.'%'));}
    $sql=$where?' WHERE '.implode(' AND ',$where):'';
    $q=$db->prepare('SELECT COUNT(*) FROM mlt_scout_submissions'.$sql);$q->execute($params);$total=(int)$q->fetchColumn();
    $q=$db->prepare('SELECT s.*,(SELECT is_active FROM mlt_route_points WHERE id=s.published_point_id) AS map_active FROM mlt_scout_submissions s'.$sql.' ORDER BY created_at DESC,id DESC LIMIT 24 OFFSET '.$offset);$q->execute($params);
    $counts=['pending'=>0,'accepted'=>0,'rejected'=>0,'revision'=>0];
    foreach($db->query('SELECT status,COUNT(*) AS total FROM mlt_scout_submissions GROUP BY status')->fetchAll() as $row)$counts[$row['status']]=(int)$row['total'];
    echo json_encode(['ok'=>true,'cards'=>array_map('mlt_scout_card',$q->fetchAll()),'counts'=>$counts,'total'=>$total,'page'=>$page],JSON_UNESCAPED_UNICODE);exit;
}

if(in_array($action,['moderate','publish','unpublish','revision_link'],true)){
    $reference=mlt_scout_text($body,'reference',32,true);
    $status=$action==='moderate'?mlt_scout_text($body,'status',24,true):'';
    $note=mlt_scout_text($body,'reviewNote',2000);
    if($action==='moderate'&&(!in_array($status,['accepted','rejected','revision'],true)||($status==='revision'&&$note==='')))mlt_scout_error(400,'revisionNote');
    $db->beginTransaction();
    try{
        $row=mlt_scout_find($db,$reference,true);
        if(!$row){$db->rollBack();mlt_scout_error(404,'cardMissing');}
        if((int)$row['version']!==(int)($body['version']??0)){$db->rollBack();mlt_scout_error(409,'reviewConflict');}
        $extra=[];
        if($action==='moderate'){
            if($status!=='accepted'&&$row['published_point_id'])$db->prepare('UPDATE mlt_route_points SET is_active=0 WHERE id=?')->execute([$row['published_point_id']]);
            $db->prepare('UPDATE mlt_scout_submissions SET status=?,review_note=?,reviewed_by=?,version=version+1,updated_at=NOW() WHERE id=?')->execute([$status,$note,$operator['id'],$row['id']]);
        }elseif($action==='revision_link'){
            if($row['status']!=='revision'){$db->rollBack();mlt_scout_error(409,'revisionOnly');}
            $key=bin2hex(random_bytes(32));
            $db->prepare('UPDATE mlt_scout_submissions SET edit_token_hash=?,version=version+1,updated_at=NOW() WHERE id=?')->execute([hash('sha256',$key),$row['id']]);
            $extra=['editToken'=>$key];
        }elseif($action==='publish'){
            if($row['status']!=='accepted'){$db->rollBack();mlt_scout_error(409,'acceptFirst');}
            $values=[$row['title'],$row['country_name'],$row['latitude'],$row['longitude'],$row['description'],json_decode($row['photos_json'],true)[0]];
            if($row['published_point_id']){
                $pointId=(int)$row['published_point_id'];
                $db->prepare('UPDATE mlt_route_points SET title=?,country_name=?,latitude=?,longitude=?,description=?,image_path=?,is_active=1 WHERE id=?')->execute([...$values,$pointId]);
            }else{
                $db->prepare('INSERT INTO mlt_route_points (title,country_name,latitude,longitude,description,image_path,slug,is_active) VALUES (?,?,?,?,?,?,?,1)')->execute([...$values,'scout-'.strtolower($row['reference_code'])]);
                $pointId=(int)$db->lastInsertId();
            }
            $db->prepare('UPDATE mlt_scout_submissions SET published_point_id=?,version=version+1,updated_at=NOW() WHERE id=?')->execute([$pointId,$row['id']]);
        }else{
            if($row['published_point_id'])$db->prepare('UPDATE mlt_route_points SET is_active=0 WHERE id=?')->execute([$row['published_point_id']]);
            $db->prepare('UPDATE mlt_scout_submissions SET version=version+1,updated_at=NOW() WHERE id=?')->execute([$row['id']]);
        }
        $db->commit();
        $card=mlt_scout_card(mlt_scout_find($db,$reference));
        echo json_encode(['ok'=>true,'card'=>$card,...$extra],JSON_UNESCAPED_UNICODE);exit;
    }catch(Throwable $error){if($db->inTransaction())$db->rollBack();throw $error;}
}
mlt_scout_error(400,'unknownAction');
