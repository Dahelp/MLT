"use client";

import { useEffect, useState, type MouseEvent } from "react";
import RealRouteMap from "./plan/RealRouteMap";
import { mapPoints } from "../content/mlt";
import { LanguageMenu } from "./LanguageMenu";
import CollectionCarousel, { scrollCollectionCarouselIntoView } from "./CollectionCarousel";

type SiteLocale = "en" | "de" | "ru";

const collections = [
  { id: "freedom", name: "Freedom", image: "/collection-freedom-carousel-v2.jpg", eyebrow: "Self-directed discovery", copy: "A fully equipped premium motorhome, a curated map and the freedom to follow your own rhythm.", rate: "From €1,490 for 7 days", days: "7–30 days" },
  { id: "signature", name: "Signature", image: "/collection-signature-carousel-v2.jpg", eyebrow: "Curated end to end", copy: "A personal route, reserved stays and remarkable roads — every essential detail already considered.", rate: "From €2,490 for 7 days", days: "7–14 days" },
  { id: "concierge", name: "Concierge", image: "/collection-concierge-carousel-v2.jpg", eyebrow: "Always one step ahead", copy: "Your journey, supported by a dedicated MLT concierge, available around the clock.", rate: "From €4,990 for 7 days", days: "7–14 days" },
  { id: "private", name: "Private", image: "/collection-private-carousel-v2.jpg", eyebrow: "A private world in motion", copy: "A five-star travelling residence with driver, private team and service shaped entirely around you.", rate: "From €19,900 for 7 days", days: "7–21 days" },
  { id: "honeymoon", name: "Honeymoon", image: "/collection-honeymoon-carousel-v2.jpg", eyebrow: "A private journey for two", copy: "Romantic roads, private stays and beautiful moments composed entirely around the two of you.", rate: "From €5,900 for 7 days", days: "7–14 days" },
] as const;

// Keep enough real slides around the active card to fill wide screens in both
// directions. Swiper still owns the loop; unlike the old implementation there
// is no transition-end recentering, so dragging remains stable.
const experiences = [
  ["01", "Family expedition", "Routes created around wonder — lakes, mountains, castles and unhurried evenings."],
  ["02", "Romantic escape", "Sunset roads, private dinners and a horizon that belongs only to you."],
  ["03", "Wine journey", "Private vineyards, meetings with winemakers and the finest roads between them."],
  ["04", "CEO escape", "No inbox. No schedule. Just quiet roads, mountains and room to think again."],
] as const;

const russianCollections = [
  { eyebrow: "Самостоятельные открытия", copy: "Полностью оборудованный премиальный автодом, продуманная карта и свобода следовать собственному ритму.", rate: "От €1 490 за 7 дней" },
  { eyebrow: "Продумано от начала до конца", copy: "Персональный маршрут, забронированные места и удивительные дороги — каждая важная деталь уже учтена.", rate: "От €2 490 за 7 дней" },
  { eyebrow: "Всегда на шаг впереди", copy: "Ваше путешествие с личным консьержем MLT, который доступен круглосуточно.", rate: "От €4 990 за 7 дней" },
  { eyebrow: "Личный мир в движении", copy: "Пятизвёздочная резиденция на колёсах с водителем, персональной командой и сервисом, полностью созданным для вас.", rate: "От €19 900 за 7 дней" },
  { eyebrow: "Личное путешествие для двоих", copy: "Романтические дороги, приватные стоянки и прекрасные моменты, созданные только для вас двоих.", rate: "От €5 900 за 7 дней" },
] as const;

const germanCollections = [
  { eyebrow: "Selbstbestimmt entdecken", copy: "Ein vollständig ausgestattetes Premium-Reisemobil, eine kuratierte Karte und die Freiheit, dem eigenen Rhythmus zu folgen.", rate: "Ab 1.490 € für 7 Tage" },
  { eyebrow: "Von Anfang bis Ende kuratiert", copy: "Eine persönliche Route, reservierte Stellplätze und besondere Straßen — alle wichtigen Details sind vorbereitet.", rate: "Ab 2.490 € für 7 Tage" },
  { eyebrow: "Immer einen Schritt voraus", copy: "Ihre Reise mit einem persönlichen MLT Concierge, der rund um die Uhr erreichbar ist.", rate: "Ab 4.990 € für 7 Tage" },
  { eyebrow: "Eine private Welt in Bewegung", copy: "Eine Fünf-Sterne-Residenz auf Rädern mit Fahrer, privatem Team und vollständig persönlichem Service.", rate: "Ab 19.900 € für 7 Tage" },
  { eyebrow: "Eine private Reise zu zweit", copy: "Romantische Straßen, private Stellplätze und besondere Momente — nur für Sie beide komponiert.", rate: "Ab 5.900 € für 7 Tage" },
] as const;

