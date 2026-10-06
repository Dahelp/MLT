"use client";

import { useEffect, useState } from "react";

export default function AdminChatStatus({variant,base=0}:{variant:"nav"|"notification"|"shortcut"|"bell";base?:number}){
 const [unread,setUnread]=useState(0);
 useEffect(()=>{let active=true;const load=async()=>{const token=localStorage.getItem("mlt-account-token")||"";if(!token)return;try{const response=await fetch("/api/chat.php",{method:"POST",cache:"no-store",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({action:"operator_sync"})});const data=await response.json();if(active&&response.ok)setUnread(Number(data.unread||0));}catch{}};load();const timer=window.setInterval(load,4000);return()=>{active=false;window.clearInterval(timer)}},[]);
 const icon=<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 15a3 3 0 0 1-3 3H9l-5 3v-3.5A3 3 0 0 1 3 15V7a3 3 0 0 1 3-3h14z"/><path d="M7 10h10M7 14h6"/></svg>;
 if(variant==="bell")return unread+base>0?<i>{unread+base}</i>:null;
 if(variant==="notification")return <a className="notification-chat-link" href="/admin/chat/">{icon}<span>Chat</span><b>{unread}</b></a>;
 if(variant==="nav")return <a className={typeof location!=="undefined"&&location.pathname.startsWith("/admin/chat")?"active":""} title="Chat" href="/admin/chat/">{icon}<b>Chat</b>{unread>0&&<em>{unread}</em>}</a>;
 return <a className="admin-chat-shortcut" href="/admin/chat/">{icon}<span>Chat</span>{unread>0&&<b>{unread}</b>}</a>;
}
