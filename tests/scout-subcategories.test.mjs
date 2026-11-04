import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';

const taxonomy=JSON.parse(fs.readFileSync(new URL('../public/data/scout-subcategories.json',import.meta.url),'utf8'));
test('every category has its own complete translated checklist and Other option',()=>{
 const counts={gourmet:6,stay:6,sight:5,experience:5};
 for(const [category,count] of Object.entries(counts)){
  const items=taxonomy[category];assert.equal(items.length,count);assert.equal(items.at(-1).id,'other');
  assert.equal(new Set(items.map(item=>item.id)).size,count);
  for(const item of items)for(const locale of ['en','de','ru','it','pl']){
   assert.ok(item.title[locale]?.trim(),`${category}.${item.id}.${locale}`);
   assert.equal(typeof item.hint[locale],'string');
  }
 }
 const module={exports:{}};
 const source=fs.readFileSync(new URL('../content/scout-subcategories.ts',import.meta.url),'utf8');
 new Function('require','module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText)(()=>taxonomy,module,module.exports);
 assert.deepEqual(module.exports.scoutSubcategoryLabels('sight',['nature','other'],'Ледник','ru'),['Природные объекты','Другое: Ледник']);
});

test('PHP uses the same category IDs, validates Other and accepts older clients',()=>{
 const validate=(category,fields={})=>JSON.parse(execFileSync(process.env.PHP_BINARY||'php',['-r',"require 'public/api/scout-core.php'; $input=json_decode(stream_get_contents(STDIN),true); echo json_encode(mlt_scout_subcategories($input,$input['category']),JSON_UNESCAPED_UNICODE);"],{cwd:new URL('../',import.meta.url),encoding:'utf8',input:JSON.stringify({category,...fields})}));
 assert.deepEqual(validate('gourmet'),[[],'']);
 for(const [category,items] of Object.entries(taxonomy)){
  const selected=items.map(item=>item.id);
  assert.deepEqual(validate(category,{subcategories:selected,subcategoryOther:'A local place'}),[selected,'A local place']);
 }
 for(const subcategories of ['nature',{id:'nature'},['restaurants'],[42],['missing']]){
  assert.equal(validate('sight',{subcategories}).code,'invalidSubcategories');
 }
 assert.equal(validate('sight',{subcategories:['other'],subcategoryOther:'  '}).code,'subcategoryOtherRequired');
 assert.equal(validate('sight',{subcategories:['other'],subcategoryOther:'x'.repeat(501)}).code,'requiredFields');
 assert.deepEqual(validate('sight',{subcategories:['nature','nature'],subcategoryOther:'Hidden text'}),[['nature'],'']);
});

test('the preflight core remains compatible with the deployed older Scout entry point',()=>{
 const fields={scoutName:'Test scout',category:'sight',title:'Test place',country:'Italy',latitude:42,longitude:12,description:'Test description',parking:'',booking:'',subcategories:['nature']};
 const result=JSON.parse(execFileSync(process.env.PHP_BINARY||'php',['-r',"require 'public/api/scout-core.php'; $body=json_decode(stream_get_contents(STDIN),true); echo json_encode([mlt_scout_fields($body),mlt_scout_fields($body,true)]);"],{cwd:new URL('../',import.meta.url),encoding:'utf8',input:JSON.stringify(fields)}));
 assert.equal(result[0].length,11);assert.deepEqual(result[1].slice(0,11),result[0]);
 assert.deepEqual(JSON.parse(result[1][11]),['nature']);assert.equal(result[1][12],'');
});
