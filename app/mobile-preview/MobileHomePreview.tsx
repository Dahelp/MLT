"use client";

import { useEffect, useRef } from "react";
import CollectionCarousel, { scrollCollectionCarouselIntoView } from "../CollectionCarousel";
import RealRouteMap from "../DeferredRouteMap";
import HeroVideo from "../HeroVideo";
import { homeCollectionCards, homeCopy, philosophyImages } from "../../content/home";
import { useMapSelection } from "../useMapSelection";
import { useCatalogItems } from "../../content/catalog-client";
import MobilePreviewHeader from "./MobilePreviewHeader";
import MapSelectionList from "../MapSelectionList";
import MobilePreviewFooter from "./MobilePreviewFooter";
import styles from "./home-preview.module.css";

type Locale = "en" | "de" | "ru" | "it" | "pl";
export default function MobileHomePreview({initialLocale="en",previewMode=true}:{initialLocale?:Locale;previewMode?:boolean}){
 const locale=initialLocale; const { selected, distance, toggle, onDistanceChange: onDistance } = useMapSelection(); const copy=homeCopy[locale]; const t={...copy,level:copy.collectionTitle,map:copy.mapLabel,view:copy.openMap,open:copy.choose,experience:copy.nav[1]};
 const catalog=useCatalogItems(); const collections=homeCollectionCards(locale,catalog);
 const cardCta={en:"EXPLORE COLLECTION",de:"KOLLEKTION ENTDECKEN",ru:"ОТКРЫТЬ КОЛЛЕКЦИЮ",it:"SCOPRI LA COLLEZIONE",pl:"POZNAJ KOLEKCJĘ"}[locale];
 const pageRef=useRef<HTMLElement>(null);
 useEffect(()=>{const root=pageRef.current;if(!root||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const items=Array.from(root.querySelectorAll<HTMLElement>("[data-mobile-reveal]")),initialItems=items.filter(item=>item.getBoundingClientRect().top<window.innerHeight*.94);root.classList.add(styles.revealReady);const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;entry.target.classList.add(styles.visible);observer.unobserve(entry.target)}),{rootMargin:"0px 0px -7% 0px",threshold:.1});items.forEach(item=>{if(!initialItems.includes(item))observer.observe(item)});let revealFrame=0;const prepareFrame=requestAnimationFrame(()=>{revealFrame=requestAnimationFrame(()=>initialItems.forEach(item=>item.classList.add(styles.visible)))});return()=>{cancelAnimationFrame(prepareFrame);cancelAnimationFrame(revealFrame);observer.disconnect();root.classList.remove(styles.revealReady)}},[]);
 return <main ref={pageRef} className={styles.stage}><div className={styles.phone}>
  <MobilePreviewHeader locale={locale} previewMode={previewMode}/><section className={`${styles.hero} ${styles.videoHero}`}><HeroVideo locale={locale} /><div className={`${styles.heroCopy} ${styles.heroEnter} mlt-hero-reveal`}><h1>{({en:"Individual Motorhome Expeditions",de:"Individuelle Wohnmobil-Expeditionen",ru:"Индивидуальные экспедиции на автодомах",it:"Spedizioni individuali in motorhome",pl:"Indywidualne wyprawy kamperem"})[locale]}</h1><span>{t.hero}</span><a href="#collections" onClick={scrollCollectionCarouselIntoView}>{t.choose}</a></div></section>
  <section className={styles.section}><label data-mobile-reveal="up">01 / {t.philosophy}</label><h1 data-mobile-reveal="up">{t.freedom}</h1><p className={styles.lead} data-mobile-reveal="up">{t.freedomCopy}</p><div className={styles.pillars}>{t.pillars.map((x,i)=><article key={x} data-mobile-reveal="up"><img src={philosophyImages[i]} alt="" loading="lazy" decoding="async"/><h3>{x}</h3></article>)}</div></section>
  <section className={styles.section} id="collections"><label>02 / {t.ways}</label><h2>{t.level}</h2><p className={styles.lead}>{t.collectionCopy}</p><CollectionCarousel locale={locale} items={collections} shellClassName={styles.railWrap} carouselClassName={styles.slider} slideClassName={styles.slide} arrowClassName={styles.sliderArrow} renderSlide={(c,i)=><a draggable={false} href={previewMode?`/${locale}/collections/${c.id}/mobile-preview/`:`/${locale}/collections/${c.id}/`}><img src={c.image} alt="" draggable="false"/><div><small>0{(i%collections.length)+1}</small><h3>MLT {c.name}<em>Collection</em></h3><p>{c.days} · {c.rate}</p><b>{cardCta}</b></div></a>}/></section>
  <section className={styles.experiencePanorama} id="experiences"><img className={styles.experiencePanoramaImage} src="/experience-riviera-panorama.webp" alt="" loading="lazy" decoding="async"/><div className={styles.experiencePanoramaCopy}><label>03 / {t.experience}</label><h2>{t.reason}</h2><p>{t.reasonCopy}</p><a href="#contact">{({en:"Find your story",de:"Ihre Geschichte finden",ru:"Найти свою историю",it:"Trova la tua storia",pl:"Znajdź swoją historię"})[locale]}</a></div></section>
  <section className={`${styles.section} ${styles.mapSection}`} id="map"><label data-mobile-reveal="up">04 / {t.map}</label><h2 data-mobile-reveal="up">{t.mapTitle}</h2><p className={styles.lead} data-mobile-reveal="up">{t.mapCopy}</p><div className={styles.mapBox} data-mobile-reveal="scale"><a href={`/${locale}/smart-map/`}>{t.view}</a><RealRouteMap selected={selected} country="All" onToggle={toggle} locale={locale} className={styles.map} onDistanceChange={onDistance}/></div><MapSelectionList locale={locale} selected={selected} distance={distance} onToggle={toggle} variant="mobile" className={styles.selection} itemClassName={styles.selectedPlace}/><a className={styles.finalButton} data-mobile-reveal="up" href="#collections" onClick={scrollCollectionCarouselIntoView}>{t.open}</a></section>
  <div id="contact"/><MobilePreviewFooter locale={locale} previewMode={previewMode}/>
 </div></main>
}
