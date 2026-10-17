"use client";
import { inquiryCopy as copy } from "../content/inquiry";
import { useEffect, useState, type FormEvent } from "react";
import type { SiteLanguage } from "./LanguageMenu";

export default function CommercialInquiry({ open, onClose, locale, source, subject, context = "" }: { open: boolean; onClose: () => void; locale: SiteLanguage; source: string; subject: string; context?: string }) {
  const t = copy[locale];
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) return; const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; document.addEventListener("keydown", close); return () => document.removeEventListener("keydown", close); }, [open, onClose]);
  if (!open) return null;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setStatus("");
    const form = new FormData(event.currentTarget);
    const payload = { firstName: form.get("firstName"), lastName: form.get("lastName"), email: form.get("email"), phone: form.get("phone"), notes: form.get("notes"), source, subject, context, privacyConsent: form.get("privacyConsent") === "on", website: form.get("website") };
    try {
      const response = await fetch("/api/concierge.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok || result.delivery === "demo") throw new Error(result.delivery === "demo" ? t.direct : (result.error || t.failed));
      setStatus(t.success);
      (event.target as HTMLFormElement).reset();
      const win = window as Window & { dataLayer?: object[] }; win.dataLayer = win.dataLayer || []; win.dataLayer.push({ event: "mlt_form_submit", source });
    } catch (error) { setStatus(error instanceof Error ? error.message : t.failed); }
    finally { setBusy(false); }
  };
  return <div className="commercial-modal-backdrop" onMouseDown={onClose}><section className="commercial-modal" role="dialog" aria-modal="true" aria-label={subject} onMouseDown={event => event.stopPropagation()}><button type="button" className="commercial-modal-close" onClick={onClose} aria-label={t.close}>×</button><p className="commercial-eyebrow">{t.eyebrow}</p><h2>{subject}</h2><p>{t.intro}</p><form onSubmit={submit}><input type="hidden" name="source" value={source}/><input type="hidden" name="subject" value={subject}/><input className="commercial-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/><div className="commercial-form-row"><label>{t.first}<input name="firstName" required maxLength={80}/></label><label>{t.last}<input name="lastName" required maxLength={80}/></label></div><div className="commercial-form-row"><label>{t.email}<input type="email" name="email" required maxLength={160}/></label><label>{t.phone}<input type="tel" name="phone" maxLength={80}/></label></div><label>{t.message}<textarea name="notes" rows={3} maxLength={800} defaultValue={context}/></label><label className="commercial-consent"><input type="checkbox" name="privacyConsent" required/><span>{t.consent} <a href={`/${locale}/legal/privacy/`} target="_blank" rel="noopener noreferrer">{t.privacy}</a>.</span></label><button className="commercial-button" disabled={busy}>{busy ? t.sending : t.send}</button>{status && <p role="status" className="commercial-form-status">{status}</p>}</form></section></div>;
}
