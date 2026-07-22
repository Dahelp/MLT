"use client";

import { useEffect, useMemo, useState } from "react";
import { collections, destinations, experiences, fleet, mapPoints } from "../content/mlt";
import { collectionDe, translations, type Locale } from "../content/i18n";

export default function Home() {
  const [selected, setSelected] = useState("signature");
  const [destination, setDestination] = useState("Dolomites");
  const [days, setDays] = useState(10);
  const [menuOpen, setMenuOpen] = useState(false);
  const [country, setCountry] = useState("Italy");
  const [guests, setGuests] = useState("2 guests");
  const [bookingMessage, setBookingMessage] = useState("");
  const [mapCountry, setMapCountry] = useState("All");
  const [routePoints, setRoutePoints] = useState<string[]>(["dolomites", "como"]);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [requestReference, setRequestReference] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"telegram" | "demo">("demo");
  const [locale, setLocale] = useState<Locale>("en");
  const t = translations[locale];
  const localizedCollections = useMemo(() => collections.map((item) => locale === "de" ? { ...item, ...collectionDe[item.id] } : item), [locale]);
  const active = useMemo(
    () => localizedCollections.find((item) => item.id === selected) ?? localizedCollections[1],
    [selected, localizedCollections],
  );

  useEffect(() => {
    const saved = window.localStorage.getItem("mlt-locale");
    if (saved === "de" || saved === "en") setLocale(saved);
  }, []);

  const changeLocale = (next: Locale) => {
    setLocale(next); window.localStorage.setItem("mlt-locale", next); document.documentElement.lang = next;
  };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setConciergeOpen(false);
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = conciergeOpen ? "hidden" : "";
    return () => { document.removeEventListener("keydown", closeOnEscape); document.body.style.overflow = ""; };
  }, [conciergeOpen]);

  const openConcierge = () => { setFormSent(false); setFormError(""); setConciergeOpen(true); };

  const submitConcierge = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormSubmitting(true);
    setFormError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      firstName: form.get("firstName"), lastName: form.get("lastName"), email: form.get("email"), phone: form.get("phone"),
      preferredContact: form.get("contact"), bestTime: form.get("time"), notes: form.get("notes"),
      collection: `${active.name} Collection`, country, guests, days,
      route: routePoints.map((id) => mapPoints.find((point) => point.id === id)?.name).filter(Boolean),
      rate: active.rate,
      website: form.get("website"),
    };
    try {
      const response = await fetch("/api/concierge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to send your request");
      setRequestReference(result.reference);
      setDeliveryMode(result.delivery === "telegram" ? "telegram" : "demo");
      setFormSent(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to send your request");
    } finally { setFormSubmitting(false); }
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="MLT home">
          <span className="brand-mark">MLT</span>
          <span className="brand-line">Move. Live. Travel.</span>
        </a>
        <nav className={menuOpen ? "nav nav-open" : "nav"} aria-label="Primary navigation">
          <a href="#collections" onClick={() => setMenuOpen(false)}>{t.collections}</a>
          <a href="#fleet" onClick={() => setMenuOpen(false)}>{t.fleet}</a>
          <a href="#smart-map" onClick={() => setMenuOpen(false)}>{t.smartMap}</a>
          <a href="#experiences" onClick={() => setMenuOpen(false)}>{t.experiences}</a>
          <a href="#journey" onClick={() => setMenuOpen(false)}>{t.journeyDesigner}</a>
          <a href="#philosophy" onClick={() => setMenuOpen(false)}>Philosophy</a>
        </nav>
        <div className="top-actions">
          <div className="language-switch" aria-label="Language"><button className={locale === "en" ? "active" : ""} onClick={() => changeLocale("en")}>EN</button><button className={locale === "de" ? "active" : ""} onClick={() => changeLocale("de")}>DE</button><button disabled title="Coming next">IT</button><button disabled title="Coming next">RU</button></div>
          <a className="concierge-link" href="#contact">{t.concierge}</a>
          <button className="menu" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Toggle menu">
            <span /><span />
          </button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="kicker"><span /> {t.kicker}</p>
          <h1>{t.heroLine1}<br /><em>{t.heroLine2}</em></h1>
          <p className="hero-copy">{t.heroCopy}</p>
          <div className="hero-cta-row">
            <a className="primary-button" href="#collections">{t.discover} <span>↗</span></a>
            <button className="film-button"><span className="play">▶</span> {t.film} <small>01:24</small></button>
          </div>
        </div>
        <form className="booking-bar" onSubmit={(event) => { event.preventDefault(); setBookingMessage("Your private selection is ready"); openConcierge(); }}>
          <div className="booking-intro"><small>{t.begin}</small><strong>{t.plan}</strong></div>
          <label>{t.startingCountry}
            <select value={country} onChange={(event) => setCountry(event.target.value)}>
              <option>Italy</option><option>Austria</option><option>Germany</option>
            </select>
          </label>
          <label>{t.arrival}<input type="date" defaultValue="2026-09-17" /></label>
          <label>{t.departure}<input type="date" defaultValue="2026-09-27" /></label>
          <label>{t.travellers}
            <select value={guests} onChange={(event) => setGuests(event.target.value)}>
              <option>2 guests</option><option>3 guests</option><option>4 guests</option><option>5+ guests</option>
            </select>
          </label>
          <button type="submit">{t.availability} <span>↗</span></button>
          {bookingMessage && <p className="booking-message" role="status">{bookingMessage}</p>}
        </form>
        <div className="hero-meta">
          <div><span>{t.nowExploring}</span><strong>Italy · Austria · Germany</strong></div>
          <div><span>{t.firstDepartures}</span><strong>{t.september}</strong></div>
          <a href="#collections" aria-label="Scroll to collections">↓</a>
        </div>
      </section>

      <section className="intro" id="philosophy">
        <p className="section-label">{t.philosophy}</p>
        <div className="intro-grid">
          <h2>{t.notRent}<br />{t.motorhomes}</h2>
          <div>
            <p className="statement">{t.freedomLead} <em>{t.extraordinary}</em></p>
            <p className="body-copy">{t.philosophyCopy}</p>
          </div>
        </div>
      </section>

      <section className="fleet" id="fleet">
        <div className="fleet-heading">
          <div><p className="section-label">{t.privateFleet}</p><h2>{t.chooseHow}<br /><em>{t.youMove}</em></h2></div>
          <div className="fleet-note"><span>01 — 03</span><p>{t.fleetCopy}</p></div>
        </div>
        <div className="vehicle-grid">
          {fleet.map((vehicle) => <article className={vehicle.featured ? "vehicle-card featured" : "vehicle-card"} key={vehicle.id}>
            <div className={`vehicle-image ${vehicle.id}`}><span>{vehicle.badge}</span><b>{vehicle.number}</b></div>
            <div className="vehicle-copy"><div><small>{vehicle.category}</small><h3>{vehicle.name}</h3></div><strong>{vehicle.rate}</strong></div>
            <div className="vehicle-specs">{vehicle.specs.map((spec) => <span key={spec}>{spec}</span>)}</div>
            <button onClick={() => { setSelected(vehicle.collection); document.querySelector("#collections")?.scrollIntoView(); }}>{t.discoverMotorhome} <span>↗</span></button>
          </article>)}
        </div>
        <p className="fleet-disclaimer">Concept fleet names and indicative rates for demonstration purposes.</p>
      </section>

      <section className="collections" id="collections">
        <div className="section-head">
          <div>
            <p className="section-label">{t.ways}</p>
            <h2>{t.chooseYour}<br /><em>{t.collection}</em></h2>
          </div>
          <p>{t.collectionCopy}</p>
        </div>
        <div className="collection-list">
          {localizedCollections.map((item) => (
            <button
              className={selected === item.id ? "collection-row active" : "collection-row"}
              key={item.id}
              onClick={() => setSelected(item.id)}
            >
              <span className="collection-number">{item.number}</span>
              <span className="collection-title"><strong>{item.name}</strong><small>{item.eyebrow}</small></span>
              <span className="collection-data"><small>{t.duration}</small>{item.days}</span>
              <span className="collection-data"><small>{t.from}</small>{item.rate}</span>
              <span className="round-arrow">↗</span>
            </button>
          ))}
        </div>
      </section>

      <section className="smart-map" id="smart-map">
        <div className="map-heading">
          <div><p className="section-label">MLT Smart Map</p><h2>{t.places}<br /><em>{t.changing}</em></h2></div>
          <p>{t.mapCopy}</p>
        </div>
        <div className="map-shell">
          <div className="map-canvas">
            <div className="map-country-tabs" aria-label="Filter map by country">
              {["All", "Italy", "Austria", "Germany"].map((item) => <button key={item} className={mapCountry === item ? "active" : ""} onClick={() => setMapCountry(item)}>{item}</button>)}
            </div>
            <div className="map-land land-one" /><div className="map-land land-two" /><div className="map-land land-three" />
            <div className="route-trace trace-one" /><div className="route-trace trace-two" />
            {mapPoints.map((point, index) => {
              const visible = mapCountry === "All" || point.country === mapCountry;
              const isSelected = routePoints.includes(point.id);
              return <button
                key={point.id}
                className={`map-pin ${point.className} ${isSelected ? "selected" : ""} ${visible ? "" : "muted"}`}
                onClick={() => setRoutePoints((current) => current.includes(point.id) ? current.filter((id) => id !== point.id) : [...current, point.id])}
                aria-pressed={isSelected}
                aria-label={`${isSelected ? "Remove" : "Add"} ${point.name}`}
              ><span>{isSelected ? "✓" : index + 1}</span><b>{point.name}</b></button>;
            })}
            <div className="map-legend"><span><i className="legend-selected" /> Selected</span><span><i /> Curated place</span><small>Illustrative concept map</small></div>
          </div>
          <aside className="route-panel">
            <div className="route-panel-head"><span>{t.selectedRoute}</span><strong>{routePoints.length.toString().padStart(2, "0")} {t.selectedPlaces}</strong></div>
            <div className="route-list">
              {routePoints.length === 0 && <p className="empty-route">Select places on the map to begin your route.</p>}
              {routePoints.map((id, index) => {
                const point = mapPoints.find((item) => item.id === id)!;
                return <div className="route-item" key={id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{point.name}</strong><small>{point.country} · {point.type}</small></div><button aria-label={`Remove ${point.name}`} onClick={() => setRoutePoints((current) => current.filter((item) => item !== id))}>×</button></div>;
              })}
            </div>
            <div className="route-estimate"><div><small>{t.suggestedDuration}</small><strong>{Math.max(7, routePoints.length * 3)}–{Math.max(10, routePoints.length * 4)} {locale === "de" ? "Tage" : "days"}</strong></div><div><small>{t.collection}</small><strong>{active.name}</strong></div></div>
            <button className="primary-button wide" disabled={routePoints.length === 0} onClick={openConcierge}>{t.buildRoute} <span>↗</span></button>
            <p>No commitment. Your concierge will refine timing, roads and availability.</p>
          </aside>
        </div>
      </section>

      <section className="experiences" id="experiences">
        <div className="experience-heading">
          <div><p className="section-label">{t.beyond}</p><h2>{t.additional}<br /><em>{t.experienceWord}</em></h2></div>
          <div><p>{t.experienceCopy}</p><button onClick={openConcierge}>{t.askConcierge} <span>↗</span></button></div>
        </div>
        <div className="experience-grid">
          {experiences.map((experience) => <article className={`experience-card ${experience.className}`} key={experience.id}>
            <div className="experience-visual"><span>{experience.number}</span></div>
            <div className="experience-copy"><small>{experience.eyebrow}</small><h3>{experience.title}</h3><p>{experience.detail}</p><button onClick={openConcierge} aria-label={`Request ${experience.title}`}>＋</button></div>
          </article>)}
        </div>
        <p className="content-status"><span /> Content model ready for Headless CMS · Demo imagery</p>
      </section>

      <section className="designer" id="journey">
        <div className="designer-copy">
          <p className="section-label">{t.assembled}</p>
          <h2>{t.buildChapter}<br /><em>{t.expedition}</em></h2>
          <p>{t.designerCopy}</p>
          <div className="steps"><span className="done">01</span><i /><span>02</span><i /><span>03</span></div>
        </div>

        <div className="journey-card">
          <div className="card-head"><span>01 / 03</span><p>{t.selectCollection}</p></div>
          <div className="choice-grid">
            {localizedCollections.map((item) => (
              <button key={item.id} onClick={() => setSelected(item.id)} className={selected === item.id ? "choice selected" : "choice"}>
                <span>{item.number}</span><strong>{item.name}</strong><small>{item.mode}</small>
              </button>
            ))}
          </div>
          <div className="config-row">
            <label>{t.landscape}
              <select value={destination} onChange={(event) => setDestination(event.target.value)}>
                {destinations.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>Duration
              <div className="counter"><button onClick={() => setDays(Math.max(7, days - 1))}>−</button><span>{days} days</span><button onClick={() => setDays(Math.min(30, days + 1))}>+</button></div>
            </label>
          </div>
          <div className="summary">
            <div><small>{t.yourCollection}</small><strong>{active.name}</strong></div>
            <div><small>{t.beginningIn}</small><strong>{destination}</strong></div>
            <div><small>{t.indicativeRate}</small><strong>{active.rate}</strong></div>
          </div>
          <ul>{active.inclusions.map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul>
          <button className="primary-button wide">{t.continueJourney} <span>→</span></button>
        </div>
      </section>

      <section className="contact" id="contact">
        <p className="section-label">{t.conversation}</p>
        <h2>{t.someJourneys}<br />{locale === "de" ? "mit einem Ziel." : "with a destination."}<br /><em>{t.yours}</em></h2>
        <button className="primary-button" onClick={openConcierge}>{t.speak} <span>↗</span></button>
      </section>

      <footer>
        <div className="brand footer-brand"><span className="brand-mark">MLT</span><span className="brand-line">Move. Live. Travel.</span></div>
        <p>Individual Road Expeditions<br />Italy · Austria · Germany</p>
        <div><a href="#top">Instagram</a><a href="#top">Imprint</a><a href="#top">Privacy</a></div>
        <small>Concept preview · 2026 MLT GmbH</small>
      </footer>

      {conciergeOpen && <div className="concierge-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setConciergeOpen(false)}>
        <section className="concierge-modal" role="dialog" aria-modal="true" aria-labelledby="concierge-title">
          <button className="modal-close" aria-label="Close concierge form" onClick={() => setConciergeOpen(false)}>×</button>
          {!formSent ? <>
            <div className="modal-intro">
              <p className="section-label">{t.privateRequest}</p>
              <h2 id="concierge-title">{t.compose}<br /><em>{t.theJourney}</em></h2>
              <p>{t.modalCopy}</p>
            </div>
            <div className="modal-layout">
              <aside className="request-summary">
                <span className="summary-label">{t.expeditionOutline}</span>
                <div><small>Collection</small><strong>{active.name} Collection</strong></div>
                <div><small>Starting country</small><strong>{country}</strong></div>
                <div><small>Travellers</small><strong>{guests}</strong></div>
                <div><small>Duration</small><strong>{days} days</strong></div>
                <div className="summary-route"><small>Selected places</small>{routePoints.length ? routePoints.map((id) => <strong key={id}>{mapPoints.find((point) => point.id === id)?.name}</strong>) : <strong>To be curated</strong>}</div>
                <p>Indicative rate<br /><b>{active.rate}</b></p>
              </aside>
              <form className="concierge-form" onSubmit={submitConcierge}>
                <label className="website-field" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
                <div className="form-row"><label>{t.firstName}<input required name="firstName" autoComplete="given-name" placeholder={locale === "de" ? "Ihr Vorname" : "Your name"} /></label><label>{t.lastName}<input required name="lastName" autoComplete="family-name" placeholder={locale === "de" ? "Ihr Nachname" : "Your surname"} /></label></div>
                <div className="form-row"><label>{t.email}<input required type="email" name="email" autoComplete="email" placeholder="name@company.com" /></label><label>{t.phone}<input type="tel" name="phone" autoComplete="tel" placeholder="+49 ..." /></label></div>
                <div className="form-row"><label>{t.preferred}<select name="contact"><option>Email</option><option>{t.phone}</option><option>WhatsApp</option></select></label><label>{t.bestTime}<select name="time"><option>{locale === "de" ? "Vormittag" : "Morning"}</option><option>{locale === "de" ? "Nachmittag" : "Afternoon"}</option><option>{locale === "de" ? "Abend" : "Evening"}</option></select></label></div>
                <label>{t.exceptional}<textarea name="notes" rows={4} placeholder={locale === "de" ? "Ein Anlass, eine Landschaft, ein besonderes Erlebnis..." : "A celebration, a landscape, a particular experience..."} /></label>
                <label className="consent"><input required type="checkbox" /><span>{t.consent}</span></label>
                {formError && <p className="form-error" role="alert">{formError}</p>}
                <button className="primary-button wide" type="submit" disabled={formSubmitting}>{formSubmitting ? t.sending : t.requestProposal} <span>→</span></button>
                <p className="form-note">{t.noCommitment}</p>
              </form>
            </div>
          </> : <div className="success-state">
            <span className="success-mark">✓</span>
            <p className="section-label">{t.received}</p>
            <h2>{t.thankYou}<br /><em>{t.begun}</em></h2>
            <p>{t.successCopy}</p>
            <div className={deliveryMode === "telegram" ? "delivery-status delivered" : "delivery-status"}><span>↗</span><div><small>Concierge channel</small><strong>{deliveryMode === "telegram" ? "Delivered to Telegram Concierge Desk" : "Telegram demo channel prepared"}</strong></div></div>
            <div className="telegram-preview"><div className="telegram-head"><span>MLT</span><div><strong>Concierge Desk</strong><small>{deliveryMode === "telegram" ? "Notification delivered" : "Demo notification preview"}</small></div></div><p><b>New private journey request</b><br />{active.name} Collection · {country}<br />{routePoints.length || "Curated"} selected places · {days} days · {guests}</p></div>
            <div className="success-reference"><small>Private request</small><strong>{requestReference}</strong></div>
            <button className="primary-button" onClick={() => setConciergeOpen(false)}>{t.returnMlt} <span>→</span></button>
          </div>}
        </section>
      </div>}
    </main>
  );
}
