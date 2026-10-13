"use client";

import { useState } from "react";
import { LanguageMenu, type SiteLanguage } from "./LanguageMenu";
import { AcquisitionsDropdown, CollectionsDropdown, siteNavLabels } from "./SiteNavDropdown";

export default function SiteHeader({ locale, isHome = false }: { locale: SiteLanguage; isHome?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = siteNavLabels(locale);
  const home = `/${locale}/`;
  const changeLocale = (next: SiteLanguage) => {
    localStorage.setItem("mlt-locale", next);
    const parts = window.location.pathname.split("/");
    if (["en", "de", "ru", "it", "pl"].includes(parts[1])) parts[1] = next;
    else parts.splice(1, 0, next);
    window.location.assign(parts.join("/") + window.location.search);
  };
  const logo = <img src="/mlt-logo.svg?v=20261006-vector" alt="MLT — Move. Live. Travel." />;
  return <header className="light-nav mlt-site-header">
    {isHome ? <span className="light-brand">{logo}</span> : <a className="light-brand" href={home} aria-label="MLT home">{logo}</a>}
    <nav className={menuOpen ? "light-links open" : "light-links"} aria-label="Primary navigation">
      <CollectionsDropdown locale={locale} />
      <AcquisitionsDropdown locale={locale} />
      <a href={`/${locale}/investments/`}>{t.investments}</a>
      <a href={`/${locale}/smart-map/`}>{t.smartMap}</a>
      <a href={`/${locale}/contact/`}>{t.contact}</a>
    </nav>
    <div className="light-actions">
      <LanguageMenu locale={locale} onChange={changeLocale} />
      <a className="account-nav-link" href={`/${locale}/account/`} aria-label={t.account}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.8-3.7 3.3-5.5 7.5-5.5s6.7 1.8 7.5 5.5"/></svg></a>
      <button className="light-menu" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label={t.toggleMenu}><span/><span/></button>
    </div>
  </header>;
}
