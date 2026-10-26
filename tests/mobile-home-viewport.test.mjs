import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const parsed={};vm.runInNewContext(readFileSync(new URL('../app/mobileHomeViewport.ts',import.meta.url),'utf8').replace('export const mobileHomeViewportScript =','globalThis.script ='),parsed);
function page({type='reload',hash='',path='/en/',mobile=true,ignoredScrolls=0,loaded=true}={}){
 let now=0,y=0,id=0;const timers=new Map(),events=new Map(),values=new Map(),calls=[];
 const add=(name,fn)=>{if(!events.has(name))events.set(name,new Set());events.get(name).add(fn)};
 const remove=(name,fn)=>events.get(name)?.delete(fn);
 const emit=(name,event={})=>{for(const fn of [...(events.get(name)||[])])fn(event)};
 const viewport={scale:1,addEventListener:(name,fn)=>add('visual:'+name,fn),removeEventListener:(name,fn)=>remove('visual:'+name,fn)};
 const win={innerWidth:390,innerHeight:661,visualViewport:viewport,get scrollY(){return y},addEventListener:(name,fn)=>add(name,fn),removeEventListener:(name,fn)=>remove(name,fn),scrollTo:o=>{calls.push({time:now,...o});if(calls.length>ignoredScrolls)y=o.top}};
 const ctx={location:{pathname:path,hash},matchMedia:()=>({matches:mobile}),document:{readyState:loaded?'complete':'loading',documentElement:{style:{setProperty:(n,v)=>values.set(n,v)}}},performance:{getEntriesByType:()=>[{type}]},window:win,setTimeout:(fn,delay)=>{timers.set(++id,{at:now+delay,fn});return id},clearTimeout:id=>timers.delete(id)};
 vm.runInNewContext(parsed.script,ctx);
 const advance=t=>{while(true){const next=[...timers.entries()].filter(([,v])=>v.at<=t).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].fn()}now=t};
 return{calls,values,win,viewport,advance,event:emit,sample:(time,scroll)=>{advance(time);y=scroll;emit('scroll')},y:()=>y};
}
test('replays the reported iPhone bounce and waits for its final 60px position',()=>{
 const p=page();const samples=[[1246,-60],[1777,-60],[2860,-32],[2878,-27],[2896,-22],[2929,70],[3016,93],[3128,116],[3228,134],[3328,149],[3428,162],[3529,172],[3629,179],[3728,124],[3737,102],[3813,25],[3929,25],[4029,40],[4129,51],[4229,56],[4379,59],[4447,60]];
 for(const [time,y]of samples){p.sample(time,y);if(time===2896)p.event('touchend');assert.equal(p.calls.length,0)}
 p.advance(4896);assert.equal(p.calls.length,0);p.advance(4897);assert.equal(p.calls.length,1);assert.equal(p.y(),0);p.event('touchstart');p.sample(5000,120);p.advance(6000);assert.equal(p.calls.length,1);
});
test('toolbar height changes keep hero at 661px; rotation can resize it',()=>{const p=page();p.win.innerHeight=797;p.event('resize');assert.equal(p.values.get('--mlt-mobile-hero-height'),'661px');p.win.innerWidth=844;p.win.innerHeight=390;p.event('resize');assert.equal(p.values.get('--mlt-mobile-hero-height'),'390px')});
for(const options of [{type:'navigate'},{type:'back_forward'},{hash:'#collections'},{path:'/en/account/'},{mobile:false}])test('does not correct '+JSON.stringify(options),()=>{const p=page(options);p.sample(50,-60);p.sample(100,60);p.advance(1000);assert.equal(p.calls.length,0)});
test('mobile reload normalizes a shallow restored offset without a negative bounce',()=>{const p=page();p.sample(100,60);p.advance(1000);assert.equal(p.calls.length,1);assert.equal(p.y(),0)});
for(const event of ['touchstart','wheel','keydown','pagehide'])test('new '+event+' cancels correction',()=>{const p=page();p.sample(10,-60);p.sample(100,60);p.event(event);p.advance(1000);assert.equal(p.calls.length,0)});
test('does not correct deep scroll or pinch zoom',()=>{for(const zoom of [false,true]){const p=page();p.sample(10,-60);if(zoom)p.viewport.scale=2;p.sample(100,zoom?60:400);p.advance(1000);assert.equal(p.calls.length,0)}});
test('guard expires without interfering with a later gesture',()=>{const p=page();p.advance(11000);p.sample(12000,-60);p.sample(12100,60);p.advance(13000);assert.equal(p.calls.length,0)});

