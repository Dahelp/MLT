"use client";
import ChatLink from "../../ChatLink";

import { useEffect, useMemo, useState } from "react";
import { collectionDetails } from "../../../content/collection-details";
import { nextAllowedDeparture, parseDepartureRule, useCatalogItems } from "../../../content/catalog-client";
import { resolveJourneyRates, journeyPrice, journeyTotal, parseCatalogData } from "../../../content/journey-pricing";
import type { Locale } from "../../../content/i18n";
import { DepartureCalendar, type DepartureRule } from "../../collections/[slug]/DepartureCalendar";
import MobilePreviewHeader from "../MobilePreviewHeader";
import MobilePreviewFooter from "../MobilePreviewFooter";
import { continueJourneyInAccount } from "../../../content/account-draft";
import { defaultPackages, localizedPackages, translations, type PackageVariant } from "../../../content/freedom-booking";
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


function addDays(date: string, days: number) {
  if (!date) return "";
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

export default function FreedomMobilePreview({ initialLocale = "EN", previewMode = true }: { initialLocale?: "EN" | "DE" | "RU" | "IT" | "PL"; previewMode?: boolean }) {
  const [plus, setPlus] = useState(false);
  const [days, setDays] = useState(7);
  const [departure, setDeparture] = useState("2026-10-12");
  const [guests, setGuests] = useState(1);
  const [locale] = useState<"EN" | "DE" | "RU" | "IT" | "PL">(initialLocale);
  const [activeField, setActiveField] = useState<"country" | "duration" | "dates" | null>(null); const [reviewOpen, setReviewOpen] = useState(false);
  const [packages, setPackages] = useState<PackageVariant[]>(defaultPackages);
  const catalogItems = useCatalogItems();
  const language=locale.toLowerCase() as Locale, ui=translations[language], detail=collectionDetails.freedom[language];
  const returnDate = useMemo(() => addDays(departure, days), [departure, days]);
  const dbCollection = catalogItems.find(entry => entry.item_type === "collection" && entry.slug === "freedom" && Boolean(entry.is_active));
  const options = useMemo(()=>resolveJourneyRates("freedom",dbCollection?.data_json),[dbCollection?.data_json]);
  const prices:Record<number,number> = Object.fromEntries(options.map(row=>[row.d,row.p]));
  useEffect(()=>{if(!options.some(row=>row.d===days))setDays(options[0].d);},[options,days]);
  const total = journeyTotal(journeyPrice("freedom",days,prices[days]??options[0].p,plus),guests);
  const money = new Intl.NumberFormat({en:"en-GB",de:"de-DE",ru:"ru-RU",it:"it-IT",pl:"pl-PL"}[language], { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(total);
  const departureRule = parseDepartureRule(dbCollection?.data_json);
  useEffect(() => { if (dbCollection?.data_json) setDeparture(current => nextAllowedDeparture(current, departureRule)); }, [dbCollection?.data_json]);
  useEffect(() => { const parsed = parseCatalogData(dbCollection?.data_json); if (Array.isArray(parsed.packageVariants) && parsed.packageVariants.length >= 2) setPackages(parsed.packageVariants as PackageVariant[]); }, [dbCollection]);
  const displayedPackages=locale==="EN"?packages:localizedPackages[language];
  const freedomPackage = displayedPackages[0] || localizedPackages[language][0];
  const freedomPlusPackage = displayedPackages[1] || localizedPackages[language][1];
  const displayDate = (value: string) => new Intl.DateTimeFormat(language==="en"?"en-GB":language==="de"?"de-DE":"ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
  const continueToAccount = () => continueJourneyInAccount({ collection: "freedom", collectionName: "MLT Freedom Collection", country: "Italy", days, arrival: departure, departure: returnDate, guests, route: "", rate: money, freedomPlus: plus, signatureTailored: false, tailoredInterests: [], vehicle: "MLT motorhome" }, language);
  const review = language === "ru" ? { title:"Проверьте выбор",copy:"Убедитесь, что все детали путешествия указаны верно.",collection:"Коллекция",package:"Пакет",route:"Маршрут",dates:"Даты",travellers:"Путешественники",confirm:"Подтвердить и перейти",cancel:"Изменить выбор",close:"Закрыть" } : language === "de" ? { title:"Auswahl prüfen",copy:"Bitte prüfen Sie die Reisedetails, bevor Sie fortfahren.",collection:"Kollektion",package:"Paket",route:"Route",dates:"Reisedaten",travellers:"Reisende",confirm:"Bestätigen & weiter",cancel:"Auswahl ändern",close:"Schließen" } :language==="it"?{title:"Controlla la tua scelta",copy:"Controlla i dettagli del viaggio prima di continuare.",collection:"Collezione",package:"Pacchetto",route:"Itinerario",dates:"Date",travellers:"Viaggiatori",confirm:"Conferma e continua",cancel:"Modifica la scelta",close:"Chiudi"}:language==="pl"?{title:"Sprawdź swój wybór",copy:"Sprawdź szczegóły podróży przed przejściem dalej.",collection:"Kolekcja",package:"Pakiet",route:"Trasa",dates:"Daty",travellers:"Podróżni",confirm:"Potwierdź i kontynuuj",cancel:"Zmień wybór",close:"Zamknij"}: { title:"Review your selection",copy:"Please check the journey details before continuing.",collection:"Collection",package:"Package",route:"Route",dates:"Travel dates",travellers:"Travellers",confirm:"Confirm & continue",cancel:"Change selection",close:"Close" };

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
          <label className={activeField === "duration" ? styles.activeField : ""} onClick={() => setActiveField("duration")}><i><Icon name="calendar"/></i><span>{ui.dates}</span><select value={days} onChange={(e) => setDays(Number(e.target.value))}>{Object.keys(prices).map(d => <option key={d} value={d}>{d} {ui.days}</option>)}</select><small className={styles.fieldPrice}>{new Intl.NumberFormat(language==="en"?"en-GB":language==="de"?"de-DE":"ru-RU", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(journeyPrice("freedom",days,prices[days]??options[0].p,plus))}</small></label>
          <div className={`${styles.calendarField} ${activeField === "dates" ? styles.activeField : ""}`} onClick={(event) => { setActiveField("dates"); if (!(event.target as HTMLElement).closest("button")) event.currentTarget.querySelector("button")?.click(); }}><i><Icon name="calendar"/></i><DepartureCalendar value={departure} onChange={setDeparture} rule={departureRule} locale={language} calendarLocale={language} label={ui.departure}/></div>
          <div className={`${styles.returnField} ${activeField === "dates" ? styles.activeField : ""}`}><i><Icon name="calendar"/></i><span>{ui.return}</span><strong>{displayDate(returnDate)}</strong></div>
          <div className={styles.travellers}><i><Icon name="travellers"/></i><span>{ui.travellers}</span><div><button onClick={() => setGuests(Math.max(1, guests - 1))}>−</button><b>{guests}</b><button onClick={() => setGuests(Math.min(8, guests + 1))}>+</button></div><small>{ui.included}</small></div>
        </div>

      </section>

      <section className={styles.ideal}><p className={styles.eyebrow}>{ui.ideal}</p><p>{detail.ideal}</p></section>
      <section className={styles.shapes}><p className={styles.eyebrow}>{detail.includes}</p><div>{detail.signature.map(x => <span key={x}>✓ &nbsp;{x}</span>)}</div></section>
      <section className={styles.compare}>{[freedomPackage, freedomPlusPackage].map(item => <article key={item.id}><h3>{item.title}</h3>{[...(item.benefits || []), ...(item.supplement ? [item.supplement] : [])].map(entry=><p key={entry}>✓ &nbsp;{entry}</p>)}</article>)}</section>
      <section className={styles.cta}><img src="/collection-freedom-hero-mobile-v2.webp" alt=""/><div><p className={styles.eyebrow}>MLT Freedom</p><h2>{detail.cta}</h2><p>{ui.prepared}</p><ChatLink>{ui.concierge}</ChatLink></div></section>
      <MobilePreviewFooter locale={language} withStickyBar previewMode={previewMode}/>
      <div className={styles.sticky}><span>{ui.total}<b>{money}</b></span><button onClick={() => setReviewOpen(true)}>{ui.pay}</button></div>
      {reviewOpen && <div className="journey-review-overlay" role="presentation" onMouseDown={() => setReviewOpen(false)}><section className="journey-review-modal" role="dialog" aria-modal="true" aria-label={review.title} onMouseDown={event => event.stopPropagation()}><button className="journey-review-close" type="button" onClick={() => setReviewOpen(false)} aria-label={review.close}>×</button><p className="section-label">MLT / 01</p><h2>{review.title}</h2><p className="journey-review-copy">{review.copy}</p><dl><div><dt>{review.collection}</dt><dd>MLT Freedom Collection</dd></div><div><dt>{review.package}</dt><dd>{plus ? freedomPlusPackage.title : freedomPackage.title}</dd></div><div><dt>{review.dates}</dt><dd>{displayDate(departure)} — {displayDate(returnDate)}</dd></div><div><dt>{review.travellers}</dt><dd>{days} {ui.days} · {guests}</dd></div></dl><div className="journey-review-total"><span>{ui.total}</span><strong>{money}</strong></div><div className="journey-review-actions"><button type="button" onClick={() => setReviewOpen(false)}>{review.cancel}</button><button type="button" className="bronze-button" onClick={continueToAccount}>{review.confirm}</button></div></section></div>}
    </div>
  </main>;
}
