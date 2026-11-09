import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../content/route-points.ts',import.meta.url),'utf8');
const module={exports:{}};
new Function('module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(module,module.exports);
const {publishedRoutePoint}=module.exports;
test('map recommendations require the explicit public boolean flag',()=>{
 for(const value of [undefined,false,'false',0,null])assert.equal(publishedRoutePoint({...row,recommended:value}).recommended,false);
 assert.equal(publishedRoutePoint({...row,recommended:true}).recommended,true);
});
const row={slug:'scout-test',title:'A published place',country_name:'Italy',latitude:'42.5',longitude:'12.7',category:'sight',description:'A waterfall\nA walking path',photos_json:'["/uploads/scout/a.jpg","/uploads/scout/b.jpg"]',parking:'At the entrance',booking:'Reserve ahead',video:{path:'/uploads/scout-video/'+'a'.repeat(48)+'.mp4',mime:'video/mp4'}};
test('published places retain their real description, gallery, video and visitor details',()=>{
 const point=publishedRoutePoint(row);
 assert.equal(point.description,row.description);assert.deepEqual(point.photos,JSON.parse(row.photos_json));
 assert.deepEqual(point.video,row.video);assert.equal(point.parking,row.parking);assert.equal(point.booking,row.booking);
});
test('legacy catalog points work without gallery or video, with a valid cover fallback',()=>{
 const point=publishedRoutePoint({...row,photos_json:'broken',image_path:'/route-alpine.jpg',video:null});
 assert.deepEqual(point.photos,['/route-alpine.jpg']);assert.equal(point.video,null);
 assert.equal(publishedRoutePoint({...row,latitude:'not a latitude'}),null);
 assert.equal(publishedRoutePoint({...row,longitude:181}),null);
});
test('invalid media schemes and malformed gallery data never become preview sources',()=>{
 const point=publishedRoutePoint({...row,photos_json:'["javascript:alert(1)","//external.test/a.jpg",null,"/a.jpg","/a.jpg"]',video:{path:'javascript:alert(1)'}});
 assert.deepEqual(point.photos,['/a.jpg']);assert.equal(point.video,null);
 assert.deepEqual(publishedRoutePoint({...row,photos_json:'{}',video:undefined}).photos,[]);
});

test('public map keeps all ten photos and exposes amenities only for accommodation',()=>{
 const photos=Array.from({length:10},(_,i)=>'/uploads/scout/photo-'+i+'.webp');
 const stay=publishedRoutePoint({...row,category:'stay',amenities:'Pool & sauna',photos_json:JSON.stringify(photos)});
 assert.deepEqual(stay.photos,photos);assert.equal(stay.amenities,'Pool & sauna');
 assert.equal(publishedRoutePoint({...row,category:'sight',amenities:'stale'}).amenities,'');
});

test('shared maps start empty, load only published places and never restore demo points on refresh or failure',async()=>{
 const hooks=[],responses=[],notifications=[];let timer,clock=100000,snapshot,serverSnapshot;
 const react={useEffect:effect=>hooks.push(effect),useSyncExternalStore:(subscribe,getSnapshot,getServerSnapshot)=>{subscribe(()=>notifications.push(true));snapshot=getSnapshot;serverSnapshot=getServerSnapshot;return getSnapshot();}};
 const m={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(new URL('../app/useRoutePoints.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('module','exports','require','fetch','window','document','Date',code)(m,m.exports,name=>{
  if(name==='react')return react;
  if(name==='../content/route-points')return module.exports;
  throw new Error('Unexpected map data dependency: '+name);
 },()=>new Promise(resolve=>responses.push(resolve)),{setInterval:callback=>{timer=callback;return 1},clearInterval(){}},{hidden:false,addEventListener(){},removeEventListener(){}},{now:()=>clock});
 assert.deepEqual(m.exports.useRoutePoints(),{points:[],coordinates:{}});
 assert.deepEqual(serverSnapshot(),{points:[],coordinates:{}});
 const cleanup=hooks[0](),settle=()=>new Promise(resolve=>setImmediate(resolve));
 responses.shift()({ok:true,json:async()=>({points:[row]})});await settle();
 assert.deepEqual(snapshot().points.map(p=>p.id),[row.slug]);assert.deepEqual(snapshot().coordinates,{[row.slug]:[12.7,42.5]});
 const loaded=snapshot();clock+=60001;timer();responses.shift()({ok:false});await settle();
 assert.equal(snapshot(),loaded,'Network failures retain only the last confirmed Scout snapshot');
 clock+=60001;timer();responses.shift()({ok:true,json:async()=>({points:[]})});await settle();
 assert.deepEqual(snapshot(),{points:[],coordinates:{}},'Unpublished places and their coordinates disappear on refresh');
 assert.ok(notifications.length>=2);cleanup();
});
