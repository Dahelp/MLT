import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import ts from 'typescript';
const module={exports:{}};
const source=fs.readFileSync(new URL('../content/map-markers.ts',import.meta.url),'utf8');
new Function('module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(module,module.exports);
const {groupMapPoints,matchesMapCountry}=module.exports;
const mapModule={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync(new URL('../content/map.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(mapModule,mapModule.exports);
const {mapCoordinates,mapZoomLimits,mapViews}=mapModule.exports;
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

test('Europe overview permits multiple zoom-out steps before reaching the lower zoom bound',()=>{
 assert.equal(mapZoomLimits.minZoom,2);
 assert.ok(mapViews.All.zoom-mapZoomLimits.minZoom>=2);
 for(const view of Object.values(mapViews))assert.ok(view.zoom>mapZoomLimits.minZoom&&view.zoom<mapZoomLimits.maxZoom);
});

test('Cascata delle Marmore keeps its own marker and true coordinates when zooming out past Tuscany',()=>{
 const coordinates={...mapCoordinates,'scout-marmore':[12.7161,42.5531]};
 const project=([lng,lat],zoom)=>({x:(lng+180)/360*512*2**zoom,y:(1-Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))/Math.PI)/2*512*2**zoom});
 for(const zoom of [6,5.2,5,4.4,4,3,2]){
  const points=Object.entries(coordinates).map(([id,coordinate])=>({id,...project(coordinate,zoom),priority:id==='scout-marmore'?1:undefined}));
  const groups=groupMapPoints(points),marker=groups.find(group=>group.ids.includes('scout-marmore')),position=project(coordinates['scout-marmore'],zoom);
  assert.equal(marker.anchorId,'scout-marmore',`zoom ${zoom}`);assert.equal(marker.x,position.x);assert.equal(marker.y,position.y);
  assert.deepEqual(new Set(groups.flatMap(group=>group.ids)),new Set(points.map(point=>point.id)));
  if(zoom===4.4)assert.ok(marker.ids.includes('tuscany'),'The nearby places remain available without replacing the Scout pin');
 }
});

test('an open place retains priority over other published places and dense pinned groups remain clickable',()=>{
 const points=Array.from({length:1000},(_,i)=>({id:String(i),x:Math.sin(i*2.3)*300+400,y:Math.cos(i*1.4)*200+300,priority:i===37?0:i%7===0?1:undefined}));
 const groups=groupMapPoints(points),open=points[37],marker=groups.find(group=>group.ids.includes(open.id));
 assert.equal(marker.anchorId,open.id);assert.equal(marker.x,open.x);assert.equal(marker.y,open.y);
 assert.deepEqual(new Set(groups.flatMap(group=>group.ids)),new Set(points.map(point=>point.id)));
 assert.equal(groups.flatMap(group=>group.ids).length,points.length);
 for(let a=0;a<groups.length;a++)for(let b=a+1;b<groups.length;b++)assert.ok(Math.hypot(groups[a].x-groups[b].x,groups[a].y-groups[b].y)>=52);
});

test('map renderer keeps the Scout pin clickable after zoom-out and exposes neighbouring places',()=>{
 const file=fs.readFileSync(new URL('../app/plan/RealRouteMap.tsx',import.meta.url),'utf8');
 const ast=ts.createSourceFile('RealRouteMap.tsx',file,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TSX);
 let callback;
 function visit(node){if(ts.isCallExpression(node)&&node.expression.getText(ast)==='useEffect'&&node.arguments[0]?.getText(ast).includes('const renderMarkers='))callback=node.arguments[0].getText(ast);ts.forEachChild(node,visit);}
 visit(ast);assert.ok(callback,'Marker lifecycle effect');
 const code=ts.transpileModule(`module.exports=${callback};`,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 function copy(filename,name){const m={exports:{}};new Function('module','exports',ts.transpileModule(fs.readFileSync(new URL('../content/'+filename,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(m,m.exports);return m.exports[name];}
 const mapMarkerCopy=copy('map-marker-copy.ts','mapMarkerCopy'),mapPreviewCopy=copy('map-preview.ts','mapPreviewCopy');
 const scout='scout-marmore',coordinates={...mapCoordinates,[scout]:[12.7161,42.5531]};
 const mercator=([lng,lat])=>({x:(lng+180)/360,y:(1-Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))/Math.PI)/2});
 const center=mercator(coordinates[scout]),handlers=new Map();let zoom=6;
 const map={getContainer:()=>({clientWidth:700,clientHeight:510}),project:coordinate=>{const p=mercator(coordinate),scale=512*2**zoom;return{x:350+(p.x-center.x)*scale,y:255+(p.y-center.y)*scale};},unproject:([x,y])=>{const scale=512*2**zoom;return{lng:((x-350)/scale+center.x)*360-180,lat:Math.atan(Math.sinh(Math.PI*(1-2*((y-255)/scale+center.y))))*180/Math.PI};},on:(name,handler)=>handlers.set(name,handler),off:name=>handlers.delete(name)};
 const node=tagName=>({tagName,children:[],attributes:{},textContent:'',append(...children){this.children.push(...children)},setAttribute(name,value){this.attributes[name]=value;}});
 const document={createElement:node,createElementNS:(_ns,tag)=>node(tag)};
 class Marker{constructor({element}){this.element=element;}setLngLat(value){this.coordinate=value;return this;}addTo(){return this;}remove(){}}
 const markersRef={current:[]},state={};
 const env={mapRef:{current:map},markersRef,mapStatus:'ready',mapPoints:Object.keys(coordinates).map(id=>({id,name:id===scout?'Cascata delle Marmore':id,country:'Italy',className:id===scout?'pin-catalog':'pin-route'})),coordinates,selected:['tuscany'],country:'All',locale:'ru',previewId:null,nearbyIds:null,inspectorId:'map-card',anchorRef:{current:null},setNearbyIds:value=>{state.nearbyIds=value},setPreviewId:value=>{state.previewId=value},maplibregl:{Marker},document,groupMapPoints,matchesMapCountry,mapMarkerCopy,mapPreviewCopy};
 const install=()=>{const m={exports:{}};new Function(...Object.keys(env),'module',code)(...Object.values(env),m);return m.exports();};
 let cleanup=install();
 const pin=()=>markersRef.current.find(marker=>marker.element.attributes['aria-label'].includes('Cascata delle Marmore'));
 for(const level of [6,5.2,4.4,4,3,2]){
  zoom=level;handlers.get('moveend')();const marker=pin();assert.ok(marker,`zoom ${level}`);
  const symbol=marker.element.children[0];
  if(marker.element.className.includes(' is-group')){
   assert.match(symbol.textContent,/^[2-9]$|^[1-9]\d+$/,'The group count stays inside the main circle');
   assert.equal(marker.element.children.length,2,'No detached count badge');
  }else assert.equal(symbol.children[0]?.tagName,'svg','An individual Scout place keeps its pin');
  assert.ok(Math.abs(marker.coordinate.lng-coordinates[scout][0])<1e-8);assert.ok(Math.abs(marker.coordinate.lat-coordinates[scout][1])<1e-8);
  assert.ok(!marker.element.className.includes(' selected'),'Selecting Tuscany must not mark the Scout place as selected');
  marker.element.onclick();assert.equal(state.previewId,scout);
 }
 zoom=4.4;handlers.get('moveend')();assert.ok(pin().element.className.includes(' is-group'));assert.equal(pin().element.children[0].textContent,'3');
 cleanup();env.previewId=scout;cleanup=install();pin().element.onclick();assert.equal(state.previewId,null);assert.ok(state.nearbyIds.includes(scout)&&state.nearbyIds.includes('tuscany'));cleanup();
});
