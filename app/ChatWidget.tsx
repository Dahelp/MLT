"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {publicChatDepartment} from "../content/chat-departments";
import { usePathname } from "next/navigation";
import { OPEN_CONCIERGE_CHAT } from "./ChatLink";

type ChatMessage = { id:number; sender_type:"client"|"operator"; sender_name:string; body:string; created_at:string };
type ChatState = { conversation?:{ id:number; name:string; email:string; status:string; department:"concierge"|"sales" }; messages:ChatMessage[]; unread:number; operatorsOnline:number };

const copy = {
  en:{title:"Write to a manager",subtitle:"MLT private support",name:"Name",email:"Email",message:"Message",send:"Send message",sending:"Sending…",placeholder:"How can we help?",agreement:"By sending a message, you agree to our Privacy Policy and Terms.",online:"A manager is online",fallback:"Our managers are away. An administrator will reply as soon as possible.",reply:"Write a reply…",error:"Could not send the message. Please try again.",minimize:"Minimize chat",open:"Open chat"},
  de:{title:"Manager kontaktieren",subtitle:"Privater MLT Support",name:"Name",email:"E-Mail",message:"Nachricht",send:"Nachricht senden",sending:"Wird gesendet…",placeholder:"Wie können wir helfen?",agreement:"Mit dem Absenden stimmen Sie unserer Datenschutzerklärung und unseren Bedingungen zu.",online:"Ein Manager ist online",fallback:"Unsere Manager sind nicht online. Ein Administrator antwortet so bald wie möglich.",reply:"Antwort schreiben…",error:"Die Nachricht konnte nicht gesendet werden.",minimize:"Chat minimieren",open:"Chat öffnen"},
  ru:{title:"Написать менеджеру",subtitle:"Персональная поддержка MLT",name:"Имя",email:"Почта",message:"Сообщение",send:"Отправить",sending:"Отправляем…",placeholder:"Чем мы можем помочь?",agreement:"Отправляя сообщение, вы соглашаетесь с Политикой конфиденциальности и Условиями.",online:"Менеджер сейчас онлайн",fallback:"Менеджеры не в сети. Администратор ответит вам в ближайшее время.",reply:"Напишите ответ…",error:"Не удалось отправить сообщение. Попробуйте ещё раз.",minimize:"Свернуть чат",open:"Открыть чат"},
  it:{title:"Scrivi a un manager",subtitle:"Assistenza privata MLT",name:"Nome",email:"Email",message:"Messaggio",send:"Invia messaggio",sending:"Invio…",placeholder:"Come possiamo aiutarti?",agreement:"Inviando un messaggio accetti la nostra Informativa sulla privacy e i Termini.",online:"Un manager è online",fallback:"Un amministratore risponderà appena possibile.",reply:"Scrivi una risposta…",error:"Impossibile inviare il messaggio. Riprova.",minimize:"Riduci la chat",open:"Apri la chat"},
  pl:{title:"Napisz do menedżera",subtitle:"Prywatne wsparcie MLT",name:"Imię",email:"Email",message:"Wiadomość",send:"Wyślij wiadomość",sending:"Wysyłanie…",placeholder:"Jak możemy pomóc?",agreement:"Wysyłając wiadomość, akceptujesz Politykę prywatności i Regulamin.",online:"Menedżer jest online",fallback:"Administrator odpowie tak szybko, jak to możliwe.",reply:"Napisz odpowiedź…",error:"Nie udało się wysłać wiadomości. Spróbuj ponownie.",minimize:"Zwiń czat",open:"Otwórz czat"},
} as const;

function getLocale(pathname:string){const code=pathname.split("/")[1];return code==="ru"||code==="de"||code==="it"||code==="pl"?code:"en";}
function api(body:Record<string,unknown>){const accountToken=localStorage.getItem("mlt-account-token")||"";return fetch("/api/chat.php",{method:"POST",cache:"no-store",headers:{"Content-Type":"application/json",Authorization:`Bearer ${accountToken}`},body:JSON.stringify(body)}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error||"Chat request failed");return data as ChatState&{token?:string};});}

