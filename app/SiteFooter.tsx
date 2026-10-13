import type { SiteLanguage } from "./LanguageMenu";
import { siteNavLabels } from "./SiteNavDropdown";

const copy = {
  en: { explore: "Explore", experiences: "Experiences", account: "My account", legal: "Legal", imprint: "Imprint", privacy: "Privacy", terms: "Terms", contact: "Contact", tagline: "Individual road expeditions across Europe" },
  de: { explore: "Entdecken", experiences: "Erlebnisse", account: "Mein Konto", legal: "Rechtliches", imprint: "Impressum", privacy: "Datenschutz", terms: "AGB", contact: "Kontakt", tagline: "Individuelle Road Expeditions durch Europa" },
  ru: { explore: "Разделы", experiences: "Впечатления", account: "Личный кабинет", legal: "Документы", imprint: "Выходные данные", privacy: "Конфиденциальность", terms: "Условия", contact: "Контакты", tagline: "Индивидуальные автомобильные экспедиции по Европе" },
  it: { explore: "Esplora", experiences: "Esperienze", account: "Il mio account", legal: "Note legali", imprint: "Informazioni legali", privacy: "Privacy", terms: "Termini", contact: "Contatti", tagline: "Viaggi su strada su misura in Europa" },
  pl: { explore: "Odkrywaj", experiences: "Doświadczenia", account: "Moje konto", legal: "Dokumenty", imprint: "Informacje prawne", privacy: "Prywatność", terms: "Warunki", contact: "Kontakt", tagline: "Indywidualne wyprawy drogowe po Europie" },
} as const;

export default function SiteFooter({ locale, reveal = false }: { locale: SiteLanguage; reveal?: boolean }) {
  const t = copy[locale];
  const nav = siteNavLabels(locale);
  const home = `/${locale}/`;
  const animation = reveal ? { "data-home-reveal": "up" } : {};
  return <footer className="light-footer">
    <div className="light-footer-logo" {...animation}><img src="/mlt-logo.svg?v=20261006-vector" alt="MLT — Move. Live. Travel." loading="lazy" decoding="async" /><p>{t.tagline}</p></div>
    <div {...animation}><strong>{t.explore}</strong><a href={`${home}#collections`}>{nav.collections}</a><a href={`${home}#experiences`}>{t.experiences}</a><a href={`/${locale}/smart-map/`}>{nav.smartMap}</a><a href={`/${locale}/about/`}>{nav.about}</a><a href={`/${locale}/account/`}>{t.account}</a></div>
    <div {...animation}><strong>{t.legal}</strong><a href={`/${locale}/legal/imprint/`}>{t.imprint}</a><a href={`/${locale}/legal/privacy/`}>{t.privacy}</a><a href={`/${locale}/legal/terms/`}>{t.terms}</a></div>
    <div {...animation}><strong>{t.contact}</strong><a href="mailto:info@mlt-lifestyle.com">info@mlt-lifestyle.com</a><a href="tel:+4917632523799">+49 176 325 23 799</a></div>
    <small {...animation}>© 2026 MLT Maschinenhandel GmbH Import-Export</small>
  </footer>;
}
