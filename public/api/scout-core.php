<?php
declare(strict_types=1);

function mlt_scout_schema(PDO $db): void {
    $db->exec('CREATE TABLE IF NOT EXISTS mlt_scout_submissions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        reference_code VARCHAR(32) NOT NULL UNIQUE,
        request_id VARCHAR(36) NOT NULL UNIQUE,
        last_request_id VARCHAR(36) NOT NULL,
        edit_token_hash CHAR(64) NOT NULL,
        scout_name VARCHAR(120) NOT NULL,
        category VARCHAR(24) NOT NULL,
        title VARCHAR(180) NOT NULL,
        country_name VARCHAR(100) NOT NULL,
        latitude DECIMAL(10,7) NOT NULL,
        longitude DECIMAL(10,7) NOT NULL,
        description TEXT NOT NULL,
        parking VARCHAR(500) NOT NULL,
        booking VARCHAR(500) NOT NULL,
        photos_json TEXT NOT NULL,
        status VARCHAR(24) NOT NULL DEFAULT "pending",
        review_note TEXT NULL,
        reviewed_by BIGINT UNSIGNED NULL,
        published_point_id BIGINT UNSIGNED NULL UNIQUE,
        version INT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX scout_status_created (status,created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    $db->exec('CREATE TABLE IF NOT EXISTS mlt_route_points (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, slug VARCHAR(100) NOT NULL UNIQUE, title VARCHAR(180) NOT NULL, country_name VARCHAR(100) NULL, latitude DECIMAL(10,7) NULL, longitude DECIMAL(10,7) NULL, description TEXT NULL, image_path VARCHAR(255) NULL, is_active TINYINT(1) NOT NULL DEFAULT 1, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
}

function mlt_scout_card(array $row): array {
    return [
        'id'=>(int)$row['id'], 'reference'=>$row['reference_code'], 'scoutName'=>$row['scout_name'],
        'category'=>$row['category'], 'title'=>$row['title'], 'country'=>$row['country_name'],
        'latitude'=>(string)$row['latitude'], 'longitude'=>(string)$row['longitude'],
        'description'=>$row['description'], 'parking'=>$row['parking'], 'booking'=>$row['booking'],
        'photos'=>json_decode($row['photos_json'],true) ?: [], 'status'=>$row['status'],
        'reviewNote'=>$row['review_note'] ?? '', 'version'=>(int)$row['version'],
        'publishedPointId'=>isset($row['published_point_id']) ? (int)$row['published_point_id'] : null,
        'isPublished'=>!empty($row['map_active']) && $row['status']==='accepted',
        'createdAt'=>$row['created_at'], 'updatedAt'=>$row['updated_at'],
    ];
}

function mlt_scout_text(array $body, string $key, int $maximum, bool $required = false): string {
    $value = $body[$key] ?? '';
    if (!is_string($value)) mlt_security_error(400, 'Проверьте текстовые поля.');
    $value = trim($value);
    if (($required && $value === '') || mb_strlen($value) > $maximum) mlt_security_error(400, 'Заполните обязательные поля и проверьте длину текста.');
    return $value;
}

function mlt_scout_fields(array $body): array {
    $category = mlt_scout_text($body,'category',24,true);
    if (!in_array($category,['gourmet','stay','sight','experience'],true)) mlt_security_error(400,'Выберите категорию места.');
    $coordinates = [];
    foreach (['latitude'=>90,'longitude'=>180] as $key=>$limit) {
        $value = $body[$key] ?? null;
        if ((!is_string($value) && !is_int($value) && !is_float($value)) || !is_numeric($value) || !is_finite((float)$value) || abs((float)$value) > $limit) mlt_security_error(400,'Проверьте широту и долготу.');
        $coordinates[] = round((float)$value,7);
    }
    return [mlt_scout_text($body,'scoutName',120,true), $category, mlt_scout_text($body,'title',180,true), mlt_scout_text($body,'country',100,true), ...$coordinates, mlt_scout_text($body,'description',3000,true), mlt_scout_text($body,'parking',500), mlt_scout_text($body,'booking',500)];
}

/** Validate every image before writing any files. Retained paths must belong to this card. */
function mlt_scout_photos(mixed $input, array $retained): array {
    if (!is_array($input) || count($input)<2 || count($input)>4) mlt_security_error(400,'Добавьте от 2 до 4 фотографий.');
    $photos = [];
    foreach ($input as $value) {
        if (!is_string($value)) mlt_security_error(400,'Некорректная фотография.');
        if (in_array($value,$retained,true)) { $photos[]=['path'=>$value]; continue; }
        if (!preg_match('#^data:image/(jpeg|webp);base64,([A-Za-z0-9+/=]+)$#D',$value,$match)) mlt_security_error(400,'Поддерживаются фотографии JPEG и WebP.');
        $bytes=base64_decode($match[2],true);
        if ($bytes===false || strlen($bytes)>1500000) mlt_security_error(400,'Каждая фотография должна быть не больше 1,5 МБ.');
        $mime=(new finfo(FILEINFO_MIME_TYPE))->buffer($bytes);
        $size=@getimagesizefromstring($bytes);
        if (!$size || !in_array($mime,['image/jpeg','image/webp'],true) || ($size['mime']??'')!==$mime || $size[0]<300 || $size[1]>2400 || $size[0]*4!==$size[1]*3) mlt_security_error(400,'Фотографии должны быть вертикальными, в формате 3:4.');
        $photos[]=['bytes'=>$bytes,'extension'=>$mime==='image/jpeg'?'jpg':'webp'];
    }
    return $photos;
}

function mlt_scout_find(PDO $db, string $reference, bool $lock = false): ?array {
    $query=$db->prepare('SELECT s.*,(SELECT is_active FROM mlt_route_points WHERE id=s.published_point_id) AS map_active FROM mlt_scout_submissions s WHERE reference_code=? LIMIT 1'.($lock?' FOR UPDATE':''));
    $query->execute([$reference]);
    return $query->fetch() ?: null;
}

function mlt_scout_authorize(?array $row, string $key): void {
    if (!$row || !preg_match('/^[a-f0-9]{64}$/D',$key) || !hash_equals($row['edit_token_hash'],hash('sha256',$key))) mlt_security_error(404,'Карточка не найдена. Проверьте персональную ссылку.');
}
