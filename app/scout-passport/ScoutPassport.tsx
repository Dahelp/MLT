"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { emptyScoutFields, scoutEditLink, scoutRequest, type ScoutCard, type ScoutFields } from "../../content/scout";
import { changeSiteLocale, siteIdentity } from "../../content/site";
import { scoutCopy, scoutFormat, scoutPath, scoutCategoriesFor } from "../../content/scout-i18n";
import type { Locale } from "../../content/i18n";
import SiteHeader from "../SiteHeader";
import PhotoCapture from "./PhotoCapture";
import { newScoutIdentity, scoutDraft } from "./draft";

const photoSlots = () => ["", "", "", ""];

export default function ScoutPassport({ locale = "ru" }: { locale?: Locale }) {
  const t = scoutCopy[locale].form, statuses = scoutCopy[locale].statuses;
  const frames = Object.values(scoutCopy[locale].frames), categories = scoutCategoriesFor(locale);
  const [fields, setFields] = useState<ScoutFields>({ ...emptyScoutFields }), [photos, setPhotos] = useState<string[]>(photoSlots);
  const [identity, setIdentity] = useState({ requestId: "", editToken: "" }), [card, setCard] = useState<ScoutCard | null>(null);
  const [loaded, setLoaded] = useState(false), [loadFailed, setLoadFailed] = useState(false), [busy, setBusy] = useState(false), [camera, setCamera] = useState<number | null>(null);
  const [gps, setGps] = useState(false), [gpsMessage, setGpsMessage] = useState(""), [error, setError] = useState(""), [saved, setSaved] = useState(""), [copied, setCopied] = useState(false);
  const message = useRef<HTMLDivElement>(null), gpsRequest = useRef(0), mounted = useRef(true);
  const editable = !card || card.status === "revision";
  const draftKey = card ? `${card.reference}:${card.version}` : "new";
  const formLocked = busy || !loaded || loadFailed;

  useEffect(() => {
    // A regenerated capability can arrive as a fragment-only navigation in an already open tab.
    const incomingLink = () => { if (new URLSearchParams(location.search).has("reference")) location.reload(); };
    window.addEventListener("hashchange", incomingLink);
    return () => window.removeEventListener("hashchange", incomingLink);
  }, []);

  useEffect(() => {
    mounted.current = true;
    document.documentElement.lang = locale;
    let active = true;
    const load = async () => {
      const reference = new URLSearchParams(location.search).get("reference");
      const editToken = new URLSearchParams(location.hash.slice(1)).get("key") || "";
      try {
        if (reference) {
          if (!editToken) throw new Error(t.missingKey);
          const result = await scoutRequest("read", { reference, editToken }, false, locale);
          if (!active) return;
          const restored = await scoutDraft("get", `${reference}:${result.card.version}`).catch(() => undefined);
          setCard(result.card); setFields(restored?.fields || result.card); setPhotos(restored?.photos || [...result.card.photos, ...photoSlots()].slice(0, 4));
          setIdentity({ requestId: restored?.requestId || crypto.randomUUID(), editToken });
        } else {
          const restored = await scoutDraft("get", "new").catch(() => undefined);
          if (!active) return;
          if (restored) { setFields(restored.fields); setPhotos(restored.photos); setIdentity({ requestId: restored.requestId, editToken: restored.editToken }); setSaved(t.draftRestored); }
          else setIdentity(newScoutIdentity());
        }
      } catch (value) { if (active) { setError(value instanceof Error ? value.message : scoutCopy[locale].errors.requestFailed); setLoadFailed(true); } }
      finally { if (active) setLoaded(true); }
    };
    void load();
    return () => { active = false; mounted.current = false; gpsRequest.current++; };
  }, []);

  useEffect(() => {
    if (!loaded || !editable || loadFailed) return;
    const timer = window.setTimeout(() => {
      void scoutDraft("put", draftKey, { fields, photos, ...identity }).then(() => setSaved(t.draftSaved)).catch(() => setSaved(t.draftUnavailable));
    }, 500);
    return () => clearTimeout(timer);
  }, [fields, photos, identity, loaded, editable, loadFailed, draftKey]);

  const change = (name: keyof ScoutFields, value: string) => setFields(current => ({ ...current, [name]: value }));
  const locate = () => {
    if (!navigator.geolocation) { setGpsMessage(t.gpsUnavailable); return; }
    const request = ++gpsRequest.current;
    setGps(true); setGpsMessage("");
    navigator.geolocation.getCurrentPosition(position => {
      if (request !== gpsRequest.current || !mounted.current) return;
      setFields(current => ({ ...current, latitude: position.coords.latitude.toFixed(7), longitude: position.coords.longitude.toFixed(7) }));
      setGpsMessage(scoutFormat(t.gpsFound, { accuracy: Math.round(position.coords.accuracy) })); setGps(false);
    }, value => {
      if (request !== gpsRequest.current || !mounted.current) return;
      setGpsMessage(value.code === 1 ? t.gpsDenied : t.gpsFailed); setGps(false);
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formLocked) return;
    const attached = photos.filter(Boolean);
    if (attached.length < 2) { setError(scoutCopy[locale].errors.photoCount); message.current?.focus(); return; }
    setBusy(true); setError("");
    try {
      const result = await scoutRequest(card ? "resubmit" : "submit", { ...fields, ...identity, photos: attached, ...(card ? { reference: card.reference, version: card.version } : {}), website: new FormData(event.currentTarget).get("website") || "" }, false, locale);
      // Keep the capability in the shareable URL before clearing the local draft.
      history.replaceState(null, "", scoutEditLink(result.card.reference, identity.editToken, locale));
      setCard(result.card); setSaved("");
      await scoutDraft("delete", draftKey).catch(() => {});
      requestAnimationFrame(() => { message.current?.focus(); message.current?.scrollIntoView({ block: "center", behavior: "smooth" }); });
    } catch (value) { setError(value instanceof Error ? value.message : scoutCopy[locale].errors.offline); message.current?.focus(); }
    finally { setBusy(false); }
  };
  const copy = async () => { if (!card) return; try { await navigator.clipboard.writeText(scoutEditLink(card.reference, identity.editToken, locale)); setCopied(true); } catch { setError(t.copyFallback); } };
  const startNew = () => { history.replaceState(null, "", scoutPath(locale)); setCard(null); setFields({ ...emptyScoutFields }); setPhotos(photoSlots()); setIdentity(newScoutIdentity()); setError(""); setSaved(""); setCopied(false); setGpsMessage(""); window.scrollTo(0, 0); };

  const switchLocale = async (next: Locale) => {
    if (next === locale) return;
    if (loaded && editable && !loadFailed) {
      try { await scoutDraft("put", draftKey, { fields, photos, ...identity }); }
      catch { setError(t.draftUnavailable); return; }
    }
    changeSiteLocale(next);
  };

  return <main className="scout-page" lang={locale}>
    <SiteHeader locale={locale} onLocaleChange={switchLocale} />
    <header className="scout-banner"><div className="scout-banner-inner"><a href={`/${locale}/`} aria-label={t.home}><img src={siteIdentity.headerLogo} alt="MLT — Move. Live. Travel." width="160" height="60" /></a><div><p>{t.bannerEyebrow}</p><h1>MLT Scout Passport</h1><span>{t.tagline}</span></div><span className="scout-banner-mark" aria-hidden="true">{t.fieldNotes} / 01</span></div></header>
    <div className="scout-content">
      <div ref={message} tabIndex={-1} className="scout-feedback" aria-live="polite">
        {error && <p className="scout-error" role="alert">{error}</p>}
        {card && <section className="scout-receipt"><p className="scout-eyebrow">{card.reference}</p><h2>{statuses[card.status]}</h2><p>{scoutCopy[locale].receipt[card.status]}</p>{card.reviewNote && <blockquote>{card.reviewNote}</blockquote>}<button type="button" onClick={() => location.reload()}>{t.refreshStatus}</button><button type="button" onClick={copy}>{copied ? t.copiedStatus : t.copyStatus}</button><small>{t.linkHelp}</small>{!editable && <button type="button" className="scout-primary" onClick={startNew}>{t.addAnother}</button>}</section>}
      </div>
      {editable && !loadFailed && <form onSubmit={submit} className="scout-form">
        <fieldset disabled={formLocked}><section className="scout-section"><div className="scout-section-title"><span>01</span><h2>{t.sectionScout}</h2></div><label>{t.scoutName} <em>*</em><input required name="scoutName" autoComplete="name" maxLength={120} value={fields.scoutName} placeholder={t.scoutPlaceholder} onChange={event => change("scoutName", event.target.value)} /></label></section>
        <section className="scout-section"><div className="scout-section-title"><span>02</span><h2>{t.sectionCategory}</h2></div><div className="scout-categories" role="radiogroup" aria-label={t.sectionCategory}>{categories.map(category => <label key={category.id} className={fields.category === category.id ? "selected" : ""}><input type="radio" name="category" value={category.id} checked={fields.category === category.id} onChange={() => change("category", category.id)} /><strong>{category.title}</strong><span>{category.hint}</span></label>)}</div></section>
        <section className="scout-section"><div className="scout-section-title"><span>03</span><h2>{t.sectionLocation}</h2></div><label>{t.title} <em>*</em><input name="title" required maxLength={180} value={fields.title} placeholder={t.titlePlaceholder} onChange={event => change("title", event.target.value)} /></label><label>{t.country} <em>*</em><input required name="country" maxLength={100} value={fields.country} placeholder={t.countryPlaceholder} onChange={event => change("country", event.target.value)} /></label><button type="button" className="scout-gps" disabled={gps} onClick={locate}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></svg>{gps ? t.gpsBusy : t.gps}</button><div className="scout-pair"><label>{t.latitude} <em>*</em><input required name="latitude" type="number" step="any" min="-90" max="90" inputMode="decimal" value={fields.latitude} placeholder="45.983261" onChange={event => { gpsRequest.current++; setGps(false); change("latitude", event.target.value); }} /></label><label>{t.longitude} <em>*</em><input required name="longitude" type="number" step="any" min="-180" max="180" inputMode="decimal" value={fields.longitude} placeholder="9.259831" onChange={event => { gpsRequest.current++; setGps(false); change("longitude", event.target.value); }} /></label></div><p className="scout-hint" role="status">{gpsMessage || t.gpsHint}</p></section>
        <section className="scout-section"><div className="scout-section-title"><span>04</span><h2>{t.sectionDetails}</h2></div><label>{t.description} <em>*</em><textarea required name="description" maxLength={3000} rows={4} value={fields.description} placeholder={t.descriptionPlaceholder} onChange={event => change("description", event.target.value)} /></label><div className="scout-pair"><label>{t.parking}<input name="parking" maxLength={500} value={fields.parking} placeholder={t.parkingPlaceholder} onChange={event => change("parking", event.target.value)} /></label><label>{t.booking}<input name="booking" maxLength={500} value={fields.booking} placeholder={t.bookingPlaceholder} onChange={event => change("booking", event.target.value)} /></label></div></section>
        <section className="scout-section"><div className="scout-section-title"><span>05</span><h2>{t.sectionPhotos}</h2></div><p className="scout-photo-description">{t.photosHelp}</p><div className="scout-photos">{frames.map((title, index) => <div className="scout-photo" key={index}><button type="button" onClick={() => setCamera(index)} aria-label={scoutFormat(photos[index] ? t.retakeFrame : t.addFrame, { number: index + 1, title })}>{photos[index] ? <img src={photos[index]} alt={scoutFormat(t.frame, { number: index + 1 }) + ": " + title} /> : <><span className="scout-plus">+</span><strong>{scoutFormat(t.frame, { number: index + 1 })}</strong><span>{title}</span></>}<i>3:4</i></button>{photos[index] && <button type="button" className="scout-photo-remove" onClick={() => setPhotos(current => current.map((photo, slot) => slot === index ? "" : photo))} aria-label={scoutFormat(t.removeFrame, { number: index + 1 })}>×</button>}</div>)}</div><p className="scout-hint">{scoutFormat(t.photoCount, { count: photos.filter(Boolean).length })}</p></section>
        <div className="scout-submit"><label className="scout-trap" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label><p>{t.checkDetails} <span>{t.required}</span></p><button className="scout-primary" disabled={formLocked || gps} type="submit">{busy ? t.sending : card ? t.resubmit : t.submit}</button><span className="scout-save-state" role="status">{loaded ? saved : t.loading}</span></div></fieldset>
      </form>}
    </div>
    {camera !== null && <PhotoCapture locale={locale} index={camera} onClose={() => setCamera(null)} onSave={photo => { setPhotos(current => current.map((value, index) => index === camera ? photo : value)); setCamera(null); }} />}
  </main>;
}
