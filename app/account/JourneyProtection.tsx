"use client";
import {useEffect,useState} from 'react';
import {type JourneyTerms} from '../../content/journey-terms';
import TermsDialog from '../TermsDialog';
export default function JourneyProtection({terms,paid,locale,disabled,onChange}:{terms:JourneyTerms;paid:number;locale:string;disabled:boolean;onChange:(enabled:boolean)=>Promise<void>}){
  const [settings,setSettings]=useState<{enabled:boolean;percent:number;terms:string}|null>(null);
  useEffect(()=>{fetch('/api/journey-options.php',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(setSettings).catch(()=>{});},[]);
  if(paid>0||!settings?.enabled||!settings.terms)return null;
  const percent=terms.protectionPercent||settings.percent;
  const money=(amount:number)=>new Intl.NumberFormat(locale,{style:'currency',currency:'EUR'}).format(amount);
  return <><label className="legal-check"><input type="checkbox" disabled={disabled} checked={terms.protectionPercent>0} onChange={e=>onChange(e.target.checked)}/><span>MLT Flexible Protection (+{percent}% · {money(Math.round(terms.base*percent)/100)}){terms.protectionPercent>0&&<><br/>{locale==='ru'?'Итого за путешествие':'Journey total'}: {money(terms.total)}</>}</span></label><TermsDialog label={locale==='ru'?'Условия защиты':'Protection terms'}><p>{terms.protectionPercent?terms.protectionTerms:settings.terms}</p></TermsDialog></>;
}
