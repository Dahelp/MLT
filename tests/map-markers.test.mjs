import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import ts from 'typescript';
const module={exports:{}};
const source=fs.readFileSync(new URL('../content/map-markers.ts',import.meta.url),'utf8');
new Function('module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(module,module.exports);
const {groupMapPoints,matchesMapCountry}=module.exports;
test('identical map coordinates retain every place in one accessible group',()=>{
 const points=[{id:'forest',x:90,y:20},{id:'forest-route',x:90,y:20},{id:'other',x:200,y:20}];
 const groups=groupMapPoints(points);assert.equal(groups.length,2);
 assert.deepEqual(new Set(groups.find(group=>group.ids.length===2).ids),new Set(['forest','forest-route']));
});
test('all marker hit areas stay apart, including groups whose centres move after merging',()=>{
 const points=Array.from({length:500},(_,i)=>({id:String(i),x:Math.sin(i*2.3)*300+400,y:Math.cos(i*1.4)*200+300}));
 const groups=groupMapPoints(points);
 assert.deepEqual(new Set(groups.flatMap(group=>group.ids)),new Set(points.map(point=>point.id)));
 assert.equal(groups.flatMap(group=>group.ids).length,points.length);
 for(let a=0;a<groups.length;a++)for(let b=a+1;b<groups.length;b++)assert.ok(Math.hypot(groups[a].x-groups[b].x,groups[a].y-groups[b].y)>=52);
 const close=[{id:'a',x:0,y:0},{id:'b',x:20,y:0}];
 assert.equal(groupMapPoints(close).length,1);assert.equal(groupMapPoints(close.map(point=>({...point,x:point.x*4}))).length,2,'Zooming can reveal individual places');
});
test('dense catalogs do not lose coincident places or invalid projection values',()=>{
 const points=Array.from({length:10000},(_,i)=>({id:String(i),x:100,y:100}));
 const groups=groupMapPoints([...points,{id:'invalid',x:NaN,y:0}]);
 assert.equal(groups.length,1);assert.equal(groups[0].ids.length,10000);
 assert.deepEqual(groupMapPoints([]),[]);
});
test('country filters accept translated country and region names without disabling valid places',()=>{
 for(const name of ['Italy','Italy / Umbria','Италия/Умбрия','Italia, Umbria','Italien — Umbrien','Włochy; Umbria','IT'])assert.equal(matchesMapCountry(name,'Italy'),true,name);
 assert.equal(matchesMapCountry('Österreich / Tirol','Austria'),true);
 assert.equal(matchesMapCountry('Германия, Бавария','Germany'),true);
 assert.equal(matchesMapCountry('Italyland','Italy'),false);
 assert.equal(matchesMapCountry('Italy','Germany'),false);
 assert.equal(matchesMapCountry('Unknown region','All'),true);
});
