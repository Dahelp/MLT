<?php
declare(strict_types=1);

function mlt_fleet_model(): array {
    static $model;
    return $model ??= json_decode(file_get_contents(dirname(__DIR__).'/data/motorhomes.json'), true, 512, JSON_THROW_ON_ERROR);
}

function mlt_fleet_collection(string $collection): bool {
    return in_array(strtolower($collection), ['freedom','signature','concierge'], true);
}

function mlt_fleet_schema(PDO $db): void {
    $db->exec('CREATE TABLE IF NOT EXISTS mlt_fleet_units (id INT UNSIGNED PRIMARY KEY, model_id VARCHAR(80) NOT NULL, label VARCHAR(120) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    $db->exec('CREATE TABLE IF NOT EXISTS mlt_fleet_blocks (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, unit_id INT UNSIGNED NOT NULL, starts_on DATE NOT NULL, ends_on DATE NOT NULL, reason VARCHAR(240) NOT NULL, created_by BIGINT UNSIGNED NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX fleet_block_dates (unit_id,starts_on,ends_on)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    foreach (['motorhome_unit_id INT UNSIGNED NULL','motorhome_reserved_until DATETIME NULL','motorhome_json TEXT NULL','pickup_location VARCHAR(160) NULL','return_location VARCHAR(160) NULL'] as $column) {
        try { $db->exec('ALTER TABLE mlt_orders ADD COLUMN '.$column); }
        catch (PDOException $e) { if (($e->errorInfo[1] ?? 0) !== 1060) throw $e; }
    }
    $q=$db->prepare('INSERT IGNORE INTO mlt_fleet_units (id,model_id,label) VALUES (?,?,?)');
    foreach ([1,2] as $id) $q->execute([$id,'knaus-van-i-650-meg','KNAUS VAN I 650 MEG - Unit #'.$id]);
    // The shared payment hold is also used to protect vehicles during provider approval.
    $db->exec('CREATE TABLE IF NOT EXISTS mlt_journey_checkout_holds (order_id BIGINT UNSIGNED PRIMARY KEY, provider VARCHAR(24) NOT NULL, checkout_url TEXT NULL, checkout_id VARCHAR(160) NULL, expires_at DATETIME NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
}

function mlt_fleet_dates(string $start, string $end): void {
    foreach ([$start,$end] as $date) {
        $parsed=DateTimeImmutable::createFromFormat('!Y-m-d',$date);
        if (!$parsed || $parsed->format('Y-m-d')!==$date) throw new DomainException('Select valid rental dates.');
    }
    if ($start >= $end || (new DateTimeImmutable($start))->diff(new DateTimeImmutable($end))->days > 366) throw new DomainException('Select a rental period of 1–366 days.');
}

// Half-open intervals: return day is available for the next departure.
// Locking reads are essential: a transaction may already have a repeatable-read snapshot.
function mlt_fleet_busy(PDO $db, string $start, string $end, int $except=0, bool $lock=false): array {
    $suffix=$lock?' FOR UPDATE':'';
    $q=$db->prepare('SELECT unit_id,starts_on,ends_on FROM mlt_fleet_blocks WHERE starts_on < ? AND ends_on > ?'.$suffix);
    $q->execute([$end,$start]); $busy=$q->fetchAll();
    $q=$db->prepare('SELECT motorhome_unit_id AS unit_id,arrival_date AS starts_on,departure_date AS ends_on FROM mlt_orders o WHERE o.id<>? AND arrival_date < ? AND departure_date > ? AND collection_name IN ("freedom","signature","concierge") AND status<>"cancelled" AND (paid_amount>0 OR status IN ("confirmed","in_progress","paid","partially_paid","completed") OR motorhome_reserved_until>NOW() OR EXISTS (SELECT 1 FROM mlt_journey_checkout_holds h WHERE h.order_id=o.id))'.$suffix);
    $q->execute([$except,$end,$start]);
    // Unassigned legacy reservations block the pool until staff assigns a physical unit.
    return array_merge($busy,$q->fetchAll());
}

function mlt_fleet_lock(PDO $db): array {
    if (!$db->inTransaction()) throw new LogicException('Fleet changes require a transaction.');
    return $db->query('SELECT * FROM mlt_fleet_units ORDER BY id FOR UPDATE')->fetchAll();
}

function mlt_fleet_reserve(PDO $db, int $orderId, ?int $requestedUnit=null): void {
    $units=mlt_fleet_lock($db);
    $q=$db->prepare('SELECT * FROM mlt_orders WHERE id=? FOR UPDATE');$q->execute([$orderId]);$order=$q->fetch();
    if (!$order || !mlt_fleet_collection((string)$order['collection_name'])) {
        if ($requestedUnit!==null) throw new DomainException('Shared motorhome booking not found.');
        return;
    }
    if ($order['status']==='cancelled') throw new DomainException('This journey has been cancelled.');
    mlt_fleet_dates((string)$order['arrival_date'],(string)$order['departure_date']);
    $busy=mlt_fleet_busy($db,$order['arrival_date'],$order['departure_date'],$orderId,true);
    $preferred=$requestedUnit ?? (int)($order['motorhome_unit_id']??0);
    usort($units,fn($a,$b)=>(($a['id']==$preferred)?0:1)<=>(($b['id']==$preferred)?0:1));
    foreach ($units as $unit) {
        if ($requestedUnit!==null && (int)$unit['id']!==$requestedUnit) continue;
        if (array_filter($busy,fn($row)=>empty($row['unit_id']) ? $requestedUnit===null : (int)$row['unit_id']===(int)$unit['id'])) continue;
        $model=mlt_fleet_model();
        $q=$db->prepare('UPDATE mlt_orders SET motorhome_unit_id=?,motorhome_reserved_until=DATE_ADD(NOW(),INTERVAL 30 MINUTE),vehicle_name=?,motorhome_json=COALESCE(motorhome_json,?) WHERE id=?');
        $q->execute([$unit['id'],$model['name'],json_encode($model,JSON_THROW_ON_ERROR),$orderId]);
        return;
    }
    throw new DomainException('Sold out for these dates. Please choose different travel dates.');
}

function mlt_fleet_availability(PDO $db,string $start,string $end,int $days): array {
    mlt_fleet_dates($start,$end);
    if ($days<1 || $days>366) throw new DomainException('Invalid journey duration.');
    $units=$db->query('SELECT id FROM mlt_fleet_units ORDER BY id')->fetchAll(PDO::FETCH_COLUMN);
    $periodEnd=(new DateTimeImmutable($end))->modify('+'.$days.' days')->format('Y-m-d');
    $busy=mlt_fleet_busy($db,$start,$periodEnd);
    $dates=[];
    for ($date=new DateTimeImmutable($start);$date->format('Y-m-d')<$end;$date=$date->modify('+1 day')) {
        $a=$date->format('Y-m-d');$b=$date->modify('+'.$days.' days')->format('Y-m-d');
        $free=array_filter($units,fn($unit)=>!array_filter($busy,fn($row)=>$row['starts_on']<$b && $row['ends_on']>$a && (empty($row['unit_id']) || (int)$row['unit_id']===(int)$unit)));
        $dates[$a]=count($free)>0?'available':'sold_out';
    }
    return $dates;
}
