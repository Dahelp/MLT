import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('sales inquiries use a separate chat, other departments and unconfigured sales keep the existing destination',()=>{
 const file=fileURLToPath(new URL('../public/api/telegram-routing.php',import.meta.url));
 const php=`require $argv[1]; putenv('TELEGRAM_CHAT_ID=common-env'); putenv('TELEGRAM_SALES_CHAT_ID=sales-env');
 $both=['telegram_chat_id'=>'common','telegram_sales_chat_id'=>'sales'];
 echo json_encode([
 mlt_inquiry_telegram_chat($both,'listing_ID_1'),mlt_inquiry_telegram_chat($both,'acquisitions'),
 mlt_inquiry_telegram_chat($both,'investments'),mlt_inquiry_telegram_chat($both,'concierge'),
 mlt_inquiry_telegram_chat($both,'listing_ID_1bad'),
 mlt_inquiry_telegram_chat(['telegram_chat_id'=>'common','telegram_sales_chat_id'=>'  '],'listing_ID_1'),
 mlt_inquiry_telegram_chat([],'listing_ID_1'),mlt_inquiry_telegram_chat([],'concierge')]);`;
 assert.deepEqual(JSON.parse(execFileSync('php',['-r',php,file],{encoding:'utf8'})),['sales','sales','common','common','common','common','sales-env','common-env']);
});
