"use client";
import { useEffect, useState } from "react";

const copy = {
  en: { title: "Your privacy,", accent: "considered.", body: "We use cookies to provide essential website functions. Analytics and marketing cookies are only activated with your explicit permission.", policy: "Privacy policy", essential: "Essential", essentialInfo: "Language, consent choice and essential website functions", analytics: "Analytics & marketing", analyticsInfo: "Optional insights and personalised content", only: "Essential only", preferences: "Preferences", close: "Close settings", all: "Accept all" },
  de: { title: "Ihre Privatsphäre,", accent: "mit Bedacht.", body: "Wir verwenden Cookies, um Inhalte zu personalisieren, Funktionen bereitzustellen und Zugriffe zu analysieren. Für Analyse und Marketing benötigen wir Ihre ausdrückliche Zustimmung.", policy: "Datenschutzerklärung", essential: "Erforderlich", essentialInfo: "Sprache, Einwilligung und notwendige Website-Funktionen", analytics: "Analyse & Marketing", analyticsInfo: "Optionale Nutzungsanalyse und personalisierte Inhalte", only: "Nur notwendige akzeptieren", preferences: "Einstellungen", close: "Einstellungen schließen", all: "Alle akzeptieren" },
} as const;

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [locale, setLocale] = useState<"en" | "de">("en");
  useEffect(() => { setOpen(!localStorage.getItem("mlt-cookie-consent")); setLocale(localStorage.getItem("mlt-locale") === "de" || navigator.language.toLowerCase().startsWith("de") ? "de" : "en"); }, []);
  const t = copy[locale];
  const save = (choice: "essential" | "all") => { localStorage.setItem("mlt-cookie-consent", JSON.stringify({ choice, analytics: choice === "all", date: new Date().toISOString() })); setOpen(false); };
  if (!open) return null;
  return <div className="cookie-overlay"><section className="cookie-panel" role="dialog" aria-modal="true" aria-label="Cookie preferences"><div><div className="cookie-lang"><button className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>EN</button><button className={locale === "de" ? "active" : ""} onClick={() => setLocale("de")}>DE</button></div><p className="section-label">MLT / Privacy</p><h2>{t.title}<br /><em>{t.accent}</em></h2><p>{t.body}</p><a href="/legal/privacy">{t.policy}</a></div>{settings && <div className="cookie-settings"><label><span><strong>{t.essential}</strong><small>{t.essentialInfo}</small></span><input type="checkbox" checked disabled /></label><label><span><strong>{t.analytics}</strong><small>{t.analyticsInfo}</small></span><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} /></label></div>}<div className="cookie-actions"><button onClick={() => save("essential")}>{t.only}</button><button onClick={() => setSettings(!settings)}>{settings ? t.close : t.preferences}</button><button onClick={() => save("all")}>{t.all}</button></div></section></div>;
}
