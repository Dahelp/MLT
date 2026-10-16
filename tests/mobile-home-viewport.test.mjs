import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const parsed={};vm.runInNewContext(readFileSync(new URL('../app/mobileHomeViewport.ts',import.meta.url),'utf8').replace('export const mobileHomeViewportScript =','globalThis.script ='),parsed);
function page({type='reload',hash='',path='/en/',mobile=true}={}){
 let now=0,y=0,id=0;const timers=new Map(),events=new Map(),values=new Map(),calls=[];
 const viewport={scale:1,addEventListener:(name,fn)=>events.set('visual:'+name,fn),removeEventListener:name=>events.delete('visual:'+name)};
 const win={innerWidth:390,innerHeight:661,visualViewport:viewport,get scrollY(){return y},addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name),scrollTo:o=>{calls.push({time:now,...o});y=o.top}};
 const ctx={location:{pathname:path,hash},matchMedia:()=>({matches:mobile}),document:{documentElement:{style:{setProperty:(n,v)=>values.set(n,v)}}},performance:{getEntriesByType:()=>[{type}]},window:win,setTimeout:(fn,delay)=>{timers.set(++id,{at:now+delay,fn});return id},clearTimeout:id=>timers.delete(id)};
 vm.runInNewContext(parsed.script,ctx);
 const advance=t=>{while(true){const next=[...timers.entries()].filter(([,v])=>v.at<=t).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].fn()}now=t};
 return{calls,values,win,viewport,advance,event:name=>events.get(name)?.(),sample:(time,scroll)=>{advance(time);y=scroll;events.get('scroll')?.()},y:()=>y};
}
test('replays the reported iPhone bounce and waits for its final 60px position',()=>{
 const p=page();const samples=[[1246,-60],[1777,-60],[2860,-32],[2878,-27],[2896,-22],[2929,70],[3016,93],[3128,116],[3228,134],[3328,149],[3428,162],[3529,172],[3629,179],[3728,124],[3737,102],[3813,25],[3929,25],[4029,40],[4129,51],[4229,56],[4379,59],[4447,60]];
 for(const [time,y]of samples){p.sample(time,y);if(time===2896)p.event('touchend');assert.equal(p.calls.length,0)}
 p.advance(4666);assert.equal(p.calls.length,0);p.advance(4667);assert.equal(p.calls.length,1);assert.equal(p.y(),0);p.sample(5000,120);p.advance(6000);assert.equal(p.calls.length,1);
});
test('toolbar height changes keep hero at 661px; rotation can resize it',()=>{const p=page();p.win.innerHeight=797;p.event('resize');assert.equal(p.values.get('--mlt-mobile-hero-height'),'661px');p.win.innerWidth=844;p.win.innerHeight=390;p.event('resize');assert.equal(p.values.get('--mlt-mobile-hero-height'),'390px')});
for(const options of [{type:'navigate'},{type:'back_forward'},{hash:'#collections'},{path:'/en/account/'},{mobile:false}])test('does not correct '+JSON.stringify(options),()=>{const p=page(options);p.sample(50,-60);p.sample(100,60);p.advance(1000);assert.equal(p.calls.length,0)});
test('ordinary reload without a negative bounce retains scroll',()=>{const p=page();p.sample(100,60);p.advance(1000);assert.equal(p.calls.length,0)});
for(const event of ['touchstart','wheel','keydown','pagehide'])test('new '+event+' cancels correction',()=>{const p=page();p.sample(10,-60);p.sample(100,60);p.event(event);p.advance(1000);assert.equal(p.calls.length,0)});
test('does not correct deep scroll or pinch zoom',()=>{for(const zoom of [false,true]){const p=page();p.sample(10,-60);if(zoom)p.viewport.scale=2;p.sample(100,zoom?60:400);p.advance(1000);assert.equal(p.calls.length,0)}});
test('guard expires without interfering with a later gesture',()=>{const p=page();p.advance(11000);p.sample(12000,-60);p.sample(12100,60);p.advance(13000);assert.equal(p.calls.length,0)});
