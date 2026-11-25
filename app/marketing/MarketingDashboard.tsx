"use client";
import {useEffect,useState} from 'react';
import OperationsShell from '../OperationsShell';
import {useOperationsLocale} from '../useOperationsLocale';
import {marketingCopy} from '../../content/marketing';
import './marketing.css';

type Groups={state:'ready'|'suppressed'|'unavailable';rows?:{key:string;count:number}[]};
type Data={operator:{name:string;role:string};period:{days:number;start:string;endExclusive:string};journeys:{total:number|null;paid:number|null;conversion:number|null;averageDays:number|null;collections:Groups;statuses:Groups;months:Groups;duration:Groups};registrations:Groups;inquiries:Groups;chats:Groups;scout:Groups;receipts:{state:string;rows?:{currency:string;amount:number}[]};vouchers:{state:string;units?:number;cashCents?:number}};

export default function MarketingDashboard(){
 const [locale]=useOperationsLocale();const t=marketingCopy[locale];
 const [days,setDays]=useState(30),[data,setData]=useState<Data|null>(null),[loading,setLoading]=useState(true),[failure,setFailure]=useState<'network'|'access'|'session'|null>(null),[revision,setRevision]=useState(0);
 useEffect(()=>{const restore=()=>{const value=Number(new URLSearchParams(location.search).get('days'));setDays([30,90,365].includes(value)?value:30)};restore();addEventListener('popstate',restore);return()=>removeEventListener('popstate',restore)},[]);
 useEffect(()=>{
  const controller=new AbortController();let active=true;let timedOut=false;
  setLoading(true);setFailure(null);setData(null);
  const token=localStorage.getItem('mlt-account-token');
  if(!token){setLoading(false);setFailure('session');return()=>controller.abort()}
  const timeout=setTimeout(()=>{timedOut=true;controller.abort()},20000);
  void fetch('/api/marketing.php',{method:'POST',cache:'no-store',signal:controller.signal,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({action:'overview',days})}).then(async response=>{
   if(response.status===401){if(active)setFailure('session');return}
   if(response.status===403){if(active)setFailure('access');return}
   if(!response.ok)throw Error('unavailable');
   const next:Data=await response.json();if(active)setData(next);
  }).catch(()=>{if(active&&(!controller.signal.aborted||timedOut))setFailure('network')}).finally(()=>{clearTimeout(timeout);if(active)setLoading(false)});
  return()=>{active=false;clearTimeout(timeout);controller.abort()};
 },[days,revision]);
 const choose=(value:number)=>{setDays(value);const url=new URL(location.href);url.searchParams.set('days',String(value));history.pushState({},'',url)};
 const value=(number:number|null|undefined,suffix='')=>number===null||number===undefined?'—':new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(number)+suffix;
 const money=(amount:number,currency:string)=>new Intl.NumberFormat(locale,{style:'currency',currency}).format(amount);
 const date=(input:string)=>new Date(input+'T00:00:00Z').toLocaleDateString(locale,{timeZone:'UTC'});
 const state=(current:string)=>current==='suppressed'?t.suppressed:current==='unavailable'?t.unavailable:t.empty;
 const groups=(id:string,title:string,group:Groups)=> <section className="marketing-panel" aria-labelledby={id}><h2 id={id}>{title}</h2>{group.state==='ready'&&group.rows?.length?<table><thead><tr><th scope="col">{t.segment}</th><th scope="col">{t.records}</th></tr></thead><tbody>{group.rows.map(row=><tr key={row.key}><th scope="row">{t.buckets[row.key as keyof typeof t.buckets]||row.key}</th><td><span className="marketing-bar" aria-hidden="true"><i style={{width:`${Math.max(2,row.count/Math.max(...group.rows!.map(r=>r.count))*100)}%`}}/></span><b>{value(row.count)}</b></td></tr>)}</tbody></table>:<p className="marketing-empty">{state(group.state)}</p>}</section>;
 return <OperationsShell scope="marketing" active="overview" operator={data?.operator} contentClassName="marketing-main" topbar={{unread:0}}>
  <header className="marketing-heading"><div><p className="marketing-eyebrow">MLT · {t.readonly}</p><h1>{t.title}</h1><p>{t.intro}</p></div><button type="button" onClick={()=>setRevision(n=>n+1)} disabled={loading}>{loading?t.loading:t.refresh}</button></header>
  <div className="marketing-toolbar"><div role="group" aria-label={t.period}>{([30,90,365] as const).map(n=><button type="button" key={n} aria-pressed={days===n} onClick={()=>choose(n)}>{n} {t.days}</button>)}</div><span>{t.completedDays}</span></div>
  {loading&&<section className="marketing-panel" role="status"><h2>{t.loading}</h2><p>{t.loadingHint}</p></section>}
  {failure&&<section className="marketing-panel marketing-error" role="alert"><h2>{failure==='access'?t.denied:failure==='session'?t.signin:t.error}</h2><p>{failure==='access'?t.deniedHint:failure==='session'?t.sessionHint:t.errorHint}</p>{failure==='network'?<button type="button" onClick={()=>setRevision(n=>n+1)}>{t.retry}</button>:<a href={`/account/?next=${encodeURIComponent('/marketing/?days='+days)}`}>{t.signin}</a>}</section>}
  {data&&data.period.days===days&&!loading&&!failure&&<>
   <p className="marketing-period">{t.window}: <time dateTime={data.period.start}>{date(data.period.start)}</time> — <time>{new Date(new Date(data.period.endExclusive+'T00:00:00Z').getTime()-86400000).toLocaleDateString(locale,{timeZone:'UTC'})}</time> · {t.databaseClock}</p>
   <div className="marketing-metrics">{[[t.applications,value(data.journeys.total),t.applicationsHint],[t.paid,value(data.journeys.paid),t.paidHint],[t.conversion,value(data.journeys.conversion,'%'),t.conversionHint],[t.duration,value(data.journeys.averageDays),t.durationHint]].map(([label,number,hint])=><article key={label}><h2>{label}</h2><strong>{number}</strong><p>{hint}</p></article>)}</div>
   <p className="marketing-privacy">{t.privacy}</p>
   <h2 className="marketing-section-title">{t.demand}</h2><div className="marketing-grid">{groups('marketing-collections',t.collections,data.journeys.collections)}{groups('marketing-status',t.statuses,data.journeys.statuses)}{groups('marketing-months',t.months,data.journeys.months)}{groups('marketing-duration',t.durationGroups,data.journeys.duration)}</div>
   <h2 className="marketing-section-title">{t.contacts}</h2><p className="marketing-description">{t.contactsHint}</p><div className="marketing-grid">{groups('marketing-inquiries',t.inquiries,data.inquiries)}{groups('marketing-chats',t.chats,data.chats)}{groups('marketing-users',t.registrations,data.registrations)}{groups('marketing-scout',t.scout,data.scout)}</div>
   <h2 className="marketing-section-title">{t.commerce}</h2><div className="marketing-grid"><section className="marketing-panel"><h2>{t.receipts}</h2><p>{t.receiptsHint}</p>{data.receipts.state==='ready'&&data.receipts.rows?.length?<dl className="marketing-money">{data.receipts.rows.map(row=><div key={row.currency}><dt>{row.currency==='other'?t.buckets.other:row.currency}</dt><dd>{row.currency==='other'?t.unavailable:money(row.amount,row.currency)}</dd></div>)}</dl>:<p className="marketing-empty">{state(data.receipts.state)}</p>}</section><section className="marketing-panel"><h2>{t.vouchers}</h2><p>{t.vouchersHint}</p>{data.vouchers.state==='ready'?<dl className="marketing-money"><div><dt>{t.units}</dt><dd>{value(data.vouchers.units)}</dd></div><div><dt>{t.voucherCash}</dt><dd>{money((data.vouchers.cashCents||0)/100,'EUR')}</dd></div></dl>:<p className="marketing-empty">{state(data.vouchers.state)}</p>}</section></div>
  </>}
  <section className="marketing-panel marketing-sources"><h2>{t.sources}</h2><p>{t.sourcesHint}</p><ul>{t.missing.map(([title,detail])=><li key={title}><span className="marketing-tag">{t.noSource}</span><div><h3>{title}</h3><p>{detail}</p></div></li>)}</ul></section>
 </OperationsShell>;
}
