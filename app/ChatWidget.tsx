"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type ChatMessage = { id:number; sender_type:"client"|"operator"; sender_name:string; body:string; created_at:string };
type ChatState = { conversation?:{ id:number; name:string; email:string; status:string }; messages:ChatMessage[]; unread:number; operatorsOnline:number };

const copy = {
  en:{title:"Write to a manager",subtitle:"MLT private support",name:"Name",email:"Email",message:"Message",send:"Send message",sending:"Sending…",placeholder:"How can we help?",agreement:"By sending a message, you agree to our Privacy Policy and Terms.",online:"A manager is online",fallback:"Our managers are away. An administrator will reply as soon as possible.",reply:"Write a reply…",error:"Could not send the message. Please try again.",minimize:"Minimize chat",open:"Open chat"},
  de:{title:"Manager kontaktieren",subtitle:"Privater MLT Support",name:"Name",email:"E-Mail",message:"Nachricht",send:"Nachricht senden",sending:"Wird gesendet…",placeholder:"Wie können wir helfen?",agreement:"Mit dem Absenden stimmen Sie unserer Datenschutzerklärung und unseren Bedingungen zu.",online:"Ein Manager ist online",fallback:"Unsere Manager sind nicht online. Ein Administrator antwortet so bald wie möglich.",reply:"Antwort schreiben…",error:"Die Nachricht konnte nicht gesendet werden.",minimize:"Chat minimieren",open:"Chat öffnen"},
  ru:{title:"Написать менеджеру",subtitle:"Персональная поддержка MLT",name:"Имя",email:"Почта",message:"Сообщение",send:"Отправить",sending:"Отправляем…",placeholder:"Чем мы можем помочь?",agreement:"Отправляя сообщение, вы соглашаетесь с Политикой конфиденциальности и Условиями.",online:"Менеджер сейчас онлайн",fallback:"Менеджеры не в сети. Администратор ответит вам в ближайшее время.",reply:"Напишите ответ…",error:"Не удалось отправить сообщение. Попробуйте ещё раз.",minimize:"Свернуть чат",open:"Открыть чат"},
} as const;

function getLocale(pathname:string){const code=pathname.split("/")[1];return code==="ru"||code==="de"?code:"en";}
function api(body:Record<string,unknown>){const accountToken=localStorage.getItem("mlt-account-token")||"";return fetch("/api/chat.php",{method:"POST",cache:"no-store",headers:{"Content-Type":"application/json",Authorization:`Bearer ${accountToken}`},body:JSON.stringify(body)}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error||"Chat request failed");return data as ChatState&{token?:string};});}

export default function ChatWidget(){
  const pathname=usePathname()||"/";
  const locale=getLocale(pathname),t=copy[locale];
  const [open,setOpen]=useState(false),[state,setState]=useState<ChatState>({messages:[],unread:0,operatorsOnline:0}),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const listRef=useRef<HTMLDivElement>(null);
  const hidden=["/admin","/manager","/concierge"].some(section=>pathname===section||pathname.startsWith(`${section}/`))||pathname.startsWith("/mobile-preview");
  const sync=useCallback(async(markRead=false)=>{const token=localStorage.getItem("mlt-chat-token")||"";if(!token)return;try{const data=await api({action:"sync",token,markRead});setState(data);setError("");}catch{/* keep chat available during transient network errors */}},[]);
  useEffect(()=>{if(hidden)return;sync(open);const timer=window.setInterval(()=>sync(open),open?3000:9000);return()=>window.clearInterval(timer)},[hidden,open,sync]);
  useEffect(()=>{if(open)requestAnimationFrame(()=>{if(listRef.current)listRef.current.scrollTop=listRef.current.scrollHeight})},[open,state.messages.length]);
  useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false)};document.addEventListener("keydown",close);return()=>document.removeEventListener("keydown",close)},[]);
  const submit=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();const formElement=event.currentTarget;setBusy(true);setError("");const form=new FormData(formElement);const existing=localStorage.getItem("mlt-chat-token")||"";try{const data=await api(existing&&state.conversation?{action:"send",token:existing,message:form.get("message")}:{action:"start",name:form.get("name"),email:form.get("email"),message:form.get("message"),locale});if(data.token)localStorage.setItem("mlt-chat-token",data.token);setState(data);formElement.reset();}catch{setError(t.error)}finally{setBusy(false)}};
  if(hidden)return null;
  return <div className={`mlt-chat-widget ${open?"is-open":""}`}>
    {!open&&<button className="mlt-chat-launcher" type="button" onClick={()=>{setOpen(true);sync(true)}} aria-label={t.open}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15a3 3 0 0 1-3 3H9l-5 3v-3.5A3 3 0 0 1 3 15V7a3 3 0 0 1 3-3h14z"/><path d="M7 10h10M7 14h6"/></svg>{state.unread>0&&<span>{state.unread>99?"99+":state.unread}</span>}</button>}
    {open&&<section className="mlt-chat-panel" role="dialog" aria-modal="false" aria-label={t.title}>
      <header><div><small>{t.subtitle}</small><h2>{t.title}</h2><p className={state.operatorsOnline>0?"online":"away"}><i/>{state.operatorsOnline>0?t.online:t.fallback}</p></div><button type="button" onClick={()=>setOpen(false)} aria-label={t.minimize}>—</button></header>
      {state.conversation?<><div className="mlt-chat-messages" ref={listRef} aria-live="polite">{state.messages.map(message=><article key={message.id} className={message.sender_type}><div><strong>{message.sender_type==="client"?state.conversation?.name:message.sender_name||"MLT"}</strong><time>{new Date(message.created_at.replace(" ","T")+"Z").toLocaleTimeString(locale,{hour:"2-digit",minute:"2-digit"})}</time></div><p>{message.body}</p></article>)}</div><form className="mlt-chat-reply" onSubmit={submit}><textarea name="message" required maxLength={4000} placeholder={t.reply}/><button disabled={busy} aria-label={t.send}>→</button></form></>:<form className="mlt-chat-form" onSubmit={submit}><label>{t.name}<input name="name" required maxLength={120} autoComplete="name"/></label><label>{t.email}<input name="email" required type="email" maxLength={160} autoComplete="email"/></label><label>{t.message}<textarea name="message" required maxLength={4000} placeholder={t.placeholder}/></label><button className="bronze-button" disabled={busy}>{busy?t.sending:t.send}</button></form>}
      {error&&<p className="mlt-chat-error" role="alert">{error}</p>}
      <p className="mlt-chat-agreement">{t.agreement} <a href={`/${locale}/legal/privacy/`}>Privacy</a> · <a href={`/${locale}/legal/terms/`}>Terms</a></p>
    </section>}
  </div>;
}
