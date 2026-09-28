"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { operationsTranslations } from "../../content/operations-i18n";

type Section = "collection" | "product" | "route" | "extra" | "points";
type Item = { id:number; item_type:Exclude<Section,"points">; collection_id:string|null; slug:string; title:string; subtitle:string|null; image_path:string|null; price:string|null; price_to:string|null; days_from:number|null; days_to:number|null; points_json:string|null; sort_order:number; is_active:number };
type Point = { id:number; slug:string; title:string; country_name:string|null; latitude:string|null; longitude:string|null; description:string|null; image_path:string|null; is_active:number };
type ApiResult = { items:Item[]; points:Point[]; path?:string };
type FormValues = { id:number; slug:string; title:string; subtitle:string; imagePath:string; collectionId:string; price:string; priceTo:string; daysFrom:string; daysTo:string; sortOrder:string; active:boolean; pointSlugs:string[]; country:string; latitude:string; longitude:string; description:string };

const blank = ():FormValues => ({id:0,slug:"",title:"",subtitle:"",imagePath:"",collectionId:"",price:"",priceTo:"",daysFrom:"",daysTo:"",sortOrder:"0",active:true,pointSlugs:[],country:"",latitude:"",longitude:"",description:""});
const number = (value:string|null|number|undefined) => value == null ? "" : String(value);
const asPoints = (json:string|null) => { try { const value=JSON.parse(json||"[]"); return Array.isArray(value)?value.map(String):[]; } catch { return []; } };

function copy(t:typeof operationsTranslations.en){
 const ru=t.collections==="Коллекции", de=t.collections==="Kollektionen";
 return ru?{
  points:"Точки маршрута",section:"Каталог",add:"Добавить",edit:"Редактировать",empty:"В этом разделе пока ничего нет.",days:"дней",from:"от",to:"до",priceFrom:"Цена от, EUR",priceTo:"Цена до, EUR",daysFrom:"Дней от",daysTo:"Дней до",slug:"Адрес (slug)",title:"Название",description:"Описание",image:"Фото AVIF/WebP",upload:"Загрузить фото",uploading:"Загрузка…",collection:"Коллекция",notLinked:"Не привязано",order:"Порядок",active:"Показывать на сайте",save:"Сохранить",saving:"Сохранение…",close:"Закрыть",country:"Страна / регион",latitude:"Широта",longitude:"Долгота",selectPoints:"Точки маршрута",pointHelp:"Сначала создайте точки здесь, затем отметьте их в форме маршрута.",saved:"Сохранено",rangeError:"Значение «до» не может быть меньше значения «от».",formatError:"Разрешены только изображения AVIF и WebP до 8 МБ.",editTitle:"Редактирование",newTitle:"Новый объект",photoAlt:"Фото объекта",price:"Цена, EUR",subtitle:"Краткое описание"
 }:de?{
  points:"Routenpunkte",section:"Katalog",add:"Hinzufügen",edit:"Bearbeiten",empty:"Dieser Bereich ist noch leer.",days:"Tage",from:"von",to:"bis",priceFrom:"Preis von, EUR",priceTo:"Preis bis, EUR",daysFrom:"Tage von",daysTo:"Tage bis",slug:"Adresse (Slug)",title:"Titel",description:"Beschreibung",image:"Foto AVIF/WebP",upload:"Foto hochladen",uploading:"Wird geladen…",collection:"Kollektion",notLinked:"Nicht verknüpft",order:"Reihenfolge",active:"Auf der Website anzeigen",save:"Speichern",saving:"Speichern…",close:"Schließen",country:"Land / Region",latitude:"Breitengrad",longitude:"Längengrad",selectPoints:"Routenpunkte",pointHelp:"Erstellen Sie hier zuerst Punkte und wählen Sie sie dann in der Route aus.",saved:"Gespeichert",rangeError:"Der Bis-Wert darf nicht kleiner als der Von-Wert sein.",formatError:"Nur AVIF- und WebP-Bilder bis 8 MB sind erlaubt.",editTitle:"Bearbeiten",newTitle:"Neues Objekt",photoAlt:"Objektfoto",price:"Preis, EUR",subtitle:"Kurzbeschreibung"
 }:{
  points:"Route points",section:"Catalog",add:"Add",edit:"Edit",empty:"Nothing here yet.",days:"days",from:"from",to:"to",priceFrom:"Price from, EUR",priceTo:"Price to, EUR",daysFrom:"Days from",daysTo:"Days to",slug:"Address (slug)",title:"Title",description:"Description",image:"AVIF/WebP photo",upload:"Upload photo",uploading:"Uploading…",collection:"Collection",notLinked:"Not linked",order:"Order",active:"Show on website",save:"Save",saving:"Saving…",close:"Close",country:"Country / region",latitude:"Latitude",longitude:"Longitude",selectPoints:"Route points",pointHelp:"Create points here first, then select them in the route form.",saved:"Saved",rangeError:"The “to” value cannot be lower than the “from” value.",formatError:"Only AVIF and WebP images up to 8 MB are allowed.",editTitle:"Edit",newTitle:"New item",photoAlt:"Item photo",price:"Price, EUR",subtitle:"Short description"
 };
}

