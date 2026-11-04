"use client";

import {useEffect,useId,useRef,useState} from "react";
import type {Locale} from "../../content/i18n";
import type {RoutePoint} from "../../content/route-points";
import {mapPreviewCopy} from "../../content/map-preview";
import "./map-point-preview.css";

export default function MapPointPreview({point,locale,selected,onSelect,onClose,onBack}:{point:RoutePoint;locale:Locale;selected:boolean;onSelect?:(id:string)=>void;onClose:()=>void;onBack?:()=>void}) {
  const heading=useId(),t=mapPreviewCopy[locale];
  const [photo,setPhoto]=useState(0),[dragging,setDragging]=useState(false),photos=point.photos||[];
  const track=useRef<HTMLDivElement>(null),drag=useRef<{x:number;scroll:number}|null>(null);
  const media=[...photos.map(src=>({src,video:false})),...(point.video?[{src:point.video.path,video:true}]:[])];
  const photoIndex=Math.min(photo,Math.max(0,media.length-1));
  useEffect(()=>{track.current?.querySelectorAll("video").forEach(video=>{if(Number(video.dataset.mediaIndex)!==photoIndex)video.pause();});},[photoIndex]);
  const description=point.description||point.descriptions?.[locale]||"";
  return <section className="map-point-preview" aria-labelledby={heading} onKeyDown={event=>{if(event.key==="Escape"){event.stopPropagation();onClose();}}}>
    <button type="button" className="map-point-preview-close" onClick={onClose} aria-label={t.close}>×</button>
    <div className="map-point-preview-content">
        {media.length>0?<div className="map-point-preview-gallery" role="group" aria-label={t.media}>
          <div ref={track} className={`map-point-media-track${dragging?" is-dragging":""}`} tabIndex={0} aria-label={t.swipe}
            onScroll={event=>{const node=event.currentTarget;if(node.clientWidth)setPhoto(Math.round(node.scrollLeft/node.clientWidth));}}
            onKeyDown={event=>{if(event.key==="ArrowRight"||event.key==="ArrowLeft"){event.preventDefault();event.stopPropagation();const direction=event.key==="ArrowRight"?1:-1;event.currentTarget.scrollTo({left:Math.max(0,Math.min(media.length-1,photoIndex+direction))*event.currentTarget.clientWidth,behavior:"smooth"});}}}
            onPointerDown={event=>{if(event.pointerType!=="mouse"||event.button!==0||(event.target as HTMLElement).closest("video"))return;drag.current={x:event.clientX,scroll:event.currentTarget.scrollLeft};setDragging(true);event.currentTarget.setPointerCapture(event.pointerId);}}
            onPointerMove={event=>{if(drag.current)event.currentTarget.scrollLeft=drag.current.scroll-(event.clientX-drag.current.x);}}
            onPointerUp={event=>{if(!drag.current)return;const node=event.currentTarget,target=Math.round(node.scrollLeft/node.clientWidth)*node.clientWidth;drag.current=null;setDragging(false);node.releasePointerCapture(event.pointerId);requestAnimationFrame(()=>node.scrollTo({left:target,behavior:"smooth"}));}}
            onPointerCancel={()=>{drag.current=null;setDragging(false);}}>
            {media.map((item,index)=><div className="map-point-media-slide" key={`${item.src}:${index}`}>{item.video?<video src={item.src} data-media-index={index} controls playsInline preload="metadata" aria-label={`${point.name} · ${t.video}`}/>:<img src={item.src} draggable={false} alt={`${point.name} · ${t.photo} ${index+1}`} decoding="async"/>}</div>)}
          </div>
          {media.length>1&&<div className="map-point-media-indicators" aria-hidden="true">{media.map((item,index)=><span key={index} className={photoIndex===index?"active":""}>{item.video?"▷":""}</span>)}</div>}
          <span className="map-point-media-counter" aria-live="polite">{photoIndex+1} / {media.length}</span>
        </div>:<p className="map-point-preview-empty">{t.noMedia}</p>}
      {onBack&&<button className="map-point-preview-back" type="button" onClick={onBack}>{t.back}</button>}
      <header className="map-point-preview-header"><h3 id={heading}>{point.name}</h3><p>{point.country} · {point.type}</p>{selected&&<span className="map-point-preview-selected">✓ {t.selected}</span>}</header>
      {description&&<details className="map-point-preview-details"><summary><span>{description}</span><b>{t.more}</b></summary><p>{description}</p></details>}
      {(point.parking||point.booking)&&<details className="map-point-preview-logistics"><summary>{t.visitorDetails}</summary><dl>{point.parking&&<div><dt>{t.parking}</dt><dd>{point.parking}</dd></div>}{point.booking&&<div><dt>{t.booking}</dt><dd>{point.booking}</dd></div>}</dl></details>}
    </div>
    {onSelect&&<div className="map-point-preview-footer"><button type="button" aria-pressed={selected} onClick={()=>onSelect(point.id)}>{selected?t.remove:t.select}</button></div>}
  </section>;
}
