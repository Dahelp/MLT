"use client";
import { useEffect, useState, type FormEvent } from "react";
import type { SiteLanguage } from "./LanguageMenu";

const copy = {
  en: { eyebrow: "A private conversation", intro: "Tell us how to reach you. An MLT manager will respond personally.", first: "First name", last: "Last name", email: "Email", phone: "Phone", message: "Your message", consent: "I agree to the processing of my personal data under the", privacy: "Privacy Policy", send: "Send request", sending: "Sending…", success: "Thank you. Your personal manager will contact you shortly.", failed: "Unable to send your request.", direct: "Please contact info@mlt-lifestyle.com directly while the inquiry service is being configured.", close: "Close" },
  de: { eyebrow: "Ein persönliches Gespräch", intro: "Teilen Sie uns mit, wie wir Sie erreichen können. Ein MLT Ansprechpartner meldet sich persönlich.", first: "Vorname", last: "Nachname", email: "E-Mail", phone: "Telefon", message: "Ihre Nachricht", consent: "Ich stimme der Verarbeitung meiner personenbezogenen Daten gemäß der", privacy: "Datenschutzerklärung", send: "Anfrage senden", sending: "Wird gesendet…", success: "Vielen Dank. Ihr Ansprechpartner meldet sich in Kürze.", failed: "Ihre Anfrage konnte nicht gesendet werden.", direct: "Bitte kontaktieren Sie info@mlt-lifestyle.com direkt, während der Anfragedienst eingerichtet wird.", close: "Schließen" },
  ru: { eyebrow: "Личный разговор", intro: "Оставьте контакты, и менеджер MLT свяжется с вами лично.", first: "Имя", last: "Фамилия", email: "Электронная почта", phone: "Телефон", message: "Ваше сообщение", consent: "Я согласен на обработку персональных данных согласно", privacy: "Политике конфиденциальности", send: "Отправить запрос", sending: "Отправляем…", success: "Спасибо. Менеджер скоро свяжется с вами.", failed: "Не удалось отправить запрос.", direct: "Пожалуйста, напишите напрямую на info@mlt-lifestyle.com, пока сервис заявок настраивается.", close: "Закрыть" },
  it: { eyebrow: "Una conversazione personale", intro: "Indicaci come contattarti. Un responsabile MLT ti risponderà personalmente.", first: "Nome", last: "Cognome", email: "E-mail", phone: "Telefono", message: "Il tuo messaggio", consent: "Acconsento al trattamento dei dati personali secondo la", privacy: "Informativa sulla privacy", send: "Invia richiesta", sending: "Invio…", success: "Grazie. Un responsabile ti contatterà a breve.", failed: "Impossibile inviare la richiesta.", direct: "Scrivi direttamente a info@mlt-lifestyle.com mentre il servizio richieste viene configurato.", close: "Chiudi" },
  pl: { eyebrow: "Osobista rozmowa", intro: "Podaj dane kontaktowe. Przedstawiciel MLT skontaktuje się z Tobą osobiście.", first: "Imię", last: "Nazwisko", email: "E-mail", phone: "Telefon", message: "Twoja wiadomość", consent: "Wyrażam zgodę na przetwarzanie danych osobowych zgodnie z", privacy: "Polityką prywatności", send: "Wyślij zapytanie", sending: "Wysyłanie…", success: "Dziękujemy. Przedstawiciel wkrótce się z Tobą skontaktuje.", failed: "Nie udało się wysłać zapytania.", direct: "Napisz bezpośrednio na info@mlt-lifestyle.com, gdy usługa zapytań jest konfigurowana.", close: "Zamknij" },
} as const;

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
  return <div className="commercial-modal-backdrop" onMouseDown={onClose}><section className="commercial-modal" role="dialog" aria-modal="true" aria-label={subject} onMouseDown={event => event.stopPropagation()}><button type="button" className="commercial-modal-close" onClick={onClose} aria-label={t.close}>×</button><p className="commercial-eyebrow">{t.eyebrow}</p><h2>{subject}</h2><p>{t.intro}</p><form onSubmit={submit}><input type="hidden" name="source" value={source}/><input type="hidden" name="subject" value={subject}/><input className="commercial-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/><div className="commercial-form-row"><label>{t.first}<input name="firstName" required maxLength={80}/></label><label>{t.last}<input name="lastName" required maxLength={80}/></label></div><div className="commercial-form-row"><label>{t.email}<input type="email" name="email" required maxLength={160}/></label><label>{t.phone}<input type="tel" name="phone" maxLength={80}/></label></div><label>{t.message}<textarea name="notes" rows={3} maxLength={800} defaultValue={context}/></label><label className="commercial-consent"><input type="checkbox" name="privacyConsent" required/><span>{t.consent} <a href={`/${locale}/legal/privacy/`} target="_blank" rel="noopener noreferrer">{t.privacy}</a>.</span></label><button className="commercial-button" disabled={busy}>{busy ? t.sending : t.send} <svg viewBox="0 0 20 20" aria-hidden="true" style={{width:20,height:20,fill:"none",stroke:"currentColor",strokeWidth:1.7}}><path d="M4 16 16 4M7 4h9v9"/></svg></button>{status && <p role="status" className="commercial-form-status">{status}</p>}</form></section></div>;
}
