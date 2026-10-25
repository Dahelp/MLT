"use client";
import {useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
export default function TermsDialog({label,children}:{label:string;children:ReactNode}){
  const [open,setOpen]=useState(false);
  return <><a href="#journey-terms" onClick={e=>{e.preventDefault();setOpen(true)}}>{label}</a>{open&&createPortal(<div className="journey-review-overlay" onClick={()=>setOpen(false)} onKeyDown={e=>{if(e.key==='Escape')setOpen(false)}}><section className="journey-review-modal" role="dialog" aria-modal="true" aria-label={label} onClick={e=>e.stopPropagation()}><button autoFocus type="button" className="journey-review-close" aria-label="Close" onClick={()=>setOpen(false)}>×</button>{children}</section></div>,document.body)}</>;
}
