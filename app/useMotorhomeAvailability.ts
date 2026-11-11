"use client";
import {useCallback,useEffect,useState} from 'react';
import {hasSharedMotorhome} from '../content/motorhome';
const iso=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export type FleetStatus = 'available'|'sold_out'|'loading'|'error'|'dates';
export function useMotorhomeAvailability(collection:string,start:string,days:number) {
 const enabled=hasSharedMotorhome(collection);
 const [version,setVersion]=useState(0);
 const [calendarMonth,setCalendarMonth]=useState(()=>{const d=new Date();d.setDate(1);return iso(d)});
 const onMonthChange=useCallback((month:string)=>setCalendarMonth(month),[]);
 const [result,setResult]=useState<{key:string;dates:Record<string,string>;error:boolean}|null>(null);
 const key=`${days}:${version}:${calendarMonth}:${start}`;
 const retry=useCallback(()=>setVersion(v=>v+1),[]);
 useEffect(()=>{
  if(!enabled)return;
  const controller=new AbortController();
  const today=new Date();today.setHours(12,0,0,0);
  const from=new Date(`${calendarMonth}T12:00:00`);if(from<today)from.setTime(today.getTime());
  const end=new Date(from);end.setDate(end.getDate()+42);
  const ranges=[{from:iso(from),to:iso(end)}];
  // Keep a selected trip fresh even while browsing a different calendar month.
  if(start&&(start<iso(from)||start>=iso(end))){const selectedEnd=new Date(`${start}T12:00:00`);selectedEnd.setDate(selectedEnd.getDate()+1);ranges.push({from:start,to:iso(selectedEnd)});}
  Promise.all(ranges.map(async range=>{
   const r=await fetch(`/api/fleet.php?from=${range.from}&to=${range.to}&days=${days}`,{cache:'no-store',signal:controller.signal});
   if(!r.ok)throw Error();const data=await r.json();if(!data.dates||typeof data.dates!=='object')throw Error();return data.dates;
  })).then(rows=>setResult({key,dates:Object.assign({},...rows),error:false}))
   .catch(()=>{if(!controller.signal.aborted)setResult({key,dates:{},error:true});});
  return()=>controller.abort();
 },[enabled,key,days,calendarMonth,start]);
 useEffect(()=>{if(!enabled)return;const timer=window.setInterval(retry,60000);const focus=()=>retry();window.addEventListener('focus',focus);return()=>{clearInterval(timer);window.removeEventListener('focus',focus)};},[enabled,retry]);
 const ready=result?.key===key&&!result.error;
 const status:FleetStatus=!enabled?'available':result?.key!==key?'loading':result.error?'error':!start?'dates':result.dates[start]==='available'?'available':'sold_out';
 return {enabled,status,retry,onMonthChange,canBook:!enabled||status==='available',isDateUnavailable:(date:string)=>enabled&&(!ready||result?.dates[date]!=='available')};
}
