import assert from 'node:assert/strict';
import test from 'node:test';
import {spawn} from 'node:child_process';
import {mkdtemp,cp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:net';
const php=process.env.PHP_BINARY||'php';
function run(...args){return new Promise((resolve,reject)=>{const child=spawn(php,[fileURLToPath(new URL('./voucher-integration.php',import.meta.url)),...args],{env:process.env});let out='',err='';child.stdout.on('data',d=>out+=d);child.stderr.on('data',d=>err+=d);child.on('error',reject);child.on('exit',code=>code===0?resolve(out):reject(Error(out+err)))})}
test('real MySQL voucher money, ownership, inventory, multi-quantity purchases, API permissions and concurrent redemption',{skip:!process.env.MLT_VOUCHER_TEST_DSN},async()=>{
 assert.match(await run('test-shared-stock'),/Shared denomination integration checks passed/);
 assert.match(await run('test'),/integration checks passed/);
 await run('prepare-concurrency');
 const results=await Promise.all([run('reserve','1','3'),run('reserve','6','3','2')]);
 assert.equal(results.map(JSON.parse).filter(r=>r.ok).length,1,'Only one parallel purchase may reserve the last four available slots');
 const spends=await Promise.all([run('redeem','1','concurrent-apply-00001'),run('redeem','2','concurrent-apply-00002')]);
 assert.equal(spends.map(JSON.parse).filter(r=>r.ok).length,1,'Parallel vouchers cannot overpay the same journey');
 const summary=JSON.parse(await run('summary'));assert.equal(Number(summary.concurrentPaid),1000);
 const dir=await mkdtemp(path.join(tmpdir(),'mlt-vouchers-test-'));const apiDir=path.join(dir,'api');
 await cp(new URL('../public/api/',import.meta.url),apiDir,{recursive:true,filter:src=>!src.endsWith('paypal-config.php')});
 const dsn=process.env.MLT_VOUCHER_TEST_DSN;const port=Number(dsn.match(/port=(\d+)/)[1]);
 // This fixture contains test connection details only, never production settings.
 const settings=`<?php return ${JSON.stringify({database:{host:`127.0.0.1;port=${port}`,name:'mlt_vouchers_test',user:process.env.MLT_VOUCHER_TEST_USER||'root',password:process.env.MLT_VOUCHER_TEST_PASSWORD||''}})};`;
 const config=settings.replace(/"([^"\\]+)":/g,"'$1'=>").replaceAll('{','[').replaceAll('}',']');await writeFile(path.join(dir,'paypal-config.php'),config);
 const serverPort=await new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const port=s.address().port;s.close(()=>resolve(port))})});
 const server=spawn(php,['-S',`127.0.0.1:${serverPort}`,'-t',dir],{stdio:['ignore','ignore','pipe']});let log='';server.stderr.on('data',d=>log+=d);
 const request=async(action,body={},role='traveller',endpoint='vouchers.php')=>{const response=await fetch(`http://127.0.0.1:${serverPort}/api/${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json',...(role?{Authorization:`Bearer voucher-test-${role}`}:{})},body:JSON.stringify({action,...body})});const raw=await response.text();try{return {status:response.status,data:JSON.parse(raw)}}catch{throw Error(raw+log)}};
 try{
  for(let i=0;i<80;i++){try{await request('catalog');break}catch{await new Promise(r=>setTimeout(r,100))}}
  assert.equal((await request('mine',{},null)).status,401);
  assert.equal((await request('status',{reference:'MLT-CONCURRENT'},'traveller','journey-checkout.php')).status,200);
  assert.equal((await request('status',{reference:'MLT-OTHER'},'traveller','journey-checkout.php')).status,409);
  for(const role of ['traveller','agency','manager','concierge','salesmanager'])assert.equal((await request('admin',{},role)).status,403);
  assert.equal((await request('admin',{},'admin')).status,200);
  assert.equal((await request('permissions',{role:'manager',view:true,manage:false},'admin')).status,200);
  assert.equal((await request('admin',{},'manager')).status,200);
  assert.equal((await request('set_status',{voucherId:1,status:'blocked',reason:'Read only access'},'manager')).status,403);
  assert.equal((await request('permissions',{role:'concierge',view:true,manage:true},'manager')).status,403);
  const campaign={id:1,title:'Test edition',faceCents:500000,priceCents:400000,quantity:50,active:true};
  assert.equal((await request('save_campaign',campaign,'admin')).status,200);
  assert.equal((await request('save_stock',{quantity:1},'admin')).status,409);
  assert.equal((await request('save_stock',{quantity:50},'admin')).status,200);
  const catalog=await request('catalog');assert.equal(catalog.data.stock.quantity,50);assert.equal(catalog.data.campaigns.length,2);
  const admin=await request('admin',{},'admin');assert.equal(admin.data.analytics[0].sold,3);assert.equal(admin.data.stock.sold,3);
  assert.equal((await request('save_stock',{quantity:50},'manager')).status,403);
  assert.equal((await request('save_stock',{quantity:51},'admin')).status,400);
  assert.equal((await request('save_campaign',{...campaign,priceCents:600000},'admin')).status,400);
  const mine=await request('mine');assert.equal(mine.data.vouchers.length,3);
  const other=await request('mine',{},'agency');assert.equal(other.data.vouchers.length,0);
  assert.equal((await request('set_status',{voucherId:1,status:'blocked',reason:'Security review'},'admin')).status,200);
  assert.equal((await request('set_status',{voucherId:1,status:'active',reason:'Review complete'},'admin')).status,200);
  assert.equal((await request('restore',{reference:'MLT-FIRST',reason:'Journey cancelled'},'admin')).status,409,'Cannot reverse active journey');
  await run('cancel-first');
  const restored=await request('restore',{reference:'MLT-FIRST',reason:'Journey cancellation approved'},'admin');assert.equal(restored.status,200);assert.equal(restored.data.restored_cents,320000);
  assert.equal((await request('restore',{reference:'MLT-FIRST',reason:'Repeated cancellation request'},'admin')).data.restored_cents,0);
  assert.equal((await request('checkout',{campaignId:1,quantity:3,provider:'stripe',consent:false})).status,400);
 }finally{server.kill();await new Promise(r=>server.once('exit',r));assert.equal(path.dirname(path.resolve(dir)),path.resolve(tmpdir()));assert.ok(path.basename(dir).startsWith('mlt-vouchers-test-'));await rm(dir,{recursive:true,force:true})}
});
