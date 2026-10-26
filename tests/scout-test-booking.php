<?php
/** Isolated local database. No production configuration is loaded. */
declare(strict_types=1);
class ScoutTestDatabase extends PDO {
    function __construct() {
        parent::__construct('sqlite:'.__DIR__.'/scout-test.sqlite');
        $this->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
        $this->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE,PDO::FETCH_ASSOC);
        $this->sqliteCreateFunction('NOW',fn()=>gmdate('Y-m-d H:i:s'));
        parent::exec('CREATE TABLE IF NOT EXISTS mlt_users (id INTEGER PRIMARY KEY,role TEXT,session_hash TEXT,session_expires_at TEXT)');
        parent::exec('CREATE TABLE IF NOT EXISTS mlt_scout_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT,reference_code TEXT UNIQUE,request_id TEXT UNIQUE,last_request_id TEXT,edit_token_hash TEXT,scout_name TEXT,category TEXT,title TEXT,country_name TEXT,latitude NUMERIC,longitude NUMERIC,description TEXT,parking TEXT,booking TEXT,photos_json TEXT,status TEXT DEFAULT "pending",review_note TEXT,reviewed_by INTEGER,published_point_id INTEGER UNIQUE,version INTEGER DEFAULT 1,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP)');
        parent::exec('CREATE TABLE IF NOT EXISTS mlt_route_points (id INTEGER PRIMARY KEY AUTOINCREMENT,slug TEXT UNIQUE,title TEXT,country_name TEXT,latitude NUMERIC,longitude NUMERIC,description TEXT,image_path TEXT,is_active INTEGER DEFAULT 1,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP)');
        if(!(int)$this->query('SELECT COUNT(*) FROM mlt_users')->fetchColumn()) {
            $q=parent::prepare('INSERT INTO mlt_users VALUES (?,?,?,?)');
            foreach(['admin','concierge','manager','salesmanager','traveller'] as $index=>$role)$q->execute([$index+1,$role,hash('sha256','test-'.$role.'-token'),'2099-01-01']);
        }
    }
    public function exec(string $sql):int|false { if(str_starts_with($sql,'CREATE TABLE IF NOT EXISTS'))return 0; return parent::exec($sql); }
    public function prepare(string $sql,array $options=[]):PDOStatement|false { return parent::prepare(str_replace(' FOR UPDATE','',$sql),$options); }
}
function mlt_settings():array { return []; }
function mlt_db(array $settings):PDO { return new ScoutTestDatabase(); }
