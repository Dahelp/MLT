import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url),cache=new Map();
function load(filename){const file=path.resolve(filename);if(cache.has(file))return cache.get(file);if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;new Function('module','exports','require',code)(module,module.exports,spec=>{if(spec.endsWith('.css'))return {};if(!spec.startsWith('.'))return require(spec);const base=path.resolve(path.dirname(file),spec);return load(fs.existsSync(base)?base:fs.existsSync(base+'.ts')?base+'.ts':base+'.tsx');});cache.set(file,module.exports);return module.exports;}
const locales=['en','de','ru','it','pl'],copy=load('public/data/scout-i18n.json');
const Amenities=load('app/scout-passport/ScoutAmenities.tsx').default;
const exclusive=load('content/exclusive-requests.ts'),components=load('app/ExclusiveRequests.tsx');
const Editor=load('app/concierge/ExclusiveRequestsEditor.tsx').default;
const render=(component,props)=>renderToStaticMarkup(React.createElement(component,props));
test('Amenities appears only for stays, in every site language',()=>{
 for(const locale of locales){const props={locale,value:'Pool & sauna',onChange(){}};const html=render(Amenities,{...props,category:'stay'});assert.ok(html.includes(copy[locale].form.amenities));assert.match(html,/name="amenities"/);assert.match(html,/Pool &amp; sauna/);for(const category of ['gourmet','sight','experience'])assert.equal(render(Amenities,{...props,category}),'');}
});
test('all four exclusive options use the same translated names in selection, client summary and manager quote',()=>{
 const catalog=load('public/data/private-exclusive-requests.json'),raw=JSON.stringify(catalog.map(item=>({id:item.id,title:'Old English label',price:123})));
 for(const locale of locales){const options=exclusive.exclusiveOptionsFor(locale),items=exclusive.parseExclusiveRequests(raw,locale);assert.deepEqual(options.map(item=>item.id),catalog.map(item=>item.id));assert.deepEqual(items.map(item=>item.title),options.map(item=>item.title));assert.ok(items.every(item=>item.price===123));const selection=render(components.ExclusiveRequestSelection,{locale,selected:[],onChange(){}});assert.equal((selection.match(/aria-pressed="false"/g)||[]).length,4);assert.doesNotMatch(selection,/€|EUR/);const summary=render(components.ExclusiveRequestsSummary,{locale,raw});const editor=render(Editor,{locale,raw,reference:'TEST',disabled:false,request:async()=>{},onSaved:async()=>{}});for(const {title} of options){for(const html of [selection,summary,editor])assert.ok(html.includes(title),`${locale}: ${title}`);}assert.ok(selection.includes(exclusive.exclusiveCopy(locale).title));}
});
test('latest map labels and collection booking copy cover every language, including Italian and Polish',()=>{
 const {mapTypeLabels,mapCountryLabels,mapRegionLabels,mapCountryLabel}=load('content/map-place-labels.ts');for(const row of [...Object.values(mapTypeLabels),...Object.values(mapCountryLabels),...Object.values(mapRegionLabels)])for(const locale of locales)assert.ok(row[locale]?.trim());assert.equal(mapCountryLabel('Италия/Умбрия','it'),'Italia / Umbria');
 for(const region of ['Trentino-Alto-Adige','Trentino Alto Adige','Trentino-Alto Adige'])assert.equal(mapCountryLabel('Italy/'+region,'de'),'Italien / Trentino-Südtirol');
 assert.equal(mapCountryLabel('Italy/Sardinia','ru'),'Италия / Сардиния');assert.equal(mapCountryLabel('Italy/Sicily','pl'),'Włochy / Sycylia');assert.equal(mapCountryLabel('Italy/Unknown-Region','en'),'Italy / Unknown-Region');
 const {collectionBookingTranslations}=load('content/collection-booking-copy.ts');const source=fs.readFileSync('app/collections/[slug]/CollectionDetail.tsx','utf8'),ast=ts.createSourceFile('page.tsx',source,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TSX);function visit(node){if(ts.isCallExpression(node)&&node.expression.getText(ast)==='tr'&&ts.isStringLiteral(node.arguments[0]))for(const locale of ['it','pl'])assert.ok(collectionBookingTranslations[node.arguments[0].text]?.[locale],node.arguments[0].text);ts.forEachChild(node,visit);}visit(ast);
});
test('photo slots restore all ten images and the compressed upload fits the unchanged request limit',()=>{
 const {scoutPhotoSlots,scoutPhotoLimits,encodeScoutPhoto}=load('content/scout-photos.ts');const photos=Array.from({length:10},(_,i)=>'/photo-'+i+'.webp');assert.deepEqual(scoutPhotoSlots(photos),photos);assert.equal(scoutPhotoSlots().length,4);assert.equal(scoutPhotoSlots([...photos,'extra']).length,10);assert.ok(scoutPhotoLimits.max*scoutPhotoLimits.maxDataChars+32768<8*1024*1024);
 const attempts=[];assert.equal(encodeScoutPhoto({toDataURL(type,quality){attempts.push(quality);assert.equal(type,'image/jpeg');return quality>.62?'x'.repeat(900001):'encoded';}},'too large'),'encoded');assert.deepEqual(attempts,[.86,.74,.62]);
});
