import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const parsed={};vm.runInNewContext(readFileSync(new URL('../app/mobileViewport.ts',import.meta.url),'utf8').replace('export const mobileViewportScript =','globalThis.script ='),parsed);
function page(withViewport=true){
 const values=new Map(),events=new Map();const viewport={offsetTop:0,height:700,scale:1,addEventListener:(name,fn)=>events.set('viewport:'+name,fn)};
 const context={window:{innerHeight:844,visualViewport:withViewport?viewport:undefined,addEventListener:(name,fn)=>events.set(name,fn),scrollTo:()=>assert.fail('must not change page scrolling')},document:{documentElement:{style:{setProperty:(name,value)=>values.set(name,value)}}}};
 vm.runInNewContext(parsed.script,context);return {values,viewport,event:name=>events.get(name)()};
}
test('tracks toolbar offset before hydration',()=>{const p=page();assert.equal(p.values.get('--mlt-visual-viewport-top'),'0px');p.viewport.offsetTop=65;p.event('viewport:scroll');assert.equal(p.values.get('--mlt-visual-viewport-top'),'65px');p.viewport.offsetTop=0;p.event('viewport:resize');assert.equal(p.values.get('--mlt-visual-viewport-top'),'0px')});
test('tracks visible height on keyboard and orientation changes',()=>{const p=page();p.viewport.height=390;p.event('viewport:resize');assert.equal(p.values.get('--mlt-visible-height'),'390px')});
test('refreshes metrics after history or reload pageshow',()=>{const p=page();p.viewport.offsetTop=42;p.event('pageshow');assert.equal(p.values.get('--mlt-visual-viewport-top'),'42px')});
test('does not follow pinch zoom offsets',()=>{const p=page();p.viewport.scale=2;p.viewport.offsetTop=180;p.event('viewport:scroll');assert.equal(p.values.get('--mlt-visual-viewport-top'),'0px');assert.equal(p.values.get('--mlt-visible-height'),'844px')});
test('negative overscroll is clamped',()=>{const p=page();p.viewport.offsetTop=-35;p.event('viewport:scroll');assert.equal(p.values.get('--mlt-visual-viewport-top'),'0px')});
test('works without VisualViewport support',()=>{const p=page(false);assert.equal(p.values.get('--mlt-visual-viewport-top'),'0px');assert.equal(p.values.get('--mlt-visible-height'),'844px');p.event('resize')});
