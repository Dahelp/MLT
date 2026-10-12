"use client";

import { useEffect, useMemo, useState } from "react";
import type { Listing } from "./Acquisitions";

const money = (value: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
const photo = (item: Listing) => {
  try { const value = JSON.parse(item.images_json); return Array.isArray(value) && typeof value[0] === "string" ? value[0] : ""; } catch { return ""; }
};

export default function MarketplaceHome({ locale, items, loading, onInquiry }: { locale: string; items: Listing[]; loading: boolean; onInquiry: () => void }) {
  const [capsuleMode, setCapsuleMode] = useState(false), [type, setType] = useState("motorhome"), [query, setQuery] = useState(""), [min, setMin] = useState(""), [max, setMax] = useState(""), [year, setYear] = useState(""), [mileage, setMileage] = useState(""), [area, setArea] = useState(""), [sort, setSort] = useState("newest"), [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => { setCapsuleMode(new URLSearchParams(window.location.search).get("category") === "capsule"); }, []);
  const results = useMemo(() => items.filter(item =>
    (!type || item.type === type) &&
    (!query || `${item.title} ${item.subtitle} ${item.type}`.toLowerCase().includes(query.toLowerCase())) &&
    (!min || Number(item.price) >= Number(min)) && (!max || Number(item.price) <= Number(max)) &&
    (!year || item.year === Number(year)) &&
    (!mileage || item.type !== "motorhome" || (item.mileage ?? Infinity) <= Number(mileage)) &&
    (!area || item.type !== "capsule" || (item.area_m2 ?? 0) >= Number(area))
  ).sort((a, b) => sort === "price-asc" ? Number(a.price) - Number(b.price) : sort === "price-desc" ? Number(b.price) - Number(a.price) : b.id - a.id), [items, type, query, min, max, year, mileage, area, sort]);
  const realCount = items.filter(item => !item.demo && item.type === "motorhome").length;
  const clear = () => { setType("motorhome"); setQuery(""); setMin(""); setMax(""); setYear(""); setMileage(""); setArea(""); };

  if (capsuleMode) return <><section className="commercial-hero acquisition-hero market-hero market-capsule-hero"><div className="commercial-hero-image"/><div className="commercial-hero-content"><p className="commercial-eyebrow">MLT / Capsule homes</p><h1>A new way<br/><em>to feel at home.</em></h1><p>Capsule homes are coming to the MLT collection. Tell our team what you are looking for and we will contact you when suitable options become available.</p><button className="commercial-button" onClick={onInquiry}>Register your interest <span>↗</span></button></div></section><section className="commercial-section market-capsule-note"><p className="commercial-eyebrow">A collection in preparation</p><h2>Thoughtfully designed.<br/><em>Worth waiting for.</em></h2><p>There are currently no capsule homes listed for sale. Our sales team can discuss your preferred layout, size and location in advance.</p><button className="commercial-button" onClick={onInquiry}>Contact the sales team <span>↗</span></button></section></>;
  return <>
    <section className="commercial-hero acquisition-hero market-hero">
      <div className="commercial-hero-image" />
      <div className="commercial-hero-content"><p className="commercial-eyebrow">MLT / Acquisitions</p><h1>Find your next<br/><em>residence on wheels.</em></h1><p>Explore premium motorhomes, compare the details and enquire directly with the MLT sales team.</p></div>
    </section>

    <section className="market-search" aria-label="Search residences">
      <div className="market-search-fields"><label>Search model or residence<input value={query} onChange={event => setQuery(event.target.value)} placeholder="e.g. MLT Explorer" /></label><label>Price up to<select value={max} onChange={event => setMax(event.target.value)}><option value="">Any price</option><option value="100000">€100,000</option><option value="200000">€200,000</option><option value="350000">€350,000</option><option value="500000">€500,000</option></select></label><label>From year<select value={year} onChange={event => setYear(event.target.value)}><option value="">Any year</option>{[2026,2025,2024,2023,2022,2021,2020].map(value => <option value={value} key={value}>{value}</option>)}</select></label><a className="commercial-button" href="#market-results">View {results.length} {results.length === 1 ? "result" : "results"} <span>↗</span></a></div>
      <button className="market-search-more" onClick={() => { setFiltersOpen(true); document.getElementById("market-results")?.scrollIntoView({ behavior: "smooth" }); }}>More search options <span>↓</span></button>
    </section>

    <section className="commercial-section market-results" id="market-results"><div className="market-results-header"><div><p className="commercial-eyebrow">MLT / The marketplace</p><h2>Explore motorhomes</h2><p>{loading ? "Loading residences…" : `${realCount} currently listed ${realCount === 1 ? "residence" : "residences"}${items.some(item => item.demo) ? " · 1 demonstration listing" : ""}`}</p></div><div className="market-results-actions"><button onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen}>Filters <span>{filtersOpen ? "−" : "+"}</span></button><label>Sort by<select value={sort} onChange={event => setSort(event.target.value)}><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label></div></div>
      <div className={filtersOpen ? "market-advanced open" : "market-advanced"}><label>Minimum price<input type="number" min="0" value={min} onChange={event => setMin(event.target.value)} placeholder="€ Any" /></label><label>Maximum price<input type="number" min="0" value={max} onChange={event => setMax(event.target.value)} placeholder="€ Any" /></label><label>Year<select value={year} onChange={event => setYear(event.target.value)}><option value="">Any</option>{[2026,2025,2024,2023,2022,2021,2020].map(value => <option value={value} key={value}>{value}</option>)}</select></label><label>Maximum mileage<input type="number" min="0" value={mileage} onChange={event => setMileage(event.target.value)} placeholder="Any km" /></label><button onClick={clear}>Clear filters</button></div>
      {results.length ? <div className="market-grid">{results.map(item => <article className="market-card" key={item.id}><a className="market-card-media" href={`/${locale}/acquisitions/${item.slug}/`}>{photo(item) ? <img src={photo(item)} alt={item.title} loading="lazy"/> : <span className="market-card-placeholder">MLT</span>}<span className="market-card-badge">{item.demo ? "DEMO · NOT FOR SALE" : item.certified ? "CERTIFIED BY MLT" : "MLT SELECTION"}</span></a><div className="market-card-body"><p className="market-card-type">{item.type === "capsule" ? "Capsule home" : "Motorhome"} <span>·</span> {item.demo ? "Illustrative example" : item.status === "sold" ? "Sold" : "Available"}</p><h3>{item.title}</h3><p>{item.subtitle}</p><strong>{item.demo ? "Example " : ""}{money(Number(item.price))}</strong><div className="market-card-spec"><span>{item.year || "Year on request"}</span><span>{item.type === "motorhome" ? item.mileage != null ? `${new Intl.NumberFormat("en-IE").format(item.mileage)} km` : "Mileage on request" : item.area_m2 != null ? `${item.area_m2} m²` : "Area on request"}</span><span>{item.type === "motorhome" ? `${item.berths || "—"} berths` : "Capsule residence"}</span></div><a className="market-card-link" href={`/${locale}/acquisitions/${item.slug}/`}>View details <span>↗</span></a></div></article>)}</div> : <div className="market-no-results"><h3>{loading ? "Preparing the collection…" : "No residences match this search."}</h3><p>Try another category or tell our sales team what you would like us to source.</p><button className="commercial-button" onClick={onInquiry}>Ask our sales team <span>↗</span></button></div>}
    </section>

    <section className="commercial-section market-concierge"><div><p className="commercial-eyebrow">A more personal way to buy</p><h2>Can&apos;t find<br/><em>the right one?</em></h2></div><div><p>Tell us the model or layout you have in mind. Our sales team will help source a motorhome around your brief.</p><button className="commercial-button" onClick={onInquiry}>Submit your requirements <span>↗</span></button></div></section>
  </>;
}
