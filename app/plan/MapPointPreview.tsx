"use client";

import {useEffect,useId,useRef,useState} from "react";
import type {Locale} from "../../content/i18n";
import type {RoutePoint} from "../../content/route-points";
import {mapPreviewCopy} from "../../content/map-preview";
import "./map-point-preview.css";

export default function MapPointPreview({point,locale,selected,onSelect,onClose}:{point:RoutePoint;locale:Locale;selected:boolean;onSelect?:(id:string)=>void;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null),heading=useId(),t=mapPreviewCopy[locale];
  const [photo,setPhoto]=useState(0),photos=point.photos||[];
  useEffect(()=>{
    const opener=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    dialog.current?.showModal();
    return ()=>{document.body.style.overflow=overflow;opener?.focus();};
  },[]);
  const description=point.description||point.descriptions?.[locale]||"";
  return <dialog ref={dialog} className="map-point-preview" aria-labelledby={heading} onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
    <header className="map-point-preview-header"><div><p>{point.country} · {point.type}</p><h2 id={heading}>{point.name}</h2></div><button type="button" autoFocus onClick={onClose} aria-label={t.close}>×</button></header>
    <div className="map-point-preview-content">
      <div className="map-point-preview-media">
        {photos.length>0?<div className="map-point-preview-gallery" aria-label={t.photos}>
          <div className="map-point-preview-photo"><img src={photos[photo]} alt={`${point.name} · ${t.photo} ${photo+1}`} decoding="async"/>{photos.length>1&&<><button type="button" className="map-point-photo-prev" aria-label={t.previous} onClick={()=>setPhoto(current=>(current+photos.length-1)%photos.length)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button><button type="button" className="map-point-photo-next" aria-label={t.next} onClick={()=>setPhoto(current=>(current+1)%photos.length)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button><span>{photo+1} / {photos.length}</span></>}</div>
          {photos.length>1&&<div className="map-point-preview-thumbnails">{photos.map((src,index)=><button type="button" key={`${src}:${index}`} aria-label={`${t.photo} ${index+1}`} aria-pressed={index===photo} onClick={()=>setPhoto(index)}><img src={src} alt="" loading="lazy"/></button>)}</div>}
        </div>:!point.video&&<p className="map-point-preview-empty">{t.noMedia}</p>}
        {point.video&&<div className="map-point-preview-video"><h3>{t.video}</h3><video src={point.video.path} controls playsInline preload="metadata" aria-label={`${point.name} · ${t.video}`}/></div>}
      </div>
      <div className="map-point-preview-details">{description&&<p>{description}</p>}{(point.parking||point.booking)&&<dl>{point.parking&&<div><dt>{t.parking}</dt><dd>{point.parking}</dd></div>}{point.booking&&<div><dt>{t.booking}</dt><dd>{point.booking}</dd></div>}</dl>}</div>
    </div>
    {onSelect&&<footer className="map-point-preview-footer"><button type="button" disabled={selected} onClick={()=>{onSelect(point.id);onClose();}}>{selected?t.selected:t.select}</button></footer>}
  </dialog>;
}
