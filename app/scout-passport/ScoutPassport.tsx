"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { emptyScoutFields, scoutCategories, scoutEditLink, scoutRequest, scoutStatuses, type ScoutCard, type ScoutFields } from "../../content/scout";
import { siteIdentity } from "../../content/site";
import PhotoCapture from "./PhotoCapture";
import { newScoutIdentity, scoutDraft } from "./draft";

const frames = ["Главный вид", "Интерьер / окружение", "Деталь", "Ещё один ракурс"];
const photoSlots = () => ["", "", "", ""];

export default function ScoutPassport() {
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
    let active = true;
    const load = async () => {
      const reference = new URLSearchParams(location.search).get("reference");
      const editToken = new URLSearchParams(location.hash.slice(1)).get("key") || "";
      try {
        if (reference) {
          if (!editToken) throw new Error("Откройте полную персональную ссылку, включая ключ после #.");
          const result = await scoutRequest("read", { reference, editToken });
          if (!active) return;
          const restored = await scoutDraft("get", `${reference}:${result.card.version}`).catch(() => undefined);
          setCard(result.card); setFields(restored?.fields || result.card); setPhotos(restored?.photos || [...result.card.photos, ...photoSlots()].slice(0, 4));
          setIdentity({ requestId: restored?.requestId || crypto.randomUUID(), editToken });
        } else {
          const restored = await scoutDraft("get", "new").catch(() => undefined);
          if (!active) return;
          if (restored) { setFields(restored.fields); setPhotos(restored.photos); setIdentity({ requestId: restored.requestId, editToken: restored.editToken }); setSaved("Черновик восстановлен на этом устройстве"); }
          else setIdentity(newScoutIdentity());
        }
      } catch (value) { if (active) { setError(value instanceof Error ? value.message : "Не удалось открыть карточку."); setLoadFailed(true); } }
      finally { if (active) setLoaded(true); }
    };
    void load();
    return () => { active = false; mounted.current = false; gpsRequest.current++; };
  }, []);

  useEffect(() => {
    if (!loaded || !editable || loadFailed) return;
    const timer = window.setTimeout(() => {
      void scoutDraft("put", draftKey, { fields, photos, ...identity }).then(() => setSaved("Черновик сохранён на этом устройстве")).catch(() => setSaved("Автосохранение недоступно. Не закрывайте страницу до отправки."));
    }, 500);
    return () => clearTimeout(timer);
  }, [fields, photos, identity, loaded, editable, loadFailed, draftKey]);

  const change = (name: keyof ScoutFields, value: string) => setFields(current => ({ ...current, [name]: value }));
  const locate = () => {
    if (!navigator.geolocation) { setGpsMessage("Геолокация недоступна. Введите координаты вручную."); return; }
    const request = ++gpsRequest.current;
    setGps(true); setGpsMessage("");
    navigator.geolocation.getCurrentPosition(position => {
      if (request !== gpsRequest.current || !mounted.current) return;
      setFields(current => ({ ...current, latitude: position.coords.latitude.toFixed(7), longitude: position.coords.longitude.toFixed(7) }));
      setGpsMessage(`Координаты определены. Точность около ${Math.round(position.coords.accuracy)} м.`); setGps(false);
    }, value => {
      if (request !== gpsRequest.current || !mounted.current) return;
      setGpsMessage(value.code === 1 ? "Разрешите доступ к геопозиции в настройках браузера или введите координаты вручную." : "Не удалось определить местоположение. Выйдите на открытое место и повторите или введите координаты вручную."); setGps(false);
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formLocked) return;
    const attached = photos.filter(Boolean);
    if (attached.length < 2) { setError("Добавьте минимум два снимка: главный вид и интерьер или окружение."); message.current?.focus(); return; }
    setBusy(true); setError("");
    try {
      const result = await scoutRequest(card ? "resubmit" : "submit", { ...fields, ...identity, photos: attached, ...(card ? { reference: card.reference, version: card.version } : {}), website: new FormData(event.currentTarget).get("website") || "" });
      // Keep the capability in the shareable URL before clearing the local draft.
      history.replaceState(null, "", scoutEditLink(result.card.reference, identity.editToken));
      setCard(result.card); setSaved("");
      await scoutDraft("delete", draftKey).catch(() => {});
      requestAnimationFrame(() => { message.current?.focus(); message.current?.scrollIntoView({ block: "center", behavior: "smooth" }); });
    } catch (value) { setError(value instanceof Error ? value.message : "Не удалось отправить. Проверьте интернет и повторите."); message.current?.focus(); }
    finally { setBusy(false); }
  };
  const copy = async () => { if (!card) return; try { await navigator.clipboard.writeText(scoutEditLink(card.reference, identity.editToken)); setCopied(true); } catch { setError("Скопируйте адрес страницы из строки браузера — это ваша персональная ссылка."); } };
  const startNew = () => { history.replaceState(null, "", "/scout-passport/"); setCard(null); setFields({ ...emptyScoutFields }); setPhotos(photoSlots()); setIdentity(newScoutIdentity()); setError(""); setSaved(""); setCopied(false); setGpsMessage(""); window.scrollTo(0, 0); };

  return <main className="scout-page" lang="ru">
    <header className="scout-banner"><div className="scout-banner-inner"><a href="/ru/" aria-label="MLT — на главную"><img src={siteIdentity.headerLogo} alt="MLT — Move. Live. Travel." width="160" height="60" /></a><div><p>THE ART OF FINDING PLACES</p><h1>MLT Scout Passport</h1><span>Curate. Capture. Contribute to the MLT route</span></div><span className="scout-banner-mark" aria-hidden="true">FIELD<br />NOTES / 01</span></div></header>
    <div className="scout-content">
      <div className="scout-intro"><p className="scout-eyebrow">MLT / LOCATION DISCOVERY</p><h2>{card ? "Ваше открытие — в MLT Base" : "Места, ради которых стоит свернуть."}</h2><p>Сохраните атмосферу места, его координаты и детали. Из ваших открытий складываются маршруты MLT.</p><div className="scout-meta"><span>01 локация</span><span>02–04 снимка</span><span>Ваш взгляд</span></div></div>
      <div ref={message} tabIndex={-1} className="scout-feedback" aria-live="polite">
        {error && <p className="scout-error" role="alert">{error}</p>}
        {card && <section className="scout-receipt"><p className="scout-eyebrow">{card.reference}</p><h2>{scoutStatuses[card.status]}</h2><p>{card.status === "pending" ? "Карточка отправлена команде MLT. Она появится на карте после проверки и публикации администратором." : card.status === "revision" ? "Команда просит дополнить карточку. Внесите изменения ниже и отправьте её повторно." : card.status === "accepted" ? "Спасибо за ваше открытие. Команда MLT приняла карточку." : "Команда рассмотрела карточку. Вы можете предложить другую локацию."}</p>{card.reviewNote && <blockquote>{card.reviewNote}</blockquote>}<button type="button" onClick={() => location.reload()}>Обновить статус</button><button type="button" onClick={copy}>{copied ? "Персональная ссылка скопирована" : "Сохранить ссылку на статус карточки"}</button><small>Ссылка даёт доступ к этой карточке. Сохраните её для проверки статуса и доработки.</small>{!editable && <button type="button" className="scout-primary" onClick={startNew}>Добавить ещё одну локацию</button>}</section>}
      </div>
      {editable && !loadFailed && <form onSubmit={submit} className="scout-form">
        <fieldset disabled={formLocked}><section className="scout-section"><div className="scout-section-title"><span>01</span><h2>Кто открывает место</h2></div><label>Имя скаута <em>*</em><input required name="scoutName" autoComplete="name" maxLength={120} value={fields.scoutName} placeholder="Например, Александр Верн" onChange={event => change("scoutName", event.target.value)} /></label></section>
        <section className="scout-section"><div className="scout-section-title"><span>02</span><h2>Категория места</h2></div><div className="scout-categories" role="radiogroup" aria-label="Категория места">{scoutCategories.map(category => <label key={category.id} className={fields.category === category.id ? "selected" : ""}><input type="radio" name="category" value={category.id} checked={fields.category === category.id} onChange={() => change("category", category.id)} /><strong>{category.title}</strong><span>{category.hint}</span></label>)}</div></section>
        <section className="scout-section"><div className="scout-section-title"><span>03</span><h2>Название и координаты</h2></div><label>Название локации <em>*</em><input name="title" required maxLength={180} value={fields.title} placeholder="Например, Ristorante La Punta" onChange={event => change("title", event.target.value)} /></label><label>Страна / регион <em>*</em><input required name="country" maxLength={100} value={fields.country} placeholder="Например, Italy" onChange={event => change("country", event.target.value)} /></label><button type="button" className="scout-gps" disabled={gps} onClick={locate}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></svg>{gps ? "Определяем координаты…" : "Определить моё местоположение"}</button><div className="scout-pair"><label>Широта <em>*</em><input required name="latitude" type="number" step="any" min="-90" max="90" inputMode="decimal" value={fields.latitude} placeholder="45.983261" onChange={event => { gpsRequest.current++; setGps(false); change("latitude", event.target.value); }} /></label><label>Долгота <em>*</em><input required name="longitude" type="number" step="any" min="-180" max="180" inputMode="decimal" value={fields.longitude} placeholder="9.259831" onChange={event => { gpsRequest.current++; setGps(false); change("longitude", event.target.value); }} /></label></div><p className="scout-hint" role="status">{gpsMessage || "Нажмите GPS, находясь на месте. Координаты можно уточнить вручную."}</p></section>
        <section className="scout-section"><div className="scout-section-title"><span>04</span><h2>Атмосфера и детали</h2></div><label>Краткий pitch для сайта <em>*</em><textarea required name="description" maxLength={3000} rows={4} value={fields.description} placeholder="Что делает это место особенным? Атмосфера, лучший вид, личное впечатление…" onChange={event => change("description", event.target.value)} /></label><div className="scout-pair"><label>Парковка / заезд<input name="parking" maxLength={500} value={fields.parking} placeholder="Есть, 150 м от входа" onChange={event => change("parking", event.target.value)} /></label><label>Бронирование<input name="booking" maxLength={500} value={fields.booking} placeholder="За 2 дня, по телефону" onChange={event => change("booking", event.target.value)} /></label></div></section>
        <section className="scout-section"><div className="scout-section-title"><span>05</span><h2>Место вашими глазами</h2></div><p className="scout-photo-description">От 2 до 4 вертикальных снимков. Нажмите «+», чтобы открыть камеру с рамкой 3:4.</p><div className="scout-photos">{frames.map((title, index) => <div className="scout-photo" key={title}><button type="button" onClick={() => setCamera(index)} aria-label={`${photos[index] ? "Переснять" : "Добавить"} кадр ${index + 1}: ${title}`}>{photos[index] ? <img src={photos[index]} alt={`Кадр ${index + 1}: ${title}`} /> : <><span className="scout-plus">+</span><strong>Кадр {index + 1}</strong><span>{title}</span></>}<i>3:4</i></button>{photos[index] && <button type="button" className="scout-photo-remove" onClick={() => setPhotos(current => current.map((photo, slot) => slot === index ? "" : photo))} aria-label={`Удалить кадр ${index + 1}`}>×</button>}</div>)}</div><p className="scout-hint">{photos.filter(Boolean).length} из 4 снимков · минимум 2</p></section>
        <div className="scout-submit"><label className="scout-trap" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label><p>Проверьте детали перед отправкой. <span>* — обязательные поля</span></p><button className="scout-primary" disabled={formLocked || gps} type="submit">{busy ? "Отправляем карточку…" : card ? "Отправить доработанную карточку" : "Отправить карточку в MLT Base"}</button><span className="scout-save-state" role="status">{loaded ? saved : "Загружаем ваш паспорт…"}</span></div></fieldset>
      </form>}
    </div>
    {camera !== null && <PhotoCapture index={camera} onClose={() => setCamera(null)} onSave={photo => { setPhotos(current => current.map((value, index) => index === camera ? photo : value)); setCamera(null); }} />}
  </main>;
}
