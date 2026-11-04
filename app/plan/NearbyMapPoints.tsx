"use client";
import {useId,useState} from "react";
import type {RoutePoint} from "../../content/route-points";
import type {Locale} from "../../content/i18n";
import {mapMarkerCopy} from "../../content/map-marker-copy";
import "./nearby-map-points.css";

export default function NearbyMapPoints({points,selected,locale,onPick,onClose}:{points:RoutePoint[];selected:string[];locale:Locale;onPick:(id:string)=>void;onClose:()=>void}) {
  const heading=useId(),[query,setQuery]=useState(""),t=mapMarkerCopy[locale];
  const visible=points.filter(point=>`${point.name} ${point.country}`.toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale)));
  return <section className="nearby-map-points" aria-labelledby={heading} onKeyDown={event=>{if(event.key==="Escape"){event.stopPropagation();onClose();}}}>
    <header><div><h3 id={heading}>{t.title} <span>({points.length})</span></h3><p>{t.help}</p></div></header>
    {points.length>8&&<input className="nearby-map-search" type="search" aria-label={t.search} placeholder={t.search} value={query} onChange={event=>setQuery(event.target.value)}/>}
    <div className="nearby-map-point-list">{visible.map(point=><button type="button" key={point.id} onClick={()=>onPick(point.id)}>
      {point.photos?.[0]&&<img src={point.photos[0]} alt="" loading="lazy"/>}<span><strong>{point.name}</strong><span>{point.country} · {point.type}</span>{selected.includes(point.id)&&<small>✓ {t.selected}</small>}</span>
    </button>)}{!visible.length&&<p role="status">{t.empty}</p>}</div>
  </section>;
}
