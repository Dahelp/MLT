import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url),cache=new Map();
function load(filename){
 const file=path.resolve(filename);if(cache.has(file))return cache.get(file);
 const module={exports:{}};cache.set(file,module.exports);
 const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 new Function('module','exports','require',source)(module,module.exports,spec=>spec.endsWith('.css')?{}:spec.startsWith('.')?load(path.resolve(path.dirname(file),`${spec}.ts`)):require(spec));
 cache.set(file,module.exports);return module.exports;
}
const Preview=load('app/plan/MapPointPreview.tsx').default,Nearby=load('app/plan/NearbyMapPoints.tsx').default;
const point={id:'test',name:'A waterfall',country:'Italy',type:'Sight',className:'',description:'A riverside walk',photos:['/one.jpg','/two.jpg'],video:{path:'/video.mp4',mime:'video/mp4'},parking:'At the entrance',booking:'Book ahead'};
const render=(props={})=>renderToStaticMarkup(React.createElement(Preview,{point,locale:'ru',selected:false,onClose(){},onSelect(){},...props}));
test('map card is an inline region with a swipe gallery, photo and video slides and an explicit selection action',()=>{
 const html=render();
 assert.match(html,/<section class="map-point-preview" aria-labelledby=/);assert.doesNotMatch(html,/<dialog|aria-modal|photo-prev|photo-next|thumbnails/);
 assert.equal((html.match(/class="map-point-media-slide"/g)||[]).length,3);
 assert.match(html,/<video[^>]+controls=""[^>]+playsInline=""/);
 assert.match(html,/A riverside walk/);assert.match(html,/Выбрать точку/);assert.match(html,/aria-pressed="false"/);
 assert.match(html,/<details class="map-point-preview-logistics"/);
});
test('selected cards allow removing the point and read-only maps omit selection',()=>{
 assert.match(render({selected:true}),/aria-pressed="true"[^>]*>Убрать из маршрута/);
 assert.doesNotMatch(render({onSelect:undefined}),/map-point-preview-footer/);
 assert.match(render({point:{...point,photos:[],video:null}}),/Фотографии скоро появятся/);
});
test('overlapping places can be browsed inline before selecting an individual place',()=>{
 const html=renderToStaticMarkup(React.createElement(Nearby,{points:[point,{...point,id:'second',name:'Another place'}],selected:['test'],locale:'ru',onPick(){},onClose(){}}));
 assert.match(html,/<section class="nearby-map-points" aria-labelledby=/);assert.doesNotMatch(html,/<dialog|aria-modal/);
 assert.match(html,/A waterfall/);assert.match(html,/Another place/);assert.match(html,/✓ Выбрано/);
});
const {mapPopupLayout}=load('content/map-popup.ts');
test('popup panning leaves the portrait card and marker inside desktop, tablet and phone maps',()=>{
 for(const width of [320,342,390,700,1440])for(const height of [280,380,510,600])for(const x of [-20,width/2,width+20])for(const y of [-20,height/2,height+20]){
  const card={width:200,height:Math.min(500,height-118)},map={width,height};
  const first=mapPopupLayout({x,y},map,card);
  const after=mapPopupLayout({x:x-first.panBy[0],y:y-first.panBy[1]},map,card);
  assert.ok(after.left-card.width/2>=12&&after.left+card.width/2<=width-12);
  assert.ok(after.top-card.height>=68&&after.top+22<=height-28);
  assert.deepEqual(after.panBy,[0,0]);
 }
});
