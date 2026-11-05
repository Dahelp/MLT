"use client";

import {useEffect,useId,useRef,useState,type FormEvent} from "react";
import {emptyScoutFields,scoutRequest,type ScoutCard,type ScoutFields} from "../../content/scout";
import {scoutCopy,scoutCategoriesFor,scoutFormat} from "../../content/scout-i18n";
import {uploadScoutVideo,type ScoutVideoDraft} from "../../content/scout-video";
import type {OperationsLocale} from "../../content/operations-i18n";
import {newScoutIdentity} from "../scout-passport/draft";
import ScoutAmenities from "../scout-passport/ScoutAmenities";
import ScoutSubcategories from "../scout-passport/ScoutSubcategories";
import {scoutPhotoSlots,scoutPhotoLimits,prepareScoutPhotos} from "../../content/scout-photos";
import PhotoCapture from "../scout-passport/PhotoCapture";
import VideoSelection from "../scout-passport/VideoSelection";
import "../scout-passport/scout.css";
import "./location-editor.css";

export default function LocationEditor({card,locale,onClose,onSaved}:{card:ScoutCard;locale:OperationsLocale;onClose:()=>void;onSaved:()=>void}){
  const t=scoutCopy[locale].editor,f=scoutCopy[locale].form;
  const dialog=useRef<HTMLDialogElement>(null),heading=useId();
  const [fields,setFields]=useState<ScoutFields>({...emptyScoutFields,...card});
  const [photos,setPhotos]=useState(()=>scoutPhotoSlots(card.photos));
  const [video,setVideo]=useState<ScoutVideoDraft|null>(card.video||null),[camera,setCamera]=useState<number|null>(null);
  const [identity]=useState(newScoutIdentity),[busy,setBusy]=useState(false),[error,setError]=useState(""),[progress,setProgress]=useState<number|null>(null);
  const editRequest=useRef({signature:"",id:identity.requestId});
  useEffect(()=>{
    const opener=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;
    document.body.style.overflow="hidden";dialog.current?.showModal();
    return ()=>{document.body.style.overflow=overflow;if(opener?.isConnected)opener.focus();};
  },[]);
  const change=(key:Exclude<keyof ScoutFields,"subcategories">,value:string)=>setFields(current=>key==="category"?{...current,category:value,subcategories:[],subcategoryOther:"",amenities:""}:{...current,[key]:value});
  const addPhoto=()=>{if(photos.length>=scoutPhotoLimits.max)return;setCamera(photos.length);};
  const save=async(event:FormEvent)=>{
    event.preventDefault();if(busy)return;
    const attached=photos.filter(Boolean);
    if(attached.length<scoutPhotoLimits.min||attached.length>scoutPhotoLimits.max){setError(scoutCopy[locale].errors.photoCount);return;}
    setBusy(true);setError("");
    try{
      const submittedPhotos=await prepareScoutPhotos(attached,locale);
      const selectedVideo=await uploadScoutVideo(video,identity.editToken,locale,setProgress);setProgress(null);
      const signature=JSON.stringify({fields,photos:submittedPhotos,video:selectedVideo});
      if(editRequest.current.signature&&editRequest.current.signature!==signature)editRequest.current.id=crypto.randomUUID();
      editRequest.current.signature=signature;
      await scoutRequest("admin_update",{...fields,reference:card.reference,version:card.version,requestId:editRequest.current.id,mediaEditToken:identity.editToken,photos:submittedPhotos,video:selectedVideo},true,locale);
      onSaved();
    }catch(value){setError((value as Error).message);setBusy(false);setProgress(null);}
  };
  return <><dialog ref={dialog} className="base-location-editor" aria-labelledby={heading} onCancel={event=>{event.preventDefault();if(!busy)onClose();}}>
    <header className="base-location-editor-header"><div><p>{card.reference} · {card.scoutName}</p><h2 id={heading}>{t.title}</h2></div><button type="button" disabled={busy} onClick={onClose} aria-label={t.close}>×</button></header>
    <form onSubmit={save} className="base-location-editor-form"><div className="base-location-editor-body"><fieldset disabled={busy} className="base-location-editor-fields">
      <p className="base-location-editor-help">{card.isPublished?t.publishedHelp:t.help}</p>
      <label>{f.title} *<input required maxLength={180} name="title" value={fields.title} onChange={event=>change("title",event.target.value)}/></label>
      <div className="base-location-editor-pair"><label>{f.sectionCategory}<select name="category" value={fields.category} onChange={event=>change("category",event.target.value)}>{scoutCategoriesFor(locale).map(category=><option value={category.id} key={category.id}>{category.title}</option>)}</select></label><label>{f.country} *<input name="country" required maxLength={100} value={fields.country} onChange={event=>change("country",event.target.value)}/></label></div>
      <ScoutSubcategories category={fields.category} selected={fields.subcategories} other={fields.subcategoryOther} locale={locale} onChange={(subcategories,subcategoryOther)=>setFields(current=>({...current,subcategories,subcategoryOther}))}/>
      <div className="base-location-editor-pair"><label>{f.latitude} *<input name="latitude" required type="number" step="any" min="-90" max="90" value={fields.latitude} onChange={event=>change("latitude",event.target.value)}/></label><label>{f.longitude} *<input name="longitude" required type="number" step="any" min="-180" max="180" value={fields.longitude} onChange={event=>change("longitude",event.target.value)}/></label></div>
      <label>{f.description} *<textarea name="description" required rows={5} maxLength={3000} value={fields.description} onChange={event=>change("description",event.target.value)}/></label>
      <ScoutAmenities category={fields.category} value={fields.amenities} locale={locale} onChange={value=>change("amenities",value)}/><div className="base-location-editor-pair"><label>{f.parking}<input name="parking" maxLength={500} value={fields.parking} onChange={event=>change("parking",event.target.value)}/></label><label>{f.booking}<input name="booking" maxLength={500} value={fields.booking} onChange={event=>change("booking",event.target.value)}/></label></div>
      <div className="base-location-editor-pair"><label>{f.locationWebsite}<input name="locationWebsite" inputMode="url" autoCapitalize="none" maxLength={2048} value={fields.locationWebsite} onChange={event=>change("locationWebsite",event.target.value)}/></label><label>{f.contactPhone}<input name="contactPhone" type="tel" maxLength={80} value={fields.contactPhone} onChange={event=>change("contactPhone",event.target.value)}/></label></div>
      <div className="base-location-editor-photos"><h3>{f.sectionPhotos}</h3><p>{t.photosHelp}</p><div className="scout-photos">{photos.map((photo,index)=><div className="scout-photo" key={index}><button type="button" onClick={()=>setCamera(index)} aria-label={scoutFormat(photo?t.replacePhoto:t.addPhoto,{number:index+1})}>{photo?<img src={photo} alt={`${f.frame.replace("{number}",String(index+1))} · ${fields.title}`}/>:<span className="scout-plus">+</span>}<i>3:4</i></button>{photo&&<><button type="button" className="scout-photo-remove" onClick={()=>setPhotos(current=>current.map((value,slot)=>slot===index?"":value))} aria-label={scoutFormat(f.removeFrame,{number:index+1})}>×</button><button type="button" className="base-location-edit-cover" disabled={photos.findIndex(Boolean)===index} onClick={()=>setPhotos(current=>[current[index],...current.filter((_,slot)=>slot!==index)])}>{photos.findIndex(Boolean)===index?t.cover:t.makeCover}</button></>}</div>)}</div>{photos.length<scoutPhotoLimits.max&&<button type="button" className="scout-add-photo" onClick={addPhoto}>{f.addPhoto}</button>}</div>
      <VideoSelection value={video} onChange={setVideo} locale={locale} disabled={busy}/>
    </fieldset></div>
    <div className="base-location-editor-footer">{error&&<p className="base-location-error" role="alert">{error}</p>}<div><button type="button" disabled={busy} onClick={onClose}>{t.cancel}</button><button className="base-location-editor-save" type="submit" disabled={busy}>{progress!==null?scoutFormat(scoutCopy[locale].video.uploading,{percent:progress}):busy?scoutCopy[locale].admin.saving:t.save}</button></div></div></form>
  </dialog>{camera!==null&&<PhotoCapture galleryOnly locale={locale} index={camera} onClose={()=>setCamera(null)} onSave={photo=>{setPhotos(current=>camera===current.length?[...current,photo]:current.map((value,index)=>index===camera?photo:value));setCamera(null);}}/>}</>;
}
