"use client";
import JourneyTerms from '../JourneyTerms';
import {collectionTerms} from '../../content/journey-terms';
import ChatLink from "../ChatLink";

import { useEffect, useMemo, useState } from "react";
import { collectionDetails } from "../../content/collection-details";
import { nextAllowedDeparture, parseDepartureRule, useCatalogItems } from "../../content/catalog-client";
import CoverflowCarousel from "../CoverflowCarousel";
import { mobileCollectionProducts } from "../../content/collection-products";
import { resolveJourneyRates, journeyPrice, journeyTotal } from "../../content/journey-pricing";
import { collections } from "../../content/mlt";
import type { Locale } from "../../content/i18n";
import { DepartureCalendar, type DepartureRule } from "../collections/[slug]/DepartureCalendar";
import MobilePreviewHeader from "./MobilePreviewHeader";
import MobilePreviewFooter from "./MobilePreviewFooter";
import { continueJourneyInAccount } from "../../content/account-draft";
import { configs, tr, extraBenefits, tailoredInterests, type CollectionId, type ContentLocale, type IconName } from "../../content/mobile-booking";
import styles from "./freedom/preview.module.css";

function Icon({ name }: { name: IconName }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {name === "globe" && <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></>}
    {name === "user" && <><circle cx="12" cy="8" r="3.5"/><path d="M5 21c.7-4.2 3.1-6.3 7-6.3s6.3 2.1 7 6.3"/></>}
    {name === "menu" && <path d="M5 8h14M5 16h14"/>}
    {name === "chevron" && <path d="m7 9.5 5 5 5-5"/>}
    {name === "arrow-left" && <path d="M15.5 5.5 9 12l6.5 6.5"/>}
    {name === "arrow-right" && <path d="m8.5 5.5 6.5 6.5-6.5 6.5"/>}
    {name === "pin" && <><path d="M20 10c0 5.2-8 11-8 11S4 15.2 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>}
    {name === "calendar" && <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M7 14h2M11 14h2M15 14h2M7 18h2M11 18h2"/></>}
    {name === "travellers" && <><circle cx="10" cy="8" r="3.2"/><path d="M3.5 20c.6-4 2.8-6 6.5-6s5.9 2 6.5 6M16 6.5a3 3 0 0 1 0 5.8M17.5 14.5c2 .8 3.2 2.6 3.5 5.5"/></>}
  </svg>;
}

function addDays(date:string,days:number){const value=new Date(`${date}T12:00:00`);value.setDate(value.getDate()+days);return value.toISOString().slice(0,10);}

export default function MobileCollectionPreview({ collectionId, initialLocale = "en", previewMode = true }: { collectionId: CollectionId; initialLocale?: Locale; previewMode?: boolean }) {
  const config=configs[collectionId], collection=collections.find(x=>x.id===collectionId)!, detail=collectionDetails[collectionId];
  const [locale,setLocale]=useState<Locale>(initialLocale);
  const [variant,setVariant]=useState(0), [days,setDays]=useState(7);
  const [departure,setDeparture]=useState("2026-10-12"), [guests,setGuests]=useState(1), [active,setActive]=useState(2);
  const [selectedInterests,setSelectedInterests]=useState<string[]>([]); const [reviewOpen,setReviewOpen]=useState(false);
  const [activeField,setActiveField]=useState<"country"|"duration"|"dates"|null>(null);
  const catalogItems=useCatalogItems();
  useEffect(()=>{const value=new URLSearchParams(location.search).get("lang");if(value==="en"||value==="de"||value==="ru"||value==="it"||value==="pl")setLocale(value);},[]);
  const contentLocale:ContentLocale=locale==="de"||locale==="ru"?locale:"en";
  const copy=detail[locale], ui=tr[locale], products=useMemo(()=>mobileCollectionProducts(collectionId,locale,catalogItems),[collectionId,locale,catalogItems]);
  const dbCollection=catalogItems.find(x=>x.item_type==="collection"&&x.slug===collectionId&&Boolean(x.is_active));
  const options=useMemo(()=>resolveJourneyRates(collectionId,dbCollection?.data_json),[collectionId,dbCollection?.data_json]);
  const prices=Object.fromEntries(options.map(row=>[row.d,row.p]));
  useEffect(()=>{if(!options.some(row=>row.d===days))setDays(options[0].d);},[options,days]);
  useEffect(()=>{if(active>=products.length)setActive(0);},[active,products.length]);
  const total=journeyTotal(journeyPrice(collectionId,days,prices[days]??options[0].p,variant===1),guests), returned=addDays(departure,days);
  const effectiveDepartureRule:DepartureRule=parseDepartureRule(dbCollection?.data_json);
  useEffect(()=>{if(dbCollection?.data_json)setDeparture(current=>nextAllowedDeparture(current,effectiveDepartureRule));},[dbCollection?.data_json]);
  const dateLocale={en:"en-GB",de:"de-DE",ru:"ru-RU",it:"it-IT",pl:"pl-PL"}[locale];
  const money=(value:number)=>new Intl.NumberFormat(dateLocale,{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(value);
  const displayDate=(value:string)=>new Intl.DateTimeFormat(dateLocale,{day:"numeric",month:"short",year:"numeric"}).format(new Date(`${value}T12:00:00`));
  const continueToAccount=()=>continueJourneyInAccount({collection:collectionId,collectionName:`MLT ${collection.name} Collection`,country:"Italy",days,arrival:departure,departure:returned,guests,route:products[active]?.title||"MLT curated route",rate:money(total),signatureTailored:collectionId==="signature"&&variant===1,freedomPlus:false,tailoredInterests:selectedInterests,vehicle:"MLT motorhome"},locale);
  const review=locale==="ru"?{title:"Проверьте выбор",copy:"Убедитесь, что все детали путешествия указаны верно.",collection:"Коллекция",package:"Пакет",route:"Маршрут",dates:"Даты",travellers:"Путешественники",confirm:"Подтвердить и перейти",cancel:"Изменить выбор",close:"Закрыть"}:locale==="de"?{title:"Auswahl prüfen",copy:"Bitte prüfen Sie die Reisedetails, bevor Sie fortfahren.",collection:"Kollektion",package:"Paket",route:"Route",dates:"Reisedaten",travellers:"Reisende",confirm:"Bestätigen & weiter",cancel:"Auswahl ändern",close:"Schließen"}:locale==="it"?{title:"Controlla la tua scelta",copy:"Controlla i dettagli del viaggio prima di continuare.",collection:"Collezione",package:"Pacchetto",route:"Itinerario",dates:"Date",travellers:"Viaggiatori",confirm:"Conferma e continua",cancel:"Modifica la scelta",close:"Chiudi"}:locale==="pl"?{title:"Sprawdź swój wybór",copy:"Sprawdź szczegóły podróży przed przejściem dalej.",collection:"Kolekcja",package:"Pakiet",route:"Trasa",dates:"Daty",travellers:"Podróżni",confirm:"Potwierdź i kontynuuj",cancel:"Zmień wybór",close:"Zamknij"}:{title:"Review your selection",copy:"Please check the journey details before continuing.",collection:"Collection",package:"Package",route:"Route",dates:"Travel dates",travellers:"Travellers",confirm:"Confirm & continue",cancel:"Change selection",close:"Close"};
  return <main className={styles.stage}><div className={styles.phone}>
    <MobilePreviewHeader locale={locale} variant="light" previewMode={previewMode}/>
    <section className={styles.hero}><img src={config.hero} alt={`MLT ${collection.name}`}/><div><span>MLT / {collection.number}</span><h1><strong>MLT {collection.name}</strong><br/><i>Collection</i></h1></div></section>
    <section className={styles.booking}><h2>{ui.build}</h2><div className={`${styles.types} ${config.packages.length===1?styles.singleType:""}`}>{config.packages.map((item,index)=><button key={item.id} className={variant===index?styles.selected:""} onClick={()=>setVariant(index)}><b>{item.title}</b>{(locale==="it"||locale==="pl"?extraBenefits[item.id]?.[locale]||item.benefits.en:item.benefits[contentLocale]).map(x=><small key={x}><span>✓</span>{x}</small>)}</button>)}</div>
      {collectionId==="signature"&&variant===1&&<div className={styles.tailoredServices} aria-label={locale==="en"?"Choose interests":locale==="de"?"Interessen auswählen":"Выберите интересы"}>{tailoredInterests.map(interest=>{const selected=selectedInterests.includes(interest.id);return <button type="button" key={interest.id} className={selected?styles.interestSelected:""} aria-pressed={selected} onClick={()=>setSelectedInterests(current=>selected?current.filter(id=>id!==interest.id):[...current,interest.id])}>{selected&&<span>✓</span>}{interest[contentLocale]}</button>})}</div>}
      <div className={styles.fields}><label className={activeField==="country"?styles.activeField:""} onClick={()=>setActiveField("country")}><i><Icon name="pin"/></i><span>{ui.country}</span><select><option>Italy</option></select></label><label className={activeField==="duration"?styles.activeField:""} onClick={()=>setActiveField("duration")}><i><Icon name="calendar"/></i><span>{ui.dates}</span><select value={days} onChange={e=>setDays(Number(e.target.value))}>{Object.keys(prices).map(d=><option key={d} value={d}>{d} {ui.days}</option>)}</select><small className={styles.fieldPrice}>{money(journeyPrice(collectionId,days,prices[days]??options[0].p,variant===1))}</small></label>
      <div className={`${styles.calendarField} ${activeField==="dates"?styles.activeField:""}`} onClick={event=>{setActiveField("dates");if(!(event.target as HTMLElement).closest("button"))event.currentTarget.querySelector("button")?.click()}}><i><Icon name="calendar"/></i><DepartureCalendar value={departure} onChange={setDeparture} rule={effectiveDepartureRule} locale={locale} calendarLocale={locale} label={ui.departure}/></div><div className={`${styles.returnField} ${activeField==="dates"?styles.activeField:""}`}><i><Icon name="calendar"/></i><span>{ui.returning}</span><strong>{displayDate(returned)}</strong></div><div className={styles.travellers}><i><Icon name="travellers"/></i><span>{ui.travellers}</span><div><button onClick={()=>setGuests(Math.max(1,guests-1))}>−</button><b>{guests}</b><button onClick={()=>setGuests(Math.min(8,guests+1))}>+</button></div><small>{ui.included}</small></div></div>
      <section className={styles.products}><p className={styles.eyebrow}>{ui.experience}</p><CoverflowCarousel locale={locale} items={products} shellClassName={styles.carousel} carouselClassName={styles.track} slideClassName={styles.slide} prevClassName={styles.prev} nextClassName={styles.next} initialIndex={2} onActiveChange={setActive} label={ui.experience} renderSlide={(product,index,select)=><button type="button" className={styles.card} data-active={index===active} aria-pressed={index===active} onClick={()=>{setActive(index);select();}}><img src={product.image} alt={product.title} draggable={false}/><span>{product.n}</span><em>{index===active?ui.selected:ui.choose}</em><div><strong>{product.title}</strong><small>{product.copy[locale]}</small></div></button>}/></section>
    </section>
    <section className={styles.ideal}><p className={styles.eyebrow}>{ui.ideal}</p><p>{copy.ideal}</p></section><section className={styles.shapes}><p className={styles.eyebrow}>{copy.includes}</p><div>{copy.signature.map(x=><span key={x}>✓ &nbsp;{x}</span>)}</div></section>
    <section className={styles.cta}><img src={config.hero} alt=""/><div><p className={styles.eyebrow}>MLT {collection.name}</p><h2>{copy.cta}</h2><p>{ui.prepared}</p><ChatLink>{ui.concierge}</ChatLink></div></section>
    <MobilePreviewFooter locale={locale} withStickyBar previewMode={previewMode}/>
    <div className={styles.sticky}><span>{ui.total}<b>{money(total)}</b></span><button onClick={()=>setReviewOpen(true)}>{ui.pay}</button></div>
    {reviewOpen&&<div className="journey-review-overlay" role="presentation" onMouseDown={()=>setReviewOpen(false)}><section className="journey-review-modal" role="dialog" aria-modal="true" aria-label={review.title} onMouseDown={event=>event.stopPropagation()}><button className="journey-review-close" type="button" onClick={()=>setReviewOpen(false)} aria-label={review.close}>×</button><p className="section-label">MLT / {collection.number}</p><h2>{review.title}</h2><p className="journey-review-copy">{review.copy}</p><dl><div><dt>{review.collection}</dt><dd>MLT {collection.name} Collection</dd></div><div><dt>{review.package}</dt><dd>{config.packages[variant]?.title}</dd></div><div><dt>{review.route}</dt><dd>{products[active]?.title||"MLT curated route"}</dd></div><div><dt>{review.dates}</dt><dd>{displayDate(departure)} — {displayDate(returned)}</dd></div><div><dt>{review.travellers}</dt><dd>{days} {ui.days} · {guests}</dd></div></dl><JourneyTerms terms={collectionTerms(collectionId,variant===1)} locale={locale}/>{collectionId==="signature"&&variant===1&&<p className="journey-review-copy">Planning Fee €500–1,500 · {locale==="ru"?"Отдельный невозвратный сбор за разработку маршрута":"Separate non-refundable route planning fee"}</p>}<div className="journey-review-total"><span>{ui.total}</span><strong>{money(total)}</strong></div><div className="journey-review-actions"><button type="button" onClick={()=>setReviewOpen(false)}>{review.cancel}</button><button type="button" className="bronze-button" onClick={continueToAccount}>{review.confirm}</button></div></section></div>}
  </div></main>;
}