for (const locale of ['en','de','ru','it','pl']) {
 for (const suffix of ['', '/mobile-site', '/mobile-preview']) {
  const path = `/${locale}/collections/freedom${suffix}/`;
  test(`pull-to-refresh restores the header on ${path} without changing collection height`, () => {
   const p=page({path});
   p.sample(50,-60);p.event('touchend');p.sample(150,60);p.advance(600);
   assert.equal(p.calls.length,1);assert.equal(p.y(),0);
   assert.equal(p.values.has('--mlt-mobile-hero-height'),false);
  });
 }
}
for (const options of [{path:'/ru/collections/freedom/',type:'navigate'},{path:'/ru/collections/freedom/',hash:'#booking'}]) {
 test('collection navigation retains its scroll '+JSON.stringify(options),()=>{const p=page(options);p.sample(50,-60);p.sample(100,60);p.advance(1000);assert.equal(p.calls.length,0)});
}

for (const route of ['','mobile-site/','mobile-preview/','collections/signature/','collections/private/mobile-site/','collections/honeymoon/mobile-site/','investments/','acquisitions/','acquisitions/marco/','contact/','about/','smart-map/','vouchers/','plan/','proposal/','legal/privacy/']) {
 const path='/ru/'+route;
 test(`public mobile reload finishes its bounce on ${path}`,()=>{const p=page({path});p.sample(50,-60);p.event('touchend');p.sample(150,60);p.advance(600);assert.equal(p.calls.length,1);assert.equal(p.y(),0)});
}


test('retries when the browser ignores the first scrollTo calls during native refresh',()=>{
 const p=page({ignoredScrolls:2});p.sample(100,60);p.advance(550);assert.equal(p.y(),60);p.advance(1000);assert.equal(p.y(),60);p.advance(1450);assert.equal(p.y(),0);assert.equal(p.calls.length,3);
});
test('corrects a native offset that is reapplied after the first successful call',()=>{
 const p=page();p.sample(100,60);p.advance(550);assert.equal(p.y(),0);p.sample(850,60);p.advance(1300);assert.equal(p.y(),0);assert.equal(p.calls.length,2);
});
test('new interaction cancels retries after an initial correction',()=>{
 const p=page();p.sample(100,60);p.advance(550);p.event('touchstart');p.sample(850,60);p.advance(5000);assert.equal(p.y(),60);assert.equal(p.calls.length,1);
});
test('waits for load and grants slow pages the full settling period',()=>{
 const p=page({loaded:false});p.sample(100,60);p.advance(12000);assert.equal(p.calls.length,0);p.event('load');p.advance(12450);assert.equal(p.y(),0);assert.equal(p.calls.length,1);
});
test('a deep restored position cannot be reset by a later scroll towards the header',()=>{
 const p=page();p.sample(100,800);p.sample(200,60);p.advance(1000);assert.equal(p.calls.length,0);
});
test('correction status distinguishes a request from the measured result',()=>{
 const p=page();p.sample(100,60);p.advance(550);assert.equal(p.win.__MLT_REFRESH_STATE__.status,'correcting');p.advance(1000);assert.equal(p.win.__MLT_REFRESH_STATE__.status,'at-top');assert.equal(p.win.__MLT_REFRESH_STATE__.attempts,1);
});

test('replays the October 26 iPhone toolbar trace with no negative scroll samples',()=>{
 const samples=JSON.parse(readFileSync(new URL('./fixtures/iphone-refresh-toolbar.json',import.meta.url),'utf8'));
 for(const path of ['/ru/','/ru/collections/freedom/mobile-site/','/ru/contact/']) {
  const p=page({path});
  for(const [time,event,y,height,offset]of samples){p.win.innerHeight=height;p.viewport.offsetTop=offset;p.sample(time,y);p.event(event.startsWith('visual-')?'visual:'+event.slice(7):event)}
  p.advance(4522);assert.equal(p.y(),0,path);p.advance(5000);assert.equal(p.win.__MLT_REFRESH_STATE__.status,'at-top');
 }
});
