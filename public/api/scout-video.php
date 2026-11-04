<?php
declare(strict_types=1);

function mlt_scout_media_limits(): array {
    static $limits;
    return $limits ??= json_decode(file_get_contents(dirname(__DIR__).'/data/scout-media.json'), true, 32, JSON_THROW_ON_ERROR);
}

function mlt_scout_video_schema(PDO $db): void {
    $db->exec('CREATE TABLE IF NOT EXISTS mlt_scout_video_uploads (
        upload_id CHAR(48) PRIMARY KEY, media_request_id CHAR(36) NOT NULL UNIQUE,
        owner_hash CHAR(64) NOT NULL, expected_size INT UNSIGNED NOT NULL,
        received_size INT UNSIGNED NOT NULL DEFAULT 0, original_name VARCHAR(160) NOT NULL,
        media_json TEXT NULL, attached_reference VARCHAR(32) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX scout_video_cleanup (attached_reference,updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
}

function mlt_scout_video_directory(): string {
    $path=dirname(__DIR__).'/uploads/scout-video';
    if (!is_dir($path) && !mkdir($path,0755,true) && !is_dir($path)) throw new RuntimeException('Video directory unavailable');
    return $path;
}

function mlt_scout_video_key(array $body): string {
    $key=mlt_scout_text($body,'editToken',64,true);
    if (!preg_match('/^[a-f0-9]{64}$/D',$key)) mlt_scout_error(400,'refresh');
    return hash('sha256',$key);
}

function mlt_scout_video_row(PDO $db, string $id, string $owner, bool $lock=false): array {
    if (!preg_match('/^[a-f0-9]{48}$/D',$id)) mlt_scout_error(404,'videoMissing');
    $q=$db->prepare('SELECT * FROM mlt_scout_video_uploads WHERE upload_id=?'.($lock?' FOR UPDATE':''));
    $q->execute([$id]);$row=$q->fetch();
    if (!$row || !hash_equals($row['owner_hash'],$owner)) mlt_scout_error(404,'videoMissing');
    return $row;
}

/** Return only an owned, completed upload, or this card's retained media. */
function mlt_scout_submission_video(PDO $db, mixed $value, string $key, ?array $existing): ?array {
    if ($value===null || $value==='') return null;
    if (!is_string($value)) mlt_scout_error(400,'videoFormat');
    $retained=json_decode($existing['video_json']??'null',true);
    if ($retained && hash_equals($retained['path'],$value)) return $retained;
    $row=mlt_scout_video_row($db,$value,hash('sha256',$key),true);
    if (!$row['media_json'] || ($row['attached_reference'] && $row['attached_reference']!==($existing['reference_code']??null))) mlt_scout_error(409,'videoIncomplete');
    return json_decode($row['media_json'],true,32,JSON_THROW_ON_ERROR);
}

function mlt_scout_attach_video(PDO $db, mixed $value, string $reference): void {
    if (is_string($value) && preg_match('/^[a-f0-9]{48}$/D',$value)) {
        $db->prepare('UPDATE mlt_scout_video_uploads SET attached_reference=?,updated_at=NOW() WHERE upload_id=?')->execute([$reference,$value]);
    }
}

// All media actions use the same unguessable scout capability as the draft.
if (in_array($action,['video_start','video_chunk','video_finish'],true)) {
    $owner=mlt_scout_video_key($body);
    mlt_scout_video_schema($db);
    $limits=mlt_scout_media_limits();
    if ($action==='video_start') {
        $request=mlt_scout_text($body,'mediaRequestId',36,true);
        $size=$body['size']??null;
        if (!preg_match('/^[a-f0-9-]{36}$/D',$request)) mlt_scout_error(400,'refresh');
        if (!is_int($size) || $size<1 || $size>$limits['videoMaxBytes']) mlt_scout_error(400,'videoSize');
        $q=$db->prepare('SELECT * FROM mlt_scout_video_uploads WHERE media_request_id=?');$q->execute([$request]);$row=$q->fetch();
        if ($row && (!hash_equals($row['owner_hash'],$owner) || (int)$row['expected_size']!==$size)) mlt_scout_error(404,'videoMissing');
        if (!$row) {
            mlt_security_limit('scout-video:'.($_SERVER['REMOTE_ADDR']??''),8,3600);
            // Bounded cleanup of abandoned uploads; attached card media is never removed.
            $q=$db->prepare('SELECT upload_id,media_json FROM mlt_scout_video_uploads WHERE attached_reference IS NULL AND updated_at<? LIMIT 20');$q->execute([gmdate('Y-m-d H:i:s',time()-86400*2)]);
            foreach($q->fetchAll() as $old) {
                $db->beginTransaction();
                $locked=$db->prepare('SELECT * FROM mlt_scout_video_uploads WHERE upload_id=? FOR UPDATE');$locked->execute([$old['upload_id']]);$locked=$locked->fetch();
                if ($locked && !$locked['attached_reference'] && $locked['updated_at']<gmdate('Y-m-d H:i:s',time()-86400*2)) {
                    $base=mlt_scout_video_directory().'/'.$locked['upload_id'];
                    foreach(['part','mp4','mov','webm'] as $extension) if(is_file($base.'.'.$extension))@unlink($base.'.'.$extension);
                    $db->prepare('DELETE FROM mlt_scout_video_uploads WHERE upload_id=?')->execute([$locked['upload_id']]);
                }
                $db->commit();
            }
            $id=bin2hex(random_bytes(24));$name=mlt_scout_text($body,'name',160)?:'Scout video';
            try {$db->prepare('INSERT INTO mlt_scout_video_uploads (upload_id,media_request_id,owner_hash,expected_size,original_name) VALUES (?,?,?,?,?)')->execute([$id,$request,$owner,$size,$name]);}
            catch(PDOException $error) { // A retried start can race the original response.
                $q=$db->prepare('SELECT * FROM mlt_scout_video_uploads WHERE media_request_id=?');$q->execute([$request]);$row=$q->fetch();
                if(!$row || !hash_equals($row['owner_hash'],$owner) || (int)$row['expected_size']!==$size)throw $error;
            }
            if (!$row) $row=['upload_id'=>$id,'received_size'=>0,'media_json'=>null];
        }
        echo json_encode(['ok'=>true,'uploadId'=>$row['upload_id'],'received'=>(int)$row['received_size'],'complete'=>(bool)$row['media_json']]);exit;
    }
    $id=mlt_scout_text($body,'uploadId',48,true);
    $db->beginTransaction();$handle=null;$oldSize=null;$renamed=null;
    try {
        $row=mlt_scout_video_row($db,$id,$owner,true);
        if ($row['media_json']) { $db->commit();echo json_encode(['ok'=>true,'received'=>(int)$row['received_size'],'complete'=>true]);exit; }
        $part=mlt_scout_video_directory().'/'.$id.'.part';
        if ($action==='video_chunk') {
            $offset=$body['offset']??null;$chunk=$body['chunk']??null;
            if (!is_int($offset) || $offset<0 || !is_string($chunk) || strlen($chunk)>(int)ceil($limits['videoChunkBytes']/3)*4) { $db->rollBack();mlt_scout_error(400,'videoUpload'); }
            $bytes=base64_decode($chunk,true);
            if ($bytes===false || !strlen($bytes) || strlen($bytes)>$limits['videoChunkBytes'] || $offset+strlen($bytes)>(int)$row['expected_size']) { $db->rollBack();mlt_scout_error(400,'videoUpload'); }
            if ($offset<(int)$row['received_size']) { $db->commit();echo json_encode(['ok'=>true,'received'=>(int)$row['received_size']]);exit; }
            if ($offset!==(int)$row['received_size']) { $db->rollBack();mlt_scout_error(409,'videoUpload'); }
            $handle=fopen($part,'c+b');
            if (!$handle || !flock($handle,LOCK_EX)) throw new RuntimeException('Video write lock');
            $oldSize=(int)$row['received_size'];
            if (fstat($handle)['size']<$oldSize || !ftruncate($handle,$oldSize) || fseek($handle,$oldSize)!==0 || fwrite($handle,$bytes)!==strlen($bytes) || !fflush($handle)) throw new RuntimeException('Video write failed');
            $received=$oldSize+strlen($bytes);
            $db->prepare('UPDATE mlt_scout_video_uploads SET received_size=?,updated_at=NOW() WHERE upload_id=?')->execute([$received,$id]);
            $db->commit();flock($handle,LOCK_UN);fclose($handle);$handle=null;
            echo json_encode(['ok'=>true,'received'=>$received]);exit;
        }
        if ((int)$row['received_size']!==(int)$row['expected_size'] || !is_file($part) || filesize($part)!==(int)$row['expected_size']) { $db->rollBack();mlt_scout_error(409,'videoIncomplete'); }
        $mime=(new finfo(FILEINFO_MIME_TYPE))->file($part);
        $extension=['video/mp4'=>'mp4','video/quicktime'=>'mov','video/webm'=>'webm'][$mime]??null;
        if (!$extension) {
            @unlink($part);$db->prepare('DELETE FROM mlt_scout_video_uploads WHERE upload_id=?')->execute([$id]);$db->commit();mlt_scout_error(400,'videoFormat');
        }
        $final=mlt_scout_video_directory().'/'.$id.'.'.$extension;
        if (!rename($part,$final)) throw new RuntimeException('Video finalize failed');$renamed=[$final,$part];
        $media=['path'=>'/uploads/scout-video/'.$id.'.'.$extension,'name'=>$row['original_name'],'size'=>(int)$row['expected_size'],'mime'=>$mime];
        $db->prepare('UPDATE mlt_scout_video_uploads SET media_json=?,updated_at=NOW() WHERE upload_id=?')->execute([json_encode($media,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),$id]);
        $db->commit();$renamed=null;
        echo json_encode(['ok'=>true,'received'=>(int)$row['received_size'],'complete'=>true]);exit;
    } catch(Throwable $error) {
        if ($db->inTransaction()) $db->rollBack();
        if ($handle) { if ($oldSize!==null) {ftruncate($handle,$oldSize);fflush($handle);}flock($handle,LOCK_UN);fclose($handle); }
        if ($renamed) @rename($renamed[0],$renamed[1]);
        throw $error;
    }
}
