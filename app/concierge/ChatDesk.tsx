"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type Conversation={id:number;name:string;email:string;locale:string;status:string;unread_operator:number;last_message:string;last_message_at:string};
type Message={id:number;sender_type:"client"|"operator";sender_name:string;body:string;created_at:string};
type DeskData={operator:{name:string;role:"admin"|"manager"};conversations:Conversation[];conversation:Conversation|null;messages:Message[];unread:number;operatorsOnline:number};

async function chatApi(action:string,payload:Record<string,unknown>={}){const token=localStorage.getItem("mlt-account-token")||"";const response=await fetch("/api/chat.php",{method:"POST",cache:"no-store",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({action,...payload})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Request failed");return data as DeskData;}

export default function ChatDesk(){
 const [data,setData]=useState<DeskData|null>(null),[selected,setSelected]=useState(0),[error,setError]=useState(""),[sending,setSending]=useState(false),[search,setSearch]=useState("");
 const unreadRef=useRef(0),listRef=useRef<HTMLDivElement>(null);
 const notify=(next:number)=>{if(next<=unreadRef.current)return;try{const context=new AudioContext();const oscillator=context.createOscillator(),gain=context.createGain();oscillator.frequency.value=620;gain.gain.value=.04;oscillator.connect(gain);gain.connect(context.destination);oscillator.start();oscillator.stop(context.currentTime+.16);}catch{}if(Notification.permission==="granted")new Notification("MLT Chat",{body:"Новое сообщение от клиента"});};
 const load=useCallback(async(id=selected)=>{try{const next=await chatApi("operator_sync",id?{conversationId:id}:{});notify(next.unread);unreadRef.current=next.unread;setData(next);setError("");}catch(reason){setError(reason instanceof Error?reason.message:"Chat unavailable")}},[selected]);
 useEffect(()=>{load();const timer=window.setInterval(()=>load(),3000);return()=>window.clearInterval(timer)},[load]);
 useEffect(()=>{if(listRef.current)listRef.current.scrollTop=listRef.current.scrollHeight},[data?.messages.length,selected]);
 const choose=(id:number)=>{setSelected(id);load(id)};
 const send=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();const form=event.currentTarget,message=new FormData(form).get("message");setSending(true);try{const next=await chatApi("operator_send",{conversationId:selected,message});setData(next);form.reset();}catch(reason){setError(reason instanceof Error?reason.message:"Could not send")}finally{setSending(false)}};
 if(error&&!data)return <main className="chat-desk-gate"><section><img src="/mlt-logo.svg?v=20261006-vector" alt="MLT"/><h1>Chat access restricted</h1><p>{error}</p><a href="/account/">Sign in →</a></section></main>;
 if(!data)return <main className="concierge-loading"/>;
 const shown=data.conversations.filter(item=>`${item.name} ${item.email}`.toLowerCase().includes(search.toLowerCase()));
 return <main className="chat-desk">
  <header className="chat-desk-top"><a href="/"><img src="/mlt-logo.svg?v=20261006-vector" alt="MLT"/></a><div><span className="chat-live-dot"/>Live chat desk</div><nav>{data.operator.role==="admin"&&<a href="/concierge/overview/">Admin panel</a>}<button onClick={()=>Notification.requestPermission()}>Enable notifications</button><button onClick={()=>{localStorage.removeItem("mlt-account-token");location.assign("/account/")}}>Sign out</button></nav></header>
  <section className="chat-desk-body"><aside className="chat-client-list"><header><p>MLT / SUPPORT</p><h1>Messages <b>{data.unread}</b></h1><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search clients"/></header><div>{shown.map(item=><button key={item.id} className={selected===item.id?"active":""} onClick={()=>choose(item.id)}><span>{item.name.split(" ").map(part=>part[0]).slice(0,2).join("")}</span><div><strong>{item.name}</strong><p>{item.last_message}</p><time>{new Date(item.last_message_at.replace(" ","T")).toLocaleString([], {day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</time></div>{Number(item.unread_operator)>0&&<b>{item.unread_operator}</b>}</button>)}</div></aside>
  <section className="chat-thread">{data.conversation?<><header><div><small>CLIENT</small><h2>{data.conversation.name}</h2><a href={`mailto:${data.conversation.email}`}>{data.conversation.email}</a></div><span>{data.conversation.locale.toUpperCase()} · {data.conversation.status}</span></header><div className="chat-thread-messages" ref={listRef}>{data.messages.map(message=><article key={message.id} className={message.sender_type}><div><strong>{message.sender_name}</strong><time>{new Date(message.created_at.replace(" ","T")).toLocaleString()}</time></div><p>{message.body}</p></article>)}</div><form onSubmit={send}><textarea required name="message" maxLength={4000} placeholder="Write a reply…"/><button disabled={sending}>{sending?"Sending…":"Send reply →"}</button></form></>:<div className="chat-thread-empty"><span>✦</span><h2>Select a conversation</h2><p>New client messages appear here automatically.</p></div>}</section></section>
 </main>;
}
