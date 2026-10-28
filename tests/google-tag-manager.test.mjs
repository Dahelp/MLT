import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {googleTagManagerScript, googleTagManagerId} from '../app/googleTagManager.ts';

function browser(saved=null,blocked=false){
 const scripts=[],listeners={},dataLayer=[{existing:'preserved'}];
 const window={dataLayer,localStorage:{getItem(){if(blocked)throw new Error('Storage blocked');return saved;}},addEventListener(name,fn){listeners[name]=fn;}};
 const first={parentNode:{insertBefore(script){scripts.push(script);}}};
 const document={getElementsByTagName(){return [first];},createElement(){return {};}};
 const context=vm.createContext({window,document});
 vm.runInContext(googleTagManagerScript,context);
 const consent=()=>Array.from(dataLayer).filter(x=>x[0]==='consent').map(x=>Array.from(x));
 return {window,scripts,listeners,dataLayer,context,consent,save(value){saved=value;},change(analytics){listeners['mlt-consent-change']({detail:{analytics}});}};
}

test('new visitors and rejected, corrupt or inaccessible choices never load GTM',()=>{
 for(const [saved,blocked] of [[null,false],['bad json',false],['false',false],[JSON.stringify({choice:'essential',analytics:false}),false],[JSON.stringify({choice:'preferences',analytics:false}),false],[JSON.stringify({choice:'essential',analytics:true}),false],[JSON.stringify({choice:'unknown',analytics:true}),false],[null,true]]){
  const b=browser(saved,blocked);assert.equal(b.scripts.length,0);assert.equal(b.dataLayer[0].existing,'preserved');
  assert.equal(b.consent()[0][1],'default');assert.deepEqual(Object.values(b.consent()[0][2]),['denied','denied','denied','denied']);
 }
});

test('acceptance queues all four consent signals before loading exactly one container',()=>{
 const b=browser();b.change(true);b.change(true);
 assert.equal(b.scripts.length,1);assert.equal(b.scripts[0].src,`https://www.googletagmanager.com/gtm.js?id=${googleTagManagerId}`);assert.equal(b.scripts[0].async,true);
 const start=b.dataLayer.findIndex(x=>x.event==='gtm.js'),grant=b.dataLayer.findIndex(x=>x[0]==='consent'&&x[1]==='update');assert.ok(grant<start);
 assert.deepEqual(Object.values(b.consent()[1][2]),['granted','granted','granted','granted']);
 b.change(false);assert.deepEqual(Object.values(b.consent().at(-1)[2]),['denied','denied','denied','denied']);assert.equal(b.scripts.length,1);
});

test('returning visitors load GTM from an explicit saved analytics choice',()=>{
 for(const choice of ['all','preferences']){const b=browser(JSON.stringify({choice,analytics:true}));assert.equal(b.scripts.length,1);assert.equal(b.dataLayer.filter(x=>x.event==='gtm.js').length,1);}
});

test('a blocked storage API still allows the current visitor to grant consent',()=>{
 const b=browser(null,true);b.change(true);assert.equal(b.scripts.length,1);
});

test('another tab updates consent, and rerunning the head bootstrap cannot duplicate GTM',()=>{
 const b=browser();b.save(JSON.stringify({choice:'all',analytics:true}));b.listeners.storage({key:'unrelated'});assert.equal(b.scripts.length,0);
 b.listeners.storage({key:'mlt-cookie-consent'});assert.equal(b.scripts.length,1);
 const count=b.dataLayer.length;vm.runInContext(googleTagManagerScript,b.context);assert.equal(b.scripts.length,1);assert.equal(b.dataLayer.length,count);
 b.save(JSON.stringify({choice:'essential',analytics:false}));b.listeners.storage({key:'mlt-cookie-consent'});assert.equal(b.consent().at(-1)[2].analytics_storage,'denied');
});
