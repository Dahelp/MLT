"use client";

import { useCallback, useEffect, useState } from "react";

type Locale="en"|"de"|"ru";
type DashboardData={operator:{name:string;role:string};conversations:Array<{id:number;name:string;last_message:string;last_message_at:string;unread_operator:number}>;unread:number;stats:{replies:number;clients:number;repliesToday:number}};
const copy={
 en:{panel:"MANAGER PANEL",welcome:"Welcome",subtitle:"Your personal chat performance and current client activity.",chat:"Open chat",unread:"Unread messages",clients:"Clients handled",replies:"Replies sent",today:"Replies today",recent:"Recent conversations",empty:"There are no conversations yet.",logout:"Sign out"},
 de:{panel:"MANAGERBEREICH",welcome:"Willkommen",subtitle:"Ihre persönliche Chat-Statistik und aktuelle Kundenaktivität.",chat:"Chat öffnen",unread:"Ungelesene Nachrichten",clients:"Betreute Kunden",replies:"Gesendete Antworten",today:"Antworten heute",recent:"Letzte Konversationen",empty:"Noch keine Konversationen.",logout:"Abmelden"},
 ru:{panel:"ПАНЕЛЬ МЕНЕДЖЕРА",welcome:"Добро пожаловать",subtitle:"Ваша личная статистика чата и текущая активность клиентов.",chat:"Открыть чат",unread:"Непрочитанные сообщения",clients:"Обработано клиентов",replies:"Отправлено ответов",today:"Ответов сегодня",recent:"Последние диалоги",empty:"Диалогов пока нет.",logout:"Выйти"},
} as const;

export default function ManagerDashboard(){
 const [data,setData]=useState<DashboardData|null>(null),[error,setError]=useState(""),[locale,setLocale]=useState<Locale>("en");
 const t=copy[locale];
 useEffect(()=>{const saved=localStorage.getItem("mlt-operations-locale");if(saved==="en"||saved==="de"||saved==="ru")setLocale(saved)},[]);
 const load=useCallback(async()=>{const token=localStorage.getItem("mlt-account-token")||"";if(!token){location.replace(`/account/?next=${encodeURIComponent(location.pathname)}`);return}try{const response=await fetch("/api/chat.php",{method:"POST",cache:"no-store",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({action:"operator_sync"})});const next=await response.json();if(!response.ok)throw new Error(next.error||"Access denied");if(next.operator?.role!=="manager"){location.replace(next.operator?.role==="admin"?"/admin/overview/":"/account/");return}setData(next);setError("")}catch(reason){setError(reason instanceof Error?reason.message:"Dashboard unavailable")}},[]);
 useEffect(()=>{load();const timer=setInterval(load,5000);return()=>clearInterval(timer)},[load]);
 const changeLocale=(next:Locale)=>{setLocale(next);localStorage.setItem("mlt-operations-locale",next)};
 if(error)return <main className="chat-desk-gate"><section><img src="/mlt-logo.svg?v=20261006-vector" alt="MLT"/><h1>{error}</h1><a href="/account/">Sign in →</a></section></main>;
 if(!data)return <main className="concierge-loading"/>;
 return <main className="manager-dashboard">
  <header><a href="/manager/"><img src="/mlt-logo.svg?v=20261006-vector" alt="MLT"/></a><nav><div className="chat-desk-languages">{(["en","de","ru"] as Locale[]).map(item=><button key={item} className={locale===item?"active":""} onClick={()=>changeLocale(item)}>{item.toUpperCase()}</button>)}</div><button onClick={()=>{localStorage.removeItem("mlt-account-token");location.assign("/account/")}}>{t.logout}</button></nav></header>
  <section className="manager-dashboard-content"><div className="manager-welcome"><div><p>{t.panel}</p><h1>{t.welcome}, {data.operator.name.split(" ")[0]}.</h1><span>{t.subtitle}</span></div><a href="/manager/chat/">{t.chat} {data.unread>0&&<b>{data.unread}</b>} →</a></div>
  <div className="manager-stats"><article><small>{t.unread}</small><strong>{data.unread}</strong></article><article><small>{t.clients}</small><strong>{data.stats?.clients||0}</strong></article><article><small>{t.replies}</small><strong>{data.stats?.replies||0}</strong></article><article><small>{t.today}</small><strong>{data.stats?.repliesToday||0}</strong></article></div>
  <section className="manager-recent"><header><p>{t.panel}</p><h2>{t.recent}</h2></header>{data.conversations.length?<div>{data.conversations.slice(0,8).map(item=><a key={item.id} href={`/manager/chat/?conversation=${item.id}`}><span>{item.name.split(" ").map(part=>part[0]).slice(0,2).join("")}</span><div><strong>{item.name}</strong><p>{item.last_message}</p></div><time>{new Date(item.last_message_at.replace(" ","T")).toLocaleString(locale,{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</time>{Number(item.unread_operator)>0&&<b>{item.unread_operator}</b>}</a>)}</div>:<p className="manager-empty">{t.empty}</p>}</section>
  </section>
 </main>;
}
