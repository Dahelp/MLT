"use client";
import {useState} from 'react';
import {type JourneyTerms as Terms,journeyPaymentRows,journeyCancellation,nextJourneyPayment} from '../content/journey-terms';
import {journeyCopy,localizeProtectionTerms} from '../content/journey-copy';
import styles from './journey-costs.module.css';

export default function JourneyTerms({terms:t,locale='en',expanded=false,arrival,paid,preview=false,legacy=false,legacyCosts}:{terms:Terms|null;locale?:string;popup?:boolean;expanded?:boolean;arrival?:string;paid?:number;preview?:boolean;legacy?:boolean;legacyCosts?:{total:number;paid:number;advance:number}}){
  const [cancelDate,setCancelDate]=useState('');
  const copy=journeyCopy[locale as keyof typeof journeyCopy]||journeyCopy.en;
  const dateLocale=({ru:'ru-RU',en:'en-GB',de:'de-DE',it:'it-IT',pl:'pl-PL'} as Record<string,string>)[locale]||'en-GB';
  const money=(n:number)=>new Intl.NumberFormat(dateLocale,{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(n);
  if(!t)return legacy?<section className={styles.summary} data-journey-costs aria-label={copy.title}><h3>{copy.title}</h3>{legacyCosts&&<dl className={styles.rows}><div><dt>{copy.total}</dt><dd>{money(legacyCosts.total)}</dd></div><div><dt>{copy.paid}</dt><dd>{money(legacyCosts.paid)}</dd></div><div><dt>{copy.remaining}</dt><dd>{money(Math.max(0,legacyCosts.total-legacyCosts.paid))}</dd></div><div><dt>{copy.next}</dt><dd>{money(Math.max(0,legacyCosts.paid<legacyCosts.advance?legacyCosts.advance-legacyCosts.paid:legacyCosts.total-legacyCosts.paid))}</dd></div></dl>}<p>{copy.unknown}</p></section>:null;
  const round=(n:number)=>Math.round(n*100)/100;
  const advance=round(t.tourTotal*t.policy.advance/100);
  const received=paid===undefined?advance+t.planningFee:Math.max(0,paid);
  const rows=journeyPaymentRows(t);
  const dueDate=(days:number|null)=>{
    if(days===null)return '';
    if(!arrival)return `${days} ${copy.before}`;
    const date=new Date(arrival+'T12:00:00Z');date.setUTCDate(date.getUTCDate()-days);
    return Number.isFinite(date.getTime())?new Intl.DateTimeFormat(dateLocale,{timeZone:'UTC'}).format(date):`${days} ${copy.before}`;
  };
  const until=arrival&&cancelDate?Math.max(0,Math.floor((Date.parse(arrival+'T00:00:00Z')-Date.parse(cancelDate+'T00:00:00Z'))/86400000)):null;
  const cancellation=until===null?null:journeyCancellation(t,until,received);
  return <section className={styles.summary} aria-label={copy.title} data-journey-costs>
    <h3>{copy.title}</h3>
    <dl className={styles.rows}>
      <div><dt>{copy.package}</dt><dd>{money(t.base)}</dd></div>
      {t.tourTotal>t.base&&<div><dt>{copy.guests}</dt><dd>+{money(round(t.tourTotal-t.base))}</dd></div>}
      {t.planningFee>0&&<div><dt>{copy.planning}</dt><dd>{preview?'€500–1,500':money(t.planningFee)}</dd></div>}
      {t.protectionPercent>0&&<div><dt>{copy.protection} ({t.protectionPercent}%)</dt><dd>+{money(t.protectionAmount)}</dd></div>}
      <div><dt><strong>{copy.total}</strong></dt><dd><strong>{preview&&t.planningFee?`${money(t.tourTotal+500)}–${money(t.tourTotal+1500)}`:money(t.total)}</strong></dd></div>
      {paid!==undefined&&<><div><dt>{copy.paid}</dt><dd>{money(paid)}</dd></div><div><dt>{copy.remaining}</dt><dd>{money(Math.max(0,round(t.total-paid)))}</dd></div><div><dt>{copy.next}</dt><dd>{money(nextJourneyPayment(t,paid))}</dd></div></>}
    </dl>
    {preview&&t.planningFee>0&&<p>{copy.estimate}</p>}
    {paid!==undefined&&nextJourneyPayment(t,paid)===0&&paid<t.total&&<p>{copy.wait}</p>}
    <ol className={styles.stages}>
      {t.planningFee>0&&<li><strong>{copy.planning}: {preview?'€500–1,500':money(t.planningFee)}</strong></li>}
      {rows.map((row,i)=><li key={i}><strong>{i===0?copy.advance:i===rows.length-1?copy.final:copy.stage} · {row.percent}% — {money(row.amount)}</strong><span>{row.days===null?(i===0?(t.variant==='private'?copy.contract:t.variant==='signature_tailored'?copy.approved:copy.now):copy.agreed):dueDate(row.days)}</span></li>)}
    </ol>
    {!arrival&&<p>{copy.chooseDate}</p>}
    {t.policy.cashFinal&&<p>{copy.cash}</p>}
    <p><strong>{copy.security}: {money(t.policy.security)}</strong><br/>{copy.securityNote}</p>
    {paid!==undefined&&<p>{copy.balance}</p>}
    <details open={expanded||undefined} className={styles.cancellation}>
      <summary>{copy.cancel}</summary>
      <p>{paid===undefined?(t.planningFee>0?`${copy.advance} ${money(advance)} + Planning Fee ${money(t.planningFee)}`:copy.basis):copy.actual}: <strong>{money(received)}</strong>. {copy.advanceBasis} {t.planningFee>0&&copy.planningLost}</p>
      {arrival&&<label>{copy.cancelDate}<input aria-label={copy.cancelDate} type="date" max={arrival} value={cancelDate} onInput={e=>setCancelDate(e.currentTarget.value)} onChange={e=>setCancelDate(e.target.value)}/></label>}
      {cancellation&&<div role="status" className={styles.result}><p>{copy.days}: {until}</p>{cancellation.refund===null?<p>{t.protectionPercent?copy.protected:copy.manual}</p>:<><p>{copy.return}: <strong>{money(cancellation.refund)}</strong></p><p>{copy.retain}: <strong>{money(cancellation.retained!)}</strong></p></>}</div>}
      {received===0&&<p>{copy.noMoney}</p>}
      <p>{copy.range}:</p>
      {t.protectionPercent>0?<p>{copy.protected} {localizeProtectionTerms(t.protectionTerms,locale)}</p>:<ul>{t.policy.cancellation.map((r,i)=>{
        const prev=Number(t.policy.cancellation[i-1]?.[0]);
        const low=Number(r[0]);
        const range=i===0?`${copy.more} ${low}`:low===0?`${copy.less} ${prev}`:`${low}–${i===1?prev:prev-1}`;
        const result=journeyCancellation(t,i===0?low+1:low,received);
        return <li key={i}><strong>{range}:</strong> {result.refund===null?`${copy.refund} ${copy.costs}`:`${copy.return}: ${money(result.refund)} · ${copy.retain}: ${money(result.retained!)}`}{typeof r[1]==='number'&&r[1]!==100?` (${r[1]}% × ${money(advance)})`:r[2]?` (${copy.fixed} ${money(Number(r[2]))})`:''}</li>;
      })}</ul>}
      <p>{copy.noAction}</p>
    </details>
  </section>;
}
