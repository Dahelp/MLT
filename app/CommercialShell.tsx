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
    <header className="commercial-nav"><a href={`/${locale}/`} aria-label="MLT home"><img src="/mlt-logo.svg" alt="MLT" /></a><nav className={open ? "open" : ""} aria-label="Primary"><a href={`/${locale}/`}>{t.home}</a><CollectionsDropdown locale={locale} allHref={`/${locale}/#collections`} /><a href={path("investments")}>{t.investments}</a><AcquisitionsDropdown locale={locale} /><a href={`/${locale}/#contact`}>{t.concierge}</a></nav><div className="commercial-nav-actions"><LanguageMenu locale={locale} onChange={changeLocale} /><a className="account-nav-link" href={`/${locale}/account/`} aria-label={locale === "ru" ? "Личный кабинет" : locale === "de" ? "Mein Konto" : locale === "it" ? "Il mio account" : locale === "pl" ? "Moje konto" : "My account"}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.8-3.7 3.3-5.5 7.5-5.5s6.7 1.8 7.5 5.5"/></svg></a><button className="commercial-menu-toggle" type="button" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}><span/><span/></button></div></header>
    {children}
    <footer className="commercial-footer"><img src="/mlt-logo.svg" alt="MLT" /><span>Individual road expeditions across Europe</span><div><a href={`/${locale}/legal/privacy/`}>Privacy</a><a href={`/${locale}/legal/imprint/`}>Imprint</a><a href="mailto:info@mlt-lifestyle.com">info@mlt-lifestyle.com</a></div><small>© 2026 MLT Maschinenhandel GmbH Import-Export</small></footer>
  </main>;
}
