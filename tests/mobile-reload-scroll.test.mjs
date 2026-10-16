import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../app/mobileReloadScroll.ts',import.meta.url),'utf8');
const parsed={};vm.runInNewContext(source.replace('export const mobileReloadScrollScript =','globalThis.script ='),parsed);
function page({mobile=true,type='reload',hash=''}={}){
 const windowEvents=new Map(),documentEvents=new Map(),frames=[],calls=[];
 const events=map=>({addEventListener:(name,fn)=>map.set(name,fn),removeEventListener:(name)=>map.delete(name)});
 const context={performance:{getEntriesByType:()=>[{type}]},matchMedia:()=>({matches:mobile}),location:{hash},history:{scrollRestoration:'auto'},requestAnimationFrame:fn=>frames.push(fn),window:{...events(windowEvents),scrollTo:options=>calls.push(options)},document:events(documentEvents)};
 vm.runInNewContext(parsed.script,context);
 return {context,calls,event:(name,event={})=>(windowEvents.get(name)||documentEvents.get(name))?.(event),frames:()=>{while(frames.length)frames.shift()()},windowEvents,documentEvents};
}
test('mobile reload disables native restoration early and aligns through pageshow',()=>{
 const p=page();assert.equal(p.context.history.scrollRestoration,'manual');assert.equal(p.calls.length,1);
 p.event('DOMContentLoaded');p.event('pageshow',{persisted:false});p.frames();assert.equal(p.calls.length,5);assert.ok(p.calls.every(c=>c.top===0&&c.left===0));assert.equal(p.windowEvents.has('touchstart'),false);
});
for(const options of [{type:'navigate'},{type:'back_forward'},{mobile:false},{hash:'#collections'}]) test('does not reset '+JSON.stringify(options),()=>{const p=page(options);assert.equal(p.calls.length,0);assert.equal(p.context.history.scrollRestoration,'auto')});
for(const input of ['touchstart','pointerdown','wheel','keydown']) test('user '+input+' cancels delayed resets',()=>{const p=page();p.event(input);p.event('DOMContentLoaded');p.event('pageshow',{persisted:false});p.frames();assert.equal(p.calls.length,1)});
test('BFCache return does not run delayed resets',()=>{const p=page();p.event('pageshow',{persisted:true});p.frames();assert.equal(p.calls.length,1);assert.equal(p.windowEvents.has('touchstart'),false)});
