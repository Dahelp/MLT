import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {mkdtempSync,copyFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';

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

test('deployment destination supplies sales routing while explicit server settings retain priority',()=>{
 const prefix=path.join(tmpdir(),'mlt-telegram-routing-');
 const dir=mkdtempSync(prefix);
 try{
  const helper=path.join(dir,'telegram-routing.php'),generated=path.join(dir,'telegram-sales-destination.php');
  copyFileSync(fileURLToPath(new URL('../public/api/telegram-routing.php',import.meta.url)),helper);
  const generator=fileURLToPath(new URL('../scripts/prepare-telegram-routing.mjs',import.meta.url));
  execFileSync(process.execPath,[generator,generated],{env:{...process.env,MLT_TELEGRAM_SALES_CHAT_ID:'-123456'}});
  const php=`require $argv[1]; putenv('TELEGRAM_CHAT_ID=common'); putenv('TELEGRAM_SALES_CHAT_ID');
  $actual=[mlt_inquiry_telegram_chat([],'listing_ID_1'),mlt_inquiry_telegram_chat([],'acquisitions'),mlt_inquiry_telegram_chat([],'concierge'),mlt_inquiry_telegram_chat(['telegram_sales_chat_id'=>'explicit'],'listing_ID_1')];
  putenv('TELEGRAM_SALES_CHAT_ID=environment');$actual[]=mlt_inquiry_telegram_chat([],'listing_ID_1');echo json_encode($actual);`;
  assert.deepEqual(JSON.parse(execFileSync('php',['-r',php,helper],{encoding:'utf8'})),['-123456','-123456','common','explicit','environment']);
  const before=readFileSync(generated,'utf8');
  assert.throws(()=>execFileSync(process.execPath,[generator,generated],{env:{...process.env,MLT_TELEGRAM_SALES_CHAT_ID:'1; arbitrary_php()'},stdio:'pipe'}));
  assert.equal(readFileSync(generated,'utf8'),before);
 }finally{
  if(!path.resolve(dir).startsWith(path.resolve(prefix)))throw new Error('Unsafe test cleanup path');
  rmSync(dir,{recursive:true,force:true});
 }
});
