"use client";

import { useEffect, useState, type FormEvent } from "react";
import { scoutCategories, scoutEditLink, scoutRequest, scoutStatuses, type ScoutCard, type ScoutStatus } from "../../content/scout";
import "./base-location.css";

export default function BaseLocationPanel() {
  const [cards, setCards] = useState<ScoutCard[]>([]), [counts, setCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState(""), [search, setSearch] = useState(""), [query, setQuery] = useState(""), [page, setPage] = useState(1), [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [message, setMessage] = useState(""), [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    scoutRequest("list", { status, search: query, page }, true).then(result => { if (active) { setCards(result.cards); setCounts(result.counts); setTotal(result.total); } }).catch(value => { if (active) setError(value.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [status, query, page, refresh]);
  const find = (event: FormEvent) => { event.preventDefault(); setPage(1); setQuery(search.trim()); };
  const copyForm = async () => { try { await navigator.clipboard.writeText(`${location.origin}/scout-passport/`); setMessage("Ссылка на форму скопирована — её можно отправить скаутам."); } catch { setMessage(`Ссылка для скаутов: ${location.origin}/scout-passport/`); } };
  return <section className="base-location-panel">
    <div className="base-location-toolbar"><div><a href="/scout-passport/" target="_blank" rel="noreferrer">Открыть форму скаута</a><button type="button" onClick={copyForm}>Копировать ссылку</button></div><button type="button" onClick={() => setRefresh(value => value + 1)} disabled={loading}>Обновить список</button></div>
    <nav className="base-location-filters" aria-label="Статус локации">{[["", "Все"], ...Object.entries(scoutStatuses)].map(([value, label]) => <button key={value} type="button" aria-pressed={status === value} onClick={() => { setStatus(value); setPage(1); }}>{label}<b>{value ? counts[value] || 0 : Object.values(counts).reduce((sum, count) => sum + count, 0)}</b></button>)}</nav>
    <form className="base-location-search" onSubmit={find}><input aria-label="Поиск локации" placeholder="Название, скаут или номер карточки" maxLength={180} value={search} onChange={event => setSearch(event.target.value)} /><button>Найти</button></form>
    <p className="base-location-help">Примите карточку после проверки. Затем нажмите «Загрузить на карты»: точка появится в Smart Map, на картах сайта и в каталоге точек маршрута.</p>
    {error && <p className="base-location-error" role="alert">{error}</p>}{message && <p role="status" className="base-location-message">{message}</p>}
    {loading ? <p role="status">Загружаем локации…</p> : <><div className="base-location-grid">{cards.map(card => <LocationCard key={`${card.reference}:${card.version}`} card={card} onChanged={() => setRefresh(value => value + 1)} />)}</div>{cards.length === 0 && !error && <div className="base-location-empty"><h2>{query ? "Ничего не найдено" : "Здесь начинаются новые маршруты"}</h2><p>{query ? "Попробуйте другое название или снимите фильтр." : "Отправьте скаутам ссылку на MLT Scout Passport. Новые карточки появятся здесь со статусом «На проверке»."}</p></div>}<div className="base-location-pagination"><button disabled={page === 1} onClick={() => setPage(value => value - 1)}>Назад</button><span>Страница {page} · найдено {total}</span><button disabled={page * 24 >= total} onClick={() => setPage(value => value + 1)}>Далее</button></div></>}
  </section>;
}

function LocationCard({ card, onChanged }: { card: ScoutCard; onChanged: () => void }) {
  const [note, setNote] = useState(card.reviewNote), [busy, setBusy] = useState(false), [error, setError] = useState(""), [link, setLink] = useState(""), [version, setVersion] = useState(card.version);
  const act = async (action: string, status?: ScoutStatus) => {
    if (busy) return;
    if (status === "revision" && !note.trim()) { setError("Напишите, что нужно доработать, в поле комментария."); return; }
    setBusy(true); setError("");
    try { await scoutRequest(action, { reference: card.reference, version, status, reviewNote: note }, true); onChanged(); }
    catch (value) { setError((value as Error).message); setBusy(false); }
  };
  const revisionLink = async () => {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const result = await scoutRequest("revision_link", { reference: card.reference, version }, true);
      const url = scoutEditLink(card.reference, result.editToken);
      // Retain the returned version locally: do not remount and lose the new link.
      setVersion(result.card.version);
      setLink(url);
      try { await navigator.clipboard.writeText(url); } catch { /* the selectable URL remains visible */ }
    } catch (value) { setError((value as Error).message); }
    finally { setBusy(false); }
  };
  const published = card.isPublished;
  return <article className="base-location-card">
    <div className="base-location-cover">{card.photos[0] && <img src={card.photos[0]} alt={card.title} loading="lazy" />}<span className={`base-location-status status-${card.status}`}>{scoutStatuses[card.status]}</span>{published && <span className="base-location-published">На карте</span>}</div>
    <div className="base-location-card-body"><small>{card.reference} · {scoutCategories.find(category => category.id === card.category)?.title}</small><h2>{card.title}</h2><p className="base-location-place">{card.country} · {card.latitude}, {card.longitude}</p><p className="base-location-description">{card.description}</p><div className="base-location-scout"><span>{card.scoutName}</span><time>{new Date(card.createdAt.replace(" ", "T") + "Z").toLocaleDateString("ru")}</time></div>
    <details><summary>Все фотографии и детали</summary><div className="base-location-gallery">{card.photos.map((photo, index) => <a key={`${photo}:${index}`} href={photo} target="_blank" rel="noreferrer"><img src={photo} alt={`Кадр ${index + 1}: ${card.title}`} loading="lazy" /></a>)}</div><dl><dt>Парковка / заезд</dt><dd>{card.parking || "Не указано"}</dd><dt>Бронирование</dt><dd>{card.booking || "Не указано"}</dd></dl></details>
    <label>Комментарий скауту<textarea maxLength={2000} rows={2} placeholder="Что уточнить или почему отклонено" value={note} disabled={busy} onChange={event => setNote(event.target.value)} /></label>
    {error && <p className="base-location-error" role="alert">{error}</p>}
    <div className="base-location-actions"><button type="button" disabled={busy || card.status === "accepted"} onClick={() => act("moderate", "accepted")}>Принять</button><button type="button" disabled={busy || card.status === "rejected"} onClick={() => act("moderate", "rejected")}>Отклонить</button><button type="button" disabled={busy} onClick={() => act("moderate", "revision")}>Доработать</button></div>
    {card.status === "accepted" && <button type="button" className="base-location-map-button" disabled={busy} onClick={() => act(published ? "unpublish" : "publish")}>{busy ? "Сохраняем…" : published ? "Убрать с карт" : "Загрузить на карты"}</button>}
    {card.status === "revision" && <><button type="button" className="base-location-link-button" disabled={busy} onClick={revisionLink}>Создать и скопировать ссылку на доработку</button>{link && <label>Отправьте эту ссылку скауту<input readOnly value={link} onFocus={event => event.currentTarget.select()} /><small>Новая ссылка заменяет предыдущую персональную ссылку этой карточки.</small></label>}</>}
    </div>
  </article>;
}
