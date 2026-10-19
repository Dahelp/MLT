"use client";
import { siteIdentity } from "../content/site";

import { useEffect } from "react";
import RealRouteMap from "./DeferredRouteMap";
import { homeCollectionCards, philosophyImages, homeCopy as copy } from "../content/home";
import { useMapSelection } from "./useMapSelection";
import { useCatalogItems } from "../content/catalog-client";
import SiteHeader from "./SiteHeader";
import HeroVideo from "./HeroVideo";
import VoucherOffer from "./VoucherOffer";
import {voucherCopy} from "../content/vouchers";
import SiteFooter from "./SiteFooter";
import MapSelectionList from "./MapSelectionList";
import CollectionCarousel, { scrollCollectionCarouselIntoView } from "./CollectionCarousel";

type SiteLocale = "en" | "de" | "ru" | "it" | "pl";

export default function Home({ initialLocale }: { initialLocale: SiteLocale }) {
  const locale = initialLocale;
  const { country: mapCountry, setCountry: setMapCountry, selected: mapSelection, distance: mapDistance, toggle: toggleMapPoint, onDistanceChange } = useMapSelection();
  const t = copy[locale];
  const catalog = useCatalogItems();
  const collections = homeCollectionCards(locale, catalog);

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem("mlt-locale", locale);
    return () => { document.body.style.overflow = ""; };
  }, [locale]);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".home-light");
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-home-reveal]"));
    const initialItems = items.filter((item) => item.getBoundingClientRect().top < window.innerHeight * 0.94);
    root.classList.add("home-reveal-enabled");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    items.forEach((item) => {
      if (!initialItems.includes(item)) observer.observe(item);
    });
    let revealFrame = 0;
    const prepareFrame = window.requestAnimationFrame(() => {
      revealFrame = window.requestAnimationFrame(() => {
        initialItems.forEach((item) => item.classList.add("is-visible"));
      });
    });
    return () => {
      window.cancelAnimationFrame(prepareFrame);
      window.cancelAnimationFrame(revealFrame);
      observer.disconnect();
      root.classList.remove("home-reveal-enabled");
    };
  }, []);

  const localPath = (path: string) => `/${locale}${path}`;
  return <main className="home-light">
    <SiteHeader locale={locale} isHome />

    <section className="light-hero light-video-hero" id="top">
      <HeroVideo locale={locale} />
      <div className="light-hero-wash" />
      <div className="light-hero-copy">
        <h1>{({ en: "Individual Motorhome Expeditions", de: "Individuelle Wohnmobil-Expeditionen", ru: "Индивидуальные экспедиции на автодомах", it: "Spedizioni individuali in motorhome", pl: "Indywidualne wyprawy kamperem" })[locale]}</h1>
        <p>{t.hero}</p>
        <div className="light-hero-buttons"><a className="bronze-button hero-collection-button" href="#collections" onClick={scrollCollectionCarouselIntoView}>{t.choose}</a><a className="text-button dark hero-voucher-button" href={`/${locale}/vouchers/`}>{voucherCopy[locale].buy}</a></div>
      </div>
    </section>

    <VoucherOffer locale={locale}/>

    <section className="light-philosophy" id="about">
      <p className="light-section-label" data-home-reveal="up">01 / {t.philosophy}</p>
      <div className="philosophy-grid"><h2 data-home-reveal="left">{t.freedom}</h2><p data-home-reveal="right">{t.freedomCopy}</p></div>
      <div className="value-row">{t.pillars.map((item, index) => <article key={item} data-home-reveal="up"><img src={philosophyImages[index]} alt="" loading="lazy" decoding="async" /><div><h3>{item}</h3></div></article>)}</div>
    </section>

    <section className="light-collections" id="collections">
      <div className="light-section-head"><div><p className="light-section-label">02 / {t.ways}</p><h2>{t.collectionTitle}</h2></div><div><p>{t.collectionCopy}</p></div></div>
      <CollectionCarousel locale={locale} items={collections} shellClassName="collection-rail-shell" carouselClassName="collection-rail" slideClassName="collection-slide" arrowClassName="carousel-side-arrow" prevClassName="carousel-side-arrow-prev" nextClassName="carousel-side-arrow-next" renderSlide={(item,index)=>{const localizedItem=item;return <a className="collection-card-link" draggable={false} href={localPath(`/collections/${item.id}`)} aria-label={locale==="ru"?`Открыть MLT ${item.name} Collection`:locale==="de"?`MLT ${item.name} Collection öffnen`:locale==="it"?`Scopri MLT ${item.name} Collection`:locale==="pl"?`Poznaj MLT ${item.name} Collection`:`Open MLT ${item.name} Collection`}><article className="light-collection-card">
          <picture>
            <source srcSet={item.image.replace(".jpg", ".avif")} type="image/avif" />
            <source srcSet={item.image.replace(".jpg", ".webp")} type="image/webp" />
            <picture><img src={item.image} alt={`MLT ${item.name} Collection`} loading="lazy" decoding="async" draggable="false" /></picture>
          </picture>
          <div className="collection-top"><span>0{(index % collections.length) + 1}</span><small>{localizedItem.eyebrow}</small></div>
          <div className="collection-card-copy"><h3>MLT {item.name}<br /><em>Collection</em></h3><p>{localizedItem.copy}</p><div><span>{locale === "ru" ? item.days.replace("days", "дней") : locale === "de" ? item.days.replace("days", "Tage") : item.days}</span><strong>{localizedItem.rate}</strong></div><span className="collection-cta">{t.details}</span></div>
        </article></a>}}/>
    </section>

    <section className="light-experiences experience-panorama" id="experiences">
      <img className="experience-panorama-image" src="/experience-riviera-panorama.webp" alt="" loading="lazy" decoding="async" />
      <div className="experience-intro" data-home-reveal="left"><p className="light-section-label">03 / {t.nav[1]}</p><h2>{t.reason}</h2><p>{t.reasonCopy}</p><a className="text-button dark" href="#contact">{t.story}</a></div>

    </section>

    <section className="light-map" id="smart-map">
      <div className="smart-map-canvas" data-home-reveal="scale">
        <div className="smart-map-country-tabs" aria-label={locale === "ru" ? "Выбор страны" : "Choose country"}>{["All", "Italy", "Austria", "Germany"].map((item) => <button key={item} className={mapCountry === item ? "active" : ""} onClick={() => setMapCountry(item)}>{locale === "ru" ? ({ All: "Все", Italy: "Италия", Austria: "Австрия", Germany: "Германия" } as Record<string, string>)[item] : locale === "de" && item === "All" ? "Alle" : item}</button>)}</div>
        <a className="smart-map-open" href={localPath("/smart-map/")}>{locale === "ru" ? "Смотреть карту" : locale === "de" ? "Karte ansehen" : locale === "it" ? "Apri la mappa" : locale === "pl" ? "Otwórz mapę" : "View map"}</a>
        <RealRouteMap selected={mapSelection} country={mapCountry} onToggle={toggleMapPoint} locale={locale} className="home-route-map" onDistanceChange={onDistanceChange} />
      </div>
      <div className="map-copy" data-home-reveal="right"><p className="light-section-label">04 / {t.mapLabel}</p><h2>{t.mapTitle}</h2><p>{t.mapCopy}</p><MapSelectionList locale={locale} selected={mapSelection} distance={mapDistance} onToggle={toggleMapPoint}/><a className="bronze-button" href="#collections" onClick={scrollCollectionCarouselIntoView}>{t.choose}</a></div>
    </section>

    <section className="light-quote"><p data-home-reveal="up">“{t.quote}”</p><span data-home-reveal="up">{locale === "ru" ? "MLT — Двигайся. Живи. Путешествуй." : "MLT — Move. Live. Travel."}</span></section>

    <section className="light-contact" id="contact">
      <div data-home-reveal="left"><p className="light-section-label">05 / {t.conversation}</p><h2>{t.contactTitle}</h2></div><div data-home-reveal="right"><p>{t.contactCopy}</p><a className="bronze-button" href={`mailto:${siteIdentity.email}`}>{t.start}</a></div>
    </section>

    <SiteFooter locale={locale} reveal />

  </main>;
}
