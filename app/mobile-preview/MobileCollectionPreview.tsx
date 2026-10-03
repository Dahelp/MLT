"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Swiper as SwiperCarousel, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";
import { EffectCoverflow, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import { collectionDetails } from "../../content/collection-details";
import { nextAllowedDeparture, parseDepartureRule, useCatalogItems } from "../../content/catalog-client";
import { collections, journeyRoutes } from "../../content/mlt";
import type { Locale } from "../../content/i18n";
import { DepartureCalendar, type DepartureRule } from "../collections/[slug]/DepartureCalendar";
import MobilePreviewHeader from "./MobilePreviewHeader";
import MobilePreviewFooter from "./MobilePreviewFooter";
import styles from "./freedom/preview.module.css";

type CollectionId = "signature" | "concierge" | "private" | "honeymoon";
type IconName = "globe" | "user" | "menu" | "chevron" | "arrow-left" | "arrow-right" | "pin" | "calendar" | "travellers";
type Product = { n: string; title: string; copy: Record<Locale, string>; image: string };
type PackageVariant = { id: string; title: string; benefits: Record<Locale, string[]>; supplement?: number };

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

const tr = {
  en: { build:"Build your journey:", country:"Country", dates:"Choose your travel dates", departure:"Departure", returning:"Return", travellers:"Travellers", included:"1–2 guests included · +€190 from the 3rd guest", experience:"Select your experience:", selected:"Selected", choose:"Choose", ideal:"Ideal for", total:"Total", pay:"Sign in & pay →", concierge:"Talk to a concierge", explore:"Explore", contact:"Contact", collections:"Collections", experiences:"Experiences", map:"Smart map", email:"Email us", privacy:"Privacy", imprint:"Imprint", days:"days", menu:"Explore MLT", journeys:"Journeys", vehicles:"Vehicles", account:"Sign in", prepared:"Tell us where you would like to begin. We will prepare every essential detail for your journey.", europe:"Individual Road Expeditions across Europe." },
  de: { build:"Stellen Sie Ihre Reise zusammen:", country:"Land", dates:"Reisedauer wählen", departure:"Abreise", returning:"Rückkehr", travellers:"Reisende", included:"1–2 Gäste inklusive · +190 € ab dem 3. Gast", experience:"Erlebnis auswählen:", selected:"Gewählt", choose:"Wählen", ideal:"Ideal für", total:"Gesamt", pay:"Anmelden & zahlen →", concierge:"Concierge kontaktieren", explore:"Entdecken", contact:"Kontakt", collections:"Kollektionen", experiences:"Erlebnisse", map:"Smart Map", email:"E-Mail", privacy:"Datenschutz", imprint:"Impressum", days:"Tage", menu:"MLT entdecken", journeys:"Reisen", vehicles:"Fahrzeuge", account:"Anmelden", prepared:"Sagen Sie uns, wo Ihre Reise beginnen soll. Wir bereiten alle wichtigen Details für Sie vor.", europe:"Individuelle Road Expeditions durch Europa." },
  ru: { build:"Соберите путешествие:", country:"Страна", dates:"Выберите длительность", departure:"Отправление", returning:"Возвращение", travellers:"Путешественники", included:"1–2 гостя включены · +€190 с 3-го гостя", experience:"Выберите впечатление:", selected:"Выбрано", choose:"Выбрать", ideal:"Идеально для", total:"Итого", pay:"Войти и оплатить →", concierge:"Связаться с консьержем", explore:"Разделы", contact:"Контакты", collections:"Коллекции", experiences:"Впечатления", map:"Карта", email:"Написать нам", privacy:"Конфиденциальность", imprint:"Реквизиты", days:"дней", menu:"Откройте MLT", journeys:"Маршруты", vehicles:"Автодома", account:"Войти", prepared:"Расскажите, откуда хотите начать. Мы подготовим все важные детали путешествия.", europe:"Индивидуальные автопутешествия по Европе." },
} satisfies Record<Locale, Record<string,string>>;

const fallbackPrices: Record<CollectionId, Record<number, number>> = {
  signature:{7:2490,10:4290,14:5890}, concierge:{7:4990,10:6590,14:8990}, private:{7:19900,10:28429,14:39800,21:59700}, honeymoon:{7:5900,10:7000,14:8900},
};
const configs: Record<CollectionId, { hero:string; packages:PackageVariant[]; products:Product[] }> = {
  signature:{ hero:"/collection-signature.webp", packages:[
    {id:"signature",title:"Signature",benefits:{en:["Personal route","Reserved premium campsites","Panoramic roads","Restaurants & activities"],de:["Persönliche Route","Reservierte Premium-Stellplätze","Panoramastraßen","Restaurants & Aktivitäten"],ru:["Личный маршрут","Премиальные стоянки","Панорамные дороги","Рестораны и впечатления"]}},
    {id:"tailored",title:"Signature Tailored",supplement:500,benefits:{en:["Everything in Signature","Personal travel scenario","Activities matched to you","Special moments"],de:["Alles aus Signature","Persönliches Reiseszenario","Passende Aktivitäten","Besondere Momente"],ru:["Всё из Signature","Личный сценарий","Подобранные активности","Особенные моменты"]}},
  ], products:[] },
  concierge:{ hero:"/collection-concierge.webp", packages:[{id:"concierge",title:"Concierge",benefits:{en:["24/7 online concierge","Live route changes","Campsites booked","Dining reservations"],de:["Online-Concierge rund um die Uhr","Flexible Routenänderungen","Gebuchte Stellplätze","Restaurantreservierungen"],ru:["Онлайн-консьерж 24/7","Изменения маршрута","Бронирование стоянок","Резервации ресторанов"]}}], products:[] },
  private:{ hero:"/collection-private.webp", packages:[{id:"private",title:"Private",benefits:{en:["Private driver","Technician and chef","Private excursions","VIP transfers"],de:["Privatfahrer","Techniker und Koch","Private Ausflüge","VIP-Transfers"],ru:["Личный водитель","Техник и повар","Частные экскурсии","VIP-трансферы"]}}], products:[] },
  honeymoon:{ hero:"/collection-honeymoon.webp", packages:[{id:"honeymoon",title:"Honeymoon",benefits:{en:["Premium motorhome for two","Romantic route","Private stays","Dedicated concierge"],de:["Premium-Reisemobil für zwei","Romantische Route","Private Stellplätze","Persönlicher Concierge"],ru:["Премиальный автодом для двоих","Романтический маршрут","Приватные стоянки","Личный консьерж"]}}], products:[] },
};

const productAssets: Record<CollectionId, string[]> = {
  signature:["signature-route-dolomites.jpg","signature-route-bavaria.jpg","signature-route-alpine.jpg","signature-route-wine.jpg","signature-route-mediterranean.jpg"],
  concierge:["concierge-family-dolomites.jpg","concierge-family-bavaria.jpg","concierge-family-alpine.jpg","concierge-family-wine.jpg","concierge-family-mediterranean.jpg"],
  private:["private-route-dolomites.webp","private-route-bavaria.webp","private-route-alpine.webp","private-route-wine.webp","private-route-mediterranean.webp"],
  honeymoon:["honeymoon-dolomites.jpg","honeymoon-bavaria.jpg","honeymoon-alpine.jpg","honeymoon-vineyards.jpg","honeymoon-riviera.jpg"],
};
const tailoredInterests = [
  {id:"mountains",en:"Mountains",de:"Berge",ru:"Горы"},{id:"restaurants",en:"Restaurants",de:"Restaurants",ru:"Рестораны"},
  {id:"wineries",en:"Wineries",de:"Weingüter",ru:"Винодельни"},{id:"lakes",en:"Lakes",de:"Seen",ru:"Озёра"},
  {id:"spa",en:"Spa",de:"Spa",ru:"Спа"},{id:"hiking",en:"Hiking",de:"Wandern",ru:"Пешие прогулки"},
  {id:"castles",en:"Castles",de:"Schlösser",ru:"Замки"},{id:"cycling",en:"Cycling",de:"Fahrräder",ru:"Велосипеды"},
  {id:"yachts",en:"Yachts",de:"Yachten",ru:"Яхты"},{id:"photo-session",en:"Photo session",de:"Fotoshooting",ru:"Фотосессия"},
  {id:"sunrise",en:"Sunrise",de:"Sonnenaufgang",ru:"Рассвет"},{id:"birthday",en:"Birthday",de:"Geburtstag",ru:"День рождения"},
  {id:"proposal",en:"Proposal",de:"Heiratsantrag",ru:"Предложение"},{id:"anniversary",en:"Anniversary",de:"Jahrestag",ru:"Годовщина"},
] as const;
function productsFor(id: CollectionId): Product[] { return journeyRoutes.slice(0,5).map((route,index)=>({n:String(index+1).padStart(2,"0"),title:route.name.replace("Freedom Journey",id === "honeymoon" ? "Romantic Journey" : "Journey"),copy:route.tagline,image:`/${productAssets[id][index]}`})); }
function addDays(date:string,days:number){const value=new Date(`${date}T12:00:00`);value.setDate(value.getDate()+days);return value.toISOString().slice(0,10);}

export default function MobileCollectionPreview({ collectionId, initialLocale = "en", previewMode = true }: { collectionId: CollectionId; initialLocale?: Locale; previewMode?: boolean }) {
  const config=configs[collectionId], collection=collections.find(x=>x.id===collectionId)!, detail=collectionDetails[collectionId];
  const [locale,setLocale]=useState<Locale>(initialLocale);
  const [variant,setVariant]=useState(0), [prices,setPrices]=useState(fallbackPrices[collectionId]), [days,setDays]=useState(Number(Object.keys(fallbackPrices[collectionId])[0]));
  const [departure,setDeparture]=useState("2026-10-12"), [guests,setGuests]=useState(1), [active,setActive]=useState(2);
  const [selectedInterests,setSelectedInterests]=useState<string[]>([]);
  const [activeField,setActiveField]=useState<"country"|"duration"|"dates"|null>(null);
  const [apiProducts,setApiProducts]=useState<Product[]>([]); const productCarousel=useRef<SwiperInstance|null>(null);
  const catalogItems=useCatalogItems();
  useEffect(()=>{const value=new URLSearchParams(location.search).get("lang");if(value==="en"||value==="de"||value==="ru")setLocale(value);},[]);
  useEffect(()=>{const item=catalogItems.find(x=>x.item_type==="collection"&&x.slug===collectionId);const parsed=item?.data_json?JSON.parse(item.data_json):{};if(parsed.pricing&&typeof parsed.pricing==="object"){const rows=Array.isArray(parsed.pricing)?parsed.pricing.map((row:{days?:unknown;price?:unknown})=>[Number(row.days),Number(row.price)]):Object.entries(parsed.pricing).map(([k,v])=>[Number(k),Number(v)]);const next=Object.fromEntries(rows.filter(([d,p]:number[])=>Number.isFinite(d)&&d>0&&Number.isFinite(p)&&p>=0));if(Object.keys(next).length){setPrices(next);setDays(Number(Object.keys(next)[0]));}}const found=catalogItems.filter(x=>x.item_type==="product"&&x.collection_id===collectionId).map((x,i)=>{const p=x.data_json?JSON.parse(x.data_json):{};return{n:String(i+1).padStart(2,"0"),title:String(x.title||""),copy:{en:p.description||"",de:p.description_de||p.description||"",ru:p.description_ru||p.description||""},image:String(x.image_path||p.image||config.hero)};});if(found.length)setApiProducts(found);},[catalogItems,collectionId,config.hero]);
  const copy=detail[locale], ui=tr[locale], products=apiProducts.length?apiProducts:productsFor(collectionId), carousel=Array.from({length:3},()=>products).flat();
  const total=prices[days]+(config.packages[variant]?.supplement||0)+Math.max(0,guests-2)*190, returned=addDays(departure,days);
  const dbCollection=catalogItems.find(x=>x.item_type==="collection"&&x.slug===collectionId);
  const effectiveDepartureRule:DepartureRule=parseDepartureRule(dbCollection?.data_json);
  useEffect(()=>{if(dbCollection?.data_json)setDeparture(current=>nextAllowedDeparture(current,effectiveDepartureRule));},[dbCollection?.data_json]);
  const money=(value:number)=>new Intl.NumberFormat(locale==="en"?"en-GB":locale==="de"?"de-DE":"ru-RU",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(value);
  const displayDate=(value:string)=>new Intl.DateTimeFormat(locale==="en"?"en-GB":locale==="de"?"de-DE":"ru-RU",{day:"numeric",month:"short",year:"numeric"}).format(new Date(`${value}T12:00:00`));
  return <main className={styles.stage}><div className={styles.phone}>
    <MobilePreviewHeader locale={locale} variant="light" previewMode={previewMode}/>
    <section className={styles.hero}><img src={config.hero} alt={`MLT ${collection.name}`}/><div><span>MLT / {collection.number}</span><h1><strong>MLT {collection.name}</strong><br/><i>Collection</i></h1></div></section>
    <section className={styles.booking}><h2>{ui.build}</h2><div className={`${styles.types} ${config.packages.length===1?styles.singleType:""}`}>{config.packages.map((item,index)=><button key={item.id} className={variant===index?styles.selected:""} onClick={()=>setVariant(index)}><b>{item.title}</b>{item.benefits[locale].map(x=><small key={x}><span>✓</span>{x}</small>)}</button>)}</div>
      {collectionId==="signature"&&variant===1&&<div className={styles.tailoredServices} aria-label={locale==="en"?"Choose interests":locale==="de"?"Interessen auswählen":"Выберите интересы"}>{tailoredInterests.map(interest=>{const selected=selectedInterests.includes(interest.id);return <button type="button" key={interest.id} className={selected?styles.interestSelected:""} aria-pressed={selected} onClick={()=>setSelectedInterests(current=>selected?current.filter(id=>id!==interest.id):[...current,interest.id])}>{selected&&<span>✓</span>}{interest[locale]}</button>})}</div>}
      <div className={styles.fields}><label className={activeField==="country"?styles.activeField:""} onClick={()=>setActiveField("country")}><i><Icon name="pin"/></i><span>{ui.country}</span><select><option>Italy</option></select></label><label className={activeField==="duration"?styles.activeField:""} onClick={()=>setActiveField("duration")}><i><Icon name="calendar"/></i><span>{ui.dates}</span><select value={days} onChange={e=>setDays(Number(e.target.value))}>{Object.keys(prices).map(d=><option key={d} value={d}>{d} {ui.days}</option>)}</select><small className={styles.fieldPrice}>{money(prices[days]+(config.packages[variant]?.supplement||0))}</small></label>
      <div className={`${styles.calendarField} ${activeField==="dates"?styles.activeField:""}`} onClick={event=>{setActiveField("dates");if(!(event.target as HTMLElement).closest("button"))event.currentTarget.querySelector("button")?.click()}}><i><Icon name="calendar"/></i><DepartureCalendar value={departure} onChange={setDeparture} rule={effectiveDepartureRule} locale={locale} calendarLocale={locale} label={ui.departure}/></div><div className={`${styles.returnField} ${activeField==="dates"?styles.activeField:""}`}><i><Icon name="calendar"/></i><span>{ui.returning}</span><strong>{displayDate(returned)}</strong></div><div className={styles.travellers}><i><Icon name="travellers"/></i><span>{ui.travellers}</span><div><button onClick={()=>setGuests(Math.max(1,guests-1))}>−</button><b>{guests}</b><button onClick={()=>setGuests(Math.min(8,guests+1))}>+</button></div><small>{ui.included}</small></div></div>
      <section className={styles.products}><p className={styles.eyebrow}>{ui.experience}</p><div className={styles.carousel}><button className={styles.prev} onClick={()=>productCarousel.current?.slidePrev()}><Icon name="arrow-left"/></button><SwiperCarousel className={styles.track} modules={[EffectCoverflow,Keyboard]} effect="coverflow" initialSlide={products.length+2} centeredSlides slidesPerView="auto" speed={500} simulateTouch grabCursor allowTouchMove touchAngle={45} threshold={4} longSwipesRatio={.15} keyboard={{enabled:true}} coverflowEffect={{rotate:0,stretch:8,depth:90,modifier:1,slideShadows:false}} onSwiper={x=>{productCarousel.current=x}} onSlideChange={x=>{const index=((x.activeIndex%products.length)+products.length)%products.length;setActive(index);if(x.activeIndex<products.length||x.activeIndex>=products.length*2)requestAnimationFrame(()=>x.slideTo(products.length+index,0,false));}}>{carousel.map((product,slideIndex)=>{const index=slideIndex%products.length;return <SwiperSlide className={styles.slide} key={`${product.n}-${slideIndex}`}><button className={styles.card} data-active={index===active} onClick={()=>{setActive(index);productCarousel.current?.slideTo(products.length+index)}}><img src={product.image} alt=""/><span>{product.n}</span><em>{index===active?ui.selected:ui.choose}</em><div><strong>{product.title}</strong><small>{product.copy[locale]}</small></div></button></SwiperSlide>})}</SwiperCarousel><button className={styles.next} onClick={()=>productCarousel.current?.slideNext()}><Icon name="arrow-right"/></button></div></section>
    </section>
    <section className={styles.ideal}><p className={styles.eyebrow}>{ui.ideal}</p><p>{copy.ideal}</p></section><section className={styles.shapes}><p className={styles.eyebrow}>{copy.includes}</p><div>{copy.signature.map(x=><span key={x}>✓ &nbsp;{x}</span>)}</div></section>
    <section className={styles.cta}><img src={config.hero} alt=""/><div><p className={styles.eyebrow}>MLT {collection.name}</p><h2>{copy.cta}</h2><p>{ui.prepared}</p><a href="mailto:concierge@mlt-travel.com">{ui.concierge}<span>→</span></a></div></section>
    <MobilePreviewFooter locale={locale} withStickyBar previewMode={previewMode}/>
    <div className={styles.sticky}><span>{ui.total}<b>{money(total)}</b></span><button onClick={()=>alert("Preview only — payment is not connected.")}>{ui.pay}</button></div>
  </div></main>;
}
