"use client";

import { useEffect, useState } from "react";

type Sample = Record<string, string | number | boolean | null>;
declare global { interface Window { __MLT_VIEWPORT_LOG__?: Sample[]; } }

export default function ViewportDiagnostics() {
  const [enabled, setEnabled] = useState(false);
  const [sample, setSample] = useState<Sample>();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(location.search).get("viewport-debug") !== "1") return;
    const update = () => {
      // Keep the consent dialog unobstructed; measurements continue in the head script.
      setEnabled(Boolean(localStorage.getItem("mlt-cookie-consent")));
      setSample(window.__MLT_VIEWPORT_LOG__?.at(-1));
    };
    update();
    const interval = window.setInterval(update, 300);
    window.addEventListener("mlt-consent-change", update);
    return () => {
      clearInterval(interval);
      window.removeEventListener("mlt-consent-change", update);
    };
  }, []);
  if (!enabled) return null;
  return <aside aria-label="Диагностика экрана" style={{ position: "fixed", zIndex: 10000, bottom: "calc(8px + env(safe-area-inset-bottom, 0px))", left: 8, right: 8, padding: 12, borderRadius: 8, background: "#fff", color: "#111", boxShadow: "0 2px 12px #0005", font: "12px/1.5 monospace" }}>
    <strong>Диагностика загрузки и экрана</strong>
    <div>document: {String(sample?.readyState)} · load: {String(sample?.loadEventEnd)}</div>
    <div>docY: {String(sample?.documentY)} · visualY: {String(sample?.visualY)} · pageY: {String(sample?.visualPageY)}</div>
    <div>header: {String(sample?.headerTop)} · hero: {String(sample?.heroTop)} / {String(sample?.heroHeight)}</div>
    <div>{String(sample?.navigation)} · {String(sample?.event)} · height: {String(sample?.visualHeight)} / {String(sample?.windowHeight)}</div>
    <div>refresh: {String(sample?.refreshStatus)} · attempts: {String(sample?.refreshAttempts)} · inset: {String(sample?.nativeTopInset)} · blocked: {String(sample?.preventedMoves)}</div>
    <button type="button" style={{ minHeight: 40, padding: "6px 12px", marginTop: 6, border: "1px solid #777", borderRadius: 6, background: "#eee", color: "#111" }} onClick={async () => {
      try {
        await navigator.clipboard.writeText(JSON.stringify({
          userAgent: navigator.userAgent,
          path: location.pathname,
          readyState: document.readyState,
          navigation: performance.getEntriesByType("navigation").map(entry => entry.toJSON()),
          incompleteImages: Array.from(document.images).filter(image => !image.complete).map(image => ({ src: image.currentSrc || image.src, loading: image.loading })),
          videos: Array.from(document.querySelectorAll("video")).map(element => ({ src: element.currentSrc, networkState: element.networkState, readyState: element.readyState, paused: element.paused, error: element.error?.code || null, buffered: Array.from({ length: element.buffered.length }, (_, index) => [element.buffered.start(index), element.buffered.end(index)]) })),
          resources: performance.getEntriesByType("resource").map(entry => entry.toJSON()),
          samples: window.__MLT_VIEWPORT_LOG__,
        }, null, 2));
        setCopied(true);
      } catch { setCopied(false); }
    }}>{copied ? "Скопировано — отправьте в чат" : "Скопировать диагностику"}</button>
  </aside>;
}