const russianExperiences = [
  ["01", "Семейная экспедиция", "Маршруты, созданные для открытий: озёра, горы, замки и неспешные вечера."],
  ["02", "Романтическое путешествие", "Закатные дороги, приватные ужины и горизонт, который принадлежит только вам."],
  ["03", "Винное путешествие", "Частные виноградники, встречи с виноделами и лучшие дороги между ними."],
  ["04", "Перезагрузка руководителя", "Без почты и расписания. Только тихие дороги, горы и пространство, чтобы снова ясно мыслить."],
] as const;

const copy = {
  en: {
    nav: ["Collections", "Experiences", "Smart Map", "About"], concierge: "Talk to a concierge", eyebrow: "Individual road expeditions", titleA: "We don’t rent", titleB: "motorhomes.", hero: "We create moments that stay with you forever – through Europe’s most remarkable landscapes, with every detail considered.", choose: "Choose a collection", route: "Create your route", film: "Watch the film", scroll: "Discover MLT", philosophy: "The MLT philosophy", freedom: "Freedom, already taken care of.", freedomCopy: "Most companies sell you the freedom to do everything yourself. We create the freedom to simply live the moment. No planning. No stress. Only the road, the view and the people you love.", pillars: ["Curated routes, not maps", "A personal concierge, not a call centre", "Memories, not itineraries"], ways: "Four ways to travel", collectionTitle: "One standard. Your level of freedom.", collectionCopy: "Every MLT collection is a complete journey, shaped around the way you want to move.", details: "Explore collection", reason: "Every journey begins with a reason.", reasonCopy: "People do not buy a motorhome. They choose the story they will still be telling ten years from now.", story: "Find your story", mapLabel: "MLT Smart Map", mapTitle: "Remarkable places. One intelligent route.", mapCopy: "Explore curated campsites, vineyards, lakes, mountain passes and quiet coastlines. Choose what calls to you; MLT will compose the journey between them.", openMap: "Open the map", quote: "The most valuable memories cannot be bought. They can only be lived.", conversation: "A private conversation", contactTitle: "Your journey begins here.", contactCopy: "Tell us what you are imagining. Your MLT concierge will return with a considered first proposal.", start: "Start a conversation", footer: "Individual road expeditions across Europe" },
  de: {
    nav: ["Kollektionen", "Erlebnisse", "Smart Map", "Über MLT"], concierge: "Concierge kontaktieren", eyebrow: "Individuelle Straßenexpeditionen", titleA: "Wir vermieten keine", titleB: "Reisemobile.", hero: "Wir schaffen Momente, die für immer bleiben — in Europas außergewöhnlichsten Landschaften und bis ins Detail durchdacht.", choose: "Kollektion wählen", route: "Route gestalten", film: "Film ansehen", scroll: "MLT entdecken", philosophy: "Die MLT Philosophie", freedom: "Freiheit, um die sich bereits jemand gekümmert hat.", freedomCopy: "Die meisten Unternehmen verkaufen Ihnen die Freiheit, alles selbst zu tun. Wir schaffen die Freiheit, den Moment einfach zu leben. Keine Planung. Kein Stress. Nur die Straße, die Aussicht und die Menschen, die Sie lieben.", pillars: ["Kuratierte Routen statt Karten", "Persönlicher Concierge statt Callcenter", "Erinnerungen statt Reisepläne"], ways: "Vier Arten zu reisen", collectionTitle: "Ein Standard. Ihre Freiheit.", collectionCopy: "Jede MLT Kollektion ist eine vollständige Reise — abgestimmt auf die Art, wie Sie sich bewegen möchten.", details: "Kollektion entdecken", reason: "Jede Reise beginnt mit einem Grund.", reasonCopy: "Menschen kaufen kein Reisemobil. Sie wählen die Geschichte, die sie noch in zehn Jahren erzählen werden.", story: "Ihre Geschichte finden", mapLabel: "MLT Smart Map", mapTitle: "Besondere Orte. Eine intelligente Route.", mapCopy: "Entdecken Sie kuratierte Stellplätze, Weingüter, Seen, Bergpässe und stille Küsten. Sie wählen, was Sie bewegt; MLT komponiert die Reise dazwischen.", openMap: "Karte öffnen", quote: "Die wertvollsten Erinnerungen kann man nicht kaufen. Man kann sie nur erleben.", conversation: "Ein privates Gespräch", contactTitle: "Ihre Reise beginnt hier.", contactCopy: "Erzählen Sie uns, was Sie sich vorstellen. Ihr MLT Concierge meldet sich mit einem sorgfältig ausgearbeiteten ersten Vorschlag.", start: "Gespräch beginnen", footer: "Individuelle Straßenexpeditionen durch Europa" },
  ru: {
    nav: ["Коллекции", "Впечатления", "Умная карта", "О MLT"], concierge: "Связаться с консьержем", eyebrow: "Индивидуальные автомобильные экспедиции", titleA: "", titleB: "", hero: "Мы создаём моменты, которые остаются с вами навсегда — среди самых удивительных пейзажей Европы, с вниманием к каждой детали.", choose: "Выбрать коллекцию", route: "Создать маршрут", film: "Смотреть фильм", scroll: "Открыть MLT", philosophy: "Философия MLT", freedom: "Свобода, о которой уже позаботились.", freedomCopy: "Большинство компаний продают вам свободу делать всё самим. Мы создаём свободу просто жить моментом. Без планирования. Без стресса. Только дорога, вид и люди, которых вы любите.", pillars: ["Курированные маршруты, а не карты", "Персональный консьерж, а не колл-центр", "Воспоминания, а не планы поездки"], ways: "Четыре способа путешествовать", collectionTitle: "Один стандарт. Ваш уровень свободы.", collectionCopy: "Каждая коллекция MLT — это целостное путешествие, созданное вокруг того, как вы хотите двигаться.", details: "Открыть коллекцию", reason: "Каждое путешествие начинается с причины.", reasonCopy: "Люди не покупают автодом. Они выбирают историю, которую будут рассказывать и через десять лет.", story: "Найти свою историю", mapLabel: "Умная карта MLT", mapTitle: "Особенные места. Один умный маршрут.", mapCopy: "Исследуйте отобранные кемпинги, виноградники, озёра, горные перевалы и тихие побережья. Выбирайте то, что откликается вам; MLT составит путешествие между этими точками.", openMap: "Открыть карту", quote: "Самые ценные воспоминания нельзя купить. Их можно только пережить.", conversation: "Личный разговор", contactTitle: "Ваше путешествие начинается здесь.", contactCopy: "Расскажите, каким вы видите своё путешествие. Консьерж MLT вернётся с продуманным первым предложением.", start: "Начать разговор", footer: "Индивидуальные автомобильные экспедиции по Европе" },
} as const;

