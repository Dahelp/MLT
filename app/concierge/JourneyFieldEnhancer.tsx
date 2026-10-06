"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { experiences, journeyRoutes, mapPoints } from "../../content/mlt";

type Targets={route:HTMLTextAreaElement;points:HTMLTextAreaElement;services:HTMLTextAreaElement};
type Service={title:string;price:number};
type Choice={id:string;label:string;value:string};
const parseList=(value:string)=>{try{const parsed=JSON.parse(value||"[]");return Array.isArray(parsed)?parsed:[]}catch{return []}};

function ChoiceDropdown({choices,selected,onToggle,placeholder,selectedWord}:{choices:Choice[];selected:string[];onToggle:(choice:Choice,checked:boolean)=>void;placeholder:string;selectedWord:string}){
 const selectedLabels=choices.filter(choice=>selected.includes(choice.value)).map(choice=>choice.label);
 return <details className="journey-choice-dropdown"><summary><span>{selectedLabels.length?`${selectedWord}: ${selectedLabels.length}`:placeholder}</span><i aria-hidden="true">⌄</i></summary><div>{choices.map(choice=><label key={choice.id}><input type="checkbox" checked={selected.includes(choice.value)} onChange={event=>onToggle(choice,event.target.checked)}/><span>{choice.label}</span></label>)}</div>{selectedLabels.length>0&&<small>{selectedLabels.join(" · ")}</small>}</details>;
}

export default function JourneyFieldEnhancer(){
 const [targets,setTargets]=useState<Targets|null>(null),[revision,setRevision]=useState(0);
 useEffect(()=>{const locate=()=>{const route=document.querySelector<HTMLTextAreaElement>('.concierge-detail textarea[name="route"]'),points=document.querySelector<HTMLTextAreaElement>('.concierge-detail textarea[name="points"]'),services=document.querySelector<HTMLTextAreaElement>('.concierge-detail textarea[name="services"]'),locale=localStorage.getItem("mlt-operations-locale")||"en",labels=locale==="ru"?["Маршруты","Места и точки карты","Дополнительные услуги"]:locale==="de"?["Routen","Orte und Kartenpunkte","Zusatzleistungen"]:["Routes","Places and map points","Additional services"];[route,points,services].forEach((node,index)=>{const text=node?.parentElement?.firstChild;if(text?.nodeType===Node.TEXT_NODE)text.nodeValue=labels[index]});setTargets(route&&points&&services?{route,points,services}:null)};locate();const observer=new MutationObserver(locate);observer.observe(document.body,{childList:true,subtree:true});return()=>observer.disconnect()},[]);
 if(!targets)return null;
 const locale=localStorage.getItem("mlt-operations-locale")||"en";
 const words=locale==="ru"?{choose:"Выберите варианты",selected:"выбрано"}:locale==="de"?{choose:"Optionen auswählen",selected:"ausgewählt"}:{choose:"Choose options",selected:"selected"};
 const routeChoices:Choice[]=journeyRoutes.map(item=>({id:item.id,label:`${item.name} · ${item.country}`,value:item.name}));
 const pointChoices:Choice[]=mapPoints.filter(item=>!journeyRoutes.some(route=>route.id===item.id)).map(item=>({id:item.id,label:`${item.name} · ${item.country}`,value:item.id}));
 const routeSelected=parseList(targets.route.value||targets.route.defaultValue).map(String).map(value=>routeChoices.find(choice=>choice.id===value)?.value||value);
 const pointSelected=parseList(targets.points.value||targets.points.defaultValue).map(String).map(value=>pointChoices.find(choice=>choice.label.startsWith(value))?.value||value);
 const currentServices=parseList(targets.services.value||targets.services.defaultValue).filter((item):item is Service=>item&&typeof item.title==="string");
 const services=Array.from(new Map([...experiences.map(item=>[item.title,{title:item.title,price:0}] as const),...currentServices.map(item=>[item.title,item] as const)]).values());
 const serviceChoices:Choice[]=services.map(service=>({id:service.title,label:service.title,value:service.title})),serviceSelected=currentServices.map(item=>item.title);
 const toggleArray=(node:HTMLTextAreaElement,choice:Choice,checked:boolean)=>{const current=parseList(node.value||node.defaultValue).map(String).filter(value=>value!==choice.value&&value!==choice.id);if(checked)current.push(choice.value);node.value=JSON.stringify(current);setRevision(value=>value+1)};
 const toggleService=(choice:Choice,checked:boolean)=>{const current=parseList(targets.services.value||targets.services.defaultValue).filter((item):item is Service=>item&&typeof item.title==="string"&&item.title!==choice.value);if(checked)current.push(services.find(item=>item.title===choice.value)||{title:choice.value,price:0});targets.services.value=JSON.stringify(current);setRevision(value=>value+1)};
 return <div hidden data-revision={revision}>{createPortal(<ChoiceDropdown choices={routeChoices} selected={routeSelected} onToggle={(choice,checked)=>toggleArray(targets.route,choice,checked)} placeholder={words.choose} selectedWord={words.selected}/>,targets.route.parentElement!,"journey-routes")}{createPortal(<ChoiceDropdown choices={pointChoices} selected={pointSelected} onToggle={(choice,checked)=>toggleArray(targets.points,choice,checked)} placeholder={words.choose} selectedWord={words.selected}/>,targets.points.parentElement!,"journey-points")}{createPortal(<ChoiceDropdown choices={serviceChoices} selected={serviceSelected} onToggle={toggleService} placeholder={words.choose} selectedWord={words.selected}/>,targets.services.parentElement!,"journey-services")}</div>;
}
