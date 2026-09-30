"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Swiper as SwiperCarousel, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";
import { EffectCoverflow, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import styles from "./preview.module.css";

type IconName = "globe" | "user" | "menu" | "chevron" | "compass" | "pin" | "calendar" | "travellers";

function Icon({ name }: { name: IconName }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {name === "globe" && <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></>}
    {name === "user" && <><circle cx="12" cy="8" r="3.5"/><path d="M5 21c.7-4.2 3.1-6.3 7-6.3s6.3 2.1 7 6.3"/></>}
    {name === "menu" && <path d="M5 8h14M5 16h14"/>}
    {name === "chevron" && <path d="m7 9.5 5 5 5-5"/>}
    {name === "compass" && <><circle cx="12" cy="12" r="9"/><path d="m15.8 8.2-2.1 5.5-5.5 2.1 2.1-5.5 5.5-2.1Z"/></>}
    {name === "pin" && <><path d="M20 10c0 5.2-8 11-8 11S4 15.2 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>}
    {name === "calendar" && <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M7 14h2M11 14h2M15 14h2M7 18h2M11 18h2"/></>}
    {name === "travellers" && <><circle cx="10" cy="8" r="3.2"/><path d="M3.5 20c.6-4 2.8-6 6.5-6s5.9 2 6.5 6M16 6.5a3 3 0 0 1 0 5.8M17.5 14.5c2 .8 3.2 2.6 3.5 5.5"/></>}
  </svg>;
}

const products = [
  { n: "01", title: "Dolomites Freedom Journey", copy: "Iconic passes and pure driving", image: "/route-dolomites.jpg" },
  { n: "02", title: "Bavaria Discovery Pass", copy: "Castles, lakes and freedom", image: "/route-bavaria.jpg" },
  { n: "03", title: "Alpine Escape Express", copy: "Mountain energy and trekking", image: "/route-alpine.jpg" },
  { n: "04", title: "Wine Roads Horizon", copy: "Wine roads and terroirs", image: "/route-wine-roads.jpg" },
  { n: "05", title: "Mediterranean Coastline", copy: "Sea breeze and hidden coves", image: "/route-mediterranean.jpg" },
];
const carouselProducts = Array.from({ length: 3 }, () => products).flat();

const prices: Record<number, number> = { 7: 1490, 10: 1990, 14: 2590, 21: 3690, 30: 4990 };
type PackageVariant = { id: string; title: string; subtitle?: string; benefits?: string[]; supplement?: string };
const defaultPackages: PackageVariant[] = [
  { id: "freedom", title: "Freedom", subtitle: "Independent journey", benefits: ["Motorhome", "Basic Road Book", "MLT My Profile", "Technical support"] },
  { id: "freedom-plus", title: "Freedom+", subtitle: "Route & recommendations", benefits: ["Everything in Freedom", "Author route", "Digital guide", "Panoramic roads", "Restaurant & location recommendations"], supplement: "+ €300–500" },
];

function addDays(date: string, days: number) {
  if (!date) return "";
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

export default function FreedomMobilePreview() {
  const [plus, setPlus] = useState(false);
  const [days, setDays] = useState(7);
  const [departure, setDeparture] = useState("2026-10-12");
  const [guests, setGuests] = useState(1);
  const [active, setActive] = useState(2);
  const [locale, setLocale] = useState<"EN" | "DE" | "RU">("EN");
  const [languageOpen, setLanguageOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [packages, setPackages] = useState<PackageVariant[]>(defaultPackages);
  const productCarousel = useRef<SwiperInstance | null>(null);
  const total = useMemo(() => prices[days] + (plus ? 300 : 0) + Math.max(0, guests - 2) * 190, [days, guests, plus]);
  const returnDate = useMemo(() => addDays(departure, days), [departure, days]);
  const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(total);
  useEffect(() => { fetch("/api/catalog.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "list" }) }).then(response => response.ok ? response.json() : Promise.reject()).then(data => { const item = Array.isArray(data.items) ? data.items.find((entry: { item_type?: string; slug?: string }) => entry.item_type === "collection" && entry.slug === "freedom") : null; const parsed = item?.data_json ? JSON.parse(item.data_json) : {}; if (Array.isArray(parsed.packageVariants) && parsed.packageVariants.length >= 2) setPackages(parsed.packageVariants); }).catch(() => {}); }, []);
  const freedomPackage = packages[0] || defaultPackages[0];
  const freedomPlusPackage = packages[1] || defaultPackages[1];

  return <main className={styles.stage}>
    <div className={styles.phone}>
      <header className={styles.header}>
        <a href="/" aria-label="MLT home"><img src="/mlt-logo.svg" alt="MLT" /></a>
        <div className={styles.headerActions}>
          <div className={styles.languageWrap}><button className={styles.language} aria-expanded={languageOpen} onClick={() => { setLanguageOpen(!languageOpen); setMenuOpen(false); }}><Icon name="globe"/><span>{locale}</span><Icon name="chevron"/></button>{languageOpen && <div className={styles.languageMenu}>{(["EN","DE","RU"] as const).map(code => <button key={code} className={locale === code ? styles.activeLanguage : ""} onClick={() => { setLocale(code); setLanguageOpen(false); }}>{code}<span>{locale === code ? "✓" : ""}</span></button>)}</div>}</div>
          <a className={styles.iconButton} href="/account" aria-label="Account"><Icon name="user"/></a>
          <button aria-label="Menu" aria-expanded={menuOpen} onClick={() => { setMenuOpen(!menuOpen); setLanguageOpen(false); }}><Icon name="menu"/></button>
        </div>
      </header>
      {menuOpen && <div className={styles.mobileMenu}><div className={styles.mobileMenuHead}><img src="/mlt-logo.svg" alt="MLT"/><button aria-label="Close menu" onClick={() => setMenuOpen(false)}>×</button></div><p>Explore MLT</p><nav><a href="/#collections"><span>01</span>Collections</a><a href="/#routes"><span>02</span>Journeys</a><a href="/#fleet"><span>03</span>Vehicles</a><a href="/#experiences"><span>04</span>Experiences</a><a href="/plan"><span>05</span>Smart map</a></nav><div className={styles.mobileMenuBottom}><a href="/account">Sign in</a><a href="mailto:concierge@mlt-travel.com">Contact concierge →</a></div></div>}

      <section className={styles.hero}>
        <img src="/collection-freedom-hero-mobile-v2.webp" alt="MLT Freedom expedition" />
        <div><span>MLT / 01</span><h1><strong>MLT Freedom</strong><br/><i>Collection</i></h1></div>
      </section>

      <section className={styles.booking}>
        <h2>Build your journey:</h2>
        <div className={styles.types}>
          <button className={!plus ? styles.selected : ""} onClick={() => setPlus(false)}><b>{freedomPackage.title}</b>{(freedomPackage.benefits || []).map(item => <small key={item}><span>✓</span> {item}</small>)}</button>
          <button className={plus ? styles.selected : ""} onClick={() => setPlus(true)}><b>{freedomPlusPackage.title}</b>{(freedomPlusPackage.benefits || []).map(item => <small key={item}><span>✓</span> {item}</small>)}</button>
        </div>
        <div className={styles.fields}>
          <label><i><Icon name="pin"/></i><span>Country</span><select><option>Italy</option></select></label>
          <label><i><Icon name="calendar"/></i><span>Choose your travel dates</span><select value={days} onChange={(e) => setDays(Number(e.target.value))}>{Object.keys(prices).map(d => <option key={d} value={d}>{d} days</option>)}</select><small className={styles.fieldPrice}>{new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(prices[days] + (plus ? 300 : 0))}</small></label>
          <label><i><Icon name="calendar"/></i><span>Departure</span><input type="date" value={departure} onChange={(event) => setDeparture(event.target.value)} /></label>
          <label><i><Icon name="calendar"/></i><span>Return</span><input type="date" value={returnDate} readOnly /></label>
          <div className={styles.travellers}><i><Icon name="travellers"/></i><span>Travellers</span><div><button onClick={() => setGuests(Math.max(1, guests - 1))}>−</button><b>{guests}</b><button onClick={() => setGuests(Math.min(8, guests + 1))}>+</button></div><small>1–2 guests included · +€190 from the 3rd guest</small></div>
        </div>
      </section>

      <section className={styles.products}>
        <p className={styles.eyebrow}>Select your experience:</p>
        <div className={styles.carousel}>
          <button className={styles.prev} onClick={() => productCarousel.current?.slidePrev()} aria-label="Previous"><span aria-hidden="true">←</span></button>
          <SwiperCarousel className={styles.track} modules={[EffectCoverflow, Keyboard]} effect="coverflow" initialSlide={products.length + 2} centeredSlides slidesPerView="auto" speed={650} loop loopAdditionalSlides={products.length} simulateTouch grabCursor allowTouchMove touchAngle={35} threshold={10} longSwipesRatio={0.2} preventClicks preventClicksPropagation keyboard={{ enabled: true }} coverflowEffect={{ rotate: 0, stretch: 8, depth: 90, modifier: 1, slideShadows: false }} onSwiper={instance => { productCarousel.current = instance; }} onSlideChange={instance => setActive(instance.realIndex % products.length)}>{carouselProducts.map((product, index) => {
            const productIndex = index % products.length;
            return <SwiperSlide className={styles.slide} key={`${product.n}-${index}`}><button className={styles.card} data-active={productIndex === active} aria-pressed={productIndex === active} onClick={() => setActive(productIndex)}>
              <img src={product.image} alt=""/><span>{product.n}</span><em>{productIndex === active ? "Selected" : "Choose"}</em><div><strong>{product.title}</strong><small>{product.copy}</small></div>
            </button></SwiperSlide>;
          })}</SwiperCarousel>
          <button className={styles.next} onClick={() => productCarousel.current?.slideNext()} aria-label="Next"><span aria-hidden="true">→</span></button>
        </div>
      </section>

      <section className={styles.ideal}><p className={styles.eyebrow}>Ideal for</p><p>For independent travelers who value top-tier equipment and expert guidance, keeping their journey completely flexible.</p></section>
      <section className={styles.shapes}><p className={styles.eyebrow}>What shapes the journey?</p><div>{["Luxury motorhome", "Curated map", "MLT route app", "Local recommendations"].map(x => <span key={x}>✓ &nbsp;{x}</span>)}</div></section>
      <section className={styles.compare}>{[freedomPackage, freedomPlusPackage].map(item => <article key={item.id}><h3>{item.title}</h3>{[...(item.benefits || []), ...(item.supplement ? [item.supplement] : [])].map(entry=><p key={entry}>✓ &nbsp;{entry}</p>)}</article>)}</section>
      <section className={styles.cta}><img src="/collection-freedom-hero-mobile-v2.webp" alt=""/><div><p className={styles.eyebrow}>MLT Freedom</p><h2>Begin a Freedom journey</h2><p>Tell us where you would like to begin. We will prepare the motorhome, the essentials and your first recommendations.</p><a href="mailto:concierge@mlt-travel.com">Talk to a concierge <span>→</span></a></div></section>
      <footer className={styles.footer}><div className={styles.footerBrand}><img src="/mlt-logo.svg" alt="MLT"/><p>Individual Road Expeditions<br/>across Europe.</p></div><div className={styles.footerLinks}><div><strong>Explore</strong><a href="/#collections">Collections</a><a href="/#experiences">Experiences</a><a href="/plan">Smart map</a></div><div><strong>Contact</strong><a href="mailto:concierge@mlt-travel.com">Email us</a><a href="tel:+4917632523799">+49 176 325 23 799</a></div></div><div className={styles.footerBottom}><span>© 2026 MLT</span><a href="/legal/privacy">Privacy</a><a href="/legal/imprint">Imprint</a></div></footer>
      <div className={styles.sticky}><span>Total <b>{money}</b></span><button onClick={() => alert("Preview only — payment is not connected.")}>Sign in & pay →</button></div>
    </div>
  </main>;
}
