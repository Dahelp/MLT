"use client";
import { useState } from "react";
import { LanguageMenu, type SiteLanguage } from "./LanguageMenu";
import { AcquisitionsDropdown, CollectionsDropdown, siteNavLabels } from "./SiteNavDropdown";
import "./commercial.css";

export default function CommercialShell({ locale, children }: { locale: SiteLanguage; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = (section: string) => `/${locale}/${section}/`;
  const t = siteNavLabels(locale);
  const changeLocale = (next: SiteLanguage) => {
    localStorage.setItem("mlt-locale", next);
    const parts = window.location.pathname.split("/"); parts[1] = next;
    window.location.assign(parts.join("/") + window.location.search);
  };
  return <main className="commercial">
    <header className="commercial-nav"><a href={`/${locale}/`} aria-label="MLT home"><img src="/mlt-logo.svg" alt="MLT" /></a><nav className={open ? "open" : ""} aria-label="Primary"><a href={`/${locale}/`}>{t.home}</a><CollectionsDropdown locale={locale} allHref={`/${locale}/#collections`} /><a href={path("investments")}>{t.investments}</a><AcquisitionsDropdown locale={locale} /><a href={`/${locale}/#contact`}>{t.concierge}</a></nav><div className="commercial-nav-actions"><LanguageMenu locale={locale} onChange={changeLocale} /><button type="button" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}>☰</button></div></header>
    {children}
    <footer className="commercial-footer"><img src="/mlt-logo.svg" alt="MLT" /><span>Individual road expeditions across Europe</span><div><a href={`/${locale}/legal/privacy/`}>Privacy</a><a href={`/${locale}/legal/imprint/`}>Imprint</a><a href="mailto:info@mlt-lifestyle.com">info@mlt-lifestyle.com</a></div><small>© 2026 MLT Maschinenhandel GmbH Import-Export</small></footer>
  </main>;
}
