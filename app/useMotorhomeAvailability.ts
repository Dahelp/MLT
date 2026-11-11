"use client";
import {useCallback,useEffect,useState} from 'react';
import {hasSharedMotorhome} from '../content/motorhome';
export type FleetStatus = 'available'|'sold_out'|'loading'|'error'|'dates';
export function useMotorhomeAvailability(collection:string,start:string,days:number) {
 const enabled=hasSharedMotorhome(collection);
 const [version,setVersion]=useState(0);
 const [result,setResult]=useState<{key:string;dates:Record<string,string>;error:boolean}|null>(null);
 const key=`${days}:${version}`;
 const retry=useCallback(()=>setVersion(v=>v+1),[]);
 useEffect(()=>{
  if(!enabled)return;
  const controller=new AbortController();
  const from=new Date();from.setHours(12,0,0,0);
  const end=new Date(from);end.setFullYear(end.getFullYear()+1);
  const iso=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  fetch(`/api/fleet.php?from=${iso(from)}&to=${iso(end)}&days=${days}`,{cache:'no-store',signal:controller.signal})
   .then(async r=>{if(!r.ok)throw Error();const data=await r.json();if(!data.dates||typeof data.dates!=='object')throw Error();setResult({key,dates:data.dates,error:false});})
   .catch(()=>{if(!controller.signal.aborted)setResult({key,dates:{},error:true});});
  return()=>controller.abort();
 },[enabled,key,days]);
 useEffect(()=>{if(!enabled)return;const timer=window.setInterval(retry,60000);const focus=()=>retry();window.addEventListener('focus',focus);return()=>{clearInterval(timer);window.removeEventListener('focus',focus)};},[enabled,retry]);
 const ready=result?.key===key&&!result.error;
 const status:FleetStatus=!enabled?'available':result?.key!==key?'loading':result.error?'error':!start?'dates':result.dates[start]==='available'?'available':'sold_out';
 return {enabled,status,retry,canBook:!enabled||status==='available',isDateUnavailable:(date:string)=>enabled&&(!ready||result?.dates[date]!=='available')};
}
