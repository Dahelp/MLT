"use client";
import {useEffect,useId,useRef,useState} from "react";
import type {RoutePoint} from "../../content/route-points";
import type {Locale} from "../../content/i18n";
import {mapMarkerCopy} from "../../content/map-marker-copy";
import "./nearby-map-points.css";

export default function NearbyMapPoints({points,selected,locale,onPick,onClose}:{points:RoutePoint[];selected:string[];locale:Locale;onPick:(id:string)=>void;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null),heading=useId(),[query,setQuery]=useState(""),t=mapMarkerCopy[locale];
  useEffect(()=>{
    const opener=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;
    document.body.style.overflow="hidden";dialog.current?.showModal();
    return ()=>{document.body.style.overflow=overflow;if(opener?.isConnected)opener.focus();};
  },[]);
  const visible=points.filter(point=>`${point.name} ${point.country}`.toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale)));
  return <dialog className="nearby-map-points" ref={dialog} aria-labelledby={heading} onCancel={event=>{event.preventDefault();onClose();}}>
    <header><div><h2 id={heading}>{t.title} <span>({points.length})</span></h2><p>{t.help}</p></div><button type="button" autoFocus onClick={onClose} aria-label={t.close}>×</button></header>
    {points.length>8&&<input className="nearby-map-search" type="search" aria-label={t.search} placeholder={t.search} value={query} onChange={event=>setQuery(event.target.value)}/>}
    <div className="nearby-map-point-list">{visible.map(point=><button type="button" key={point.id} onClick={()=>onPick(point.id)}>
      {point.photos?.[0]&&<img src={point.photos[0]} alt="" loading="lazy"/>}<span><strong>{point.name}</strong><span>{point.country} · {point.type}</span>{selected.includes(point.id)&&<small>✓ {t.selected}</small>}</span>
    </button>)}{!visible.length&&<p role="status">{t.empty}</p>}</div>
  </dialog>;
}
