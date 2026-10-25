import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import ts from 'typescript';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
function php(code){return JSON.parse(execFileSync(process.env.PHP_BINARY||'php',['-r',`require 'public/api/journey-terms.php'; ${code}`],{cwd:root,encoding:'utf8'}));}
const expected={freedom:{7:1490,10:1990,14:2590,21:3690,30:4990},freedom_plus:{7:1790,10:2340,14:3040,21:4190,30:5490},signature:{7:2490,10:4290,14:5890},signature_tailored:{7:2490,10:4290,14:5890},concierge:{7:4990,10:6590,14:8990},private:{7:19900,10:28490,14:39800,21:59700}};
test('all 23 approved package prices, six variants, guarantees and advances',()=>{
 const rows=php(`$out=[];foreach(${JSON.stringify(Object.keys(expected)).replaceAll('[','[').replaceAll(']',']')} as $id){foreach([7,10,14,21,30] as $d){try{$out[]=mlt_journey_terms(['collection'=>$id,'days'=>$d]);}catch(DomainException $e){}}}echo json_encode($out);`);
 assert.equal(rows.length,23);
 for(const row of rows){assert.ok(Object.values(expected[row.variant]).includes(row.base));assert.equal(row.planningFee,row.variant==='signature_tailored'?500:0);assert.equal(row.total,row.base+row.planningFee);assert.equal(row.policy.advance,row.variant==='signature_tailored'?30:20);assert.equal(row.policy.security,row.variant==='private'?3000:row.variant==='concierge'?2000:1500);}
 assert.deepEqual(php(`echo json_encode(mlt_journey_terms(['collection'=>'private','days'=>10]));`).base,28490);
});
test('PHP and client follow identical cumulative milestones, including partial payments and final cents',()=>{
 const filename=path.join(root,'content/journey-terms.ts');const module={exports:{}};
 const source=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports',source)(()=>JSON.parse(fs.readFileSync(path.join(root,'public/data/journey-pricing.json'),'utf8')),module,module.exports);
 for(const [id,amount] of [['freedom',1490],['private',19900],['signature_tailored',2490]]){
  const terms=php(`$t=mlt_journey_terms(['collection'=>'${id}','days'=>7]);$t['routeApproved']=true;$t['contractSigned']=true;echo json_encode($t);`);
  for(const paid of [0,100,298,500,997,1490,5000,9950,terms.total]){
   const due=php(`echo json_encode(mlt_journey_next_payment(json_decode('${JSON.stringify(terms)}',true),${paid}));`);
   assert.equal(module.exports.nextJourneyPayment(terms,paid),due,`${id}: paid ${paid}`);
   assert.ok(due<=Math.max(0,terms.total-paid));
  }
 }
 assert.deepEqual(php(`$t=mlt_journey_terms(['collection'=>'private','days'=>7]);$a=mlt_journey_next_payment($t,0);$t['contractSigned']=true;echo json_encode([$a,mlt_journey_next_payment($t,0),mlt_journey_next_payment($t,3980),mlt_journey_next_payment($t,9950)]);`),[0,3980,5970,9950]);
 assert.deepEqual(php(`$t=mlt_journey_terms(['collection'=>'signature_tailored','days'=>7]);$a=[mlt_journey_next_payment($t,0),mlt_journey_next_payment($t,500)];$t['routeApproved']=true;echo json_encode([...$a,mlt_journey_next_payment($t,500),mlt_journey_next_payment($t,1247)]);`),[500,0,747,1743]);
});
test('protection 5/8%, untrusted rates and unavailable options',()=>{
 for(const percent of [5,5.5,8]){
  const t=php(`echo json_encode(mlt_journey_terms(['collection'=>'freedom','days'=>7,'flexibleProtection'=>true,'price'=>1,'protectionPercent'=>99],['enabled'=>true,'percent'=>${percent},'terms'=>'Approved test terms']));`);
  assert.equal(t.protectionAmount,Math.round(1490*percent)/100);assert.equal(t.total,1490+t.protectionAmount);assert.equal(t.policy.security,1500);
 }
 assert.equal(php(`try{mlt_journey_terms(['collection'=>'freedom','days'=>7,'flexibleProtection'=>true]);echo 'false';}catch(DomainException $e){echo 'true';}`),true);
 assert.equal(php(`try{mlt_journey_terms(['collection'=>'private','days'=>30]);echo 'false';}catch(DomainException $e){echo 'true';}`),true);
});
test('cancellation favourable boundary days, fixed administrative charge, planning retention and actual expenses',()=>{
 assert.deepEqual(php(`$t=mlt_journey_terms(['collection'=>'freedom','days'=>7]);$a=[];foreach([61,60,31,30,16,15,14,0] as $d)$a[]=mlt_journey_cancellation($t,$d,298)['refund'];echo json_encode($a);`),[198,149,149,149,89.4,89.4,0,0]);
 assert.equal(php(`$t=mlt_journey_terms(['collection'=>'signature','days'=>7]);echo json_encode(mlt_journey_cancellation($t,100,498));`).refund,348.6);
 assert.equal(php(`$t=mlt_journey_terms(['collection'=>'signature_tailored','days'=>7]);echo json_encode(mlt_journey_cancellation($t,121,1247,100));`).refund,647);
 assert.equal(php(`$t=mlt_journey_terms(['collection'=>'freedom_plus','days'=>7]);echo json_encode(mlt_journey_cancellation($t,91,358));`).manualReview,true);
});

test('extra guests belong to the tour advance; protection uses the fixed package price and does not inflate retention',()=>{
 const result=php(`$t=mlt_journey_terms(['collection'=>'freedom','days'=>7,'guests'=>3,'flexibleProtection'=>true],['enabled'=>true,'percent'=>5.5,'terms'=>'Approved test terms']);$next=mlt_journey_next_payment($t,0);$t['protectionPercent']=0;echo json_encode(['base'=>$t['base'],'tour'=>$t['tourTotal'],'protection'=>$t['protectionAmount'],'advance'=>$next,'refund'=>mlt_journey_cancellation($t,30,$next)['refund']]);`);
 assert.deepEqual(result,{base:1490,tour:1680,protection:81.95,advance:336,refund:168});
});
