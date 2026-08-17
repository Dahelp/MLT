"use client";

import { useEffect, useRef, useState } from "react";
import { Swiper as SwiperCarousel, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";
import { EffectCoverflow, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";

type SiteLocale = "en" | "de" | "ru";

const collections = [
  { id: "freedom", name: "Freedom", image: "/collection-freedom.jpg", eyebrow: "Self-directed discovery", copy: "A fully equipped premium motorhome, a curated map and the freedom to follow your own rhythm.", rate: "From €150 / day", days: "7–30 days" },
  { id: "signature", name: "Signature", image: "/collection-signature.jpg", eyebrow: "Curated end to end", copy: "A personal route, reserved stays and remarkable roads — every essential detail already considered.", rate: "From €250 / day", days: "7–14 days" },
  { id: "concierge", name: "Concierge", image: "/collection-concierge.jpg", eyebrow: "Always one step ahead", copy: "Your journey, supported by a dedicated MLT concierge, available around the clock.", rate: "From €450 / day", days: "7–14 days" },
  { id: "private", name: "Private", image: "/collection-private.jpg", eyebrow: "A private world in motion", copy: "A five-star travelling residence with driver, private team and service shaped entirely around you.", rate: "From €2,000 / day", days: "7–21 days" },
  { id: "proposal", name: "Proposal", image: "/collection-proposal.jpg", eyebrow: "The art of saying yes", copy: "A private European route and a complete proposal scenario — location, creative team and every detail handled by MLT.", rate: "Tailored proposal", days: "3–7 days" },
] as const;

const carouselCopies = 9;
const carouselMiddleStart = collections.length * Math.floor(carouselCopies / 2);
const carouselCollections = Array.from({ length: carouselCopies }, () => collections).flat();

const experiences = [
  ["01", "Family expedition", "Routes created around wonder — lakes, mountains, castles and unhurried evenings."],
  ["02", "Romantic escape", "Sunset roads, private dinners and a horizon that belongs only to you."],
  ["03", "Wine journey", "Private vineyards, meetings with winemakers and the finest roads between them."],
  ["04", "CEO escape", "No inbox. No schedule. Just quiet roads, mountains and room to think again."],
] as const;

const copy = {
  en: {
    nav: ["Collections", "Experiences", "Smart Map", "About"], concierge: "Talk to a concierge", eyebrow: "Individual road expeditions", titleA: "We don’t rent", titleB: "motorhomes.", hero: "We create moments that stay with you forever — through Europe’s most remarkable landscapes, with every detail considered.", choose: "Choose a collection", route: "Create your route", film: "Watch the film", scroll: "Discover MLT", philosophy: "The MLT philosophy", freedom: "Freedom, already taken care of.", freedomCopy: "Most companies sell you the freedom to do everything yourself. We create the freedom to simply live the moment. No planning. No stress. Only the road, the view and the people you love.", pillars: ["Curated routes, not maps", "A personal concierge, not a call centre", "Memories, not itineraries"], ways: "Four ways to travel", collectionTitle: "One standard. Your level of freedom.", collectionCopy: "Every MLT collection is a complete journey, shaped around the way you want to move.", details: "Explore collection", reason: "Every journey begins with a reason.", reasonCopy: "People do not buy a motorhome. They choose the story they will still be telling ten years from now.", story: "Find your story", mapLabel: "MLT Smart Map", mapTitle: "Remarkable places. One intelligent route.", mapCopy: "Explore curated campsites, vineyards, lakes, mountain passes and quiet coastlines. Choose what calls to you; MLT will compose the journey between them.", openMap: "Open the map", quote: "The most valuable memories cannot be bought. They can only be lived.", conversation: "A private conversation", contactTitle: "Your journey begins here.", contactCopy: "Tell us what you are imagining. Your MLT concierge will return with a considered first proposal.", start: "Start a conversation", footer: "Individual road expeditions across Europe" },
  de: {
    nav: ["Kollektionen", "Erlebnisse", "Smart Map", "Über MLT"], concierge: "Concierge kontaktieren", eyebrow: "Individuelle Straßenexpeditionen", titleA: "Wir vermieten keine", titleB: "Reisemobile.", hero: "Wir schaffen Momente, die für immer bleiben — in Europas außergewöhnlichsten Landschaften und bis ins Detail durchdacht.", choose: "Kollektion wählen", route: "Route gestalten", film: "Film ansehen", scroll: "MLT entdecken", philosophy: "Die MLT Philosophie", freedom: "Freiheit, um die sich bereits jemand gekümmert hat.", freedomCopy: "Die meisten Unternehmen verkaufen Ihnen die Freiheit, alles selbst zu tun. Wir schaffen die Freiheit, den Moment einfach zu leben. Keine Planung. Kein Stress. Nur die Straße, die Aussicht und die Menschen, die Sie lieben.", pillars: ["Kuratierte Routen statt Karten", "Persönlicher Concierge statt Callcenter", "Erinnerungen statt Reisepläne"], ways: "Vier Arten zu reisen", collectionTitle: "Ein Standard. Ihre Freiheit.", collectionCopy: "Jede MLT Kollektion ist eine vollständige Reise — abgestimmt auf die Art, wie Sie sich bewegen möchten.", details: "Kollektion entdecken", reason: "Jede Reise beginnt mit einem Grund.", reasonCopy: "Menschen kaufen kein Reisemobil. Sie wählen die Geschichte, die sie noch in zehn Jahren erzählen werden.", story: "Ihre Geschichte finden", mapLabel: "MLT Smart Map", mapTitle: "Besondere Orte. Eine intelligente Route.", mapCopy: "Entdecken Sie kuratierte Stellplätze, Weingüter, Seen, Bergpässe und stille Küsten. Sie wählen, was Sie bewegt; MLT komponiert die Reise dazwischen.", openMap: "Karte öffnen", quote: "Die wertvollsten Erinnerungen kann man nicht kaufen. Man kann sie nur erleben.", conversation: "Ein privates Gespräch", contactTitle: "Ihre Reise beginnt hier.", contactCopy: "Erzählen Sie uns, was Sie sich vorstellen. Ihr MLT Concierge meldet sich mit einem sorgfältig ausgearbeiteten ersten Vorschlag.", start: "Gespräch beginnen", footer: "Individuelle Straßenexpeditionen durch Europa" },
  ru: {
    nav: ["Коллекции", "Сценарии", "Smart Map", "О компании"], concierge: "Связаться с консьержем", eyebrow: "Индивидуальные автомобильные экспедиции", titleA: "Мы не сдаем автодома.", titleB: "Мы создаем моменты, которые остаются с вами навсегда.", hero: "MLT — это премиальные решения для жизни, работы и путешествий. От мобильных экспедиций до капсульных пространств. Объединяет одно — безупречное качество и философия свободы.", choose: "Выбрать коллекцию", route: "Создать маршрут", film: "Чат", scroll: "Открыть MLT", philosophy: "Философия MLT", freedom: "Свобода, о которой уже позаботились.", freedomCopy: "Большинство компаний продают вам свободу делать всё самим. Мы создаём свободу просто жить моментом. Без планирования. Без стресса.", pillars: ["Курированные маршруты, а не карты", "Персональный консьерж, а не колл-центр", "Воспоминания, а не планы"], ways: "Четыре способа путешествовать", collectionTitle: "Один стандарт. Ваш уровень свободы.", collectionCopy: "Каждая коллекция MLT — это целостное путешествие, созданное вокруг вас.", details: "Подробнее", reason: "Каждое путешествие начинается с причины.", reasonCopy: "Люди выбирают историю, которую будут рассказывать через десять лет.", story: "Найти свою историю", mapLabel: "MLT Smart Map", mapTitle: "Особенные места. Один умный маршрут.", mapCopy: "Исследуйте виноградники, озёра, горные перевалы и тихие побережья. MLT соединит их в ваше путешествие.", openMap: "Открыть карту", quote: "Самые дорогие воспоминания нельзя купить. Их можно только пережить.", conversation: "Личный разговор", contactTitle: "Ваше путешествие начинается здесь.", contactCopy: "Расскажите, каким вы представляете своё путешествие. Консьерж MLT подготовит первое предложение.", start: "Начать разговор", footer: "Индивидуальные автомобильные экспедиции по Европе" },
} as const;

export default function Home() {
  const [locale, setLocale] = useState<SiteLocale>("en");
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeCollection, setActiveCollection] = useState(4);
  const carousel = useRef<SwiperInstance | null>(null);
  const t = copy[locale];

  useEffect(() => {
    const saved = localStorage.getItem("mlt-locale");
    if (saved === "de" || saved === "en" || saved === "ru") setLocale(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setChatOpen(false);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("keydown", close); document.body.style.overflow = ""; };
  }, [locale]);

  const changeLocale = (next: SiteLocale) => { setLocale(next); localStorage.setItem("mlt-locale", next); };
  return <main className="home-light">
    <header className="light-nav">
      <a className="light-brand" href="#top" aria-label="MLT home"><img src="/mlt-logo-bronze.png" alt="MLT — Move. Live. Travel." /></a>
      <nav className={menuOpen ? "light-links open" : "light-links"} aria-label="Primary navigation">
        <a href="#collections" onClick={() => setMenuOpen(false)}>{t.nav[0]}</a>
        <a href="#experiences" onClick={() => setMenuOpen(false)}>{t.nav[1]}</a>
        <a href="#smart-map" onClick={() => setMenuOpen(false)}>{t.nav[2]}</a>
        <a href="#about" onClick={() => setMenuOpen(false)}>{t.nav[3]}</a>
      </nav>
      <div className="light-actions">
        <div className="light-language" aria-label="Language"><button className={locale === "en" ? "active" : ""} onClick={() => changeLocale("en")}>EN</button><button className={locale === "de" ? "active" : ""} onClick={() => changeLocale("de")}>DE</button><button className={locale === "ru" ? "active" : ""} onClick={() => changeLocale("ru")}>RU</button></div>
        <a className="nav-concierge" href="#contact">{t.concierge}</a>
        <button className="light-menu" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Toggle menu"><span /><span /></button>
      </div>
    </header>

    <section className="light-hero" id="top">
      <img className="light-hero-image" src="/hero-coast-motorhome.jpg" alt="MLT motorhome overlooking the Mediterranean coast at sunset" />
      <div className="light-hero-wash" />
      <div className="light-hero-copy">
        <p className="light-eyebrow"><span />{t.eyebrow}</p>
        <h1 className={locale === "ru" ? "hero-title-ru" : undefined}>{t.titleA}<br /><em>{t.titleB}</em></h1>
        <p>{t.hero}</p>
        <div className="light-hero-buttons"><a className="bronze-button" href="#collections">{t.choose}<span>↗</span></a><a className="text-button" href="/plan">{t.route}<span>→</span></a></div>
      </div>
      <button className="light-chat" onClick={() => setChatOpen(!chatOpen)} aria-expanded={chatOpen} aria-label={locale === "ru" ? "Открыть чат" : "Open concierge chat"}><span className="chat-icon"><i /><i /><i /></span><b>{locale === "ru" ? "Чат" : locale === "de" ? "Chat" : "Chat"}</b></button>
      {chatOpen && <aside className="hero-chat-panel"><button className="chat-close" onClick={() => setChatOpen(false)} aria-label="Close chat">×</button><small>MLT Concierge</small><strong>{locale === "ru" ? "Давайте обсудим ваше путешествие" : locale === "de" ? "Lassen Sie uns Ihre Reise besprechen" : "Let’s discuss your journey"}</strong><p>{locale === "ru" ? "Ответим и поможем выбрать коллекцию." : "A personal MLT concierge will help you choose the right collection."}</p><a href="mailto:concierge@mlt-travel.com">{locale === "ru" ? "Написать консьержу" : "Message the concierge"}<span>↗</span></a></aside>}
      <a className="light-scroll" href="#about"><span>{t.scroll}</span><i>↓</i></a>
    </section>

    <section className="light-philosophy" id="about">
      <p className="light-section-label">01 / {t.philosophy}</p>
      <div className="philosophy-grid"><h2>{t.freedom}</h2><p>{t.freedomCopy}</p></div>
      <div className="value-row">{t.pillars.map((item, index) => <article key={item}><span>0{index + 1}</span><h3>{item}</h3></article>)}</div>
    </section>

    <section className="light-collections" id="collections">
      <div className="light-section-head"><div><p className="light-section-label">02 / {locale === "ru" ? "Пять способов путешествовать" : locale === "de" ? "Fünf Arten zu reisen" : "Five ways to travel"}</p><h2>{t.collectionTitle}</h2></div><div><p>{t.collectionCopy}</p><div className="rail-controls"><button onClick={() => carousel.current?.slidePrev()} aria-label="Previous collection">←</button><span>{String(activeCollection + 1).padStart(2, "0")} / {String(collections.length).padStart(2, "0")}</span><button onClick={() => carousel.current?.slideNext()} aria-label="Next collection">→</button></div></div></div>
      <SwiperCarousel className="collection-rail" modules={[EffectCoverflow, Keyboard]} effect="coverflow" initialSlide={carouselMiddleStart + 4} centeredSlides centeredSlidesBounds={false} slidesPerView="auto" speed={850} grabCursor keyboard={{ enabled: true }} coverflowEffect={{ rotate: 0, stretch: 22, depth: 145, modifier: 1, slideShadows: false }} onSwiper={(instance) => { carousel.current = instance; setActiveCollection(instance.activeIndex % collections.length); }} onSlideChange={(instance) => setActiveCollection(instance.activeIndex % collections.length)} onSlideChangeTransitionEnd={(instance) => { if (instance.activeIndex < collections.length * 2 || instance.activeIndex >= collections.length * (carouselCopies - 2)) instance.slideTo(carouselMiddleStart + (instance.activeIndex % collections.length), 0, false); }} aria-label="MLT collections">
        {carouselCollections.map((item, index) => <SwiperSlide className="collection-slide" key={`${item.id}-${index}`}><a className="collection-card-link" href={`/collections/${item.id}`} aria-label={`Open MLT ${item.name} Collection`}><article className="light-collection-card">
          <img src={item.image} alt={`MLT ${item.name} Collection`} loading="eager" />
          <div className="collection-shade" />
          <div className="collection-top"><span>0{(index % collections.length) + 1}</span><small>{item.eyebrow}</small></div>
          <div className="collection-card-copy"><h3>MLT {item.name}<br /><em>Collection</em></h3><p>{item.copy}</p><div><span>{item.days}</span><strong>{item.rate}</strong></div><span className="collection-cta">{t.details}<span>↗</span></span></div>
        </article></a></SwiperSlide>)}
      </SwiperCarousel>
    </section>

    <section className="light-experiences" id="experiences">
      <div className="experience-intro"><p className="light-section-label">03 / Experiences</p><h2>{t.reason}</h2><p>{t.reasonCopy}</p><a className="text-button dark" href="#contact">{t.story}<span>→</span></a></div>
      <div className="experience-list">{experiences.map(([number, title, body]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{body}</p></div><i>↗</i></article>)}</div>
    </section>

    <section className="light-map" id="smart-map">
      <div className="map-photo"><img src="/collection-signature.jpg" alt="An MLT route through the Amalfi coast" /><div className="map-route-art"><span className="point one" /><span className="point two" /><span className="point three" /><i /></div></div>
      <div className="map-copy"><p className="light-section-label">04 / {t.mapLabel}</p><h2>{t.mapTitle}</h2><p>{t.mapCopy}</p><div className="map-stats"><div><strong>30+</strong><span>curated places</span></div><div><strong>3</strong><span>countries at launch</span></div></div><a className="bronze-button" href="/plan">{t.openMap}<span>↗</span></a></div>
    </section>

    <section className="light-quote"><p>“{t.quote}”</p><span>MLT — Move. Live. Travel.</span></section>

    <section className="light-contact" id="contact">
      <div><p className="light-section-label">05 / {t.conversation}</p><h2>{t.contactTitle}</h2></div><div><p>{t.contactCopy}</p><a className="bronze-button" href="mailto:concierge@mlt-travel.com">{t.start}<span>↗</span></a></div>
    </section>

    <footer className="light-footer"><div className="light-footer-logo"><img src="/mlt-logo-bronze.png" alt="MLT" /><p>{t.footer}</p></div><div><strong>Explore</strong><a href="#collections">{t.nav[0]}</a><a href="#experiences">{t.nav[1]}</a><a href="/plan">{t.nav[2]}</a></div><div><strong>Legal</strong><a href="/legal/imprint">Impressum</a><a href="/legal/privacy">Datenschutz</a><a href="/legal/terms">AGB</a></div><div><strong>Contact</strong><a href="mailto:concierge@mlt-travel.com">concierge@mlt-travel.com</a><a href="tel:+4917632523799">+49 176 325 23 799</a></div><small>© 2026 MLT Maschinenhandel GmbH Import-Export</small></footer>

  </main>;
}
