"use client";
import ChatLink from "./ChatLink";

import { useMapSelection } from "./useMapSelection";
import { mapCopy as copy, mapCountries as countries } from "../content/map";
import type { SiteLanguage } from "./LanguageMenu";
import SiteHeader from "./SiteHeader";
import HeroBannerImage from "./HeroBannerImage";
import SiteFooter from "./SiteFooter";
import MapSelectionList from "./MapSelectionList";
import RealRouteMap from "./plan/RealRouteMap";

export default function SmartMapPage({ locale }: { locale: SiteLanguage }) {
  const t = copy[locale];
  const { country, setCountry, selected: selection, distance, toggle, onDistanceChange } = useMapSelection();
  return <main className="home-light smart-map-page">
    <SiteHeader locale={locale} />
    <section className="smart-map-page-intro photo-hero"><HeroBannerImage name="smart-map"/><p className="light-section-label">{t.eyebrow}</p><h1>{t.title}</h1><p>{t.intro}</p></section>
    <section className="light-map smart-map-page-panel" aria-label={t.eyebrow}>
      <div className="smart-map-canvas">
        <div className="smart-map-country-tabs" aria-label={t.country}>{countries.map(item => <button key={item} type="button" className={country === item ? "active" : ""} onClick={() => setCountry(item)}>{item === "All" ? t.all : item}</button>)}</div>
        <RealRouteMap selected={selection} country={country} onToggle={toggle} locale={locale} className="home-route-map" onDistanceChange={onDistanceChange} />
      </div>
      <div className="map-copy"><p className="light-section-label">{t.selected}</p><h2>{t.title}</h2><MapSelectionList locale={locale} selected={selection} distance={distance} onToggle={toggle}/><a className="bronze-button smart-map-collection-button" href={`/${locale}/#collections`}>{t.choose}</a></div>
    </section>
    <section className="light-contact"><div><h2>{t.contactTitle}</h2></div><div><p>{t.contactCopy}</p><ChatLink className="bronze-button">{t.start}</ChatLink></div></section>
    <SiteFooter locale={locale} />
  </main>;
}
