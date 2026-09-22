"use client";

import { useEffect, useState } from "react";
import type { Collection } from "../../../content/mlt";
import { collectionDe, type Locale } from "../../../content/i18n";
import { collectionDetails } from "../../../content/collection-details";

const durationOptions = {
  freedom: [{ days: 7, price: 1490 }, { days: 10, price: 1990 }, { days: 14, price: 2590 }, { days: 21, price: 3690 }, { days: 30, price: 4990 }],
  signature: [{ days: 7, price: 2490 }, { days: 10, price: 3557 }, { days: 14, price: 4980 }, { days: 21, price: 7470 }, { days: 30, price: 10671 }],
  concierge: [{ days: 7, price: 4990 }, { days: 10, price: 7129 }, { days: 14, price: 9980 }, { days: 21, price: 14970 }, { days: 30, price: 21386 }],
  private: [{ days: 7, price: 19900 }, { days: 10, price: 28429 }, { days: 14, price: 39800 }, { days: 21, price: 59700 }, { days: 30, price: 85286 }],
  proposal: [{ days: 3, price: 0 }, { days: 5, price: 0 }, { days: 7, price: 0 }],
} as const;

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

function CollectionBooking({ collectionId, locale }: { collectionId: string; locale: Locale }) {
  const options = durationOptions[collectionId as keyof typeof durationOptions] || durationOptions.freedom;
  const [selectedDays, setSelectedDays] = useState<number>(options[0].days);
  const [startDate, setStartDate] = useState("");
  const selected = options.find((option) => option.days === selectedDays) || options[0];
  const calculatedEnd = new Date(`${startDate || "2000-01-01"}T12:00:00`); calculatedEnd.setDate(calculatedEnd.getDate() + selectedDays);
  const endDate = startDate ? toIsoDate(calculatedEnd) : "";
  const minDate = toIsoDate(new Date());
  const text = locale === "de"
    ? { label: "Ihre Reise", days: "Tage", start: "Startdatum", end: "Reise endet", select: "Dauer wählen", continue: "Reise konfigurieren", quote: "auf Anfrage", hint: "Wählen Sie zuerst die Dauer und dann Ihr gewünschtes Startdatum. Der Gesamtpreis wird sofort aktualisiert." }
    : { label: "Your journey", days: "days", start: "Start date", end: "Journey ends", select: "Choose duration", continue: "Configure this journey", quote: "on request", hint: "Choose the length first, then your preferred departure date. Your total updates immediately." };
  const euro = (value: number) => new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
  const plannerUrl = startDate ? `/plan?collection=${collectionId}&days=${selected.days}&dates=${startDate}_${endDate}` : "#booking";

  return <section className="collection-booking" id="booking" aria-label={text.label}>
    <div><p className="section-label">MLT / {text.label}</p><h2>{text.select}</h2><p>{text.hint}</p></div>
    <div className="duration-options" role="radiogroup" aria-label={text.select}>{options.map((option) => <button type="button" role="radio" aria-checked={selectedDays === option.days} className={selectedDays === option.days ? "selected" : ""} key={option.days} onClick={() => setSelectedDays(option.days)}><strong>{option.days} {text.days}</strong><span>{option.price ? euro(option.price) : text.quote}</span></button>)}</div>
    <div className="collection-date-row"><label>{text.start}<input type="date" min={minDate} value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><div><small>{text.end}</small><strong>{endDate ? new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${endDate}T12:00:00`)) : "—"}</strong></div><div><small>{text.label}</small><strong>{selected.price ? euro(selected.price) : text.quote}</strong></div><a className={`primary-button ${startDate ? "" : "disabled"}`} href={plannerUrl} aria-disabled={!startDate} onClick={(event) => { if (!startDate) event.preventDefault(); }}>{text.continue}<span>↗</span></a></div>
  </section>;
}

export function CollectionDetail({ collection }: { collection: Collection }) {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => { const saved = localStorage.getItem("mlt-locale"); if (saved === "de") setLocale("de"); }, []);
  const changeLocale = (next: Locale) => { setLocale(next); localStorage.setItem("mlt-locale", next); document.documentElement.lang = next; };
  const item = locale === "de" ? { ...collection, ...collectionDe[collection.id] } : collection;
  const copy = collectionDetails[collection.id][locale];
  const ui = locale === "de" ? { duration: "Dauer", rate: "Preisrahmen", ideal: "Ideal für", included: "Enthalten", explore: "Reise anfragen" } : { duration: "Duration", rate: "Indicative rate", ideal: "Ideal for", included: "Included", explore: "Request this journey" };

  return <main className={`detail-page detail-${collection.id}`}>
    <header className="detail-nav"><a className="brand" href="/"><img className="brand-logo" src="/mlt-logo.svg" alt="MLT — Move. Live. Travel." /></a><a href="/#collections">← {copy.back}</a><div className="language-switch"><button className={locale === "en" ? "active" : ""} onClick={() => changeLocale("en")}>EN</button><button className={locale === "de" ? "active" : ""} onClick={() => changeLocale("de")}>DE</button></div></header>
    <section className="detail-hero">
      <div className="detail-hero-shade" />
      <div className="detail-index">MLT / {item.number}</div>
      <div className="detail-hero-copy"><p className="section-label">{item.eyebrow}</p><h1>{item.name}<br /><em>Collection</em></h1><p>{copy.manifesto}</p><a className="primary-button" href={`/plan?collection=${item.id}`}>{ui.explore}<span>↗</span></a></div>
      <div className="detail-facts"><div><small>{ui.duration}</small><strong>{item.days}</strong></div><div><small>{ui.rate}</small><strong>{item.rate}</strong></div><div><small>Service</small><strong>{item.mode}</strong></div></div>
    </section>
    <section className="detail-intro"><p className="section-label">{ui.ideal}</p><p className="detail-lead">{copy.ideal}</p><div className="detail-includes"><h2>{copy.includes}</h2><ul>{item.inclusions.map((entry) => <li key={entry}><span>✓</span>{entry}</li>)}</ul></div></section>
    <CollectionBooking collectionId={item.id} locale={locale} />
    <section className="detail-flow"><div className="detail-flow-head"><p className="section-label">{copy.itinerary}</p><h2>{item.promise}</h2></div><div className="flow-grid">{copy.flow.map((step, index) => <article key={step.title}><span>{String(index + 1).padStart(2, "0")}</span><small>{step.label}</small><h3>{step.title}</h3><p>{step.copy}</p></article>)}</div></section>
    <section className="detail-cta"><p className="section-label">MLT {item.name}</p><h2>{copy.cta}</h2><a className="primary-button" href={`/plan?collection=${item.id}`}>{ui.explore}<span>↗</span></a></section>
    <footer className="detail-footer"><div className="brand"><img className="brand-logo" src="/mlt-logo.svg" alt="MLT — Move. Live. Travel." /></div><p>Individual Road Expeditions · MLT GmbH</p><a href="/">mlt.travel</a></footer>
  </main>;
}
