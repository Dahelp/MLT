"use client";

import { useEffect, useRef, useState } from "react";
import { scoutCopy, scoutFormat } from "../../content/scout-i18n";
import type { Locale } from "../../content/i18n";
type CameraCopy = typeof scoutCopy.en.camera;

/** Always writes the same 900 × 1200 portrait crop shown in the viewfinder. */
function portrait(source: CanvasImageSource, width: number, height: number, t: CameraCopy) {
  if (!width || !height) throw new Error(t.notReady);
  const canvas = document.createElement("canvas");
  canvas.width = 900; canvas.height = 1200;
  const context = canvas.getContext("2d");
  if (!context) throw new Error(t.prepareFailed);
  const cropWidth = Math.min(width, height * 3 / 4), cropHeight = cropWidth * 4 / 3;
  context.drawImage(source, (width - cropWidth) / 2, (height - cropHeight) / 2, cropWidth, cropHeight, 0, 0, 900, 1200);
  let result = canvas.toDataURL("image/jpeg", 0.86);
  if (result.length > 1900000) result = canvas.toDataURL("image/jpeg", 0.7);
  if (result.length > 2000000) throw new Error(t.tooLarge);
  return result;
}

export default function PhotoCapture({ locale, index, onSave, onClose }: { locale: Locale; index: number; onSave: (photo: string) => void; onClose: () => void }) {
  const t = scoutCopy[locale].camera;
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
    if (!navigator.mediaDevices?.getUserMedia) setError(t.unavailable);
    else navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" }, aspectRatio: { ideal: 3 / 4 }, width: { ideal: 1200 }, height: { ideal: 1600 } } })
      .then(async value => {
        if (!active || !cameraWanted.current) { value.getTracks().forEach(track => track.stop()); return; }
        stream.current = value;
        if (video.current) { video.current.srcObject = value; await video.current.play(); }
      }).catch(() => { if (active) setError(t.denied); });
    const hide = () => { if (document.hidden) { stop(); if (active) setReady(false); } };
    document.addEventListener("visibilitychange", hide);
    return () => { active = false; stop(); document.removeEventListener("visibilitychange", hide); document.body.style.overflow = previousOverflow; opener?.focus(); };
  }, []);
  const take = () => {
    try { const source = video.current; if (source) { setPreview(portrait(source, source.videoWidth, source.videoHeight, t)); stop(); setReady(false); } }
    catch (value) { setError((value as Error).message); }
  };
  const choose = async (image?: File) => {
    if (!image) return;
    setBusy(true); setError("");
    if (image.size > 25 * 1024 * 1024) { setError(t.fileTooLarge); setBusy(false); return; }
    const url = URL.createObjectURL(image);
    try {
      const source = new Image(); source.src = url; await source.decode();
      setPreview(portrait(source, source.naturalWidth, source.naturalHeight, t)); cameraWanted.current = false; stop(); setReady(false);
    } catch { setError(t.readFailed); }
    finally { URL.revokeObjectURL(url); setBusy(false); }
  };
  return <dialog ref={dialog} className="scout-camera" aria-labelledby="camera-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><div><small>MLT / {scoutFormat(scoutCopy[locale].form.frame, { number: String(index + 1).padStart(2, "0") })}</small><h2 id="camera-title">{t.title}</h2></div><button type="button" onClick={onClose} aria-label={t.close}>×</button></header>
    <div className="scout-viewfinder">{preview ? <img src={preview} alt={t.preview} /> : <video ref={video} autoPlay playsInline muted onLoadedData={() => setReady(true)} />}<span>3:4</span>{!ready && !preview && <p>{t.aim}<br />{t.orChoose}</p>}</div>
    {error && <p className="scout-error" role="alert">{error}</p>}
    <p className="scout-camera-hint">{t.hint}</p>
    <div className="scout-camera-actions">{preview ? <button type="button" className="scout-primary" onClick={() => onSave(preview)}>{t.use}</button> : <button type="button" className="scout-primary" disabled={!ready || busy} onClick={take}>{t.take}</button>}<button type="button" onClick={() => file.current?.click()} disabled={busy}>{busy ? t.preparing : preview ? t.chooseOther : t.choose}</button></div>
    <input ref={file} type="file" accept="image/*" capture="environment" hidden onChange={event => { void choose(event.target.files?.[0]); event.target.value = ""; }} />
  </dialog>;
}
