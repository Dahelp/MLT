'use client';
import { useEffect, useRef, useState } from 'react';
import { scoutCopy } from '../../content/scout-i18n';
import { scoutMediaLimits, type ScoutVideoDraft } from '../../content/scout-video';
import type { Locale } from '../../content/i18n';

export default function VideoSelection({value,onChange,locale,disabled}:{value:ScoutVideoDraft|null;onChange:(video:ScoutVideoDraft|null)=>void;locale:Locale;disabled:boolean}){
  const t=scoutCopy[locale].video, gallery=useRef<HTMLInputElement>(null), camera=useRef<HTMLInputElement>(null);
  const [url,setUrl]=useState(''),[error,setError]=useState('');
  useEffect(()=>{if(!value){setUrl('');return}if(!('file' in value)){setUrl(value.path);return}const object=URL.createObjectURL(value.file);setUrl(object);return()=>URL.revokeObjectURL(object)},[value]);
  const select=(file?:File)=>{
    if(!file)return;setError('');
    if(!file.size||file.size>scoutMediaLimits.videoMaxBytes){setError(t.tooLarge);return}
    if(!['video/mp4','video/webm','video/quicktime','video/x-m4v'].includes(file.type)&&!(/\.(mp4|mov|webm|m4v)$/i).test(file.name)){setError(t.format);return}
    onChange({file,requestId:crypto.randomUUID()});
  };
  return <div className="scout-video-selection"><h3>{t.title}</h3><p className="scout-hint">{t.hint}</p>
    {url&&<div className="scout-video-preview"><video src={url} controls playsInline preload="metadata" aria-label={t.preview}/><p>{value&&('file' in value?value.file.name:value.name)}</p><button type="button" disabled={disabled} onClick={()=>{onChange(null);setError('')}}>{t.remove}</button></div>}
    <div className="scout-video-actions"><button type="button" disabled={disabled} onClick={()=>gallery.current?.click()}>{value?t.replace:t.gallery}</button><button type="button" disabled={disabled} onClick={()=>camera.current?.click()}>{t.record}</button></div>
    {error&&<p className="scout-error" role="alert">{error}</p>}
    <input data-scout-video-gallery ref={gallery} type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.mov,.webm,.m4v" hidden disabled={disabled} onChange={event=>{select(event.target.files?.[0]);event.target.value=''}}/>
    <input data-scout-video-camera ref={camera} type="file" accept="video/*" capture="environment" hidden disabled={disabled} onChange={event=>{select(event.target.files?.[0]);event.target.value=''}}/>
  </div>;
}
