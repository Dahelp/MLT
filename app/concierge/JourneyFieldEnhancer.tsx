"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { experiences, journeyRoutes, mapPoints } from "../../content/mlt";

type Targets={route:HTMLTextAreaElement;points:HTMLTextAreaElement;services:HTMLTextAreaElement};
type Service={title:string;price:number};
const parseList=(value:string)=>{try{const parsed=JSON.parse(value||"[]");return Array.isArray(parsed)?parsed:[]}catch{return []}};
const selectedValues=(node:HTMLTextAreaElement,options:Array<{id:string;name:string}>)=>{const current=parseList(node.value||node.defaultValue).map(String);return options.filter(option=>current.includes(option.id)||current.includes(option.name)).map(option=>option.name)};

export default function JourneyFieldEnhancer(){
 const [targets,setTargets]=useState<Targets|null>(null),[revision,setRevision]=useState(0);
 useEffect(()=>{const locate=()=>{const route=document.querySelector<HTMLTextAreaElement>('.concierge-detail textarea[name="route"]'),points=document.querySelector<HTMLTextAreaElement>('.concierge-detail textarea[name="points"]'),services=document.querySelector<HTMLTextAreaElement>('.concierge-detail textarea[name="services"]'),locale=localStorage.getItem("mlt-operations-locale")||"en",labels=locale==="ru"?["Маршруты","Места и точки карты","Дополнительные услуги"]:locale==="de"?["Routen","Orte und Kartenpunkte","Zusatzleistungen"]:["Routes","Places and map points","Additional services"];[route,points,services].forEach((node,index)=>{const text=node?.parentElement?.firstChild;if(text?.nodeType===Node.TEXT_NODE)text.nodeValue=labels[index]});setTargets(route&&points&&services?{route,points,services}:null)};locate();const observer=new MutationObserver(locate);observer.observe(document.body,{childList:true,subtree:true});return()=>observer.disconnect()},[]);
 if(!targets)return null;
 const routeOptions=journeyRoutes.map(item=>({id:item.id,name:item.name}));
 const pointOptions=mapPoints.filter(item=>!journeyRoutes.some(route=>route.id===item.id)).map(item=>({id:item.id,name:`${item.name} · ${item.country}`}));
 const currentServices=parseList(targets.services.value||targets.services.defaultValue).filter((item):item is Service=>item&&typeof item.title==="string");
 const serviceOptions=Array.from(new Map([...experiences.map(item=>[item.title,{title:item.title,price:0}] as const),...currentServices.map(item=>[item.title,item] as const)]).values());
 const locale=localStorage.getItem("mlt-operations-locale")||"en",hint=locale==="ru"?"Можно выбрать несколько вариантов":locale==="de"?"Mehrere Optionen können ausgewählt werden":"Multiple options can be selected";
 const syncSelect=(node:HTMLTextAreaElement,event:ChangeEvent<HTMLSelectElement>)=>{node.value=JSON.stringify(Array.from(event.currentTarget.selectedOptions,value=>value.value));setRevision(value=>value+1)};
 const toggleService=(service:Service,checked:boolean)=>{const chosen=parseList(targets.services.value||targets.services.defaultValue).filter((item):item is Service=>item&&typeof item.title==="string"&&item.title!==service.title);if(checked)chosen.push(service);targets.services.value=JSON.stringify(chosen);setRevision(value=>value+1)};
 return <>{createPortal(<><select className="journey-multi-select" multiple size={Math.min(7,routeOptions.length)} value={selectedValues(targets.route,routeOptions)} onChange={event=>syncSelect(targets.route,event)}>{routeOptions.map(item=><option key={item.id} value={item.name}>{item.name}</option>)}</select><small className="journey-field-hint">{hint}</small></>,targets.route.parentElement!)}{createPortal(<><select className="journey-multi-select" multiple size={Math.min(8,pointOptions.length)} value={selectedValues(targets.points,pointOptions)} onChange={event=>syncSelect(targets.points,event)}>{pointOptions.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><small className="journey-field-hint">{hint}</small></>,targets.points.parentElement!)}{createPortal(<div className="journey-service-list" data-revision={revision}>{serviceOptions.map(service=>{const checked=parseList(targets.services.value||targets.services.defaultValue).some((item:Service)=>item?.title===service.title);return <label key={service.title}><input type="checkbox" checked={checked} onChange={event=>toggleService(service,event.target.checked)}/><span>{service.title}</span></label>})}</div>,targets.services.parentElement!)}</>;
}
