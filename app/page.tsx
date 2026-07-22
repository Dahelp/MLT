"use client";

import { useEffect, useMemo, useState } from "react";

type Collection = {
  id: string;
  number: string;
  name: string;
  eyebrow: string;
  promise: string;
  days: string;
  rate: string;
  mode: string;
  inclusions: string[];
};

const collections: Collection[] = [
  {
    id: "freedom",
    number: "01",
    name: "Freedom",
    eyebrow: "Self-directed discovery",
    promise: "Your road. Your rhythm.",
    days: "7–30 days",
    rate: "€150–220 / day",
    mode: "Independent",
    inclusions: ["Luxury motorhome", "Curated map", "MLT route app", "Local recommendations"],
  },
  {
    id: "signature",
    number: "02",
    name: "Signature",
    eyebrow: "Curated, end to end",
    promise: "The journey, beautifully resolved.",
    days: "7–14 days",
    rate: "€250–400 / day",
    mode: "Tailored",
    inclusions: ["Personal route", "Reserved campsites", "Panoramic roads", "Restaurants & activities"],
  },
  {
    id: "concierge",
    number: "03",
    name: "Concierge",
    eyebrow: "Always one step ahead",
    promise: "Travel without interruption.",
    days: "7–15 days",
    rate: "€450–700 / day",
    mode: "Assisted 24/7",
    inclusions: ["Live route changes", "Dining reservations", "Excursions", "Roadside assistance"],
  },
  {
    id: "private",
    number: "04",
    name: "Private",
    eyebrow: "The rarest way to move",
    promise: "A private world, in motion.",
    days: "7–21 days",
    rate: "€2,000–4,000 / day",
    mode: "Fully hosted",
    inclusions: ["Private driver & technician", "Chef & service", "Half board", "VIP transfers & concierge"],
  },
];

const destinations = ["Dolomites", "Lake Como", "Tyrol", "Bavaria"];

