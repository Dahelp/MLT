"use client";

import { useEffect, useRef, useState } from "react";

/** Always writes the same 900 × 1200 portrait crop shown in the viewfinder. */
function portrait(source: CanvasImageSource, width: number, height: number) {
  if (!width || !height) throw new Error("Камера ещё не готова. Попробуйте снова.");
  const canvas = document.createElement("canvas");
  canvas.width = 900; canvas.height = 1200;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Не удалось подготовить фото.");
  const cropWidth = Math.min(width, height * 3 / 4), cropHeight = cropWidth * 4 / 3;
  context.drawImage(source, (width - cropWidth) / 2, (height - cropHeight) / 2, cropWidth, cropHeight, 0, 0, 900, 1200);
  let result = canvas.toDataURL("image/jpeg", 0.86);
  if (result.length > 1900000) result = canvas.toDataURL("image/jpeg", 0.7);
  if (result.length > 2000000) throw new Error("Фото слишком большое. Попробуйте другой снимок.");
  return result;
}

export default function PhotoCapture({ index, onSave, onClose }: { index: number; onSave: (photo: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null), dialog = useRef<HTMLDialogElement>(null), file = useRef<HTMLInputElement>(null);
  const stream = useRef<MediaStream | null>(null), cameraWanted = useRef(true);
  const [ready, setReady] = useState(false), [error, setError] = useState(""), [preview, setPreview] = useState(""), [busy, setBusy] = useState(false);
  const stop = () => { stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; };
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    let active = true;
    if (!navigator.mediaDevices?.getUserMedia) setError("Камера недоступна в этом браузере. Откройте камеру телефона кнопкой ниже.");
    else navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" }, aspectRatio: { ideal: 3 / 4 }, width: { ideal: 1200 }, height: { ideal: 1600 } } })
      .then(async value => {
        if (!active || !cameraWanted.current) { value.getTracks().forEach(track => track.stop()); return; }
        stream.current = value;
        if (video.current) { video.current.srcObject = value; await video.current.play(); }
      }).catch(() => { if (active) setError("Нет доступа к камере. Разрешите его в браузере или выберите снимок с телефона."); });
    const hide = () => { if (document.hidden) { stop(); if (active) setReady(false); } };
    document.addEventListener("visibilitychange", hide);
    return () => { active = false; stop(); document.removeEventListener("visibilitychange", hide); document.body.style.overflow = previousOverflow; opener?.focus(); };
  }, []);
  const take = () => {
    try { const source = video.current; if (source) { setPreview(portrait(source, source.videoWidth, source.videoHeight)); stop(); setReady(false); } }
    catch (value) { setError((value as Error).message); }
  };
  const choose = async (image?: File) => {
    if (!image) return;
    setBusy(true); setError("");
    if (image.size > 25 * 1024 * 1024) { setError("Выберите снимок до 25 МБ."); setBusy(false); return; }
    const url = URL.createObjectURL(image);
    try {
      const source = new Image(); source.src = url; await source.decode();
      setPreview(portrait(source, source.naturalWidth, source.naturalHeight)); cameraWanted.current = false; stop(); setReady(false);
    } catch { setError("Не удалось прочитать фото. Используйте JPEG, PNG или WebP."); }
    finally { URL.revokeObjectURL(url); setBusy(false); }
  };
  return <dialog ref={dialog} className="scout-camera" aria-labelledby="camera-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><div><small>MLT / FRAME {String(index + 1).padStart(2, "0")}</small><h2 id="camera-title">Кадр в формате 3:4</h2></div><button type="button" onClick={onClose} aria-label="Закрыть камеру">×</button></header>
    <div className="scout-viewfinder">{preview ? <img src={preview} alt="Предпросмотр снимка 3:4" /> : <video ref={video} autoPlay playsInline muted onLoadedData={() => setReady(true)} />}<span>3:4</span>{!ready && !preview && <p>Наведите камеру на локацию<br />или выберите фото ниже</p>}</div>
    {error && <p className="scout-error" role="alert">{error}</p>}
    <p className="scout-camera-hint">Всё, что видно в рамке, попадёт в карточку. Фото с телефона обрезается по центру.</p>
    <div className="scout-camera-actions">{preview ? <button type="button" className="scout-primary" onClick={() => onSave(preview)}>Использовать фото</button> : <button type="button" className="scout-primary" disabled={!ready || busy} onClick={take}>Сделать снимок</button>}<button type="button" onClick={() => file.current?.click()} disabled={busy}>{busy ? "Подготовка…" : preview ? "Выбрать другой снимок" : "Камера телефона / выбрать фото"}</button></div>
    <input ref={file} type="file" accept="image/*" capture="environment" hidden onChange={event => { void choose(event.target.files?.[0]); event.target.value = ""; }} />
  </dialog>;
}
