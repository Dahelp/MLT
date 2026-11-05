"use client";
import {encodeScoutPhoto} from '../../content/scout-photos';

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { scoutCopy, scoutFormat } from "../../content/scout-i18n";
import { scoutCrop } from "../../content/scout-crop";
import type { Locale } from "../../content/i18n";

export default function PhotoCapture({ locale, index, onSave, onClose, galleryOnly = false }: { locale: Locale; index: number; onSave: (photo: string) => void; onClose: () => void; galleryOnly?: boolean }) {
  const t = scoutCopy[locale].camera;
  const video = useRef<HTMLVideoElement>(null), dialog = useRef<HTMLDialogElement>(null), file = useRef<HTMLInputElement>(null), nativeCamera = useRef<HTMLInputElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null), mounted = useRef(false), cameraRequest = useRef(0), imageRequest = useRef(0);
  const drag = useRef<{ pointer: number; clientX: number; clientY: number; x: number; y: number } | null>(null);
  const [ready, setReady] = useState(false), [cameraOpen, setCameraOpen] = useState(false), [error, setError] = useState(""), [image, setImage] = useState<HTMLImageElement | null>(null), [busy, setBusy] = useState(false);
  const [crop, setCrop] = useState({ zoom: 1, x: .5, y: .5 });
  const stop = () => { cameraRequest.current++; stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; };

  useEffect(() => {
    mounted.current = true;
    const opener = document.activeElement as HTMLElement | null, previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; dialog.current?.showModal();
    const hide = () => { if (document.hidden) { stop(); setReady(false); setCameraOpen(false); } };
    document.addEventListener("visibilitychange", hide);
    return () => { mounted.current = false; imageRequest.current++; stop(); document.removeEventListener("visibilitychange", hide); document.body.style.overflow = previousOverflow; opener?.focus(); };
  }, []);

  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!image || !context) return;
    const rect = scoutCrop(image.naturalWidth, image.naturalHeight, crop.zoom, crop.x, crop.y);
    context.drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, 900, 1200);
  }, [image, crop]);

  const choose = async (photo?: File) => {
    if (!photo) return;
    const request = ++imageRequest.current;
    stop(); setCameraOpen(false); setReady(false); setBusy(true); setError("");
    if (photo.size > 25 * 1024 * 1024) { setError(t.fileTooLarge); setBusy(false); return; }
    const url = URL.createObjectURL(photo);
    try {
      const source = new Image(); source.src = url; await source.decode();
      if (mounted.current && imageRequest.current === request) { setImage(source); setCrop({ zoom: 1, x: .5, y: .5 }); }
    } catch { if (mounted.current && imageRequest.current === request) setError(t.readFailed); }
    finally { URL.revokeObjectURL(url); if (mounted.current && imageRequest.current === request) setBusy(false); }
  };

  const openCamera = async () => {
    stop(); setImage(null); setError(""); setReady(false); setCameraOpen(true);
    if (!navigator.mediaDevices?.getUserMedia) { setCameraOpen(false); setError(t.unavailable); return; }
    const request = cameraRequest.current;
    try {
      const value = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" }, aspectRatio: { ideal: 3 / 4 }, width: { ideal: 1200 }, height: { ideal: 1600 } } });
      if (!mounted.current || cameraRequest.current !== request) { value.getTracks().forEach(track => track.stop()); return; }
      stream.current = value;
      if (video.current) { video.current.srcObject = value; await video.current.play(); }
    } catch { if (mounted.current && cameraRequest.current === request) { stop(); setCameraOpen(false); setError(t.denied); } }
  };

  const take = async () => {
    const source = video.current;
    if (!source?.videoWidth || !source.videoHeight) { setError(t.notReady); return; }
    const frame = document.createElement("canvas"); frame.width = source.videoWidth; frame.height = source.videoHeight;
    const context = frame.getContext("2d");
    if (!context) { setError(t.prepareFailed); return; }
    context.drawImage(source, 0, 0);
    stop(); setReady(false); setCameraOpen(false); setBusy(true);
    try { const shot = new Image(); shot.src = frame.toDataURL("image/jpeg", .92); await shot.decode(); if (mounted.current) { setImage(shot); setCrop({ zoom: 1, x: .5, y: .5 }); } }
    catch { if (mounted.current) setError(t.prepareFailed); }
    finally { if (mounted.current) setBusy(false); }
  };

  const save = () => {
    try {
      if (!image || !canvas.current) return;
      onSave(encodeScoutPhoto(canvas.current,t.tooLarge));
    } catch (value) { setError((value as Error).message); }
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!image || drag.current?.pointer !== event.pointerId) return;
    const rect = scoutCrop(image.naturalWidth, image.naturalHeight, crop.zoom), view = event.currentTarget.getBoundingClientRect(), start = drag.current;
    const clamp = (value: number) => Math.max(0, Math.min(1, value));
    setCrop(current => ({ ...current,
      x: image.naturalWidth > rect.width ? clamp(start.x - (event.clientX - start.clientX) / view.width * rect.width / (image.naturalWidth - rect.width)) : .5,
      y: image.naturalHeight > rect.height ? clamp(start.y - (event.clientY - start.clientY) / view.height * rect.height / (image.naturalHeight - rect.height)) : .5,
    }));
  };
  return <dialog ref={dialog} className="scout-camera" aria-labelledby="camera-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><div><small>MLT / {scoutFormat(scoutCopy[locale].form.frame, { number: String(index + 1).padStart(2, "0") })}</small><h2 id="camera-title">{t.title}</h2></div><button type="button" onClick={onClose} aria-label={t.close}>×</button></header>
    <div className={`scout-viewfinder${image ? " scout-crop-view" : ""}`} onPointerDown={event => { if (image) { drag.current = { pointer: event.pointerId, clientX: event.clientX, clientY: event.clientY, x: crop.x, y: crop.y }; event.currentTarget.setPointerCapture(event.pointerId); } }} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      {image ? <canvas ref={canvas} width={900} height={1200} role="img" aria-label={t.preview}/> : cameraOpen ? <video ref={video} autoPlay playsInline muted onLoadedData={() => setReady(true)}/> : null}
      <span>3:4</span>{!ready && !image && <p>{busy ? t.preparing : cameraOpen ? t.aim : galleryOnly ? t.choose : t.sourceHint}</p>}
    </div>
    {error && <p className="scout-error" role="alert">{error}</p>}
    {(!galleryOnly || image) && <p className="scout-camera-hint">{image ? t.cropHint : t.hint}</p>}
    {image && <div className="scout-crop-controls"><label>{t.zoom}<input type="range" min="1" max="3" step="0.05" value={crop.zoom} onChange={event => setCrop(current => ({ ...current, zoom: Number(event.target.value) }))}/></label><details><summary>{t.position}</summary><label>{t.horizontal}<input type="range" min="0" max="1" step="0.01" value={crop.x} onChange={event => setCrop(current => ({ ...current, x: Number(event.target.value) }))}/></label><label>{t.vertical}<input type="range" min="0" max="1" step="0.01" value={crop.y} onChange={event => setCrop(current => ({ ...current, y: Number(event.target.value) }))}/></label></details><button type="button" onClick={() => setCrop({ zoom: 1, x: .5, y: .5 })}>{t.resetCrop}</button></div>}
    <div className="scout-camera-actions">
      {image ? <button type="button" className="scout-primary" disabled={busy} onClick={save}>{t.use}</button> : cameraOpen ? <button type="button" className="scout-primary" disabled={!ready || busy} onClick={() => void take()}>{t.take}</button> : !galleryOnly && <button type="button" className="scout-primary" disabled={busy} onClick={() => void openCamera()}>{t.openCamera}</button>}
      <button type="button" className={galleryOnly && !image ? "scout-primary" : undefined} onClick={() => file.current?.click()} disabled={busy}>{busy ? t.preparing : image ? t.chooseOther : t.choose}</button>
      {error && !image && !galleryOnly && <button type="button" onClick={() => nativeCamera.current?.click()} disabled={busy}>{t.phoneCamera}</button>}
    </div>
    <input ref={file} data-scout-photo-gallery type="file" accept="image/*" hidden onChange={event => { void choose(event.target.files?.[0]); event.target.value = ""; }}/>
    <input ref={nativeCamera} data-scout-photo-camera type="file" accept="image/*" capture="environment" hidden onChange={event => { void choose(event.target.files?.[0]); event.target.value = ""; }}/>
  </dialog>;
}
