import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,cp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {operationsDestination,adminReturnRequired} from '../content/operations-access.ts';
import {operationsNavigation} from '../content/operations-navigation.ts';

test('marketers enter only their own workspace and administrators can inspect it',()=>{
 for(const next of ['/admin/users/','/sales/','/admin/vouchers/','/marketing-evil/','//evil.test/','/marketing/?email=x'])assert.equal(operationsDestination('marketer',next),'/marketing/');
 assert.equal(operationsDestination('marketer','/marketing/?days=90'),'/marketing/?days=90');
 assert.equal(operationsDestination('admin','/marketing/'),'/marketing/');
 assert.equal(adminReturnRequired('admin','/marketing/'),true);
 assert.equal(adminReturnRequired('marketer','/marketing/'),false);
 for(const locale of ['en','de','ru'])assert.deepEqual(operationsNavigation('marketing',locale).map(x=>x.href),['/marketing/']);
});

test('marketing API authorizes on the server, aggregates real records and suppresses sensitive cohorts',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'mlt-marketing-test-'));
 for(const name of ['marketing.php','marketing-core.php','security.php'])await cp(new URL('../public/api/'+name,import.meta.url),path.join(dir,name));
 await cp(new URL('./marketing-test-database.php',import.meta.url),path.join(dir,'booking.php'));
 const port=await new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p))})});
 const server=spawn(process.env.PHP_BINARY||'php',['-S',`127.0.0.1:${port}`,'-t',dir],{stdio:['ignore','ignore','pipe']});
 let log='';server.stderr.on('data',chunk=>log+=chunk);
 const call=async(body={action:'overview',days:30},role='marketer',method='POST')=>{
  const r=await fetch(`http://127.0.0.1:${port}/marketing.php`,{method,headers:{'Content-Type':'application/json',...(role?{Authorization:'Bearer test-'+role}:{})},...(method==='POST'?{body:JSON.stringify(body)}:{})});
  const raw=await r.text();try{return {status:r.status,data:JSON.parse(raw),cache:r.headers.get('cache-control')}}catch{throw Error(raw+log)}
 };
 try{
  for(let i=0;i<50;i++){try{await call();break}catch{await new Promise(r=>setTimeout(r,100))}}
  assert.equal((await call({},'')).status,401);
  assert.equal((await call({},'expired')).status,401);
  for(const role of ['manager','salesmanager','concierge','traveller','agency'])assert.equal((await call({action:'overview',days:30},role)).status,403);
  assert.equal((await call(undefined,'admin')).status,200);
  assert.equal((await call(undefined,'marketer','GET')).status,405);
  for(const body of [{action:'save',days:30},{action:'overview',days:1},{action:'overview',days:'30'},{action:'overview',days:30,role:'admin'},{action:'overview',days:30,start:'2026-01-01'},{action:'overview',days:30,groupBy:'email'}])assert.equal((await call(body)).status,400);
  for(const days of [30,90,365]){
   const {status,data,cache}=await call({action:'overview',days});assert.equal(status,200);assert.match(cache,/no-store/);
   assert.equal(data.journeys.total,10);assert.equal(data.journeys.paid,5);assert.equal(data.journeys.conversion,50);assert.equal(data.journeys.averageDays,10.5);
   assert.deepEqual(data.receipts.rows,[{currency:'EUR',amount:500}],'Voucher credit is excluded from cash receipts');
   assert.equal(data.vouchers.units,10);assert.equal(data.vouchers.cashCents,100000);
   assert.equal(data.inquiries.rows.find(x=>x.key==='acquisitions').count,5);
   assert.equal(data.registrations.rows[0].count,5,'Staff accounts do not count as customer registrations');
   assert.doesNotMatch(JSON.stringify(data),/PRIVATE_|customer_email|session_hash|reference_code|notes|listing_ID|payment_id/);
  }
  await writeFile(path.join(dir,'missing'),'yes');assert.equal((await call()).data.scout.state,'unavailable');
  await writeFile(path.join(dir,'small'),'yes');const small=(await call()).data;
  assert.equal(small.journeys.total,null);assert.equal(small.journeys.paid,null);assert.equal(small.journeys.conversion,null);assert.equal(small.journeys.averageDays,null);
  assert.deepEqual(small.journeys.collections,{state:'suppressed',rows:[]});assert.equal(small.receipts.state,'suppressed');assert.equal(small.vouchers.state,'suppressed');
  await writeFile(path.join(dir,'broken'),'yes');assert.equal((await call()).status,500,'A database failure must not become a zero or empty report');
 }finally{server.kill();await new Promise(resolve=>server.once('exit',resolve));assert.equal(path.dirname(path.resolve(dir)),path.resolve(tmpdir()));assert.ok(path.basename(dir).startsWith('mlt-marketing-test-'));await rm(dir,{recursive:true,force:true})}
});
