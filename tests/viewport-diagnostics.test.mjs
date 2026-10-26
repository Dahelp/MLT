import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const parsed={};vm.runInNewContext(readFileSync(new URL('../app/viewportDiagnostics.ts',import.meta.url),'utf8').replace('export const viewportDiagnosticScript =','globalThis.script ='),parsed);
function page(search){const events=new Map();const viewport={offsetTop:0,pageTop:0,height:700,scale:1,addEventListener:(name,fn)=>events.set('visual-'+name,fn)};let y=0,now=0;const context={URLSearchParams,location:{search},performance:{now:()=>now+=110,getEntriesByType:()=>[{type:'reload'}]},window:{visualViewport:viewport,innerHeight:800,get scrollY(){return y},addEventListener:(name,fn)=>events.set(name,fn),scrollTo:()=>assert.fail('diagnostics must not scroll')},document:{get scrollingElement(){return{scrollTop:y}},querySelector:selector=>selector==='header'?{getBoundingClientRect:()=>({top:-y})}:null,addEventListener:(name,fn)=>events.set(name,fn)}};vm.runInNewContext(parsed.script,context);return{context,viewport,events,setY:value=>y=value,log:()=>context.window.__MLT_VIEWPORT_LOG__}}
test('normal visitors do not activate diagnostics or listeners',()=>{const p=page('');assert.equal(p.log(),undefined);assert.equal(p.events.size,0)});
test('captures document movement separately from visual viewport movement',()=>{const p=page('?viewport-debug=1');p.setY(60);p.events.get('scroll')({type:'scroll'});assert.equal(p.log().at(-1).documentY,60);assert.equal(p.log().at(-1).headerTop,-60);p.viewport.offsetTop=40;p.viewport.pageTop=100;p.events.get('visual-scroll')();assert.equal(p.log().at(-1).visualY,40);assert.equal(p.log().at(-1).documentY,60)});
test('records lifecycle and keeps a bounded in-memory log',()=>{const p=page('?viewport-debug=1');p.events.get('pageshow')({type:'pageshow',persisted:true});assert.equal(p.log().at(-1).persisted,true);for(let i=0;i<1000;i++)p.events.get('resize')({type:'resize'});assert.equal(p.log().length,240);assert.equal(p.log()[0].event,'head');assert.equal(p.log()[1].event,'pageshow')});

test('includes the correction status and records its outcome without scrolling',()=>{const p=page('?viewport-debug=1');p.context.window.__MLT_REFRESH_STATE__={status:'correcting',attempts:2};p.context.window.__MLT_RECORD_VIEWPORT__('refresh-correcting');assert.equal(p.log().at(-1).refreshStatus,'correcting');assert.equal(p.log().at(-1).refreshAttempts,2)});

test('distinguishes an unfinished document from a completed load and records failing resources',()=>{
  const p=page('?viewport-debug=1');
  p.context.document.readyState='interactive';
  p.context.performance.getEntriesByType=()=>[{type:'navigate',loadEventEnd:0}];
  p.events.get('readystatechange')();
  assert.equal(p.log().at(-1).readyState,'interactive');
  assert.equal(p.log().at(-1).loadEventEnd,0);
  p.context.document.readyState='complete';
  p.context.performance.getEntriesByType=()=>[{type:'navigate',loadEventEnd:1200}];
  p.events.get('load')({type:'load'});
  assert.equal(p.log().at(-1).readyState,'complete');
  assert.equal(p.log().at(-1).loadEventEnd,1200);
  p.events.get('error')({target:{src:'https://example.test/missing.js'}});
  assert.equal(p.log().at(-1).event,'error:https://example.test/missing.js');
});