const mapPoints = [
  { id: "como", country: "Italy", name: "Lake Como", type: "Lakeside stay", className: "pin-como" },
  { id: "dolomites", country: "Italy", name: "Dolomites", type: "Panoramic road", className: "pin-dolomites" },
  { id: "tuscany", country: "Italy", name: "Val d’Orcia", type: "Private vineyard", className: "pin-tuscany" },
  { id: "amalfi", country: "Italy", name: "Amalfi Coast", type: "Coastal retreat", className: "pin-amalfi" },
  { id: "tyrol", country: "Austria", name: "Tyrol", type: "Alpine lodge", className: "pin-tyrol" },
  { id: "salzburg", country: "Austria", name: "Salzburg Lakes", type: "Wild swimming", className: "pin-salzburg" },
  { id: "vienna", country: "Austria", name: "Vienna", type: "Private dining", className: "pin-vienna" },
  { id: "bavaria", country: "Germany", name: "Bavarian Alps", type: "Scenic route", className: "pin-bavaria" },
  { id: "blackforest", country: "Germany", name: "Black Forest", type: "Forest hideaway", className: "pin-blackforest" },
];

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
  const active = useMemo(
    () => collections.find((item) => item.id === selected) ?? collections[1],
    [selected],
  );

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
          <a href="#collections" onClick={() => setMenuOpen(false)}>Collections</a>
          <a href="#fleet" onClick={() => setMenuOpen(false)}>Fleet</a>
          <a href="#smart-map" onClick={() => setMenuOpen(false)}>Smart map</a>
          <a href="#journey" onClick={() => setMenuOpen(false)}>Journey designer</a>
          <a href="#philosophy" onClick={() => setMenuOpen(false)}>Philosophy</a>
        </nav>
        <div className="top-actions">
          <button className="lang" aria-label="Change language">EN</button>
          <a className="concierge-link" href="#contact">Talk to a concierge</a>
          <button className="menu" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Toggle menu">
            <span /><span />
          </button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="kicker"><span /> Individual road expeditions</p>
          <h1>Europe,<br /><em>without limits.</em></h1>
          <p className="hero-copy">Not a rental. A private way of moving through the world — composed around you.</p>
          <div className="hero-cta-row">
            <a className="primary-button" href="#collections">Discover the collections <span>↗</span></a>
            <button className="film-button"><span className="play">▶</span> Watch the film <small>01:24</small></button>
          </div>
        </div>
        <form className="booking-bar" onSubmit={(event) => { event.preventDefault(); setBookingMessage("Your private selection is ready"); openConcierge(); }}>
          <div className="booking-intro"><small>Begin your journey</small><strong>Plan an expedition</strong></div>
          <label>Starting country
            <select value={country} onChange={(event) => setCountry(event.target.value)}>
              <option>Italy</option><option>Austria</option><option>Germany</option>
            </select>
          </label>
          <label>Arrival<input type="date" defaultValue="2026-09-17" /></label>
          <label>Departure<input type="date" defaultValue="2026-09-27" /></label>
          <label>Travellers
            <select value={guests} onChange={(event) => setGuests(event.target.value)}>
              <option>2 guests</option><option>3 guests</option><option>4 guests</option><option>5+ guests</option>
            </select>
          </label>
          <button type="submit">Explore availability <span>↗</span></button>
          {bookingMessage && <p className="booking-message" role="status">{bookingMessage}</p>}
        </form>
        <div className="hero-meta">
          <div><span>Now exploring</span><strong>Italy · Austria · Germany</strong></div>
          <div><span>First departures</span><strong>September 2026</strong></div>
          <a href="#collections" aria-label="Scroll to collections">↓</a>
        </div>
      </section>

      <section className="intro" id="philosophy">
        <p className="section-label">The MLT philosophy</p>
        <div className="intro-grid">
          <h2>We do not rent<br />motorhomes.</h2>
          <div>
            <p className="statement">We create the freedom to wake up somewhere <em>extraordinary.</em></p>
            <p className="body-copy">Every MLT expedition is a considered balance of remarkable roads, rare places and effortless service — from total independence to a fully hosted private journey.</p>
          </div>
        </div>
      </section>

      <section className="fleet" id="fleet">
        <div className="fleet-heading">
          <div><p className="section-label">The private fleet</p><h2>Choose how<br />you <em>move.</em></h2></div>
          <div className="fleet-note"><span>01 — 03</span><p>Exceptionally equipped motorhomes selected for long-distance comfort, privacy and complete independence.</p></div>
        </div>
        <div className="vehicle-grid">
          <article className="vehicle-card">
            <div className="vehicle-image explorer"><span>Available from September</span><b>01</b></div>
            <div className="vehicle-copy"><div><small>Grand touring</small><h3>MLT Explorer</h3></div><strong>from €220 / day</strong></div>
            <div className="vehicle-specs"><span>4 guests</span><span>Automatic</span><span>7.8 m</span></div>
            <button onClick={() => { setSelected("freedom"); document.querySelector("#collections")?.scrollIntoView(); }}>Discover this motorhome <span>↗</span></button>
          </article>
          <article className="vehicle-card featured">
            <div className="vehicle-image granduca"><span>Signature choice</span><b>02</b></div>
            <div className="vehicle-copy"><div><small>Flagship residence</small><h3>MLT Granduca</h3></div><strong>from €390 / day</strong></div>
            <div className="vehicle-specs"><span>4 guests</span><span>Panoramic lounge</span><span>8.7 m</span></div>
            <button onClick={() => { setSelected("signature"); document.querySelector("#collections")?.scrollIntoView(); }}>Discover this motorhome <span>↗</span></button>
          </article>
          <article className="vehicle-card">
            <div className="vehicle-image compatto"><span>Agile luxury</span><b>03</b></div>
            <div className="vehicle-copy"><div><small>Compact touring</small><h3>MLT Compatto</h3></div><strong>from €180 / day</strong></div>
            <div className="vehicle-specs"><span>2 guests</span><span>Automatic</span><span>6.9 m</span></div>
            <button onClick={() => { setSelected("freedom"); document.querySelector("#collections")?.scrollIntoView(); }}>Discover this motorhome <span>↗</span></button>
          </article>
        </div>
        <p className="fleet-disclaimer">Concept fleet names and indicative rates for demonstration purposes.</p>
      </section>

      <section className="collections" id="collections">
        <div className="section-head">
          <div>
            <p className="section-label">Four ways to travel</p>
            <h2>Choose your<br /><em>collection.</em></h2>
          </div>
          <p>Each collection begins with the same promise: the finest motorhomes, a remarkable European landscape and the space to travel differently.</p>
        </div>
        <div className="collection-list">
          {collections.map((item) => (
            <button
              className={selected === item.id ? "collection-row active" : "collection-row"}
              key={item.id}
              onClick={() => setSelected(item.id)}
            >
              <span className="collection-number">{item.number}</span>
              <span className="collection-title"><strong>{item.name}</strong><small>{item.eyebrow}</small></span>
              <span className="collection-data"><small>Duration</small>{item.days}</span>
              <span className="collection-data"><small>From</small>{item.rate}</span>
              <span className="round-arrow">↗</span>
            </button>
          ))}
        </div>
      </section>

      <section className="smart-map" id="smart-map">
        <div className="map-heading">
          <div><p className="section-label">MLT Smart Map</p><h2>Places worth<br /><em>changing course for.</em></h2></div>
          <p>Explore a first edit of remarkable roads, private stays and rare experiences. Select what moves you — our concierge will compose the journey between them.</p>
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
            <div className="route-panel-head"><span>Your selected route</span><strong>{routePoints.length.toString().padStart(2, "0")} places</strong></div>
            <div className="route-list">
              {routePoints.length === 0 && <p className="empty-route">Select places on the map to begin your route.</p>}
              {routePoints.map((id, index) => {
                const point = mapPoints.find((item) => item.id === id)!;
                return <div className="route-item" key={id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{point.name}</strong><small>{point.country} · {point.type}</small></div><button aria-label={`Remove ${point.name}`} onClick={() => setRoutePoints((current) => current.filter((item) => item !== id))}>×</button></div>;
              })}
            </div>
            <div className="route-estimate"><div><small>Suggested duration</small><strong>{Math.max(7, routePoints.length * 3)}–{Math.max(10, routePoints.length * 4)} days</strong></div><div><small>Collection</small><strong>{active.name}</strong></div></div>
            <button className="primary-button wide" disabled={routePoints.length === 0} onClick={openConcierge}>Build this route with a concierge <span>↗</span></button>
            <p>No commitment. Your concierge will refine timing, roads and availability.</p>
          </aside>
        </div>
      </section>

      <section className="designer" id="journey">
        <div className="designer-copy">
          <p className="section-label">Your journey, assembled</p>
          <h2>Build the first chapter<br />of your <em>expedition.</em></h2>
          <p>Select a collection, a landscape and your pace. We will turn the outline into a private itinerary.</p>
          <div className="steps"><span className="done">01</span><i /><span>02</span><i /><span>03</span></div>
        </div>

        <div className="journey-card">
          <div className="card-head"><span>01 / 03</span><p>Select your collection</p></div>
          <div className="choice-grid">
            {collections.map((item) => (
              <button key={item.id} onClick={() => setSelected(item.id)} className={selected === item.id ? "choice selected" : "choice"}>
                <span>{item.number}</span><strong>{item.name}</strong><small>{item.mode}</small>
              </button>
            ))}
          </div>
          <div className="config-row">
            <label>Landscape
              <select value={destination} onChange={(event) => setDestination(event.target.value)}>
                {destinations.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>Duration
              <div className="counter"><button onClick={() => setDays(Math.max(7, days - 1))}>−</button><span>{days} days</span><button onClick={() => setDays(Math.min(30, days + 1))}>+</button></div>
            </label>
          </div>
          <div className="summary">
            <div><small>Your collection</small><strong>{active.name}</strong></div>
            <div><small>Beginning in</small><strong>{destination}</strong></div>
            <div><small>Indicative rate</small><strong>{active.rate}</strong></div>
          </div>
          <ul>{active.inclusions.map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul>
          <button className="primary-button wide">Continue your journey <span>→</span></button>
        </div>
      </section>

      <section className="contact" id="contact">
        <p className="section-label">A private conversation</p>
        <h2>Some journeys begin<br />with a destination.<br /><em>Yours begins here.</em></h2>
        <button className="primary-button" onClick={openConcierge}>Speak with our concierge <span>↗</span></button>
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
              <p className="section-label">Your private request</p>
              <h2 id="concierge-title">Let us compose<br /><em>the journey.</em></h2>
              <p>Share a few details. An MLT concierge will return with a considered first proposal.</p>
            </div>
            <div className="modal-layout">
              <aside className="request-summary">
                <span className="summary-label">Expedition outline</span>
                <div><small>Collection</small><strong>{active.name} Collection</strong></div>
                <div><small>Starting country</small><strong>{country}</strong></div>
                <div><small>Travellers</small><strong>{guests}</strong></div>
                <div><small>Duration</small><strong>{days} days</strong></div>
                <div className="summary-route"><small>Selected places</small>{routePoints.length ? routePoints.map((id) => <strong key={id}>{mapPoints.find((point) => point.id === id)?.name}</strong>) : <strong>To be curated</strong>}</div>
                <p>Indicative rate<br /><b>{active.rate}</b></p>
              </aside>
              <form className="concierge-form" onSubmit={submitConcierge}>
                <label className="website-field" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
                <div className="form-row"><label>First name<input required name="firstName" autoComplete="given-name" placeholder="Your name" /></label><label>Last name<input required name="lastName" autoComplete="family-name" placeholder="Your surname" /></label></div>
                <div className="form-row"><label>Email<input required type="email" name="email" autoComplete="email" placeholder="name@company.com" /></label><label>Phone<input type="tel" name="phone" autoComplete="tel" placeholder="+49 ..." /></label></div>
                <div className="form-row"><label>Preferred contact<select name="contact"><option>Email</option><option>Phone</option><option>WhatsApp</option></select></label><label>Best time to reach you<select name="time"><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label></div>
                <label>What would make this journey exceptional?<textarea name="notes" rows={4} placeholder="A celebration, a landscape, a particular experience..." /></label>
                <label className="consent"><input required type="checkbox" /><span>I agree that MLT may use these details to prepare and discuss my travel proposal.</span></label>
                {formError && <p className="form-error" role="alert">{formError}</p>}
                <button className="primary-button wide" type="submit" disabled={formSubmitting}>{formSubmitting ? "Sending securely..." : "Request my private proposal"} <span>→</span></button>
                <p className="form-note">Your information remains private. No payment or commitment is required.</p>
              </form>
            </div>
          </> : <div className="success-state">
            <span className="success-mark">✓</span>
            <p className="section-label">Request received</p>
            <h2>Thank you.<br /><em>Your journey has begun.</em></h2>
            <p>An MLT concierge will review your preferences and contact you within one business day with the next private step.</p>
            <div className={deliveryMode === "telegram" ? "delivery-status delivered" : "delivery-status"}><span>↗</span><div><small>Concierge channel</small><strong>{deliveryMode === "telegram" ? "Delivered to Telegram Concierge Desk" : "Telegram demo channel prepared"}</strong></div></div>
            <div className="telegram-preview"><div className="telegram-head"><span>MLT</span><div><strong>Concierge Desk</strong><small>{deliveryMode === "telegram" ? "Notification delivered" : "Demo notification preview"}</small></div></div><p><b>New private journey request</b><br />{active.name} Collection · {country}<br />{routePoints.length || "Curated"} selected places · {days} days · {guests}</p></div>
            <div className="success-reference"><small>Private request</small><strong>{requestReference}</strong></div>
            <button className="primary-button" onClick={() => setConciergeOpen(false)}>Return to MLT <span>→</span></button>
          </div>}
        </section>
      </div>}
    </main>
  );
}
