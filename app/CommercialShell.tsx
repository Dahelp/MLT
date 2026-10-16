"use client";
import type { SiteLanguage } from "./LanguageMenu";
import SiteHeader from "./SiteHeader";
import { siteNavLabels } from "./SiteNavDropdown";
import "./commercial.css";

export default function CommercialShell({ locale, children }: { locale: SiteLanguage; children: React.ReactNode }) {
  const footer = {
    en: ["Individual road expeditions across Europe", "Privacy", "Imprint"],
    de: ["Individuelle Reiseexpeditionen durch Europa", "Datenschutz", "Impressum"],
    ru: ["Индивидуальные экспедиции по Европе", "Конфиденциальность", "Юридическая информация"],
    it: ["Spedizioni individuali attraverso l’Europa", "Privacy", "Note legali"],
    pl: ["Indywidualne wyprawy po Europie", "Prywatność", "Informacje prawne"],
  }[locale];
  return <main className="commercial">
    <SiteHeader locale={locale} />
    {children}
    <footer className="commercial-footer"><img src="/mlt-logo.svg" alt="MLT" /><span>{footer[0]}</span><div><a href={`/${locale}/about/`}>{siteNavLabels(locale).about}</a><a href={`/${locale}/smart-map/`}>{siteNavLabels(locale).smartMap}</a><a href={`/${locale}/legal/privacy/`}>{footer[1]}</a><a href={`/${locale}/legal/imprint/`}>{footer[2]}</a><a href="mailto:info@mlt-lifestyle.com">info@mlt-lifestyle.com</a></div><small>© 2026 MLT Maschinenhandel GmbH Import-Export</small></footer>
  </main>;
}
