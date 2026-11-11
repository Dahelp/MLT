import assert from 'node:assert/strict';
import test from 'node:test';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,cp,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {createServer} from 'node:net';
const php=process.env.PHP_BINARY||'php';
const fixture=new URL('./journey-integration.php',import.meta.url);
const run=(...args)=>JSON.parse(execFileSync(php,[fileURLToPath(fixture),...args],{encoding:'utf8',env:process.env}));
test('client booking, persisted terms, ownership, CMS protection, Tailored approval, Private stages and checkout locks',{skip:!process.env.MLT_PRICING_TEST_DSN},async()=>{
 const settings=run('setup');
 const dir=await mkdtemp(path.join(tmpdir(),'mlt-pricing-'));
 await cp(new URL('../public/api/',import.meta.url),path.join(dir,'api'),{recursive:true,filter:src=>!src.endsWith("paypal-config.php")});
 await mkdir(path.join(dir,'data'));
 await cp(new URL('../public/data/motorhomes.json',import.meta.url),path.join(dir,'data/motorhomes.json'));
 await cp(new URL('../public/data/journey-pricing.json',import.meta.url),path.join(dir,'data/journey-pricing.json'));
 await cp(new URL('../public/data/private-exclusive-requests.json',import.meta.url),path.join(dir,'data/private-exclusive-requests.json'));
 await writeFile(path.join(dir,'paypal-config.php'),`<?php return ${JSON.stringify(settings).replace(/"([^"\\]+)":/g,"'$1'=>").replaceAll('{','[').replaceAll('}',']')};`);
 const port=await new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p))});});
 const server=spawn(php,['-S',`127.0.0.1:${port}`,'-t',dir],{stdio:['ignore','ignore','pipe']});let log='';server.stderr.on('data',d=>log+=d);
 const api=async(action,body={},role='agency',endpoint='account.php')=>{
  const r=await fetch(`http://127.0.0.1:${port}/api/${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer pricing-test-${role}`},body:JSON.stringify({action,...body})});const raw=await r.text();try{return {status:r.status,...JSON.parse(raw)}}catch{throw Error(raw+log)}
 };
 const admin=(action,body={})=>api(action,body,'admin','concierge-account.php');
 let rentalIndex=0;
 const create=async(collection,extra={})=>{const start=new Date(Date.UTC(2027,7,15+31*rentalIndex++));const end=new Date(start);end.setUTCDate(end.getUTCDate()+7);const r=await api('create_application',{collection,days:7,guests:2,arrival:start.toISOString().slice(0,10),departure:end.toISOString().slice(0,10),confirmationId:randomUUID(),...extra});assert.equal(r.status,200,JSON.stringify(r)+log);return r.reference;};
 const order=async ref=>(await api('orders')).orders.find(o=>o.reference_code===ref);
 try{
  for(let i=0;i<40;i++){try{await api('orders');break;}catch{await new Promise(r=>setTimeout(r,100));}}
  assert.equal((await api('journey_settings',{},'agency','concierge-account.php')).status,403);
  assert.equal((await admin('journey_settings_save',{enabled:true,percent:9,terms:'Test'})).status,409);
  assert.equal((await admin('journey_settings_save',{enabled:true,percent:5,terms:''})).status,409);
  const freedom=await create('freedom',{freedomPlus:true,price:1});
  assert.equal(Number((await order(freedom)).total_amount),1790);
  assert.equal(run('quote',freedom).amount,358);
  assert.equal((await api('journey_protection',{reference:freedom,enabled:true},'traveller')).status,409);
  for(const percent of [5,5.5,8]){
   assert.equal((await admin('journey_settings_save',{enabled:true,percent,terms:'TEST ONLY — approved protection terms'})).status,200);
   const r=await api('journey_protection',{reference:freedom,enabled:true});assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.terms.total,Math.round(1790*(1+percent/100)*100)/100);
  }
  run('hold',freedom);
  assert.equal((await api('journey_protection',{reference:freedom,enabled:false})).status,409);
  run('release',freedom);
  assert.equal((await api('journey_protection',{reference:freedom,enabled:false})).status,200);
  run('pay',freedom);
  assert.equal((await api('journey_protection',{reference:freedom,enabled:true})).status,409);
  const tailored=await create('signature',{signatureTailored:true});
  assert.equal(run('quote',tailored).amount,500);
  assert.equal((await admin('journey_terms_update',{reference:tailored,planningFee:1000,routeApproved:false})).status,200);
  assert.equal(run('quote',tailored).amount,1000);run('pay',tailored);assert.equal(run('quote',tailored),null);
  assert.equal((await admin('journey_terms_update',{reference:tailored,planningFee:999,routeApproved:true})).status,409);
  assert.equal((await admin('journey_terms_update',{reference:tailored,planningFee:1000,routeApproved:true})).status,200);
  assert.equal(run('quote',tailored).amount,747);run('pay',tailored);assert.equal(run('quote',tailored).amount,1743);
  const privateRef=await create('private');assert.equal(run('quote',privateRef),null);
  assert.equal((await admin('journey_terms_update',{reference:privateRef,contractSigned:true})).status,200);
  for(const amount of [3980,5970,9950]){assert.equal(run('quote',privateRef).amount,amount);run('pay',privateRef);}
  assert.equal(run('quote',privateRef),null);assert.equal((await order(privateRef)).status,'paid');
  // Private requests are preferences until an authenticated operator saves a complete quote.
  const requested=['helicopter-flight','michelin-chef-dinner','como-yacht-experience'];
  const exclusive=await create('private',{exclusiveRequests:requested,price:1,extrasAmount:999});
  let saved=await order(exclusive);
  assert.equal(Number(saved.total_amount),19900);
  assert.deepEqual(JSON.parse(saved.exclusive_requests_json).map(item=>item.price),[null,null,null]);
  const prices=requested.map((id,i)=>({id,price:[1200.50,0,799.50][i]}));
  assert.equal((await api('exclusive_requests_quote',{reference:exclusive,items:prices})).status,403);
  assert.equal((await admin('exclusive_requests_quote',{reference:exclusive,items:prices.slice(1)})).status,409);
  for(const price of [-1,'',null,'1.001','NaN','1e3',100001]){
   assert.equal((await admin('exclusive_requests_quote',{reference:exclusive,items:prices.map((item,i)=>i?item:{...item,price})})).status,409);
  }
  assert.equal((await admin('exclusive_requests_quote',{reference:exclusive,items:prices.map(item=>({...item,id:'ferrari-rental'}))})).status,409);
  run('hold',exclusive);
  assert.equal((await admin('exclusive_requests_quote',{reference:exclusive,items:prices})).status,409);
  run('release',exclusive);
  const quoted=await api('exclusive_requests_quote',{reference:exclusive,items:prices},'concierge','concierge-account.php');
  assert.equal(quoted.status,200,JSON.stringify(quoted));assert.equal(quoted.total,21900);
  const requoted=await admin('exclusive_requests_quote',{reference:exclusive,items:prices});
  assert.equal(requoted.status,200);assert.equal(requoted.total,21900,'Saving the same prices again must not add them twice');
  saved=await order(exclusive);assert.deepEqual(JSON.parse(saved.exclusive_requests_json).map(item=>item.price),[1200.5,0,799.5]);
  assert.equal(JSON.parse(saved.journey_terms_json).total,21900);
  assert.equal(JSON.parse(saved.journey_terms_json).base,19900);
  assert.equal(Number(saved.extras_amount),2000);
  assert.equal((await admin('journey_update',{reference:exclusive,route:['Test route'],points:[],services:[],conciergeNote:'Test only'})).status,200);
  assert.deepEqual(JSON.parse((await order(exclusive)).exclusive_requests_json),JSON.parse(saved.exclusive_requests_json));
  assert.equal(Number((await order(exclusive)).total_amount),21900);
  assert.equal((await admin('journey_terms_update',{reference:exclusive,contractSigned:true})).status,200);
  for(const amount of [3980,5970,11950]){assert.equal(run('quote',exclusive).amount,amount);run('pay',exclusive);}
  assert.equal((await admin('exclusive_requests_quote',{reference:exclusive,items:prices})).status,409);
  const invalidExclusive=await api('create_application',{collection:'private',days:7,guests:2,exclusiveRequests:['invented-option'],confirmationId:randomUUID()});
  assert.equal(invalidExclusive.status,400);
  const noExclusive=await order(await create('private',{exclusiveRequests:[]}));assert.equal(Number(noExclusive.total_amount),19900);
  assert.equal(noExclusive.exclusive_requests_json,null);
  const ordinary=await order(await create('freedom',{exclusiveRequests:requested}));assert.equal(ordinary.exclusive_requests_json,null);
  const invalid=await api('create_application',{collection:'private',days:30,guests:2,confirmationId:randomUUID()});assert.equal(invalid.status,400);
  const preview=await admin('journey_cancellation_preview',{reference:tailored,cancellationDate:'2027-04-01',costs:100});assert.equal(preview.status,200);assert.equal(preview.result.refund,647);
 }finally{server.kill();}
});
