"use client";

import { useEffect, useState } from "react";
import type { Locale } from "../../../content/i18n";
import { fleetDetails } from "../../../content/fleet-details";

type Vehicle = { id: string; number: string; badge: string; category: string; name: string; rate: string; specs: string[]; collection: string; featured: boolean };

export function FleetDetail({ vehicle }: { vehicle: Vehicle }) {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => { if (localStorage.getItem("mlt-locale") === "de") setLocale("de"); }, []);
  const changeLocale = (next: Locale) => { setLocale(next); localStorage.setItem("mlt-locale", next); document.documentElement.lang = next; };
  const copy = fleetDetails[vehicle.id][locale];

  return <main className={`fleet-detail fleet-detail-${vehicle.id}`}>
    <header className="detail-nav"><a className="brand" href="/"><span className="brand-mark">MLT</span><span className="brand-line">Move. Live. Travel.</span></a><a href="/#fleet">← {copy.labels.back}</a><div className="language-switch"><button className={locale === "en" ? "active" : ""} onClick={() => changeLocale("en")}>EN</button><button className={locale === "de" ? "active" : ""} onClick={() => changeLocale("de")}>DE</button></div></header>
    <section className="fleet-detail-hero"><div className="detail-hero-shade" /><div className="detail-index">FLEET / {vehicle.number}</div><div className="fleet-detail-copy"><p className="section-label">{vehicle.category}</p><h1>{vehicle.name.replace("MLT ", "")}<br /><em>by MLT</em></h1><p>{copy.tagline}</p><a className="primary-button" href={`/plan?vehicle=${vehicle.id}`}>{copy.labels.request}<span>↗</span></a></div><div className="fleet-spec-bar"><div><small>{copy.labels.guests}</small><strong>{vehicle.specs[0]}</strong></div><div><small>{copy.labels.transmission}</small><strong>{vehicle.specs[1]}</strong></div><div><small>{copy.labels.length}</small><strong>{vehicle.specs[2]}</strong></div><div><small>{copy.labels.from}</small><strong>{vehicle.rate.replace("from ", "")}</strong></div></div></section>
    <section className="fleet-story"><p className="section-label">{vehicle.name}</p><p className="fleet-story-lead">{copy.intro}</p><div className="equipment-grid"><div><h2>{copy.labels.highlights}</h2><p>{copy.labels.concept}</p></div><ul>{copy.highlights.map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul></div></section>
    <section className="fleet-gallery"><div className="gallery-main"><span>01</span></div><div className="gallery-side gallery-two"><span>02</span></div><div className="gallery-side gallery-three"><span>03</span></div><p>{copy.labels.concept}</p></section>
    <section className="onboard"><div className="onboard-head"><p className="section-label">{copy.labels.spaces}</p><h2>{copy.tagline}</h2></div><div className="onboard-grid">{copy.spaces.map((space, index) => <article key={space.title}><span>0{index + 1}</span><h3>{space.title}</h3><p>{space.copy}</p></article>)}</div></section>
    <section className="fleet-collections"><div><p className="section-label">{copy.labels.suited}</p><h2>{vehicle.name}</h2></div><div>{copy.suited.map((collection) => <a key={collection} href={`/collections/${collection.split(" ")[0].toLowerCase()}`}>{collection}<span>↗</span></a>)}</div></section>
    <section className="detail-cta fleet-detail-cta"><p className="section-label">MLT Fleet / {vehicle.number}</p><h2>{copy.labels.request}</h2><a className="primary-button" href={`/plan?vehicle=${vehicle.id}`}>{copy.labels.request}<span>↗</span></a></section>
    <footer className="detail-footer"><div className="brand"><span className="brand-mark">MLT</span><span className="brand-line">Move. Live. Travel.</span></div><p>{copy.labels.concept}</p><a href="/">mlt.travel</a></footer>
  </main>;
}
