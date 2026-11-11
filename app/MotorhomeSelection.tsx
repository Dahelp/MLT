"use client";
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import type {Locale} from '../content/i18n';
import {motorhome,motorhomeCopy} from '../content/motorhome';
import type {FleetStatus} from './useMotorhomeAvailability';
import ChevronIcon from './ChevronIcon';
import styles from './motorhome.module.css';

export function MotorhomeSpecs({locale,model=motorhome}:{locale:Locale;model?:typeof motorhome}) {
 const t=motorhomeCopy[locale];
 const paths=['M5 20v-7m14 7v-7M5 16h14M7 13V7a5 5 0 0 1 10 0v6','M3 8h18v8H3zM7 8v4m5-4v3m5-3v4','M4 16V8h12l4 4v4H4m3 0v3m10-3v3','M3 21V4h18v17M3 13h18M12 13v8M6 8h3','M4 5h16v14H4zM8 10h8m-8 4h5'];
 return <ul className={styles.specs}>{[t.seats.replaceAll('4',String(model.seats)),t.length.replace('6.96',String(model.lengthMetres)).replace('6,96',String(model.lengthMetres).replace('.',',')),t.engine,t.highlights,t.licence].map((text,i)=><li key={text}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[i]}/></svg><span>{text}</span></li>)}</ul>;
}

export default function MotorhomeSelection({locale,status,retry,selected,onSelect,guests=1}:{locale:Locale;status:FleetStatus;retry:()=>void;selected:boolean;onSelect:()=>void;guests?:number}) {
 const t=motorhomeCopy[locale];const [index,setIndex]=useState(0);const [open,setOpen]=useState(false);
 const touch=useRef<{x:number;y:number}|null>(null),swiped=useRef(false),dialog=useRef<HTMLDivElement>(null),opener=useRef<HTMLButtonElement>(null);
 const move=(delta:number)=>setIndex(i=>(i+delta+motorhome.images.length)%motorhome.images.length);
 useEffect(()=>{
  if(!open)return;const previous=document.activeElement as HTMLElement;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.current?.focus();
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);if(e.key==='ArrowLeft')setIndex(i=>(i-1+motorhome.images.length)%motorhome.images.length);if(e.key==='ArrowRight')setIndex(i=>(i+1)%motorhome.images.length);if(e.key==='Tab'){const buttons=dialog.current?.querySelectorAll<HTMLButtonElement>('button');if(!buttons?.length)return;const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
  document.addEventListener('keydown',key);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);previous?.focus();};
 },[open]);
 const photo=motorhome.images[index];
 const gallery=(large=false)=><div className={large?styles.largeGallery:styles.gallery} onTouchStart={e=>{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};swiped.current=false;}} onTouchEnd={e=>{if(!touch.current)return;const x=e.changedTouches[0].clientX-touch.current.x,y=e.changedTouches[0].clientY-touch.current.y;if(Math.abs(x)>45&&Math.abs(x)>Math.abs(y)){move(x<0?1:-1);swiped.current=true;}touch.current=null;}}>
  {large?<img src={photo.src} alt={photo.alt}/>:<button ref={opener} type="button" className={styles.photo} aria-label={t.expand} onClick={()=>{if(!swiped.current)setOpen(true);}}><img src={photo.src} alt={photo.alt} loading="lazy" decoding="async"/><span className={styles.expand} aria-hidden="true">⛶</span></button>}
  <button type="button" className={styles.prev} onClick={()=>move(-1)} aria-label={t.previous}><ChevronIcon direction="left"/></button><button type="button" className={styles.next} onClick={()=>move(1)} aria-label={t.next}><ChevronIcon direction="right"/></button>
  <span className={styles.counter} aria-live="polite">{index+1} / {motorhome.images.length}{index===1?' · Layout':''}</span>
 </div>;
 return <section className={styles.selection} aria-label={t.title}>
  <h2>{t.title}</h2><div className={styles.card}>
   <div className={styles.media}>{gallery()}<div className={styles.dots} aria-label={t.title}>{motorhome.images.map((photo,i)=><button type="button" key={photo.src} aria-label={`${i+1} · ${photo.label}`} aria-current={i===index?'true':undefined} onClick={()=>setIndex(i)}><span/></button>)}</div></div>
   <div className={styles.info}><h3>{motorhome.name}</h3><p className={styles.status} data-status={status} role="status"><span/>{status==='available'?t.available:status==='sold_out'?t.sold_out:status==='loading'?t.checking:status==='error'?t.error:t.chooseDates}</p><MotorhomeSpecs locale={locale}/>{status==='error'&&<button type="button" onClick={retry} className={styles.select}>{t.retry}</button>}{guests>4&&<p role="alert">{t.capacity}</p>}<button type="button" className={styles.select} disabled={status!=='available'||guests>4} aria-pressed={status==='available'&&selected} onClick={onSelect}>{status==='available'&&selected?'✓ ':''}{status==='available'&&selected?t.selected:t.select}</button></div>
  </div>{open&&createPortal(<div className={styles.overlay} onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}}><div ref={dialog} className={styles.dialog} role="dialog" aria-modal="true" aria-label={motorhome.name} tabIndex={-1}><button type="button" className={styles.close} onClick={()=>setOpen(false)} aria-label={t.close}>×</button>{gallery(true)}</div></div>,document.body)}
 </section>;
}

export function BookedMotorhome({raw,unit,locale,pickup,returning}:{raw?:string;unit?:number|null;locale:Locale;pickup?:string;returning?:string}) {
 let model:typeof motorhome;try{model=JSON.parse(raw||'null');if(model?.id!==motorhome.id)return null;}catch{return null;}
 const t=motorhomeCopy[locale];
 return <div className={styles.booked}><img src={model.images[0].src} alt={model.name} loading="lazy"/><div><strong>{model.name}</strong><MotorhomeSpecs locale={locale} model={model}/>{unit&&<p>{t.unit}: #{unit}</p>}<p>{t.pickup}: {pickup||t.pending}<br/>{t.returning}: {returning||t.pending}</p></div></div>;
}
