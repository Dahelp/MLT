// Isolated UI fixtures: never logs in to real accounts or reads production data.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.MLT_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QA_BASE||'http://127.0.0.1:4297';
const output='../output/marketing-2026-11-24';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...process.env.MLT_BROWSER_EXECUTABLE&&{executablePath:process.env.MLT_BROWSER_EXECUTABLE}});
const groups=(rows)=>({state:'ready',rows:rows.map(([key,count])=>({key,count}))});
const fixture={operator:{name:'MLT Marketing',role:'marketer'},period:{days:30,start:'2026-10-25',endExclusive:'2026-11-24'},journeys:{total:60,paid:20,conversion:33.3,averageDays:9.5,collections:groups([['freedom',30],['signature',20],['private',10]]),statuses:groups([['requested',30],['paid',20],['cancelled',10]]),months:groups([['2026-10',25],['2026-11',35]]),duration:groups([['short',20],['medium',30],['long',10]])},registrations:groups([['ru',30],['en',20]]),inquiries:groups([['acquisitions',25],['investments',10]]),chats:groups([['sales',20],['concierge',15]]),scout:groups([['approved',10],['pending',5]]),receipts:{state:'ready',rows:[{currency:'EUR',amount:30000}]},vouchers:{state:'ready',units:10,cashCents:500000}};
const errors=[],results=[];
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});let mode='success';let requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{localStorage.setItem('mlt-account-token','ui-fixture');localStorage.setItem('mlt-operations-locale','ru');localStorage.setItem('mlt-cookie-consent',JSON.stringify({choice:'essential',analytics:false}));});
  await page.route('**/api/**',async route=>{
   const url=route.request().url();requests.push(url);
   if(url.includes('marketing.php')){
    const days=route.request().postDataJSON().days;
    if(mode==='slow')await new Promise(r=>setTimeout(r,1200));
    if(mode==='network')return route.abort();
    if(mode==='error')return route.fulfill({status:503,json:{error:'Service unavailable'}});
    if(mode==='denied')return route.fulfill({status:403,json:{error:'Denied'}});
    if(mode==='expired')return route.fulfill({status:401,json:{error:'Sign in'}});
    let data=structuredClone(fixture);data.period.days=days;
    if(mode==='empty'){data.journeys.total=0;data.journeys.paid=0;data.journeys.conversion=null;data.journeys.averageDays=null;for(const key of ['collections','statuses','months','duration'])data.journeys[key]=groups([]);for(const key of ['registrations','inquiries','chats','scout'])data[key]=groups([]);data.receipts.rows=[];data.vouchers.units=0;data.vouchers.cashCents=0;}
    if(mode==='suppressed'){data.journeys.total=null;data.journeys.paid=null;data.journeys.conversion=null;data.journeys.averageDays=null;for(const key of ['collections','statuses','months','duration'])data.journeys[key]={state:'suppressed',rows:[]};data.scout={state:'unavailable'};}
    return route.fulfill({json:data});
   }
   if(url.includes('operator-session'))return route.fulfill({json:{operator:page.url().includes('/admin/')?{name:'MLT Admin',role:'admin'}:fixture.operator}});
   if(new URL(url).pathname==='/api/account.php')return route.fulfill({json:{user:{role:'marketer',locale:'ru',firstName:'MLT',lastName:'Marketing',email:'test@example.invalid'},orders:[]}});
   if(url.includes('concierge-account'))return route.fulfill({json:{operator:{name:'MLT Admin',role:'admin'},summary:{total:0,paid:0,pending:0,revenue:0},orders:[]}});
   if(url.includes('chat.php'))return route.fulfill({json:{unread:0}});
   return route.fulfill({json:{}});
  });
  await page.goto(base+'/marketing/',{waitUntil:'networkidle'});await page.getByRole('heading',{name:'Аналитика маркетинга',exact:true}).waitFor();await page.locator('.marketing-metrics').waitFor();
  assert.equal(await page.locator('.marketing-metrics article').count(),4);
  assert.equal(await page.locator('.staff-notifications').count(),0);
  assert.ok(!requests.some(url=>/chat.php|concierge-account|admin-users/.test(url)),'Marketing must never request raw client APIs');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal page overflow');
  await page.screenshot({path:`${output}/marketing-${width}.png`,fullPage:true});
  if(width===390){await page.getByRole('button',{name:'Развернуть меню'}).click();await page.locator('.staff-sidebar a[aria-current=page]').waitFor({state:'visible'});await page.keyboard.press('Escape');assert.equal(await page.locator('main').getAttribute('data-mobile-open'),'false');}
  await page.getByRole('button',{name:'90 дней',exact:true}).focus();await page.keyboard.press('Enter');await page.waitForURL(/days=90/);await page.locator('.marketing-metrics').waitFor();assert.equal(await page.getByRole('button',{name:'90 дней',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'Язык',exact:true}).click();await page.locator('.staff-topbar-popover button').filter({hasText:'DE'}).click();await page.getByRole('heading',{name:'Marketinganalyse',exact:true}).waitFor();
  await page.getByRole('button',{name:'Sprache',exact:true}).click();await page.locator('.staff-topbar-popover button').filter({hasText:'EN'}).click();await page.getByRole('heading',{name:'Marketing analytics',exact:true}).waitFor();
  await page.getByRole('button',{name:'Language',exact:true}).click();await page.locator('.staff-topbar-popover button').filter({hasText:'RU'}).click();
  for(const next of ['slow','empty','suppressed','error','network','denied','expired']){
   mode=next;await page.getByRole('button',{name:'Обновить',exact:true}).click();
   if(mode==='slow'){await page.getByRole('heading',{name:'Загружаем данные…',exact:true}).waitFor();}
   if(['error','network','denied','expired'].includes(mode)){await page.getByRole('alert').waitFor();assert.equal(await page.locator('.marketing-metrics').count(),0);}else{await page.locator('.marketing-metrics').waitFor();}
   if(mode==='empty')assert.ok(await page.getByText('За этот период записей нет.',{exact:true}).count()>0);
   if(mode==='suppressed')assert.ok(await page.getByText('Источник пока недоступен.',{exact:true}).count()>0);
   mode='success';if(next==='error'||next==='network')await page.getByRole('button',{name:'Повторить',exact:true}).click();else await page.getByRole('button',{name:'Обновить',exact:true}).click();await page.locator('.marketing-metrics').waitFor();
  }
  await page.goto(base+'/admin/overview/',{waitUntil:'networkidle'});await page.locator('.concierge-stats').waitFor();await page.screenshot({path:`${output}/sibling-admin-${width}.png`,fullPage:true});
  await page.goto(base+'/account/',{waitUntil:'networkidle'});await page.waitForURL(/\/marketing\/$/);await page.locator('.marketing-metrics').waitFor();
  results.push({width,states:['success','loading','empty','suppressed','unavailable','503','network','403','401','retry'],locales:['ru','de','en'],overflow:false});await page.close();
 }
 assert.deepEqual(errors,[]);await writeFile(`${output}/browser-results.json`,JSON.stringify({results,errors,fixture:true},null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close()}
