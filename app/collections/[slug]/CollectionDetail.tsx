"use client";

import { useEffect, useState } from "react";
import type { Collection } from "../../../content/mlt";
import { collectionDe, type Locale } from "../../../content/i18n";
import { collectionDetails } from "../../../content/collection-details";

export function CollectionDetail({ collection }: { collection: Collection }) {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => { const saved = localStorage.getItem("mlt-locale"); if (saved === "de") setLocale("de"); }, []);
  const changeLocale = (next: Locale) => { setLocale(next); localStorage.setItem("mlt-locale", next); document.documentElement.lang = next; };
  const item = locale === "de" ? { ...collection, ...collectionDe[collection.id] } : collection;
  const copy = collectionDetails[collection.id][locale];
  const ui = locale === "de" ? { duration: "Dauer", rate: "Preisrahmen", ideal: "Ideal für", included: "Enthalten", explore: "Reise anfragen" } : { duration: "Duration", rate: "Indicative rate", ideal: "Ideal for", included: "Included", explore: "Request this journey" };

  return <main className={`detail-page detail-${collection.id}`}>
    <header className="detail-nav"><a className="brand" href="/"><span className="brand-mark">MLT</span><span className="brand-line">Move. Live. Travel.</span></a><a href="/#collections">← {copy.back}</a><div className="language-switch"><button className={locale === "en" ? "active" : ""} onClick={() => changeLocale("en")}>EN</button><button className={locale === "de" ? "active" : ""} onClick={() => changeLocale("de")}>DE</button></div></header>
    <section className="detail-hero">
      <div className="detail-hero-shade" />
      <div className="detail-index">MLT / {item.number}</div>
      <div className="detail-hero-copy"><p className="section-label">{item.eyebrow}</p><h1>{item.name}<br /><em>Collection</em></h1><p>{copy.manifesto}</p><a className="primary-button" href={`/plan?collection=${item.id}`}>{ui.explore}<span>↗</span></a></div>
      <div className="detail-facts"><div><small>{ui.duration}</small><strong>{item.days}</strong></div><div><small>{ui.rate}</small><strong>{item.rate}</strong></div><div><small>Service</small><strong>{item.mode}</strong></div></div>
    </section>
    <section className="detail-intro"><p className="section-label">{ui.ideal}</p><p className="detail-lead">{copy.ideal}</p><div className="detail-includes"><h2>{copy.includes}</h2><ul>{item.inclusions.map((entry) => <li key={entry}><span>✓</span>{entry}</li>)}</ul></div></section>
    <section className="detail-flow"><div className="detail-flow-head"><p className="section-label">{copy.itinerary}</p><h2>{item.promise}</h2></div><div className="flow-grid">{copy.flow.map((step, index) => <article key={step.title}><span>{String(index + 1).padStart(2, "0")}</span><small>{step.label}</small><h3>{step.title}</h3><p>{step.copy}</p></article>)}</div></section>
    <section className="detail-cta"><p className="section-label">MLT {item.name}</p><h2>{copy.cta}</h2><a className="primary-button" href={`/plan?collection=${item.id}`}>{ui.explore}<span>↗</span></a></section>
    <footer className="detail-footer"><div className="brand"><span className="brand-mark">MLT</span><span className="brand-line">Move. Live. Travel.</span></div><p>Individual Road Expeditions · MLT GmbH</p><a href="/">mlt.travel</a></footer>
  </main>;
}
