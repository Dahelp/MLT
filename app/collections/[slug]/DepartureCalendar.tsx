"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "../../../content/i18n";

export type DepartureRule = { mode: "any" | "weekdays"; weekdays: number[]; blockedDates: string[]; allowedDates: string[] };

const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
const sameMonth = (a: Date,b: Date) => a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth();

export function DepartureCalendar({value,onChange,rule,locale,label}:{value:string;onChange:(value:string)=>void;rule:DepartureRule;locale:Locale;label:string}){
 const root=useRef<HTMLDivElement>(null), today=useMemo(()=>{const date=new Date();date.setHours(0,0,0,0);return date},[]);
 const [open,setOpen]=useState(false),[month,setMonth]=useState(()=>value?new Date(`${value}T12:00:00`):today);
 useEffect(()=>{const close=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false)};document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close)},[]);
 const language=locale==="ru"?"ru-RU":locale==="de"?"de-DE":"en-GB";
 const first=new Date(month.getFullYear(),month.getMonth(),1), offset=(first.getDay()+6)%7, count=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
 const days=Array.from({length:offset+count},(_,index)=>index<offset?null:new Date(month.getFullYear(),month.getMonth(),index-offset+1));
 const allowed=(date:Date)=>{const key=iso(date);if(date<today||rule.blockedDates.includes(key))return false;if(rule.allowedDates.includes(key))return true;return rule.mode==="any"||rule.weekdays.includes(date.getDay())};
 const weekdays=Array.from({length:7},(_,index)=>new Intl.DateTimeFormat(language,{weekday:"short"}).format(new Date(2026,5,1+index)));
 const allowedNames=rule.weekdays.map(day=>new Intl.DateTimeFormat(language,{weekday:"long"}).format(new Date(2026,5,7+day))).join(", ");
 const selected=value?new Date(`${value}T12:00:00`):null;
 return <div className="booking-date departure-calendar" ref={root}><span>{label}</span><button type="button" className="departure-calendar-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(current=>!current)}>{selected?new Intl.DateTimeFormat(language,{day:"numeric",month:"short",year:"numeric"}).format(selected):"—"}<i aria-hidden="true">▦</i></button>{open&&<div className="departure-calendar-popover" role="dialog" aria-label={label}><header><button type="button" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))} aria-label="Previous month">←</button><strong>{new Intl.DateTimeFormat(language,{month:"long",year:"numeric"}).format(month)}</strong><button type="button" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))} aria-label="Next month">→</button></header><div className="departure-calendar-weekdays">{weekdays.map(day=><span key={day}>{day}</span>)}</div><div className="departure-calendar-days">{days.map((date,index)=>date?<button type="button" key={iso(date)} disabled={!allowed(date)} className={value===iso(date)?"selected":""} aria-pressed={value===iso(date)} onClick={()=>{onChange(iso(date));setOpen(false)}}>{date.getDate()}</button>:<span key={`blank-${index}`}/>)}</div>{rule.mode==="weekdays"&&<p>{locale==="ru"?`Дни отправления: ${allowedNames}`:locale==="de"?`Abreisetage: ${allowedNames}`:`Departure days: ${allowedNames}`}</p>}</div>}</div>;
}