export default function ChatWidget(){
  const pathname=usePathname()||"/";
  const department=publicChatDepartment(pathname);
  return <ChatSession key={department} pathname={pathname} department={department}/>;
}
function ChatSession({pathname,department}:{pathname:string;department:"concierge"|"sales"}){
  const locale=getLocale(pathname),t=copy[locale];
  const tokenKey=department==="sales"?"mlt-chat-token-sales":"mlt-chat-token";
  const team={en:["Motorhomes, capsule homes & investments","Your MLT journey team"],de:["Wohnmobile, Kapselhäuser & Investitionen","Ihr MLT Reiseteam"],ru:["Автодома, капсулы и инвестиции","Ваша команда путешествий MLT"],it:["Camper, case capsula e investimenti","Il team viaggi MLT"],pl:["Kampery, domy kapsułowe i inwestycje","Twój zespół podróży MLT"]}[locale];
  const online={en:"Always online",de:"Immer online",ru:"Всегда онлайн",it:"Sempre online",pl:"Zawsze online"}[locale];
  const title=department==="sales"?"MLT Manager":"MLT Concierge";
  const [open,setOpen]=useState(false),[state,setState]=useState<ChatState>({messages:[],unread:0,operatorsOnline:0}),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const listRef=useRef<HTMLDivElement>(null);
  const hidden=["/admin","/manager","/concierge","/sales","/scout-passport"].some(section=>pathname===section||pathname.startsWith(`${section}/`))||/^\/(?:en\/|de\/|ru\/|it\/|pl\/)?scout-passport(?:\/|$)/.test(pathname)||pathname.startsWith("/mobile-preview");
  const isCollectionPage=pathname.includes("/collections/");
  const sync=useCallback(async(markRead=false)=>{const token=localStorage.getItem(tokenKey)||"";try{const data=await api(token?{action:"sync",token,markRead,department}:{action:"status",department});setState(data);setError("");}catch{/* keep chat available during transient network errors */}},[department,tokenKey]);
  useEffect(()=>{if(hidden)return;sync(open);const timer=window.setInterval(()=>sync(open),open?3000:9000);return()=>window.clearInterval(timer)},[hidden,open,sync]);
  useEffect(() => {
    if (hidden || department !== "concierge") return;
    const openChat = () => { setOpen(true); void sync(true); };
    window.addEventListener(OPEN_CONCIERGE_CHAT, openChat);
    return () => window.removeEventListener(OPEN_CONCIERGE_CHAT, openChat);
  }, [hidden, department, sync]);
  useEffect(()=>{if(open)requestAnimationFrame(()=>{if(listRef.current)listRef.current.scrollTop=listRef.current.scrollHeight})},[open,state.messages.length]);
  useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false)};document.addEventListener("keydown",close);return()=>document.removeEventListener("keydown",close)},[]);
  const submit=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();const formElement=event.currentTarget;setBusy(true);setError("");const form=new FormData(formElement);const existing=localStorage.getItem(tokenKey)||"";try{const data=await api(existing&&state.conversation?{action:"send",token:existing,message:form.get("message")}:{action:"start",name:form.get("name"),email:form.get("email"),message:form.get("message"),locale,department});if(data.token)localStorage.setItem(tokenKey,data.token);setState(data);formElement.reset();}catch{setError(t.error)}finally{setBusy(false)}};
  if(hidden)return null;
  return <div className={`mlt-chat-widget is-online ${open?"is-open":""} ${isCollectionPage?"is-collection-page":""}`}>
    {!open&&<button className="mlt-chat-launcher" type="button" onClick={()=>{setOpen(true);sync(true)}} aria-label={t.open}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15a3 3 0 0 1-3 3H9l-5 3v-3.5A3 3 0 0 1 3 15V7a3 3 0 0 1 3-3h14z"/><path d="M7 10h10M7 14h6"/></svg>{state.unread>0&&<span>{state.unread>99?"99+":state.unread}</span>}</button>}
    {open&&<section className="mlt-chat-panel" role="dialog" aria-modal="false" aria-label={title}>
      <header><div><small>{team[department==="sales"?0:1]}</small><h2>{title}</h2><p className="online"><i/>{online}</p></div><button type="button" onClick={()=>setOpen(false)} aria-label={t.minimize}>—</button></header>
      {state.conversation?<><div className="mlt-chat-messages" ref={listRef} aria-live="polite">{state.messages.map(message=><article key={message.id} className={message.sender_type}><div><strong>{message.sender_type==="client"?state.conversation?.name:message.sender_name||"MLT"}</strong><time>{new Date(message.created_at.replace(" ","T")+"Z").toLocaleTimeString(locale,{hour:"2-digit",minute:"2-digit"})}</time></div><p>{message.body}</p></article>)}</div><form className="mlt-chat-reply" onSubmit={submit}><textarea name="message" required maxLength={4000} placeholder={t.reply}/><button disabled={busy} aria-label={t.send}><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-8-8 18-2-8-8-2Z"/><path d="m11 13 5-5"/></svg></button></form></>:<form className="mlt-chat-form" onSubmit={submit}><label>{t.name}<input name="name" required maxLength={120} autoComplete="name"/></label><label>{t.email}<input name="email" required type="email" maxLength={160} autoComplete="email"/></label><label>{t.message}<textarea name="message" required maxLength={4000} placeholder={t.placeholder}/></label><button className="bronze-button" disabled={busy}>{busy?t.sending:t.send}</button></form>}
      {error&&<p className="mlt-chat-error" role="alert">{error}</p>}
      <p className="mlt-chat-agreement">{t.agreement} <a href={`/${locale}/legal/privacy/`}>Privacy</a> · <a href={`/${locale}/legal/terms/`}>Terms</a></p>
    </section>}
  </div>;
}
