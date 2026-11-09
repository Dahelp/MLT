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
require __DIR__.'/scout-video.php';
mlt_scout_video_schema($db);

if ($action==='points') {
    // Publish location media only after explicit approval and map publication.
    // Scout identity, capabilities, contact details and review notes stay private.
    $rows=$db->query('SELECT p.slug,p.title,p.country_name,p.latitude,p.longitude,p.description,p.image_path,s.category,s.photos_json,s.parking,s.booking,s.amenities,s.recommended,s.video_json FROM mlt_route_points p INNER JOIN mlt_scout_submissions s ON s.published_point_id=p.id WHERE p.is_active=1 AND s.status="accepted" ORDER BY p.id')->fetchAll();
    foreach ($rows as &$point) {
        $point['amenities']=($point['category']??'')==='stay'?($point['amenities']??''):'';
        $point['recommended']=(bool)($point['recommended']??false);
        $video=json_decode($point['video_json']??'null',true);
        $point['video']=is_array($video) && preg_match('#^/uploads/scout-video/[a-f0-9]{48}\.(?:mp4|mov|webm)$#D',(string)($video['path']??'')) ? ['path'=>$video['path'],'mime'=>$video['mime']??''] : null;
        unset($point['video_json']);
    }
    unset($point);
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
    $fields=mlt_scout_fields($body,true,true);
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
        $videoValue=array_key_exists('video',$body)?$body['video']:(json_decode($existing['video_json']??'null',true)['path']??null);
        $video=mlt_scout_submission_video($db,$videoValue,$key,$existing);
        $videoJson=$video?json_encode($video,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR):null;
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
            $q=$db->prepare('UPDATE mlt_scout_submissions SET scout_name=?,category=?,title=?,country_name=?,latitude=?,longitude=?,description=?,parking=?,booking=?,location_website=?,contact_phone=?,subcategories_json=?,subcategory_other=?,amenities=?,photos_json=?,video_json=?,last_request_id=?,status="pending",version=version+1,updated_at=NOW() WHERE id=?');
            $q->execute([...$fields,$json,$videoJson,$requestId,$existing['id']]);
        }else{
            $reference='MLT-S-'.strtoupper(bin2hex(random_bytes(6)));
            $q=$db->prepare('INSERT INTO mlt_scout_submissions (scout_name,category,title,country_name,latitude,longitude,description,parking,booking,location_website,contact_phone,subcategories_json,subcategory_other,amenities,photos_json,video_json,reference_code,request_id,last_request_id,edit_token_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
            $q->execute([...$fields,$json,$videoJson,$reference,$requestId,$requestId,hash('sha256',$key)]);
        }
        mlt_scout_attach_video($db,$videoValue,$reference);
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

if($action==='admin_update' || $action==='recommend'){
    $reference=mlt_scout_text($body,'reference',32,true);
    $requestId=mlt_scout_text($body,'requestId',36,true);
    if(!preg_match('/^[a-f0-9-]{36}$/D',$requestId))mlt_scout_error(400,'refresh');
    $written=[];
    $db->beginTransaction();
    try{
        $row=mlt_scout_find($db,$reference,true);
        if(!$row){$db->rollBack();mlt_scout_error(404,'cardMissing');}
        $retry=$db->prepare('SELECT submission_id,operator_id FROM mlt_scout_edits WHERE request_id=?');$retry->execute([$requestId]);$previous=$retry->fetch();
        if($previous){
            if((int)$previous['submission_id']!==(int)$row['id'] || (int)$previous['operator_id']!==(int)$operator['id']){$db->rollBack();mlt_scout_error(409,'reviewConflict');}
            $db->commit();echo json_encode(['ok'=>true,'card'=>mlt_scout_card($row)],JSON_UNESCAPED_UNICODE);exit;
        }
        if((int)$row['version']!==(int)($body['version']??0)){$db->rollBack();mlt_scout_error(409,'reviewConflict');}
        $recommended=array_key_exists('recommended',$body)?$body['recommended']:(bool)($row['recommended']??false);
        if(!is_bool($recommended) || ($action==='recommend'&&!array_key_exists('recommended',$body))){$db->rollBack();mlt_scout_error(400,'invalidText');}
        if($action==='admin_update'){
            // Keep the original scout identity and capability; only the administrator edits location content.
            $fields=mlt_scout_fields(array_merge($body,['scoutName'=>$row['scout_name']]),true,true);
            $retained=json_decode($row['photos_json'],true)?:[];
            $photos=mlt_scout_photos($body['photos']??$retained,$retained);
            $videoValue=array_key_exists('video',$body)?$body['video']:(json_decode($row['video_json']??'null',true)['path']??null);
            $video=mlt_scout_submission_video($db,$videoValue,mlt_scout_text($body,'mediaEditToken',64),$row);
            $paths=[];
            foreach($photos as $photo){
                if(isset($photo['path'])){$paths[]=$photo['path'];continue;}
                $directory=dirname(__DIR__).'/uploads/scout';
                if(!is_dir($directory)&&!mkdir($directory,0755,true)&&!is_dir($directory))throw new RuntimeException('Scout upload directory');
                $path='/uploads/scout/'.bin2hex(random_bytes(18)).'.'.$photo['extension'];$file=dirname(__DIR__).$path;$written[]=$file;
                if(file_put_contents($file,$photo['bytes'],LOCK_EX)===false)throw new RuntimeException('Scout image write');
                $paths[]=$path;
            }
            $q=$db->prepare('UPDATE mlt_scout_submissions SET scout_name=?,category=?,title=?,country_name=?,latitude=?,longitude=?,description=?,parking=?,booking=?,location_website=?,contact_phone=?,subcategories_json=?,subcategory_other=?,amenities=?,photos_json=?,video_json=?,version=version+1,updated_at=NOW() WHERE id=?');
            $q->execute([...$fields,json_encode($paths,JSON_THROW_ON_ERROR),$video?json_encode($video,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR):null,$row['id']]);
            mlt_scout_attach_video($db,$videoValue,$reference);
            if($row['published_point_id']){
                $updated=mlt_scout_find($db,$reference);
                $db->prepare('UPDATE mlt_route_points SET title=?,country_name=?,latitude=?,longitude=?,description=?,image_path=? WHERE id=?')->execute([$updated['title'],$updated['country_name'],$updated['latitude'],$updated['longitude'],$updated['description'],$paths[0],$row['published_point_id']]);
            }
        }
        // Recommendations are an administrator decision, independent of scout edits and publication.
        $db->prepare('UPDATE mlt_scout_submissions SET recommended=?,version=version+?,updated_at=NOW() WHERE id=?')->execute([(int)$recommended,$action==='recommend'?1:0,$row['id']]);
        $card=mlt_scout_card(mlt_scout_find($db,$reference));
        $db->prepare('INSERT INTO mlt_scout_edits (submission_id,operator_id,request_id,previous_version,before_json,after_json) VALUES (?,?,?,?,?,?)')->execute([$row['id'],$operator['id'],$requestId,$row['version'],json_encode(mlt_scout_card($row),JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),json_encode($card,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)]);
        $db->commit();
        echo json_encode(['ok'=>true,'card'=>$card],JSON_UNESCAPED_UNICODE);exit;
    }catch(Throwable $error){
        if($db->inTransaction())$db->rollBack();foreach($written as $file)@unlink($file);throw $error;
    }
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
