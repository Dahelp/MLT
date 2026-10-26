import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const parsed={};vm.runInNewContext(readFileSync(new URL('../app/managedPullRefresh.ts',import.meta.url),'utf8').replace('export const managedPullRefreshScript =','globalThis.script ='),parsed);
const gsa='Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_2 like Mac OS X) AppleWebKit/605.1.15 GSA/443.5 Mobile/15E148 Safari/604.1';
function page({ua=gsa,path='/ru/',mobile=true,search='',scale=1,selection='None'}={}) {
 const events=new Map(),classes=new Set(),elements=[];let y=0,reloads=0;
 const body={appendChild:el=>elements.push(el)};
 const root={classList:{add:c=>classes.add(c)}};
 const win={get scrollY(){return y},visualViewport:{scale},getSelection:()=>({type:selection}),getComputedStyle:el=>({overflowY:el.overflowY||'visible'}),location:{reload:()=>reloads++},addEventListener:(name,fn,options)=>events.set(name,{fn,options}),scrollTo:()=>assert.fail('managed refresh must not move document content')};
 const doc={body,documentElement:root,createElement:()=>({textContent:'',setAttribute(){},remove(){const i=elements.indexOf(this);if(i>=0)elements.splice(i,1)}})};
 const context={window:win,document:doc,navigator:{userAgent:ua},location:{pathname:path,search},matchMedia:()=>({matches:mobile}),URLSearchParams};
 vm.runInNewContext(parsed.script,context);
 const emit=(type,{x=100,y=100,count=1,target=body,cancelable=true}={})=>{const event={touches:Array.from({length:count},()=>({clientX:x,clientY:y})),target,cancelable,defaultPrevented:false,preventDefault(){this.defaultPrevented=true}};events.get(type)?.fn(event);return event};
 return{context,win,events,classes,elements,emit,setY:value=>y=value,reloads:()=>reloads};
}
test('first downward gesture at the top is canceled before native scrolling and reloads on release',()=>{const p=page();p.emit('touchstart');const e=p.emit('touchmove',{y:200});assert.equal(e.defaultPrevented,true);assert.equal(p.reloads(),0);assert.equal(p.win.__MLT_REFRESH_STATE__.status,'managed-armed');p.emit('touchend');assert.equal(p.reloads(),1);assert.equal(p.win.__MLT_REFRESH_STATE__.nativeInset,0)});
test('root listener explicitly requests a cancelable touchmove listener',()=>{const p=page();assert.equal(p.events.get('touchmove').options.passive,false);assert.equal(p.events.get('touchmove').options.capture,true);assert.ok(p.classes.has('mlt-managed-refresh'))});
test('short pulls are canceled but do not refresh',()=>{const p=page();p.emit('touchstart');assert.equal(p.emit('touchmove',{y:130}).defaultPrevented,true);p.emit('touchend');assert.equal(p.reloads(),0);assert.equal(p.elements.length,0)});
test('ordinary upward scrolling is never canceled',()=>{const p=page();p.emit('touchstart');assert.equal(p.emit('touchmove',{y:20}).defaultPrevented,false);p.emit('touchend');assert.equal(p.reloads(),0)});
test('a downward gesture starting deeper in the document remains ordinary scrolling',()=>{const p=page();p.setY(350);p.emit('touchstart');p.setY(0);assert.equal(p.emit('touchmove',{y:220}).defaultPrevented,false);p.emit('touchend');assert.equal(p.reloads(),0)});
test('horizontal dragging is not captured or refreshed',()=>{const p=page();p.emit('touchstart');assert.equal(p.emit('touchmove',{x:210,y:115}).defaultPrevented,false);p.emit('touchmove',{x:220,y:250});p.emit('touchend');assert.equal(p.reloads(),0)});
for(const options of [{ua:gsa.replace('GSA/443.5','CriOS/140')},{ua:gsa.replace('GSA/443.5','Version/26')},{ua:gsa.replaceAll('iPhone','Android')},{mobile:false},{path:'/ru/account/'},{search:'?viewport-debug=1&refresh-mode=raw'}])test('leaves native behavior intact for '+JSON.stringify(options),()=>{const p=page(options);assert.equal(p.events.size,0);assert.equal(p.classes.size,0)});
test('a non-diagnostic visitor cannot disable protection with the raw query parameter',()=>{const p=page({search:'?refresh-mode=raw'});assert.ok(p.classes.has('mlt-managed-refresh'))});
for(const kind of ['input','dialog','scroller'])test('does not capture gestures inside '+kind,()=>{const p=page();const target={closest:()=>kind==='scroller'?null:{},scrollHeight:500,clientHeight:100,overflowY:'auto',parentElement:null};p.emit('touchstart',{target});assert.equal(p.emit('touchmove',{target,y:250}).defaultPrevented,false);p.emit('touchend');assert.equal(p.reloads(),0)});
test('pinch zoom and multi-touch are preserved',()=>{for(const options of [{scale:2},{}]){const p=page(options);p.emit('touchstart',{count:options.scale?1:2});assert.equal(p.emit('touchmove',{count:2,y:250}).defaultPrevented,false);p.emit('touchend');assert.equal(p.reloads(),0)}});
test('adding a second finger cancels an armed refresh',()=>{const p=page();p.emit('touchstart');p.emit('touchmove',{y:250});p.emit('touchmove',{count:2,y:260});p.emit('touchend');assert.equal(p.reloads(),0)});
test('text selection is not captured',()=>{const p=page({selection:'Range'});p.emit('touchstart');assert.equal(p.emit('touchmove',{y:250}).defaultPrevented,false);p.emit('touchend');assert.equal(p.reloads(),0)});
test('touch cancellation never refreshes',()=>{const p=page();p.emit('touchstart');p.emit('touchmove',{y:250});p.emit('touchcancel');p.emit('touchend');assert.equal(p.reloads(),0);assert.equal(p.elements.length,0)});
test('uncancelable native events are recorded rather than causing a second refresh',()=>{const p=page();p.emit('touchstart');p.emit('touchmove',{y:250,cancelable:false});assert.equal(p.win.__MLT_REFRESH_STATE__.status,'managed-uncancelable');p.emit('touchend');assert.equal(p.reloads(),0)});
test('repeated gestures each reload once without accumulating document offsets',()=>{const p=page();for(let i=0;i<3;i++){p.emit('touchstart');p.emit('touchmove',{y:250});p.emit('touchend')}assert.equal(p.reloads(),3);assert.equal(p.win.__MLT_REFRESH_STATE__.nativeInset,0)});
for(const path of ['/en/','/de/collections/freedom/','/ru/mobile-site/','/it/contact/','/pl/investments/'])test('handles public route '+path,()=>{const p=page({path});p.emit('touchstart');p.emit('touchmove',{y:250});p.emit('touchend');assert.equal(p.reloads(),1)});

test('managed gesture handling runs without the legacy correction and body compensation',()=>{
 const p=page();const native={};vm.runInNewContext(readFileSync(new URL('../app/mobileHomeViewport.ts',import.meta.url),'utf8').replace('export const mobileHomeViewportScript =','globalThis.script ='),native);
 p.context.document.documentElement.style={setProperty(){}};p.win.innerHeight=661;p.win.innerWidth=390;vm.runInNewContext(native.script,p.context);
 assert.equal(p.win.__MLT_REFRESH_STATE__.mode,'managed');p.emit('touchstart');p.emit('touchmove',{y:250});p.emit('touchend');assert.equal(p.reloads(),1);assert.equal(p.classes.has('mlt-native-scroll-inset'),false);
});
