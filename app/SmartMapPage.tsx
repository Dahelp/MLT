"use client";

import { useCallback, useState } from "react";
import type { SiteLanguage } from "./LanguageMenu";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import RealRouteMap from "./plan/RealRouteMap";
import { mapPoints } from "../content/mlt";

const copy = {
  en: { eyebrow: "MLT / Smart Map", title: "Remarkable places. One intelligent route.", intro: "Explore curated places across Europe. Choose what calls to you; MLT will compose the journey between them.", country: "Choose country", all: "All", selected: "Selected places", empty: "Choose places on the map", remove: "Remove", distance: "You will travel", conversation: "A private conversation", contactTitle: "Your journey begins here.", contactCopy: "Tell us what you are imagining. Your MLT concierge will return with a considered first proposal.", start: "Start a conversation" },
  de: { eyebrow: "MLT / Smart Map", title: "Besondere Orte. Eine intelligente Route.", intro: "Entdecken Sie besondere Orte in Europa. Wählen Sie Ihre Ziele; MLT gestaltet die Reise dazwischen.", country: "Land wählen", all: "Alle", selected: "Ausgewählte Orte", empty: "Wählen Sie Orte auf der Karte", remove: "Entfernen", distance: "Sie fahren", conversation: "Ein privates Gespräch", contactTitle: "Ihre Reise beginnt hier.", contactCopy: "Erzählen Sie uns von Ihrer Reise. Ihr MLT Concierge erstellt einen durchdachten ersten Vorschlag.", start: "Gespräch beginnen" },
  ru: { eyebrow: "MLT / Умная карта", title: "Особенные места. Один умный маршрут.", intro: "Исследуйте избранные места Европы. Выберите то, что вам близко, а MLT составит маршрут между ними.", country: "Выбор страны", all: "Все", selected: "Выбранные места", empty: "Выберите точки на карте", remove: "Удалить", distance: "Вы проедете", conversation: "Личный разговор", contactTitle: "Ваше путешествие начинается здесь.", contactCopy: "Расскажите, каким вы видите своё путешествие. Консьерж MLT вернётся с продуманным первым предложением.", start: "Начать разговор" },
  it: { eyebrow: "MLT / Mappa intelligente", title: "Luoghi straordinari. Un itinerario intelligente.", intro: "Esplora luoghi selezionati in Europa. Scegli le tue mete; MLT creerà il percorso tra loro.", country: "Scegli il paese", all: "Tutti", selected: "Luoghi selezionati", empty: "Scegli i luoghi sulla mappa", remove: "Rimuovi", distance: "Percorrerai", conversation: "Una conversazione privata", contactTitle: "Il tuo viaggio inizia qui.", contactCopy: "Raccontaci cosa immagini. Il tuo concierge MLT preparerà una prima proposta su misura.", start: "Inizia una conversazione" },
  pl: { eyebrow: "MLT / Inteligentna mapa", title: "Niezwykłe miejsca. Jedna inteligentna trasa.", intro: "Odkrywaj wybrane miejsca w Europie. Wybierz cele, a MLT ułoży podróż między nimi.", country: "Wybierz kraj", all: "Wszystkie", selected: "Wybrane miejsca", empty: "Wybierz miejsca na mapie", remove: "Usuń", distance: "Przejedziesz", conversation: "Prywatna rozmowa", contactTitle: "Twoja podróż zaczyna się tutaj.", contactCopy: "Opowiedz nam o swoich planach. Concierge MLT przygotuje pierwszą propozycję.", start: "Rozpocznij rozmowę" },
} as const;

export default function SmartMapPage({ locale }: { locale: SiteLanguage }) {
  const t = copy[locale];
  const [country, setCountry] = useState("All");
  const [selection, setSelection] = useState<string[]>(["dolomites", "como"]);
  const [distance, setDistance] = useState<number | null>(null);
  const toggle = (id: string) => setSelection(current => current.includes(id) ? current.filter(point => point !== id) : [...current, id]);
  const onDistanceChange = useCallback((value: number | null) => setDistance(value), []);
  const countries = ["All", "Italy", "Austria", "Germany"] as const;
  return <main className="home-light smart-map-page">
    <SiteHeader locale={locale} />
    <section className="smart-map-page-intro"><p className="light-section-label">{t.eyebrow}</p><h1>{t.title}</h1><p>{t.intro}</p></section>
    <section className="light-map smart-map-page-panel" aria-label={t.eyebrow}>
      <div className="smart-map-canvas">
        <div className="smart-map-country-tabs" aria-label={t.country}>{countries.map(item => <button key={item} type="button" className={country === item ? "active" : ""} onClick={() => setCountry(item)}>{item === "All" ? t.all : item}</button>)}</div>
        <RealRouteMap selected={selection} country={country} onToggle={toggle} locale={locale} className="home-route-map" onDistanceChange={onDistanceChange} />
      </div>
      <div className="map-copy"><p className="light-section-label">{t.selected}</p><h2>{t.title}</h2><div className="smart-map-selection"><div className="smart-map-selection-heading"><small>{t.selected}</small><span>{selection.length} / {mapPoints.length}</span></div><div>{selection.length ? selection.map((id, index) => { const point = mapPoints.find(item => item.id === id); return point && <button key={id} type="button" onClick={() => toggle(id)} aria-label={`${t.remove} ${point.name}`}><span>{index + 1}</span>{point.name}<b aria-hidden="true">×</b></button>; }) : <p>{t.empty}</p>}</div>{distance !== null && <strong className="smart-map-distance">{t.distance} {distance.toLocaleString(locale)} km</strong>}</div></div>
    </section>
    <section className="light-contact"><div><p className="light-section-label">05 / {t.conversation}</p><h2>{t.contactTitle}</h2></div><div><p>{t.contactCopy}</p><a className="bronze-button" href="mailto:info@mlt-lifestyle.com">{t.start}</a></div></section>
    <SiteFooter locale={locale} />
  </main>;
}
