// All accounts and responses are fixtures; no production account is created.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.MLT_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...process.env.MLT_BROWSER_EXECUTABLE&&{executablePath:process.env.MLT_BROWSER_EXECUTABLE}});
const base=process.env.QA_BASE||'http://127.0.0.1:4207';
const output='../output/team-marketer-2026-11-25';await mkdir(output,{recursive:true});
const operator={name:'MLT Administrator',role:'admin'};
const errors=[];
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:1000}});let saved=null,failSave=true;
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{localStorage.setItem('mlt-account-token','team-ui-fixture');localStorage.setItem('mlt-operations-locale','ru');localStorage.setItem('mlt-cookie-consent',JSON.stringify({choice:'essential',analytics:false}));});
  await page.route('**/api/**',async route=>{
   const endpoint=new URL(route.request().url()).pathname;let body={};try{body=route.request().postDataJSON()||{}}catch{}
   if(endpoint.endsWith('/operator-session.php'))return route.fulfill({json:{operator}});
   if(endpoint.endsWith('/concierge-account.php'))return route.fulfill({json:body.action==='team'?{team:[]}:{operator,summary:{total:0,paid:0,pending:0,revenue:0},orders:[]}});
   if(endpoint.endsWith('/admin-users.php')){
    if(body.action==='save'){saved=body;if(failSave)return route.fulfill({status:503,json:{error:'Временная ошибка'}});return route.fulfill({json:{id:42}})}
    if(body.action==='detail')return route.fulfill({json:{user:{...saved,id:42,created_at:'2026-11-25'},orders:[],inquiries:[],chats:[]}});
    return route.fulfill({json:{operator,users:[],total:0,page:1}});
   }
   return route.fulfill({json:{unread:0}});
  });
  await page.goto(base+'/admin/team/',{waitUntil:'networkidle'});
  await page.getByText('Маркетолог ещё не назначен.',{exact:true}).waitFor();
  const create=page.getByRole('link',{name:'Добавить маркетолога',exact:true});assert.equal(await create.getAttribute('href'),'/admin/users/?create=marketer');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:`${output}/team-${width}.png`,fullPage:true});
  await create.click();await page.waitForURL(/create=marketer/);
  let form=page.locator('.users-form');await form.waitFor();assert.equal(await form.getByRole('combobox',{name:'Доступ',exact:true}).inputValue(),'marketer');
  await page.reload({waitUntil:'networkidle'});form=page.locator('.users-form');await form.waitFor();assert.equal(await form.getByRole('combobox',{name:'Доступ',exact:true}).inputValue(),'marketer');
  await page.screenshot({path:`${output}/create-${width}.png`,fullPage:true});
  await form.getByRole('button',{name:'Отмена',exact:true}).click();assert.equal(new URL(page.url()).searchParams.has('create'),false);assert.equal(await page.locator('.users-form').count(),0);
  await page.getByRole('button',{name:'Создать пользователя'}).click();form=page.locator('.users-form');assert.equal(await form.getByRole('combobox',{name:'Доступ',exact:true}).inputValue(),'traveller');
  await form.getByRole('combobox',{name:'Доступ',exact:true}).selectOption('marketer');
  await form.getByLabel('Имя',{exact:true}).fill('Test');await form.getByLabel('Фамилия',{exact:true}).fill('Marketer');await form.getByLabel('Email',{exact:true}).fill('marketer@example.invalid');await form.getByLabel('Пароль',{exact:true}).fill('Test-marketer-password');
  await form.getByRole('button',{name:'Сохранить',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(await form.getByRole('combobox',{name:'Доступ',exact:true}).inputValue(),'marketer');
  failSave=false;await form.getByRole('button',{name:'Сохранить',exact:true}).click();await page.waitForURL(/user=42/);await page.locator('.users-profile').waitFor();assert.equal(saved.role,'marketer');assert.equal(new URL(page.url()).searchParams.has('create'),false);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.close();
 }
 assert.deepEqual(errors,[]);console.log('Team → add marketer → preselected role → reload/cancel → save error/retry → saved profile passed at 1440/390 px.');
}finally{await browser.close()}
