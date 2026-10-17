"use client";

import { collections } from "../content/mlt";
import type { SiteLanguage } from "./LanguageMenu";
import type { PointerEvent, SyntheticEvent, MouseEvent } from "react";

const labels = {
  en: { collections: "Collections", investments: "Investments", acquisitions: "Acquisitions", motorhomes: "Motorhomes", capsules: "Capsule homes", smartMap: "Smart Map", home: "Home", contact: "Contact", about: "About", account: "My account", toggleMenu: "Toggle menu" },
  de: { collections: "Kollektionen", investments: "Investitionen", acquisitions: "Fahrzeuge kaufen", motorhomes: "Reisemobile", capsules: "Kapselhäuser", smartMap: "Smart Map", home: "Startseite", contact: "Kontakt", about: "Über MLT", account: "Mein Konto", toggleMenu: "Menü öffnen" },
  ru: { collections: "Коллекции", investments: "Инвестиции", acquisitions: "Покупка", motorhomes: "Автодома", capsules: "Капсульные дома", smartMap: "Умная карта", home: "Главная", contact: "Контакты", about: "О нас", account: "Личный кабинет", toggleMenu: "Открыть меню" },
  it: { collections: "Collezioni", investments: "Investimenti", acquisitions: "Acquisti", motorhomes: "Camper", capsules: "Case modulari", smartMap: "Mappa intelligente", home: "Home", contact: "Contatti", about: "Chi siamo", account: "Il mio account", toggleMenu: "Apri il menu" },
  pl: { collections: "Kolekcje", investments: "Inwestycje", acquisitions: "Zakup", motorhomes: "Kampery", capsules: "Domy modułowe", smartMap: "Inteligentna mapa", home: "Strona główna", contact: "Kontakt", about: "O nas", account: "Moje konto", toggleMenu: "Otwórz menu" },
} as const;

export function siteNavLabels(locale: SiteLanguage) { return labels[locale]; }

const collectionNames = collections.map(item => [item.id, `MLT ${item.name}`] as const);

function closeOtherDropdowns(event: SyntheticEvent<HTMLDetailsElement>) {
  const current = event.currentTarget;
  if (!current.open) return;
  current.closest("nav")?.querySelectorAll<HTMLDetailsElement>("details.mlt-nav-dropdown[open]").forEach(other => {
    if (other !== current) other.open = false;
  });
}

function openOnHover(event: PointerEvent<HTMLDetailsElement>) {
  if (event.pointerType === "mouse" && window.matchMedia("(min-width: 1181px) and (hover: hover) and (pointer: fine)").matches) {
    event.currentTarget.open = true;
  }
}

function closeOnHoverEnd(event: PointerEvent<HTMLDetailsElement>) {
  if (event.pointerType === "mouse" && window.matchMedia("(min-width: 1181px) and (hover: hover) and (pointer: fine)").matches) {
    event.currentTarget.open = false;
  }
}

function preventMouseToggle(event: MouseEvent<HTMLElement>) {
  if (event.detail > 0 && window.matchMedia("(min-width: 1181px) and (hover: hover) and (pointer: fine)").matches) {
    event.preventDefault();
  }
}

export function CollectionsDropdown({ locale }: { locale: SiteLanguage }) {
  const t = labels[locale];
  return <details className="mlt-nav-dropdown" name="mlt-primary-navigation" onToggle={closeOtherDropdowns} onPointerEnter={openOnHover} onPointerLeave={closeOnHoverEnd}><summary onClick={preventMouseToggle}>{t.collections}</summary><div className="mlt-nav-dropdown-menu">{collectionNames.map(([slug, name]) => <a key={slug} href={slug === "proposal" ? `/${locale}/proposal/` : `/${locale}/collections/${slug}/`}>{name}</a>)}</div></details>;
}

export function AcquisitionsDropdown({ locale }: { locale: SiteLanguage }) {
  const t = labels[locale];
  return <details className="mlt-nav-dropdown" name="mlt-primary-navigation" onToggle={closeOtherDropdowns} onPointerEnter={openOnHover} onPointerLeave={closeOnHoverEnd}><summary onClick={preventMouseToggle}>{t.acquisitions}</summary><div className="mlt-nav-dropdown-menu"><a href={`/${locale}/acquisitions/`}>{t.motorhomes}</a><a href={`/${locale}/acquisitions/?category=capsule`}>{t.capsules}</a></div></details>;
}
