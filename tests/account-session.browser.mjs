// Run against a local preview or the published static site. All API responses are
// intercepted in the browser; this test never signs in to a real account.
// MLT_PLAYWRIGHT_MODULE and MLT_BROWSER_EXECUTABLE can select an existing runtime.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('.codex_tmp',{recursive:true});
const {chromium}=await import(process.env.MLT_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QA_BASE||'http://127.0.0.1:4297';
const browser=await chromium.launch({headless:true,...process.env.MLT_BROWSER_EXECUTABLE&&{executablePath:process.env.MLT_BROWSER_EXECUTABLE}});
const user={email:'qa@example.invalid',firstName:'QA',lastName:'Client',phone:'',locale:'ru',role:'client'};
const success={user,orders:[]};
const errors=[];
function gate(){let release;const promise=new Promise(resolve=>{release=resolve});return {promise,release}}

async function pageFor(width,token='test-session'){
 const page=await browser.newPage({viewport:{width,height:1000}});
 page.qaLoginPaints=0;
 page.on('console',message=>{if(message.text()==='QA_SIGN_IN_PAINT')page.qaLoginPaints++});
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(token=>{
  if(token)localStorage.setItem('mlt-account-token',token);else localStorage.removeItem('mlt-account-token');
  localStorage.removeItem('mlt-account-draft');
  localStorage.setItem('mlt-cookie-consent',JSON.stringify({choice:'essential',analytics:false}));
  window.qaLoginPaints=0;
  new MutationObserver(()=>{if(document.querySelector('.account-auth,.account-sign-in')){window.qaLoginPaints++;console.debug('QA_SIGN_IN_PAINT')}}).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
 },token);
 await page.route('**/api/**',route=>route.fulfill({json:{points:[],items:[],vouchers:[],pending:[],balance:0,operatorsOnline:0,messages:[]}}));
 return page;
}

async function noLogin(page){
 assert.equal(await page.locator('.account-auth,.account-sign-in').count(),0);
 assert.equal(await page.evaluate(()=>window.qaLoginPaints),0);
 assert.doesNotMatch(await page.locator('main').first().evaluate(el=>getComputedStyle(el).backgroundImage),/account-login-background/);
}

try{
 for(const width of [1440,390]){
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width,height:1000}});
  const staticPage=await context.newPage();
  await staticPage.goto(base+'/ru/account/',{waitUntil:'load'});
  await staticPage.locator('.account-session-status').waitFor();
  assert.equal(await staticPage.locator('.account-auth,input[type=password]').count(),0);
  assert.doesNotMatch(await staticPage.locator('main').evaluate(el=>getComputedStyle(el).backgroundImage),/account-login-background/);
  assert.match(await staticPage.locator('main').innerText(),/Загружаем личный кабинет/);
  await staticPage.screenshot({path:`.codex_tmp/account-session-static-${width}.png`});
  await context.close();

  for(const section of ['', 'profile/', 'journeys/', 'documents/', 'vouchers/']){
   const page=await pageFor(width);
   let pending=gate(),requested=gate();
   await page.route('**/api/account.php',async route=>{requested.release();await pending.promise;await route.fulfill({json:success})});
   for(let refresh=0;refresh<2;refresh++){
    if(refresh){pending=gate();requested=gate();await page.reload({waitUntil:'domcontentloaded'})}
    else await page.goto(`${base}/ru/account/${section}`,{waitUntil:'domcontentloaded'});
    await requested.promise;
    await page.locator('.account-session-status[aria-busy=true]').waitFor();
    await noLogin(page);
    pending.release();
    await page.locator('.account-premium').waitFor();
    await noLogin(page);
   }
   if(!section)await page.screenshot({path:`.codex_tmp/account-session-ready-${width}.png`});
   console.log(`PASS ${width}px account/${section} slow session + reload`);
   await page.close();
  }
 }

 for(const failure of ['server','network','timeout']){
  const page=await pageFor(390);let attempts=0;
  await page.route('**/api/account.php',async route=>{
   attempts++;
   if(attempts>1)return route.fulfill({json:success});
   if(failure==='server')return route.fulfill({status:503,json:{error:'Temporary outage'}});
   if(failure==='network')return route.abort('failed');
   // Leave the request pending to exercise the real session timeout.
  });
  await page.goto(base+'/ru/account/',{waitUntil:'domcontentloaded'});
  await page.locator('.account-session-status[aria-busy=false] [role=alert]').waitFor({timeout:22000});
  await noLogin(page);
  assert.equal(await page.evaluate(()=>localStorage.getItem('mlt-account-token')),'test-session');
  await page.getByRole('button',{name:'Повторить',exact:true}).click();
  await page.locator('.account-premium').waitFor();await noLogin(page);
  console.log(`PASS ${failure} preserves session and retries without sign-in`);await page.close();
 }

 for(const signedIn of [true,false]){
  const page=await pageFor(390,signedIn?'expired-token':null);
  await page.route('**/api/account.php',route=>route.fulfill({status:401,json:{error:'Session expired'}}));
  await page.goto(base+'/ru/account/',{waitUntil:'domcontentloaded'});
  await page.locator('.account-sign-in .account-auth').waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('mlt-account-token')),null);
  assert.equal(await page.locator('input[type=password]').count(),1);
  console.log(`PASS ${signedIn?'expired':'absent'} session shows real sign-in`);await page.close();
 }

 for(const destination of ['/admin/overview/','/ru/vouchers/']){
  const page=await pageFor(1440);
  await page.route('**/api/account.php',route=>route.fulfill({json:{...success,user:{...user,role:destination.startsWith('/admin')?'admin':'client'}}}));
  await page.route(base+destination,async route=>{await new Promise(resolve=>setTimeout(resolve,300));await route.fulfill({contentType:'text/html',body:'<main>Redirect complete</main>'})});
  await page.goto(base+'/ru/account/'+(destination.includes('vouchers')?'?next=%2Fru%2Fvouchers%2F':''),{waitUntil:'domcontentloaded'});
  await page.getByText('Redirect complete').waitFor();
  assert.equal(page.qaLoginPaints,0,'Sign-in must never be mounted while redirecting');
  console.log(`PASS ${destination} redirect has no sign-in flash`);await page.close();
 }
 assert.deepEqual(errors,[]);console.log('Account session browser checks passed');
}finally{await browser.close()}
