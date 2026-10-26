"use client";

import { useEffect, useState, type FormEvent } from "react";
import { scoutEditLink, scoutRequest, type ScoutCard, type ScoutStatus } from "../../content/scout";
import "./base-location.css";
import { scoutCopy, scoutFormat, scoutPath, scoutCategoriesFor } from "../../content/scout-i18n";
import type { OperationsLocale } from "../../content/operations-i18n";

export default function BaseLocationPanel({ locale }: { locale: OperationsLocale }) {
  const t = scoutCopy[locale].admin, statuses = scoutCopy[locale].statuses;
  const [cards, setCards] = useState<ScoutCard[]>([]), [counts, setCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState(""), [search, setSearch] = useState(""), [query, setQuery] = useState(""), [page, setPage] = useState(1), [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [message, setMessage] = useState(""), [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setMessage("");
    scoutRequest("list", { status, search: query, page }, true, locale).then(result => { if (active) { setCards(result.cards); setCounts(result.counts); setTotal(result.total); } }).catch(value => { if (active) setError(value.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [status, query, page, refresh, locale]);
  const find = (event: FormEvent) => { event.preventDefault(); setPage(1); setQuery(search.trim()); };
  const copyForm = async () => { try { await navigator.clipboard.writeText(`${location.origin}${scoutPath(locale)}`); setMessage(t.linkCopied); } catch { setMessage(scoutFormat(t.scoutLink, { url: `${location.origin}${scoutPath(locale)}` })); } };
  return <section className="base-location-panel" lang={locale}>
    <div className="base-location-toolbar"><div><a href={scoutPath(locale)} target="_blank" rel="noreferrer">{t.openForm}</a><button type="button" onClick={copyForm}>{t.copyLink}</button></div><button type="button" onClick={() => setRefresh(value => value + 1)} disabled={loading}>{t.refresh}</button></div>
    <nav className="base-location-filters" aria-label={t.filterLabel}>{[["", t.all], ...Object.entries(statuses)].map(([value, label]) => <button key={value} type="button" aria-pressed={status === value} onClick={() => { setStatus(value); setPage(1); }}>{label}<b>{value ? counts[value] || 0 : Object.values(counts).reduce((sum, count) => sum + count, 0)}</b></button>)}</nav>
    <form className="base-location-search" onSubmit={find}><input aria-label={t.searchLabel} placeholder={t.searchPlaceholder} maxLength={180} value={search} onChange={event => setSearch(event.target.value)} /><button>{t.search}</button></form>
    <p className="base-location-help">{t.help}</p>
    {error && <p className="base-location-error" role="alert">{error}</p>}{message && <p role="status" className="base-location-message">{message}</p>}
    {loading ? <p role="status">{t.loading}</p> : <><div className="base-location-grid">{cards.map(card => <LocationCard key={`${card.reference}:${card.version}`} card={card} locale={locale} onChanged={() => setRefresh(value => value + 1)} />)}</div>{cards.length === 0 && !error && <div className="base-location-empty"><h2>{query ? t.noResults : t.emptyTitle}</h2><p>{query ? t.noResultsHelp : t.emptyHelp}</p></div>}<div className="base-location-pagination"><button disabled={page === 1} onClick={() => setPage(value => value - 1)}>{t.previous}</button><span>{scoutFormat(t.pagination, { page, total })}</span><button disabled={page * 24 >= total} onClick={() => setPage(value => value + 1)}>{t.next}</button></div></>}
  </section>;
}

function LocationCard({ card, locale, onChanged }: { card: ScoutCard; locale: OperationsLocale; onChanged: () => void }) {
  const t = scoutCopy[locale].admin, f = scoutCopy[locale].form, statuses = scoutCopy[locale].statuses;
  const [note, setNote] = useState(card.reviewNote), [busy, setBusy] = useState(false), [error, setError] = useState(""), [link, setLink] = useState(""), [version, setVersion] = useState(card.version);
  const act = async (action: string, status?: ScoutStatus) => {
    if (busy) return;
    if (status === "revision" && !note.trim()) { setError(t.revisionComment); return; }
    setBusy(true); setError("");
    try { await scoutRequest(action, { reference: card.reference, version, status, reviewNote: note }, true, locale); onChanged(); }
    catch (value) { setError((value as Error).message); setBusy(false); }
  };
  const revisionLink = async () => {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const result = await scoutRequest("revision_link", { reference: card.reference, version }, true, locale);
      const url = scoutEditLink(card.reference, result.editToken, locale);
      // Retain the returned version locally: do not remount and lose the new link.
      setVersion(result.card.version);
      setLink(url);
      try { await navigator.clipboard.writeText(url); } catch { /* the selectable URL remains visible */ }
    } catch (value) { setError((value as Error).message); }
    finally { setBusy(false); }
  };
  const published = card.isPublished;
  return <article className="base-location-card">
    <div className="base-location-cover">{card.photos[0] && <img src={card.photos[0]} alt={card.title} loading="lazy" />}<span className={`base-location-status status-${card.status}`}>{statuses[card.status]}</span>{published && <span className="base-location-published">{t.onMap}</span>}</div>
    <div className="base-location-card-body"><small>{card.reference} · {scoutCategoriesFor(locale).find(category => category.id === card.category)?.title}</small><h2>{card.title}</h2><p className="base-location-place">{card.country} · {card.latitude}, {card.longitude}</p><p className="base-location-description">{card.description}</p><div className="base-location-scout"><span>{card.scoutName}</span><time>{new Date(card.createdAt.replace(" ", "T") + "Z").toLocaleDateString(locale)}</time></div>
    <details><summary>{t.details}</summary><div className="base-location-gallery">{card.photos.map((photo, index) => <a key={`${photo}:${index}`} href={photo} target="_blank" rel="noreferrer"><img src={photo} alt={scoutFormat(f.frame, { number: index + 1 }) + ": " + card.title} loading="lazy" /></a>)}</div><dl><dt>{f.parking}</dt><dd>{card.parking || t.notSpecified}</dd><dt>{f.booking}</dt><dd>{card.booking || t.notSpecified}</dd></dl></details>
    <label>{t.comment}<textarea maxLength={2000} rows={2} placeholder={t.commentPlaceholder} value={note} disabled={busy} onChange={event => setNote(event.target.value)} /></label>
    {error && <p className="base-location-error" role="alert">{error}</p>}
    <div className="base-location-actions"><button type="button" disabled={busy || card.status === "accepted"} onClick={() => act("moderate", "accepted")}>{t.accept}</button><button type="button" disabled={busy || card.status === "rejected"} onClick={() => act("moderate", "rejected")}>{t.reject}</button><button type="button" disabled={busy} onClick={() => act("moderate", "revision")}>{t.revise}</button></div>
    {card.status === "accepted" && <button type="button" className="base-location-map-button" disabled={busy} onClick={() => act(published ? "unpublish" : "publish")}>{busy ? t.saving : published ? t.unpublish : t.publish}</button>}
    {card.status === "revision" && <><button type="button" className="base-location-link-button" disabled={busy} onClick={revisionLink}>{t.revisionLink}</button>{link && <label>{t.sendLink}<input readOnly value={link} onFocus={event => event.currentTarget.select()} /><small>{t.replacesLink}</small></label>}</>}
    </div>
  </article>;
}
