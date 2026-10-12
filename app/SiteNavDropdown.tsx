"use client";

import type { SiteLanguage } from "./LanguageMenu";

const labels = {
  en: { collections: "Collections", all: "All collections", investments: "Investments", acquisitions: "Acquisitions", motorhomes: "Motorhomes", capsules: "Capsule homes", home: "Home", concierge: "Concierge" },
  de: { collections: "Kollektionen", all: "Alle Kollektionen", investments: "Investitionen", acquisitions: "Fahrzeuge kaufen", motorhomes: "Reisemobile", capsules: "Kapselhäuser", home: "Startseite", concierge: "Concierge" },
  ru: { collections: "Коллекции", all: "Все коллекции", investments: "Инвестиции", acquisitions: "Покупка", motorhomes: "Автодома", capsules: "Капсульные дома", home: "Главная", concierge: "Консьерж" },
  it: { collections: "Collezioni", all: "Tutte le collezioni", investments: "Investimenti", acquisitions: "Acquisti", motorhomes: "Camper", capsules: "Case modulari", home: "Home", concierge: "Concierge" },
  pl: { collections: "Kolekcje", all: "Wszystkie kolekcje", investments: "Inwestycje", acquisitions: "Zakup", motorhomes: "Kampery", capsules: "Domy modułowe", home: "Strona główna", concierge: "Concierge" },
} as const;

export function siteNavLabels(locale: SiteLanguage) { return labels[locale]; }

const collectionNames = [
  ["freedom", "MLT Freedom"], ["signature", "MLT Signature"], ["concierge", "MLT Concierge"],
  ["private", "MLT Private"], ["honeymoon", "MLT Honeymoon"], ["proposal", "MLT Proposal"],
] as const;

export function CollectionsDropdown({ locale, allHref }: { locale: SiteLanguage; allHref: string }) {
  const t = labels[locale];
  return <details className="mlt-nav-dropdown"><summary>{t.collections}<span aria-hidden="true">⌄</span></summary><div className="mlt-nav-dropdown-menu"><a href={allHref}>{t.all}</a>{collectionNames.map(([slug, name]) => <a key={slug} href={slug === "proposal" ? `/${locale}/proposal/` : `/${locale}/collections/${slug}/`}>{name}</a>)}</div></details>;
}

export function AcquisitionsDropdown({ locale }: { locale: SiteLanguage }) {
  const t = labels[locale];
  return <details className="mlt-nav-dropdown"><summary>{t.acquisitions}<span aria-hidden="true">⌄</span></summary><div className="mlt-nav-dropdown-menu"><a href={`/${locale}/acquisitions/`}>{t.motorhomes}</a><a href={`/${locale}/acquisitions/?category=capsule`}>{t.capsules}</a></div></details>;
}
