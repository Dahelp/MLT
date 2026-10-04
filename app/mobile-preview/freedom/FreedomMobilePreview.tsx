"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Swiper as SwiperCarousel, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";
import { EffectCoverflow, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import { collectionDetails } from "../../../content/collection-details";
import { nextAllowedDeparture, parseDepartureRule, useCatalogItems } from "../../../content/catalog-client";
import { journeyRoutes } from "../../../content/mlt";
import type { Locale } from "../../../content/i18n";
import { DepartureCalendar, type DepartureRule } from "../../collections/[slug]/DepartureCalendar";
import MobilePreviewHeader from "../MobilePreviewHeader";
import MobilePreviewFooter from "../MobilePreviewFooter";
import { continueJourneyInAccount } from "../../../content/account-draft";
import styles from "./preview.module.css";

type IconName = "arrow-left" | "arrow-right" | "compass" | "pin" | "calendar" | "travellers";

function Icon({ name }: { name: IconName }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {name === "arrow-left" && <path d="m14 6-6 6 6 6M8 12h8"/>}
    {name === "arrow-right" && <path d="m10 6 6 6-6 6M16 12H8"/>}
    {name === "compass" && <><circle cx="12" cy="12" r="9"/><path d="m15.8 8.2-2.1 5.5-5.5 2.1 2.1-5.5 5.5-2.1Z"/></>}
    {name === "pin" && <><path d="M20 10c0 5.2-8 11-8 11S4 15.2 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>}
    {name === "calendar" && <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M7 14h2M11 14h2M15 14h2M7 18h2M11 18h2"/></>}
    {name === "travellers" && <><circle cx="10" cy="8" r="3.2"/><path d="M3.5 20c.6-4 2.8-6 6.5-6s5.9 2 6.5 6M16 6.5a3 3 0 0 1 0 5.8M17.5 14.5c2 .8 3.2 2.6 3.5 5.5"/></>}
  </svg>;
}

const products = journeyRoutes.slice(0,5).map(route=>({n:route.number,title:route.name,copy:route.tagline,image:route.image}));
const carouselProducts = Array.from({ length: 3 }, () => products).flat();

const prices: Record<number, number> = { 7: 1490, 10: 1990, 14: 2590, 21: 3690, 30: 4990 };
type PackageVariant = { id: string; title: string; subtitle?: string; benefits?: string[]; supplement?: string };
const defaultPackages: PackageVariant[] = [
  { id: "freedom", title: "Freedom", subtitle: "Independent journey", benefits: ["Motorhome", "Basic Road Book", "MLT My Profile", "Technical support"] },
  { id: "freedom-plus", title: "Freedom+", subtitle: "Route & recommendations", benefits: ["Everything in Freedom", "Author route", "Digital guide", "Panoramic roads", "Restaurant & location recommendations"], supplement: "+ €300–500" },
];
const localizedPackages:Record<Locale,PackageVariant[]>={
  en:defaultPackages,
  de:[{id:"freedom",title:"Freedom",benefits:["Reisemobil","Basis-Roadbook","MLT My Profile","Technischer Support"]},{id:"freedom-plus",title:"Freedom+",benefits:["Alles aus Freedom","Autorenroute","Digitaler Reiseführer","Panoramastraßen","Restaurant- & Ortsempfehlungen"],supplement:"+ €300–500"}],
  ru:[{id:"freedom",title:"Freedom",benefits:["Автодом","Базовый путеводитель","MLT My Profile","Техническая поддержка"]},{id:"freedom-plus",title:"Freedom+",benefits:["Всё из Freedom","Авторский маршрут","Цифровой гид","Панорамные дороги","Рекомендации ресторанов и мест"],supplement:"+ €300–500"}],
};
const translations={
  en:{build:"Build your journey:",country:"Country",dates:"Choose your travel dates",departure:"Departure",return:"Return",travellers:"Travellers",included:"1–2 guests included · +€190 from the 3rd guest",experience:"Select your experience:",selected:"Selected",choose:"Choose",ideal:"Ideal for",total:"Total",pay:"Sign in & pay →",concierge:"Talk to a concierge",prepared:"Tell us where you would like to begin. We will prepare the motorhome, the essentials and your first recommendations.",explore:"Explore",collections:"Collections",experiences:"Experiences",map:"Smart map",contact:"Contact",email:"Email us",privacy:"Privacy",imprint:"Imprint",journeys:"Journeys",vehicles:"Vehicles",account:"Sign in",menu:"Explore MLT",europe:"Individual Road Expeditions across Europe.",days:"days"},
  de:{build:"Stellen Sie Ihre Reise zusammen:",country:"Land",dates:"Reisedauer wählen",departure:"Abreise",return:"Rückkehr",travellers:"Reisende",included:"1–2 Reisende inklusive · +190 € ab der 3. Person",experience:"Erlebnis auswählen:",selected:"Gewählt",choose:"Wählen",ideal:"Ideal für",total:"Gesamt",pay:"Anmelden & zahlen →",concierge:"Concierge kontaktieren",prepared:"Sagen Sie uns, wo Ihre Reise beginnen soll. Wir bereiten das Reisemobil, alles Wesentliche und Ihre ersten Empfehlungen vor.",explore:"Entdecken",collections:"Kollektionen",experiences:"Erlebnisse",map:"Smart Map",contact:"Kontakt",email:"E-Mail",privacy:"Datenschutz",imprint:"Impressum",journeys:"Reisen",vehicles:"Fahrzeuge",account:"Anmelden",menu:"MLT entdecken",europe:"Individuelle Road Expeditions durch Europa.",days:"Tage"},
  ru:{build:"Соберите путешествие:",country:"Страна",dates:"Выберите длительность",departure:"Отправление",return:"Возвращение",travellers:"Путешественники",included:"1–2 гостя включены · +€190 с 3-го гостя",experience:"Выберите впечатление:",selected:"Выбрано",choose:"Выбрать",ideal:"Идеально для",total:"Итого",pay:"Войти и оплатить →",concierge:"Связаться с консьержем",prepared:"Расскажите, откуда хотите начать. Мы подготовим автодом, всё необходимое и первые рекомендации.",explore:"Разделы",collections:"Коллекции",experiences:"Впечатления",map:"Карта",contact:"Контакты",email:"Написать нам",privacy:"Конфиденциальность",imprint:"Реквизиты",journeys:"Маршруты",vehicles:"Автодома",account:"Войти",menu:"Откройте MLT",europe:"Индивидуальные автопутешествия по Европе.",days:"дней"},
} satisfies Record<Locale,Record<string,string>>;

function addDays(date: string, days: number) {
  if (!date) return "";
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

export default function FreedomMobilePreview({ initialLocale = "EN", previewMode = true }: { initialLocale?: "EN" | "DE" | "RU"; previewMode?: boolean }) {
  const [plus, setPlus] = useState(false);
  const [days, setDays] = useState(7);
  const [departure, setDeparture] = useState("2026-10-12");
  const [guests, setGuests] = useState(1);
  const [active, setActive] = useState(2);
  const [locale] = useState<"EN" | "DE" | "RU">(initialLocale);
  const [activeField, setActiveField] = useState<"country" | "duration" | "dates" | null>(null);
  const [packages, setPackages] = useState<PackageVariant[]>(defaultPackages);
  const catalogItems = useCatalogItems();
  const productCarousel = useRef<SwiperInstance | null>(null);
  const language=locale.toLowerCase() as Locale, ui=translations[language], detail=collectionDetails.freedom[language];
  const total = useMemo(() => prices[days] + (plus ? 300 : 0) + Math.max(0, guests - 2) * 190, [days, guests, plus]);
  const returnDate = useMemo(() => addDays(departure, days), [departure, days]);
  const money = new Intl.NumberFormat(language==="en"?"en-GB":language==="de"?"de-DE":"ru-RU", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(total);
  const dbCollection = catalogItems.find(entry => entry.item_type === "collection" && entry.slug === "freedom");
  const departureRule = parseDepartureRule(dbCollection?.data_json);
  useEffect(() => { if (dbCollection?.data_json) setDeparture(current => nextAllowedDeparture(current, departureRule)); }, [dbCollection?.data_json]);
  useEffect(() => { const parsed = dbCollection?.data_json ? JSON.parse(dbCollection.data_json) : {}; if (Array.isArray(parsed.packageVariants) && parsed.packageVariants.length >= 2) setPackages(parsed.packageVariants); }, [dbCollection]);
  const displayedPackages=locale==="EN"?packages:localizedPackages[language];
  const freedomPackage = displayedPackages[0] || localizedPackages[language][0];
  const freedomPlusPackage = displayedPackages[1] || localizedPackages[language][1];
  const displayDate = (value: string) => new Intl.DateTimeFormat(language==="en"?"en-GB":language==="de"?"de-DE":"ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
  const continueToAccount = () => continueJourneyInAccount({ collection: "freedom", collectionName: "MLT Freedom Collection", country: "Italy", days, arrival: departure, departure: returnDate, guests, route: products[active]?.title || "MLT curated route", rate: money, freedomPlus: plus, signatureTailored: false, tailoredInterests: [], vehicle: "MLT motorhome" }, language);

  return <main className={styles.stage}>
    <div className={styles.phone}>
      <MobilePreviewHeader locale={language} variant="light" previewMode={previewMode}/>

      <section className={styles.hero}>
        <img src="/collection-freedom-hero-mobile-v2.webp" alt="MLT Freedom expedition" />
        <div><span>MLT / 01</span><h1><strong>MLT Freedom</strong><br/><i>Collection</i></h1></div>
      </section>

      <section className={styles.booking}>
        <h2>{ui.build}</h2>
        <div className={styles.types}>
          <button className={!plus ? styles.selected : ""} onClick={() => setPlus(false)}><b>{freedomPackage.title}</b>{(freedomPackage.benefits || []).map(item => <small key={item}><span>✓</span> {item}</small>)}</button>
          <button className={plus ? styles.selected : ""} onClick={() => setPlus(true)}><b>{freedomPlusPackage.title}</b>{(freedomPlusPackage.benefits || []).map(item => <small key={item}><span>✓</span> {item}</small>)}</button>
        </div>
        <div className={styles.fields}>
          <label className={activeField === "country" ? styles.activeField : ""} onClick={() => setActiveField("country")}><i><Icon name="pin"/></i><span>{ui.country}</span><select><option>Italy</option></select></label>
          <label className={activeField === "duration" ? styles.activeField : ""} onClick={() => setActiveField("duration")}><i><Icon name="calendar"/></i><span>{ui.dates}</span><select value={days} onChange={(e) => setDays(Number(e.target.value))}>{Object.keys(prices).map(d => <option key={d} value={d}>{d} {ui.days}</option>)}</select><small className={styles.fieldPrice}>{new Intl.NumberFormat(language==="en"?"en-GB":language==="de"?"de-DE":"ru-RU", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(prices[days] + (plus ? 300 : 0))}</small></label>
          <div className={`${styles.calendarField} ${activeField === "dates" ? styles.activeField : ""}`} onClick={(event) => { setActiveField("dates"); if (!(event.target as HTMLElement).closest("button")) event.currentTarget.querySelector("button")?.click(); }}><i><Icon name="calendar"/></i><DepartureCalendar value={departure} onChange={setDeparture} rule={departureRule} locale={language} calendarLocale={language} label={ui.departure}/></div>
          <div className={`${styles.returnField} ${activeField === "dates" ? styles.activeField : ""}`}><i><Icon name="calendar"/></i><span>{ui.return}</span><strong>{displayDate(returnDate)}</strong></div>
          <div className={styles.travellers}><i><Icon name="travellers"/></i><span>{ui.travellers}</span><div><button onClick={() => setGuests(Math.max(1, guests - 1))}>−</button><b>{guests}</b><button onClick={() => setGuests(Math.min(8, guests + 1))}>+</button></div><small>{ui.included}</small></div>
        </div>
        <section className={styles.products}>
          <p className={styles.eyebrow}>{ui.experience}</p>
          <div className={styles.carousel}>
            <button className={styles.prev} onClick={() => productCarousel.current?.slidePrev()} aria-label="Previous"><Icon name="arrow-left"/></button>
            <SwiperCarousel className={styles.track} modules={[EffectCoverflow, Keyboard]} effect="coverflow" initialSlide={products.length + 2} centeredSlides slidesPerView="auto" speed={650} loop loopAdditionalSlides={products.length} simulateTouch grabCursor allowTouchMove touchAngle={35} threshold={10} longSwipesRatio={0.2} preventClicks preventClicksPropagation keyboard={{ enabled: true }} coverflowEffect={{ rotate: 0, stretch: 8, depth: 90, modifier: 1, slideShadows: false }} onSwiper={instance => { productCarousel.current = instance; }} onSlideChange={instance => setActive(instance.realIndex % products.length)}>{carouselProducts.map((product, index) => {
              const productIndex = index % products.length;
              return <SwiperSlide className={styles.slide} key={`${product.n}-${index}`}><button className={styles.card} data-active={productIndex === active} aria-pressed={productIndex === active} onClick={() => setActive(productIndex)}>
                <img src={product.image} alt=""/><span>{product.n}</span><em>{productIndex === active ? ui.selected : ui.choose}</em><div><strong>{product.title}</strong><small>{product.copy[language]}</small></div>
              </button></SwiperSlide>;
            })}</SwiperCarousel>
            <button className={styles.next} onClick={() => productCarousel.current?.slideNext()} aria-label="Next"><Icon name="arrow-right"/></button>
          </div>
        </section>
      </section>

      <section className={styles.ideal}><p className={styles.eyebrow}>{ui.ideal}</p><p>{detail.ideal}</p></section>
      <section className={styles.shapes}><p className={styles.eyebrow}>{detail.includes}</p><div>{detail.signature.map(x => <span key={x}>✓ &nbsp;{x}</span>)}</div></section>
      <section className={styles.compare}>{[freedomPackage, freedomPlusPackage].map(item => <article key={item.id}><h3>{item.title}</h3>{[...(item.benefits || []), ...(item.supplement ? [item.supplement] : [])].map(entry=><p key={entry}>✓ &nbsp;{entry}</p>)}</article>)}</section>
      <section className={styles.cta}><img src="/collection-freedom-hero-mobile-v2.webp" alt=""/><div><p className={styles.eyebrow}>MLT Freedom</p><h2>{detail.cta}</h2><p>{ui.prepared}</p><a href="mailto:info@mlt-lifestyle.com">{ui.concierge}<span>→</span></a></div></section>
      <MobilePreviewFooter locale={language} withStickyBar previewMode={previewMode}/>
      <div className={styles.sticky}><span>{ui.total}<b>{money}</b></span><button onClick={continueToAccount}>{ui.pay}</button></div>
    </div>
  </main>;
}
