import assert from 'node:assert/strict';
import test from 'node:test';
import {enableScrollReveal} from '../app/scrollReveal.ts';

const options={selector:'[data-reveal]',enabledClass:'enabled',visibleClass:'visible',rootMargin:'0px 0px -8% 0px',threshold:.12};
function setup(reduced=false){
 const saved={window:globalThis.window,observer:globalThis.IntersectionObserver};
 const item=top=>({getBoundingClientRect:()=>({top}),classList:new Set()});
 const items=[item(-50),item(500),item(999),item(1000),item(1500)],events=[];
 let callback;
 globalThis.window={innerHeight:1000,matchMedia:()=>({matches:reduced})};
 globalThis.IntersectionObserver=class{
  constructor(fn,config){callback=fn;assert.equal(config.rootMargin,options.rootMargin)}
  observe(item){events.push(['observe',item])}
  unobserve(item){events.push(['unobserve',item])}
  disconnect(){events.push(['disconnect'])}
 };
 const classes=new Set();
 const root={querySelectorAll:()=>items,classList:{add(name){
  // Enabling CSS must never hide any content already inside the viewport.
  for(const item of items.slice(0,3))assert.ok(item.classList.has('visible'));
  classes.add(name);
 },remove(name){classes.delete(name)}}};
 return {root,items,classes,events,enter(entries){callback(entries)},restore(){globalThis.window=saved.window;globalThis.IntersectionObserver=saved.observer}};
}

test('hydration preserves every painted reveal item, including the bottom edge of the viewport',()=>{
 const s=setup();try{
  const cleanup=enableScrollReveal(s.root,options);
  assert.ok(s.classes.has('enabled'));
  assert.deepEqual(s.events,[['observe',s.items[3]],['observe',s.items[4]]]);
  assert.ok(!s.items[3].classList.has('visible'));
  cleanup();assert.ok(!s.classes.has('enabled'));assert.deepEqual(s.events.at(-1),['disconnect']);
 }finally{s.restore()}
});

test('off-screen items reveal only on intersection and are then unobserved',()=>{
 const s=setup();try{
  enableScrollReveal(s.root,options);
  s.enter([{target:s.items[3],isIntersecting:false}]);assert.ok(!s.items[3].classList.has('visible'));
  s.enter([{target:s.items[3],isIntersecting:true}]);assert.ok(s.items[3].classList.has('visible'));
  assert.deepEqual(s.events.at(-1),['unobserve',s.items[3]]);
 }finally{s.restore()}
});

test('reduced motion and an absent page leave server-rendered content untouched',()=>{
 const s=setup(true);try{
  assert.equal(enableScrollReveal(s.root,options),undefined);assert.equal(s.classes.size,0);assert.deepEqual(s.events,[]);
  assert.equal(enableScrollReveal(null,options),undefined);
 }finally{s.restore()}
});
