"use client";
import {useEffect,useState} from 'react';
import {type JourneyTerms} from '../../content/journey-terms';
import TermsDialog from '../TermsDialog';
import {journeyCopy} from '../../content/journey-copy';
export default function JourneyProtection({terms,paid,locale,disabled,onChange}:{terms:JourneyTerms;paid:number;locale:string;disabled:boolean;onChange:(enabled:boolean)=>Promise<void>}){
  const [settings,setSettings]=useState<{enabled:boolean;percent:number;terms:string}|null>(null);
  useEffect(()=>{fetch('/api/journey-options.php',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(setSettings).catch(()=>{});},[]);
  if(paid>0||!settings?.enabled||!settings.terms)return null;
  const copy=journeyCopy[locale as keyof typeof journeyCopy]||journeyCopy.en;
  const percent=terms.protectionPercent||settings.percent;
  const extra=Math.round(terms.base*percent)/100;
  const enabled=terms.protectionPercent>0;
  const money=(amount:number)=>new Intl.NumberFormat(locale,{style:'currency',currency:'EUR'}).format(amount);
  return <><label className="legal-check"><input type="checkbox" disabled={disabled} checked={enabled} onChange={e=>onChange(e.target.checked)}/><span>MLT Flexible Protection<br/>{money(terms.base)} × {percent}% = +{money(extra)}<br/>{copy.total}: <strong>{money(terms.total-terms.protectionAmount+(enabled?extra:0))}</strong><br/>{({ru:'Доплата включается в финальный платёж. Гарантийный депозит не меняется.',en:'Added to the final payment. Your security deposit stays the same.',de:'Im letzten Zahlungsabschnitt enthalten. Die Kaution bleibt unverändert.',it:'Incluso nel saldo finale. La cauzione non cambia.',pl:'Doliczone do płatności końcowej. Kaucja bez zmian.'} as Record<string,string>)[locale]||'Added to the final payment.'}</span></label><TermsDialog label={copy.protection}><p>{terms.protectionPercent?terms.protectionTerms:settings.terms}</p></TermsDialog></>;
}
