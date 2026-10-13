"use client";
import type { SiteLanguage } from "./LanguageMenu";
import SiteHeader from "./SiteHeader";
import { siteNavLabels } from "./SiteNavDropdown";
import "./commercial.css";

export default function CommercialShell({ locale, children }: { locale: SiteLanguage; children: React.ReactNode }) {
  return <main className="commercial">
    <SiteHeader locale={locale} />
    {children}
    <footer className="commercial-footer"><img src="/mlt-logo.svg" alt="MLT" /><span>Individual road expeditions across Europe</span><div><a href={`/${locale}/about/`}>{siteNavLabels(locale).about}</a><a href={`/${locale}/smart-map/`}>{siteNavLabels(locale).smartMap}</a><a href={`/${locale}/legal/privacy/`}>Privacy</a><a href={`/${locale}/legal/imprint/`}>Imprint</a><a href="mailto:info@mlt-lifestyle.com">info@mlt-lifestyle.com</a></div><small>© 2026 MLT Maschinenhandel GmbH Import-Export</small></footer>
  </main>;
}
