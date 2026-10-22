"use client";

import { useEffect, useMemo, useState } from "react";
import type { Listing } from "./Acquisitions";
import { acquisitionText, acquisitionMoney, acquisitionLocale } from "../../../content/acquisition-i18n";
import HeroBannerImage from "../../HeroBannerImage";

const photo = (item: Listing) => {
  try { const value = JSON.parse(item.images_json); return Array.isArray(value) && typeof value[0] === "string" ? value[0] : ""; } catch { return ""; }
};

export default function MarketplaceHome({ locale, items, loading, onInquiry }: { locale: string; items: Listing[]; loading: boolean; onInquiry: () => void }) {
  const t = (text: string) => acquisitionText(text, locale);
  const money = (value: number) => acquisitionMoney(value, locale);
  const [capsuleMode, setCapsuleMode] = useState<boolean | null>(null), [type, setType] = useState("motorhome"), [query, setQuery] = useState(""), [max, setMax] = useState(""), [year, setYear] = useState(""), [mileage, setMileage] = useState(""), [area, setArea] = useState(""), [sort, setSort] = useState("newest");
  useEffect(() => { setCapsuleMode(new URLSearchParams(window.location.search).get("category") === "capsule"); }, []);
  const filterOptions = useMemo(() => {
    const inventory = items.filter(item => !type || item.type === type);
    const numbers = (values: (string | number | null)[]) => [...new Set(values.filter(value => value !== null && value !== "").map(Number).filter(value => Number.isFinite(value) && value >= 0))].sort((a, b) => a - b);
    return {
      models: [...new Set(inventory.map(item => item.title))].sort(),
      years: numbers(inventory.map(item => item.year)).filter(value => value > 0).reverse(),
      prices: numbers(inventory.map(item => item.price)),
      mileages: numbers(inventory.map(item => item.mileage)),
    };
  }, [items, type]);
  const results = useMemo(() => items.filter(item =>
    (!type || item.type === type) &&
    (!query || `${item.title} ${item.subtitle} ${item.type}`.toLowerCase().includes(query.toLowerCase())) &&
    (!max || Number(item.price) <= Number(max)) &&
    (!year || (item.year != null && Number(item.year) >= Number(year))) &&
    (!mileage || item.type !== "motorhome" || (item.mileage ?? Infinity) <= Number(mileage)) &&
    (!area || item.type !== "capsule" || (item.area_m2 ?? 0) >= Number(area))
  ).sort((a, b) => sort === "price-asc" ? Number(a.price) - Number(b.price) : sort === "price-desc" ? Number(b.price) - Number(a.price) : b.id - a.id), [items, type, query, max, year, mileage, area, sort]);
  const realCount = items.filter(item => !item.demo && item.type === "motorhome").length;
  const clear = () => { setType("motorhome"); setQuery(""); setMax(""); setYear(""); setMileage(""); setArea(""); };

  if (capsuleMode) return <><section className="commercial-hero acquisition-hero market-hero market-capsule-hero photo-hero"><HeroBannerImage name="capsule-home"/><div className="commercial-hero-content"><p className="commercial-eyebrow">{t("MLT / Capsule homes")}</p><h1>{t("A new way")}<br/><em>{t("to feel at home.")}</em></h1><p>{t("Capsule homes are coming to the MLT collection. Tell our team what you are looking for and we will contact you when suitable options become available.")}</p><button className="commercial-button" onClick={onInquiry}>{t("Register your interest")}</button></div></section><section className="commercial-section market-capsule-note"><p className="commercial-eyebrow">{t("A collection in preparation")}</p><h2>{t("Thoughtfully designed.")}<br/><em>{t("Worth waiting for.")}</em></h2><p>{t("There are currently no capsule homes listed for sale. Our sales team can discuss your preferred layout, size and location in advance.")}</p><button className="commercial-button" onClick={onInquiry}>{t("Contact the sales team")}</button></section></>;
  return <>
    <section className="commercial-hero acquisition-hero market-hero photo-hero">
      {capsuleMode === false && <HeroBannerImage name="motorhomes"/>}
      <div className="commercial-hero-content"><p className="commercial-eyebrow">{t("MLT / Acquisitions")}</p><h1>{t("Find your next")}<br/><em>{t("residence on wheels.")}</em></h1><p>{t("Explore premium motorhomes, compare the details and enquire directly with the MLT sales team.")}</p></div>
    </section>

    <section className="market-search" aria-label={t("Search residences")}>
      <div className="market-search-fields"><label>{t("Search model or residence")}<input list="market-model-options" value={query} onChange={event => setQuery(event.target.value)} placeholder={t("Search listed models")} /><datalist id="market-model-options">{filterOptions.models.map(value => <option value={value} key={value}/>)}</datalist></label><label>{t("Price up to")}<select value={max} onChange={event => setMax(event.target.value)} disabled={loading}><option value="">{t("Any price")}</option>{filterOptions.prices.map(value => <option value={value} key={value}>{money(value)}</option>)}</select></label><label>{t("From year")}<select value={year} onChange={event => setYear(event.target.value)} disabled={loading}><option value="">{t("Any year")}</option>{filterOptions.years.map(value => <option value={value} key={value}>{value}</option>)}</select></label><label>{t("Maximum mileage")}<select value={mileage} onChange={event => setMileage(event.target.value)} disabled={loading}><option value="">{t("Any mileage")}</option>{filterOptions.mileages.map(value => <option value={value} key={value}>{new Intl.NumberFormat(acquisitionLocale(locale)).format(value)} km</option>)}</select></label><a className="commercial-button" href="#market-results">{t("View results")} ({results.length})</a></div>
      <div className="market-search-actions"><button type="button" onClick={clear}>{t("Clear filters")}</button></div>
    </section>

    <section className="commercial-section market-results" id="market-results"><div className="market-results-header"><div><p className="commercial-eyebrow">{t("MLT / The marketplace")}</p><h2>{t("Explore motorhomes")}</h2><p>{loading ? t("Loading residences…") : `${t("Currently listed")}: ${realCount}${items.some(item => item.demo) ? ` · ${t("Demonstration listings")}: ${items.filter(item => item.demo).length}` : ""}`}</p></div><div className="market-results-actions"><label>{t("Sort by")}<select value={sort} onChange={event => setSort(event.target.value)}><option value="newest">{t("Newest")}</option><option value="price-asc">{t("Price: low to high")}</option><option value="price-desc">{t("Price: high to low")}</option></select></label></div></div>
      {results.length ? <div className="market-grid">{results.map(item => <a className="market-card" key={item.id} href={`/${locale}/acquisitions/${item.slug}/`} aria-label={`${t("View details")}: ${item.title}`}><div className="market-card-media">{photo(item) ? <img src={photo(item)} alt={item.title} loading="lazy"/> : <span className="market-card-placeholder">MLT</span>}<span className="market-card-badge">{item.demo ? t("DEMO · NOT FOR SALE") : item.certified ? t("CERTIFIED BY MLT") : t("MLT SELECTION")}</span></div><div className="market-card-body"><p className="market-card-type">{item.type === "capsule" ? t("Capsule home") : t("Motorhome")} <span>·</span> {item.demo ? t("Illustrative example") : item.status === "sold" ? t("Sold") : t("Available")}</p><h3>{item.title}</h3><p>{item.subtitle}</p><strong>{item.demo ? `${t("Example")} ` : ""}{money(Number(item.price))}</strong><div className="market-card-spec"><span>{item.year || t("Year on request")}</span><span>{item.type === "motorhome" ? item.mileage != null ? `${new Intl.NumberFormat(acquisitionLocale(locale)).format(item.mileage)} km` : t("Mileage on request") : item.area_m2 != null ? `${item.area_m2} m²` : t("Area on request")}</span><span>{item.type === "motorhome" ? `${item.berths || "—"} ${t("berths")}` : t("Capsule residence")}</span></div><span className="market-card-link">{t("View details")}</span></div></a>)}</div> : <div className="market-no-results"><h3>{loading ? t("Preparing the collection…") : t("No residences match this search.")}</h3><p>{t("Try another category or tell our sales team what you would like us to source.")}</p><button className="commercial-button" onClick={onInquiry}>{t("Ask our sales team")}</button></div>}
    </section>

    <section className="commercial-section market-concierge"><div><p className="commercial-eyebrow">{t("A more personal way to buy")}</p><h2>{t("Need help")}<br/><em>{t("choosing?")}</em></h2></div><div><p>{t("Tell us the model or layout you have in mind. Our professional team will help you find the best fit from our range.")}</p><button className="commercial-button" onClick={onInquiry}>{t("Submit your requirements")}</button></div></section>
  </>;
}
