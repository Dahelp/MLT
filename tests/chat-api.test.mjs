import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,cp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
const php=process.env.PHP_BINARY||'php';
test('chat queues enforce server authorization and retain existing conversations',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'mlt-chat-'));
 for(const file of ['chat.php','chat-access.php'])await cp(new URL('../public/api/'+file,import.meta.url),path.join(directory,file));
 await cp(new URL('./chat-test-booking.php',import.meta.url),path.join(directory,'booking.php'));
 const port=await new Promise(resolve=>{const server=createServer();server.listen(0,'127.0.0.1',()=>{const port=server.address().port;server.close(()=>resolve(port))})});
 const server=spawn(php,['-S',`127.0.0.1:${port}`,'-t',directory],{stdio:['ignore','ignore','pipe']});let log='';server.stderr.on('data',data=>log+=data);
 const request=async(body,role)=>{const response=await fetch(`http://127.0.0.1:${port}/chat.php`,{method:'POST',headers:{'Content-Type':'application/json',...(role?{Authorization:`Bearer test-${role}-token`}:{})},body:JSON.stringify(body)});const raw=await response.text();let data;try{data=JSON.parse(raw.replace(/^\uFEFF/,''))}catch{throw Error(raw+'\n'+log)}return {status:response.status,data}};
 try{
  for(let i=0;i<50;i++){try{await request({action:'status',department:'sales'});break}catch{await new Promise(resolve=>setTimeout(resolve,100))}}
  const start=department=>request({action:'start',department,name:department+' guest',email:department+'@example.test',message:'Local routing test',locale:'it'});
  const sales=await start('sales'),concierge=await start('concierge');assert.equal(sales.status,200);assert.equal(concierge.status,200);assert.equal(sales.data.conversation.department,'sales');assert.equal(concierge.data.conversation.department,'concierge');
  for(const role of ['manager','salesmanager','concierge']){const result=await request({action:'operator_sync'},role);assert.equal(result.status,200);assert.ok(result.data.conversations.every(c=>c.department===(role==='concierge'?'concierge':'sales')))}
  const admin=await request({action:'operator_sync'},'admin');assert.equal(admin.data.conversations.length,3);assert.ok(admin.data.conversations.some(c=>c.name==='Legacy Guest'&&c.department==='concierge'));
  assert.equal((await request({action:'operator_sync',department:'all'},'manager')).status,403);
  assert.equal((await request({action:'operator_sync'},'traveller')).status,403);
  assert.equal((await request({action:'operator_sync'})).status,403);
  for(const action of ['operator_sync','operator_send','operator_close']){
   assert.equal((await request({action,conversationId:concierge.data.conversation.id,message:'Forbidden'},'manager')).status,404);
   assert.equal((await request({action,conversationId:sales.data.conversation.id,message:'Forbidden'},'concierge')).status,404);
  }
  const unreadCheck=await request({action:'operator_sync'},'admin');for(const id of [sales.data.conversation.id,concierge.data.conversation.id])assert.equal(Number(unreadCheck.data.conversations.find(c=>c.id===id).unread_operator),1);
  const unchanged=await request({action:'sync',token:concierge.data.token});assert.equal(unchanged.data.messages.length,1);assert.equal(unchanged.data.conversation.status,'open');
  assert.equal((await request({action:'send',token:concierge.data.token,department:'sales',message:'Wrong queue'})).status,409);
  const reply=await request({action:'operator_send',department:'sales',conversationId:sales.data.conversation.id,message:'Manager reply'},'manager');assert.equal(reply.status,200);assert.equal(reply.data.messages.at(-1).body,'Manager reply');
  const client=await request({action:'sync',token:sales.data.token});assert.equal(client.data.unread,1);assert.equal(client.data.messages.at(-1).sender_type,'operator');
  const read=await request({action:'sync',token:sales.data.token,markRead:true});assert.equal(read.data.unread,0);
  assert.equal((await request({action:'operator_send',department:'concierge',conversationId:concierge.data.conversation.id,message:'Concierge reply'},'concierge')).status,200);
  const filtered=await request({action:'operator_sync',department:'sales'},'admin');assert.ok(filtered.data.conversations.every(c=>c.department==='sales'));
  assert.equal((await request({action:'operator_sync',department:'concierge',conversationId:sales.data.conversation.id},'admin')).status,404);
  await request({action:'operator_send',conversationId:concierge.data.conversation.id,message:'Admin journey reply'},'admin');
  const beforeSalesReply=await request({action:'operator_sync',department:'sales'},'admin');assert.equal(beforeSalesReply.data.stats.replies,0);assert.equal(beforeSalesReply.data.stats.clients,0);
  assert.equal((await request({action:'operator_send',conversationId:sales.data.conversation.id,message:'Admin reply'},'admin')).status,200);
  const salesStats=await request({action:'operator_sync',department:'sales'},'admin');const journeyStats=await request({action:'operator_sync',department:'concierge'},'admin');assert.equal(salesStats.data.stats.replies,1);assert.equal(salesStats.data.stats.clients,1);assert.equal(journeyStats.data.stats.replies,1);const managerStats=await request({action:'operator_sync'},'manager');assert.equal(managerStats.data.stats.replies,1);
  const legacy=await request({action:'sync',token:'a'.repeat(64)});assert.equal(legacy.data.messages[0].body,'Existing history');
  const first=await request({action:'start',department:'sales',name:'A',email:'a@example.test',message:'Sales'},'traveller');const second=await request({action:'start',department:'concierge',name:'A',email:'a@example.test',message:'Journey'},'traveller');assert.notEqual(first.data.conversation.id,second.data.conversation.id);
  assert.equal((await request({action:'start',department:'unknown',name:'A',email:'a@example.test',message:'Invalid'})).status,400);
 }finally{server.kill();await new Promise(resolve=>server.once('exit',resolve));assert.equal(path.dirname(path.resolve(directory)),path.resolve(tmpdir()));assert.ok(path.basename(directory).startsWith('mlt-chat-'));await rm(directory,{recursive:true,force:true})}
});
