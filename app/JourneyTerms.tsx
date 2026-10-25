"use client";
import {type JourneyTerms as Terms} from '../content/journey-terms';
import TermsDialog from './TermsDialog';

/** Uses native disclosure and existing typography. No new layout or style rules. */
export default function JourneyTerms({terms:t,locale='en',popup=false,expanded=false,arrival}:{terms:Terms|null;locale?:string;popup?:boolean;expanded?:boolean;arrival?:string}){
  if(!t)return null;
  const ru=locale==='ru';
  const money=(n:number)=>new Intl.NumberFormat(ru?'ru-RU':'en-GB',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(n);
  if(popup)return <TermsDialog label={ru?'Оплата, гарантийный депозит и отмена':'Payment, security and cancellation'}><JourneyTerms terms={t} locale={locale} arrival={arrival} expanded/></TermsDialog>;
  return <details open={expanded||undefined}><summary>{ru?'Оплата, гарантийный депозит и отмена':'Payment, security and cancellation'}</summary>
    <p>{t.variant==='signature_tailored'?'Signature Tailored':t.variant==='freedom_plus'?'Freedom+':t.variant} · {t.policy.label}: {money(t.policy.security)}. {ru?'Гарантийный депозит вносится отдельно и не входит в стоимость тура.':'Security is collected separately and is outside the tour price.'}</p>
    {t.planningFee>0&&<p>Planning Fee: {t.total?money(t.planningFee):'€500–1,500'}. {ru?'Отдельный невозвратный сбор при старте разработки маршрута. Точную сумму назначает администратор. Аванс 30% — после утверждения маршрута.':'Separate non-refundable fee when route planning starts. The administrator confirms the amount. The 30% advance follows route approval.'}</p>}
    <p>{ru?'Этапы оплаты':'Payment stages'}: {t.policy.stages.map((p,i)=>`${p}%${t.policy.dueDays[i]===null?'':ru?` — за ${t.policy.dueDays[i]} дней до поездки`:` — ${t.policy.dueDays[i]} days before arrival`}`).join(' / ')}.
      {t.variant==='private'&&(ru?' Первый платёж — после подписания договора.':' First payment follows contract signing.')}
      {t.policy.cashFinal&&(ru?' Финальный платёж также можно внести наличными на месте.':' The final payment may also be made in cash on arrival.')}</p>
    {t.total>0&&<ul>{t.policy.stages.map((percent,i)=>{
      const previous=t.policy.stages.slice(0,i).reduce((sum,p)=>sum+p,0);
      const amount=i===t.policy.stages.length-1?t.total-t.planningFee-Math.round(t.tourTotal*previous)/100:Math.round(t.tourTotal*(previous+percent))/100-Math.round(t.tourTotal*previous)/100;
      const days=t.policy.dueDays[i];let due='';
      if(days!==null&&arrival&&/^\d{4}-\d{2}-\d{2}$/.test(arrival)){const date=new Date(arrival+'T12:00:00Z');date.setUTCDate(date.getUTCDate()-days);if(Number.isFinite(date.getTime()))due=date.toLocaleDateString(ru?'ru-RU':'en-GB',{timeZone:'UTC'});}
      return <li key={i}>{i+1}. {money(amount)}{due?` — ${due}`:''}</li>;
    })}</ul>}
    {t.protectionAmount>0&&<p>{ru?'Доплата за защиту рассчитана от базового тарифа и включена в финальный платёж.':'Protection is calculated on the base package price and included in the final payment.'}</p>}
    {t.total>0&&<p>{ru?'Стоимость путешествия':'Journey price'}: {money(t.tourTotal)}. MLT Flexible Protection: {money(t.protectionAmount)} ({t.protectionPercent}%). {ru?'Итого с отдельным Planning Fee, без гарантийного депозита':'Total including separate Planning Fee, excluding security'}: {money(t.total)}.</p>}
    <p>{ru?'Условия отмены (дней до начала)':'Cancellation (days before arrival)'}:</p>
    <ul>{t.policy.cancellation.map((r,i)=>{
      const range=i===0?`> ${r[0]}`:r[0]===0?`< ${t.policy.cancellation[i-1][0]}`:`${r[0]}–${t.policy.cancellation[i-1][0]}`;
      const text=r[1]===100?(ru?'без возврата':'no refund'):typeof r[1]==='number'?(ru?`удержание ${r[1]}% аванса`:`${r[1]}% retained of advance`):r[2]?(ru?'возврат аванса за вычетом 100 €':'advance refunded less €100'):r[1]==='route_cost'?(ru?'возврат за вычетом подготовки маршрута':'refund less route preparation costs'):(ru?'возврат за вычетом фактических расходов':'refund less actual expenses');
      return <li key={i}>{range}: {text}.</li>;
    })}</ul>
    {t.protectionPercent>0&&<p>MLT Flexible Protection: {t.protectionTerms}</p>}
  </details>;
}