export default function Home({ initialLocale }: { initialLocale: SiteLocale }) {
  const [locale, setLocale] = useState<SiteLocale>(initialLocale);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [mapCountry, setMapCountry] = useState("All");
  const [mapSelection, setMapSelection] = useState<string[]>(["dolomites", "como"]);
  const t = copy[locale];
  const localizedExperiences = locale === "ru" ? russianExperiences : experiences;

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem("mlt-locale", locale);
    const close = (event: KeyboardEvent) => event.key === "Escape" && setChatOpen(false);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("keydown", close); document.body.style.overflow = ""; };
  }, [locale]);

  const localPath = (path: string) => `/${locale}${path}`;
  const toggleMapPoint = (id: string) => setMapSelection((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const scrollToSection = (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    event.preventDefault();
    setMenuOpen(false);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `${location.pathname}${location.search}`);
    event.currentTarget.blur();
  };
  const changeLocale = (next: SiteLocale) => {
    localStorage.setItem("mlt-locale", next);
    window.location.assign(`/${next}/${window.location.hash}`);
  };
  return <main className="home-light">
    <header className="light-nav">
      <a className="light-brand" href="#top" aria-label="MLT home"><img src="/mlt-logo.svg" alt="MLT — Move. Live. Travel." /></a>
      <nav className={menuOpen ? "light-links open" : "light-links"} aria-label="Primary navigation">
        <a href="#collections" onClick={(event) => scrollToSection(event, "collections")}>{t.nav[0]}</a>
        <a href="#experiences" onClick={(event) => scrollToSection(event, "experiences")}>{t.nav[1]}</a>
        <a href="#smart-map" onClick={(event) => scrollToSection(event, "smart-map")}>{t.nav[2]}</a>
        <a href="#about" onClick={(event) => scrollToSection(event, "about")}>{t.nav[3]}</a>
      </nav>
      <div className="light-actions">
        <LanguageMenu locale={locale} onChange={changeLocale} /><a className="account-nav-link" href={localPath("/account")} aria-label={locale === "ru" ? "Личный кабинет" : "My account"}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c.8-3.7 3.3-5.5 7.5-5.5s6.7 1.8 7.5 5.5" /></svg></a>
        <button className="light-menu" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Toggle menu"><span /><span /></button>
      </div>
    </header>

    <section className="light-hero" id="top">
      <picture>
        <source srcSet="/hero-mediterranean-sunset.avif" type="image/avif" />
        <source srcSet="/hero-mediterranean-sunset.webp" type="image/webp" />
        <img className="light-hero-image" src="/hero-mediterranean-sunset.jpg" alt="MLT motorhome overlooking the Mediterranean coast at sunset" fetchPriority="high" decoding="async" />
      </picture>
      <div className="light-hero-wash" />
      <div className="light-hero-copy">
        <p className="light-eyebrow"><span />{t.eyebrow}</p>
        <p>{t.hero}</p>
        <div className="light-hero-buttons"><a className="bronze-button hero-collection-button" href="#collections" onClick={scrollCollectionCarouselIntoView}>{t.choose}</a></div>
      </div>
      <div className="hero-bottom-bar">
        <a className="light-scroll" href="#about"><span>{t.scroll}</span><i>↓</i></a>
        <button className="light-chat" onClick={() => setChatOpen(!chatOpen)} aria-expanded={chatOpen} aria-label={locale === "ru" ? "Открыть чат" : "Open concierge chat"}><b>{locale === "ru" ? "Чат" : "Chat"}</b><span className="chat-icon"><i /><i /><i /></span></button>
      </div>
      {chatOpen && <aside className="hero-chat-panel"><button className="chat-close" onClick={() => setChatOpen(false)} aria-label={locale === "ru" ? "Закрыть чат" : "Close chat"}>×</button><small>{locale === "ru" ? "Консьерж MLT" : "MLT Concierge"}</small><strong>{locale === "ru" ? "Давайте обсудим ваше путешествие" : locale === "de" ? "Lassen Sie uns Ihre Reise besprechen" : "Let’s discuss your journey"}</strong><p>{locale === "ru" ? "Ответим и поможем выбрать коллекцию." : "A personal MLT concierge will help you choose the right collection."}</p><a href="mailto:concierge@mlt-travel.com">{locale === "ru" ? "Написать консьержу" : "Message the concierge"}<span>↗</span></a></aside>}
    </section>

    <section className="light-philosophy" id="about">
      <p className="light-section-label">01 / {t.philosophy}</p>
      <div className="philosophy-grid"><h2>{t.freedom}</h2><p>{t.freedomCopy}</p></div>
      <div className="value-row">{t.pillars.map((item, index) => <article key={item}><span>0{index + 1}</span><h3>{item}</h3></article>)}</div>
    </section>

    <section className="light-collections" id="collections">
      <div className="light-section-head"><div><p className="light-section-label">02 / {locale === "ru" ? "Пять способов путешествовать" : locale === "de" ? "Fünf Arten zu reisen" : "Five ways to travel"}</p><h2>{t.collectionTitle}</h2></div><div><p>{t.collectionCopy}</p></div></div>
      <CollectionCarousel items={collections} shellClassName="collection-rail-shell" carouselClassName="collection-rail" slideClassName="collection-slide" arrowClassName="carousel-side-arrow" prevClassName="carousel-side-arrow-prev" nextClassName="carousel-side-arrow-next" renderSlide={(item,index)=>{const localizedItem=locale==="ru"?russianCollections[index%collections.length]:locale==="de"?germanCollections[index%collections.length]:item;return <a className="collection-card-link" href={localPath(`/collections/${item.id}`)} aria-label={locale==="ru"?`Открыть MLT ${item.name} Collection`:locale==="de"?`MLT ${item.name} Collection öffnen`:`Open MLT ${item.name} Collection`}><article className="light-collection-card">
          <picture>
            <source srcSet={item.image.replace(".jpg", ".avif")} type="image/avif" />
            <source srcSet={item.image.replace(".jpg", ".webp")} type="image/webp" />
            <picture><img src={item.image} alt={`MLT ${item.name} Collection`} loading="lazy" decoding="async" draggable="false" /></picture>
          </picture>
          <div className="collection-top"><span>0{(index % collections.length) + 1}</span><small>{localizedItem.eyebrow}</small></div>
          <div className="collection-card-copy"><h3>MLT {item.name}<br /><em>Collection</em></h3><p>{localizedItem.copy}</p><div><span>{locale === "ru" ? item.days.replace("days", "дней") : locale === "de" ? item.days.replace("days", "Tage") : item.days}</span><strong>{localizedItem.rate}</strong></div><span className="collection-cta">{t.details}<span>↗</span></span></div>
        </article></a>}}/>
    </section>

    <section className="light-experiences" id="experiences">
      <div className="experience-intro"><p className="light-section-label">03 / {locale === "ru" ? "Сценарии" : "Experiences"}</p><h2>{t.reason}</h2><p>{t.reasonCopy}</p><a className="text-button dark" href="#contact">{t.story}<span>→</span></a></div>
      <div className="experience-list">{localizedExperiences.map(([number, title, body]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{body}</p></div><i>↗</i></article>)}</div>
    </section>

    <section className="light-map" id="smart-map">
      <div className="smart-map-canvas">
        <div className="smart-map-country-tabs" aria-label={locale === "ru" ? "Выбор страны" : "Choose country"}>{["All", "Italy", "Austria", "Germany"].map((item) => <button key={item} className={mapCountry === item ? "active" : ""} onClick={() => setMapCountry(item)}>{locale === "ru" ? ({ All: "Все", Italy: "Италия", Austria: "Австрия", Germany: "Германия" } as Record<string, string>)[item] : locale === "de" && item === "All" ? "Alle" : item}</button>)}</div>
        <RealRouteMap selected={mapSelection} country={mapCountry} onToggle={toggleMapPoint} locale={locale} className="home-route-map" />
      </div>
      <div className="map-copy"><p className="light-section-label">04 / {t.mapLabel}</p><h2>{t.mapTitle}</h2><p>{t.mapCopy}</p><div className="smart-map-selection"><small>{locale === "ru" ? "Выбранные места" : locale === "de" ? "Ausgewählte Orte" : "Selected places"}</small><div>{mapSelection.length ? mapSelection.map((id, index) => { const point = mapPoints.find((item) => item.id === id); return point && <button key={id} onClick={() => toggleMapPoint(id)}><span>{index + 1}</span>{point.name}<b>×</b></button>; }) : <p>{locale === "ru" ? "Выберите точки на карте" : locale === "de" ? "Wählen Sie Orte auf der Karte" : "Choose places on the map"}</p>}</div></div><div className="map-stats"><div><strong>30+</strong><span>{locale === "ru" ? "отобранных мест" : "curated places"}</span></div><div><strong>3</strong><span>{locale === "ru" ? "страны на старте" : "countries at launch"}</span></div></div><a className="bronze-button" href="#collections">{locale === "ru" ? "Выбрать коллекцию" : "Choose a collection"}<span>↗</span></a></div>
    </section>

    <section className="light-quote"><p>“{t.quote}”</p><span>{locale === "ru" ? "MLT — Двигайся. Живи. Путешествуй." : "MLT — Move. Live. Travel."}</span></section>

    <section className="light-contact" id="contact">
      <div><p className="light-section-label">05 / {t.conversation}</p><h2>{t.contactTitle}</h2></div><div><p>{t.contactCopy}</p><a className="bronze-button" href="mailto:concierge@mlt-travel.com">{t.start}<span>↗</span></a></div>
    </section>

    <footer className="light-footer"><div className="light-footer-logo"><img src="/mlt-logo.svg" alt="MLT — Move. Live. Travel." /><p>{t.footer}</p></div><div><strong>{locale === "ru" ? "Разделы" : "Explore"}</strong><a href="#collections">{t.nav[0]}</a><a href="#experiences">{t.nav[1]}</a><a href={localPath("/account")}>{locale === "ru" ? "Личный кабинет" : "My account"}</a></div><div><strong>{locale === "ru" ? "Документы" : "Legal"}</strong><a href={localPath("/legal/imprint")}>{locale === "ru" ? "Выходные данные" : "Impressum"}</a><a href={localPath("/legal/privacy")}>{locale === "ru" ? "Конфиденциальность" : "Datenschutz"}</a><a href={localPath("/legal/terms")}>{locale === "ru" ? "Условия" : "AGB"}</a></div><div><strong>{locale === "ru" ? "Контакты" : "Contact"}</strong><a href="mailto:concierge@mlt-travel.com">concierge@mlt-travel.com</a><a href="tel:+4917632523799">+49 176 325 23 799</a></div><small>© 2026 MLT Maschinenhandel GmbH Import-Export</small></footer>

  </main>;
}
