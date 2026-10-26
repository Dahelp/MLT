"use client";
import {useEffect,useState} from 'react';
import {orderTerms} from '../../content/journey-terms';
import JourneyTerms from '../JourneyTerms';
type Request=(action:string,payload?:object)=>Promise<any>;
export function JourneySettings({request,locale}:{request:Request;locale:string}){
  const [data,setData]=useState<{percent:number;enabled:boolean;terms:string}|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{request('journey_settings').then(d=>setData(d.settings)).catch(e=>setMessage(e.message));},[]);
  const labels={
    ru:{section:'Условия оплаты и возврата',intro:'Дополнительная защита путешествия: доплата и условия переноса или отмены.',percent:'Доплата, %',terms:'Утверждённые условия переноса и возврата',offer:'Предлагать клиентам',save:'Сохранить',saving:'Сохранение…',saved:'Сохранено'},
    en:{section:'Payment and refund terms',intro:'Optional journey protection: surcharge and rescheduling or cancellation terms.',percent:'Surcharge, %',terms:'Approved rescheduling and refund terms',offer:'Offer to clients',save:'Save',saving:'Saving…',saved:'Saved'},
    de:{section:'Zahlungs- und Erstattungsbedingungen',intro:'Optionaler Reiseschutz: Aufpreis und Bedingungen für Umbuchung oder Stornierung.',percent:'Aufpreis, %',terms:'Genehmigte Umbuchungs- und Erstattungsbedingungen',offer:'Kunden anbieten',save:'Speichern',saving:'Wird gespeichert…',saved:'Gespeichert'}
  };
  const t=labels[locale as keyof typeof labels]||labels.en;
  return <details className="concierge-table journey-settings"><summary>{t.section}</summary><h3>MLT Flexible Protection</h3><p>{t.intro}</p>{data&&<form className="journey-editor" onSubmit={async e=>{e.preventDefault();setBusy(true);setMessage('');try{await request('journey_settings_save',data);setMessage(t.saved)}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}}>
    <label>{t.percent}<input type="number" min={5} max={8} step="0.01" required value={data.percent} onChange={e=>setData({...data,percent:Number(e.target.value)})}/></label>
    <label>{t.terms}<textarea required={data.enabled} value={data.terms} onChange={e=>setData({...data,terms:e.target.value})}/></label>
    <label className="journey-settings-toggle"><input type="checkbox" checked={data.enabled} onChange={e=>setData({...data,enabled:e.target.checked})}/>{t.offer}</label><button disabled={busy}>{busy?t.saving:t.save}</button>
  </form>}<p role="status">{message}</p></details>;
}

export function JourneyTermsEditor({raw,reference,request,locale,onSaved}:{raw?:string;reference:string;request:Request;locale:string;onSaved:()=>void}){
  const terms=orderTerms(raw),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),ru=locale==='ru';
  if(!terms)return null;
  return <><JourneyTerms terms={terms} locale={locale}/>{['signature_tailored','private'].includes(terms.variant)&&<form key={reference} className="journey-editor" onSubmit={async e=>{e.preventDefault();const form=new FormData(e.currentTarget);setBusy(true);try{await request('journey_terms_update',{reference,planningFee:form.get('planningFee'),routeApproved:form.get('routeApproved')==='on',contractSigned:form.get('contractSigned')==='on'});setMessage(ru?'Сохранено':'Saved');onSaved();}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}}>
    {terms.variant==='signature_tailored'?<><label>Planning Fee, EUR<input name="planningFee" type="number" min={500} max={1500} step="0.01" required defaultValue={terms.planningFee}/></label><label><input type="checkbox" name="routeApproved" defaultChecked={terms.routeApproved}/>{ru?'Маршрут утверждён':'Route approved'}</label></>:<label><input type="checkbox" name="contractSigned" defaultChecked={terms.contractSigned}/>{ru?'Договор подписан':'Contract signed'}</label>}
    <button disabled={busy}>{ru?'Сохранить условия':'Save terms'}</button><p role="status">{message}</p></form>}<CancellationPreview request={request} reference={reference} locale={locale}/></>;
}

function CancellationPreview({request,reference,locale}:{request:Request;reference:string;locale:string}){
  const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),ru=locale==='ru';
  return <details><summary>{ru?'Расчёт отмены':'Cancellation preview'}</summary><form className="journey-editor" onSubmit={async e=>{e.preventDefault();const form=new FormData(e.currentTarget);setBusy(true);try{const d=await request('journey_cancellation_preview',{reference,cancellationDate:form.get('date'),costs:form.get('costs')});setMessage(d.result.manualReview?(ru?'Требуется индивидуальный расчёт по сохранённым условиям защиты либо уточнение фактических расходов.':'Review the saved protection terms or enter actual expenses.'):`${ru?'К возврату':'Refund'}: €${d.result.refund}. ${ru?'Дней до поездки':'Days before arrival'}: ${d.daysBefore}.`);}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}}>
    <label>{ru?'Дата отмены':'Cancellation date'}<input type="date" name="date" required/></label><label>{ru?'Фактические расходы / подготовка маршрута, EUR':'Actual expenses / route preparation, EUR'}<input type="number" name="costs" min={0} step="0.01"/></label><button disabled={busy}>{ru?'Рассчитать':'Calculate'}</button><p role="status">{message}</p><small>{ru?'Предварительный расчёт. Возврат денег и изменение статуса заказа не выполняются.':'Preview only. This does not issue a refund or change the order status.'}</small>
  </form></details>;
}
