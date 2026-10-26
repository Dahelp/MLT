"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { scoutEditLink, scoutRequest, type ScoutCard, type ScoutStatus } from "../../content/scout";
import "./base-location.css";
import { scoutCopy, scoutFormat, scoutPath, scoutCategoriesFor } from "../../content/scout-i18n";
import type { OperationsLocale } from "../../content/operations-i18n";

export default function BaseLocationPanel({ locale }: { locale: OperationsLocale }) {
  const t = scoutCopy[locale].admin, statuses = scoutCopy[locale].statuses;
  const [cards, setCards] = useState<ScoutCard[]>([]), [counts, setCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState(""), [search, setSearch] = useState(""), [query, setQuery] = useState(""), [page, setPage] = useState(1), [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [message, setMessage] = useState(""), [refresh, setRefresh] = useState(0), [copied, setCopied] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setMessage(""); setCopied(false);
    scoutRequest("list", { status, search: query, page }, true, locale).then(result => { if (active) { setCards(result.cards); setCounts(result.counts); setTotal(result.total); } }).catch(value => { if (active) setError(value.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [status, query, page, refresh, locale]);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => { setCopied(false); setMessage(""); }, 3500);
    return () => window.clearTimeout(timer);
  }, [copied]);
  const find = (event: FormEvent) => { event.preventDefault(); setPage(1); setQuery(search.trim()); };
  const copyForm = async () => { try { await navigator.clipboard.writeText(`${location.origin}${scoutPath(locale)}`); setCopied(true); setMessage(t.linkCopied); } catch { setMessage(scoutFormat(t.scoutLink, { url: `${location.origin}${scoutPath(locale)}` })); } };
  return <section className="base-location-panel" lang={locale}>
    <div className="base-location-controls">
      <div className="base-location-toolbar">
        <nav className="base-location-filters" aria-label={t.filterLabel}>{[["", t.all], ...Object.entries(statuses)].map(([value, label]) => <button key={value} type="button" aria-pressed={status === value} onClick={() => { setStatus(value); setPage(1); }}><span>{label}</span><b>{value ? counts[value] || 0 : Object.values(counts).reduce((sum, count) => sum + count, 0)}</b></button>)}</nav>
        <div className="base-location-tools" role="group" aria-label={t.tools}>
          <a className="base-location-icon-button" href={scoutPath(locale)} target="_blank" rel="noreferrer" aria-label={t.openForm} title={t.openForm}><ToolbarIcon name="open" /></a>
          <button className={`base-location-icon-button${copied ? " is-copied" : ""}`} type="button" onClick={copyForm} aria-label={t.copyLink} title={t.copyLink}><ToolbarIcon name={copied ? "check" : "copy"} /></button>
          <button className="base-location-icon-button" type="button" onClick={() => setRefresh(value => value + 1)} disabled={loading} aria-label={t.refresh} title={t.refresh}><ToolbarIcon name="refresh" spinning={loading} /></button>
          {message && <p role="status" className="base-location-toast"><ToolbarIcon name={copied ? "check" : "copy"} /><span>{message}</span></p>}
        </div>
      </div>
      <form className="base-location-search" onSubmit={find}><input aria-label={t.searchLabel} placeholder={t.searchPlaceholder} maxLength={180} value={search} onChange={event => setSearch(event.target.value)} /><button type="submit" className="base-location-icon-button" aria-label={t.search} title={t.search}><ToolbarIcon name="search" /></button></form>
    </div>
    <p className="base-location-help">{t.help}</p>
    {error && <p className="base-location-error" role="alert">{error}</p>}
    {loading ? <p role="status">{t.loading}</p> : <><div className="base-location-grid">{cards.map(card => <LocationCard key={`${card.reference}:${card.version}`} card={card} locale={locale} onChanged={() => setRefresh(value => value + 1)} />)}</div>{cards.length === 0 && !error && <div className="base-location-empty"><h2>{query ? t.noResults : t.emptyTitle}</h2><p>{query ? t.noResultsHelp : t.emptyHelp}</p></div>}{(page > 1 || total > 24) && <div className="base-location-pagination"><button disabled={page === 1} onClick={() => setPage(value => value - 1)}>{t.previous}</button><span>{scoutFormat(t.pagination, { page, total })}</span><button disabled={page * 24 >= total} onClick={() => setPage(value => value + 1)}>{t.next}</button></div>}</>}
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

function ToolbarIcon({ name, spinning = false }: { name: "open" | "copy" | "refresh" | "check" | "search"; spinning?: boolean }) {
  const paths: Record<typeof name, ReactNode> = {
    open: <><path d="M14 3h7v7M21 3 11 13" /><path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" /></>,
    copy: <><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.2 6.2A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.8 5.8" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  };
  return <svg className={spinning ? "is-spinning" : undefined} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
