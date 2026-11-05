import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../content/route-points.ts',import.meta.url),'utf8');
const module={exports:{}};
new Function('module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(module,module.exports);
const {publishedRoutePoint}=module.exports;
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
