<?php
declare(strict_types=1);
require_once __DIR__.'/security.php';
mlt_security_guard(['GET','POST']);
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');
require_once __DIR__.'/booking.php';
$db=mlt_db(mlt_settings());
if (!$db) { http_response_code(503);echo json_encode(['error'=>'Availability is temporarily unavailable.']);exit; }
try {
    if ($_SERVER['REQUEST_METHOD']==='GET') {
        $dates=mlt_fleet_availability($db,(string)($_GET['from']??''),(string)($_GET['to']??''),(int)($_GET['days']??0));
        echo json_encode(['modelId'=>mlt_fleet_model()['id'],'dates'=>$dates]);exit;
    }
    $body=json_decode(file_get_contents('php://input'),true)?:[];
    $token=preg_replace('/^Bearer\s+/i','',(string)($_SERVER['HTTP_AUTHORIZATION']??''));
    $q=$db->prepare('SELECT id,role FROM mlt_users WHERE session_hash=? AND session_expires_at>NOW()');$q->execute([hash('sha256',$token)]);$user=$q->fetch();
    if (!$user || $user['role']!=='admin') {http_response_code(403);echo json_encode(['error'=>'Administrator access required.']);exit;}
    $action=$body['action']??'overview';
    if ($action==='overview') {
        echo json_encode(['units'=>$db->query('SELECT * FROM mlt_fleet_units ORDER BY id')->fetchAll(),'blocks'=>$db->query('SELECT * FROM mlt_fleet_blocks ORDER BY starts_on DESC')->fetchAll(),'orders'=>$db->query('SELECT id,reference_code,collection_name,status,arrival_date,departure_date,motorhome_unit_id,motorhome_reserved_until,paid_amount,pickup_location,return_location FROM mlt_orders WHERE collection_name IN ("freedom","signature","concierge") AND status<>"cancelled" ORDER BY arrival_date DESC LIMIT 500')->fetchAll()]);exit;
    }
    $db->beginTransaction();
    mlt_fleet_lock($db);
    if ($action==='assign') {
        $id=(int)($body['orderId']??0);
        // Active checkouts cannot change their physical reservation.
        $q=$db->prepare('SELECT order_id FROM mlt_journey_checkout_holds WHERE order_id=?');$q->execute([$id]);
        if ($q->fetchColumn()) throw new DomainException('Close the active checkout before reassigning a unit.');
        mlt_fleet_reserve($db,$id,(int)($body['unitId']??0));
    } elseif ($action==='locations') {
        $pickup=mb_substr(trim((string)($body['pickup']??'')),0,160);$returning=mb_substr(trim((string)($body['returning']??'')),0,160);
        if (!$pickup || !$returning) throw new DomainException('Enter both handover locations.');
        $db->prepare('UPDATE mlt_orders SET pickup_location=?,return_location=? WHERE id=?')->execute([$pickup,$returning,(int)($body['orderId']??0)]);
    } elseif ($action==='block') {
        $start=(string)($body['start']??'');$end=(string)($body['end']??'');mlt_fleet_dates($start,$end);
        $unit=(int)($body['unitId']??0);$units=mlt_fleet_lock($db);
        if (!in_array($unit,array_map(fn($row)=>(int)$row['id'],$units),true)) throw new DomainException('Invalid unit.');
        $reason=mb_substr(trim((string)($body['reason']??'')),0,240);
        if ($reason==='') throw new DomainException('Enter the maintenance reason.');
        foreach (mlt_fleet_busy($db,$start,$end,0,true) as $row) if (empty($row['unit_id']) || (int)$row['unit_id']===$unit) throw new DomainException('These dates overlap an existing reservation or block.');
        $db->prepare('INSERT INTO mlt_fleet_blocks (unit_id,starts_on,ends_on,reason,created_by) VALUES (?,?,?,?,?)')->execute([$unit,$start,$end,$reason,$user['id']]);
    } elseif ($action==='unblock') {
        mlt_fleet_lock($db);
        $db->prepare('DELETE FROM mlt_fleet_blocks WHERE id=?')->execute([(int)($body['id']??0)]);
    } else throw new DomainException('Unknown fleet action.');
    $db->commit();echo json_encode(['ok'=>true]);
} catch (DomainException $e) {if($db->inTransaction())$db->rollBack();http_response_code(409);echo json_encode(['error'=>$e->getMessage()]);}
catch (Throwable $e) {if($db->inTransaction())$db->rollBack();error_log('MLT fleet: '.$e->getMessage());http_response_code(503);echo json_encode(['error'=>'Could not update availability. Please retry.']);}