export default function CatalogPanel({isAdmin,request,t}:{isAdmin:boolean;request:(action:string,payload?:object)=>Promise<unknown>;t:typeof operationsTranslations.en}){
 const c=copy(t);
 const [section,setSection]=useState<Section>("collection");
 const [items,setItems]=useState<Item[]>([]),[points,setPoints]=useState<Point[]>([]),[open,setOpen]=useState(false),[values,setValues]=useState<FormValues>(blank()),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[uploading,setUploading]=useState(false);
 const collections=useMemo(()=>items.filter(i=>i.item_type==="collection"),[items]);
 const visible=useMemo(()=>section==="points"?points:items.filter(i=>i.item_type===section),[items,points,section]);
 const load=async()=>{const data=await request("list") as ApiResult;setItems(data.items||[]);setPoints(data.points||[])};
 useEffect(()=>{const value=new URLSearchParams(window.location.search).get("section");if(["collection","product","route","extra","points"].includes(value||""))setSection(value as Section);load().catch(e=>setMessage(e instanceof Error?e.message:String(e)))},[]);
 const href=(value:Section)=>`/concierge/catalog/?section=${value}`;
 const labels:{value:Section;label:string}[]=[{value:"collection",label:t.collections},{value:"product",label:t.products},{value:"route",label:t.routes},{value:"extra",label:t.extras},{value:"points",label:c.points}];
 const startNew=()=>{setValues(blank());setMessage("");setOpen(true)};
 const startEdit=(entry:Item|Point)=>{
  if(section==="points") {const p=entry as Point;setValues({...blank(),id:p.id,slug:p.slug,title:p.title,country:p.country_name||"",latitude:number(p.latitude),longitude:number(p.longitude),description:p.description||"",imagePath:p.image_path||"",active:Boolean(p.is_active)});}
  else {const i=entry as Item;setValues({...blank(),id:i.id,slug:i.slug,title:i.title,subtitle:i.subtitle||"",imagePath:i.image_path||"",collectionId:i.collection_id||"",price:number(i.price),priceTo:number(i.price_to),daysFrom:number(i.days_from),daysTo:number(i.days_to),sortOrder:number(i.sort_order),active:Boolean(i.is_active),pointSlugs:asPoints(i.points_json)});}
  setMessage("");setOpen(true);
 };
 const set=(name:keyof FormValues,value:string|boolean|string[])=>setValues(current=>({...current,[name]:value}));
 const upload=async(file?:File)=>{
  if(!file)return;
  if(!["image/webp","image/avif"].includes(file.type)||file.size>8*1024*1024){setMessage(c.formatError);return;}
  setUploading(true);setMessage("");
  try{const dataUrl=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file)});const result=await request("upload",{file:dataUrl}) as ApiResult;if(!result.path)throw new Error(c.formatError);set("imagePath",result.path)}catch(e){setMessage(e instanceof Error?e.message:String(e))}finally{setUploading(false)}
 };
 const submit=async(event:FormEvent)=>{
  event.preventDefault();
  if(section==="collection"&&((values.daysFrom&&values.daysTo&&+values.daysTo<+values.daysFrom)||(values.price&&values.priceTo&&+values.priceTo<+values.price))){setMessage(c.rangeError);return;}
  setBusy(true);setMessage("");
  try{
   if(section==="points") await request("save_point",{id:values.id,slug:values.slug,title:values.title,country:values.country,latitude:values.latitude,longitude:values.longitude,description:values.description,imagePath:values.imagePath,active:values.active});
   else await request("save",{id:values.id,itemType:section,slug:values.slug,title:values.title,subtitle:values.subtitle,imagePath:values.imagePath,collectionId:values.collectionId,price:values.price,priceTo:values.priceTo,daysFrom:values.daysFrom,daysTo:values.daysTo,sortOrder:values.sortOrder,points:values.pointSlugs,active:values.active});
   await load();setOpen(false);setMessage(c.saved);
  }catch(e){setMessage(e instanceof Error?e.message:String(e))}finally{setBusy(false)}
 };
 const range=(i:Item)=>{
  if(section==="collection")return <div className="catalog-card-range"><span>{i.days_from||"—"}{i.days_to&&i.days_to!==i.days_from?`–${i.days_to}`:""} {c.days}</span><b>€ {i.price||"—"}{i.price_to&&i.price_to!==i.price?`–${i.price_to}`:""}</b></div>;
  return i.price?<div className="catalog-card-range"><b>€ {i.price}{i.price_to&&i.price_to!==i.price?`–${i.price_to}`:""}</b></div>:null;
 };
 return <section className="catalog-panel">
  <nav className="catalog-tabs" aria-label={c.section}>{labels.map(tab=><a key={tab.value} href={href(tab.value)} className={section===tab.value?"active":""} aria-current={section===tab.value?"page":undefined}>{tab.label}</a>)}</nav>
  <div className="catalog-heading"><div><p className="account-eyebrow">{c.section.toUpperCase()} / {(labels.find(x=>x.value===section)?.label||"").toUpperCase()}</p><h2>{labels.find(x=>x.value===section)?.label}</h2>{section==="points"&&<p className="catalog-help">{c.pointHelp}</p>}</div>{isAdmin&&<button className="catalog-add" onClick={startNew}>{c.add} +</button>}</div>
  {message&&<p className="catalog-message">{message}</p>}
  <div className="catalog-grid">{visible.map(entry=>{const point=section==="points", image=point?(entry as Point).image_path:(entry as Item).image_path, subtitle=point?(entry as Point).country_name:(entry as Item).subtitle;return <article key={`${section}-${entry.id}`}><div className="catalog-image">{image?<img src={image} alt={entry.title}/>:<span>MLT</span>}</div><small>{point?c.points:labels.find(x=>x.value===section)?.label}</small><h3>{entry.title}</h3>{subtitle&&<p className="catalog-card-meta">{subtitle}</p>}{!point&&range(entry as Item)}{point&&<p className="catalog-card-meta">{(entry as Point).latitude||"—"}, {(entry as Point).longitude||"—"}</p>}{section==="route"&&<p className="catalog-card-meta">{c.points}: {asPoints((entry as Item).points_json).length}</p>}{isAdmin&&<button onClick={()=>startEdit(entry)}>{c.edit} →</button>}</article>})}{visible.length===0&&<p className="catalog-empty">{c.empty}</p>}</div>
  {open&&<div className="catalog-editor" role="dialog" aria-modal="true"><form onSubmit={submit} className="catalog-editor-v2"><header><div><small>{values.id?c.editTitle:c.newTitle}</small><h2>{labels.find(x=>x.value===section)?.label}</h2></div><button type="button" onClick={()=>setOpen(false)} aria-label={c.close}>×</button></header>
   <Field label={c.title}><input required value={values.title} onChange={e=>set("title",e.target.value)}/></Field><Field label={c.slug}><input required pattern="[a-z0-9-]+" value={values.slug} onChange={e=>set("slug",e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"-"))}/></Field>
   {section!=="points"&&<Field label={c.subtitle} wide><textarea value={values.subtitle} onChange={e=>set("subtitle",e.target.value)}/></Field>}
   {(section==="product"||section==="route")&&<Field label={c.collection}><select value={values.collectionId} onChange={e=>set("collectionId",e.target.value)}><option value="">{c.notLinked}</option>{collections.map(item=><option key={item.slug} value={item.slug}>{item.title}</option>)}</select></Field>}
   {section==="collection"&&<><Field label={c.daysFrom}><input type="number" min="1" value={values.daysFrom} onChange={e=>set("daysFrom",e.target.value)}/></Field><Field label={c.daysTo}><input type="number" min="1" value={values.daysTo} onChange={e=>set("daysTo",e.target.value)}/></Field><Field label={c.priceFrom}><input type="number" min="0" step="0.01" value={values.price} onChange={e=>set("price",e.target.value)}/></Field><Field label={c.priceTo}><input type="number" min="0" step="0.01" value={values.priceTo} onChange={e=>set("priceTo",e.target.value)}/></Field></>}
   {(section==="product"||section==="extra")&&<Field label={c.price}><input type="number" min="0" step="0.01" value={values.price} onChange={e=>set("price",e.target.value)}/></Field>}
   {section==="points"&&<><Field label={c.country}><input value={values.country} onChange={e=>set("country",e.target.value)}/></Field><Field label={c.latitude}><input type="number" min="-90" max="90" step="0.0000001" value={values.latitude} onChange={e=>set("latitude",e.target.value)}/></Field><Field label={c.longitude}><input type="number" min="-180" max="180" step="0.0000001" value={values.longitude} onChange={e=>set("longitude",e.target.value)}/></Field><Field label={c.description} wide><textarea value={values.description} onChange={e=>set("description",e.target.value)}/></Field></>}
   {section==="route"&&<fieldset className="catalog-point-picker"><legend>{c.selectPoints}</legend>{points.length?points.map(point=><label key={point.slug}><input type="checkbox" checked={values.pointSlugs.includes(point.slug)} onChange={e=>set("pointSlugs",e.target.checked?[...values.pointSlugs,point.slug]:values.pointSlugs.filter(x=>x!==point.slug))}/><span>{point.title}{point.country_name?` · ${point.country_name}`:""}</span></label>):<p>{c.pointHelp}</p>}</fieldset>}
   <Field label={c.image} wide><div className="catalog-upload">{values.imagePath&&<img src={values.imagePath} alt={c.photoAlt}/>}<input value={values.imagePath} onChange={e=>set("imagePath",e.target.value)} placeholder="/uploads/catalog/photo.webp"/><label className="catalog-upload-button">{uploading?c.uploading:c.upload}<input type="file" accept="image/avif,image/webp" disabled={uploading} onChange={e=>upload(e.target.files?.[0])}/></label></div></Field>
   {section!=="points"&&<Field label={c.order}><input type="number" value={values.sortOrder} onChange={e=>set("sortOrder",e.target.value)}/></Field>}
   <label className="catalog-active"><input type="checkbox" checked={values.active} onChange={e=>set("active",e.target.checked)}/><span>{c.active}</span></label>
   {message&&<p className="catalog-form-message">{message}</p>}<button className="catalog-save" disabled={busy||uploading}>{busy?c.saving:c.save}</button>
  </form></div>}
 </section>;
}

function Field({label,wide=false,children}:{label:string;wide?:boolean;children:ReactNode}){return <label className={wide?"catalog-wide":""}><span>{label}</span>{children}</label>}
