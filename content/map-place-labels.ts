import type {Locale} from "./i18n";
import {matchesMapCountry} from "./map-markers";
export const mapCountryLabels = {
  "All": {
    "en": "All",
    "de": "Alle",
    "ru": "Все",
    "it": "Tutti",
    "pl": "Wszystkie"
  },
  "Italy": {
    "en": "Italy",
    "de": "Italien",
    "ru": "Италия",
    "it": "Italia",
    "pl": "Włochy"
  },
  "Austria": {
    "en": "Austria",
    "de": "Österreich",
    "ru": "Австрия",
    "it": "Austria",
    "pl": "Austria"
  },
  "Germany": {
    "en": "Germany",
    "de": "Deutschland",
    "ru": "Германия",
    "it": "Germania",
    "pl": "Niemcy"
  }
};
export const mapTypeLabels = {
  "Lakeside stay": {
    "en": "Lakeside stay",
    "de": "Aufenthalt am See",
    "ru": "Отдых у озера",
    "it": "Soggiorno sul lago",
    "pl": "Pobyt nad jeziorem"
  },
  "Panoramic road": {
    "en": "Panoramic road",
    "de": "Panoramastraße",
    "ru": "Панорамная дорога",
    "it": "Strada panoramica",
    "pl": "Droga widokowa"
  },
  "Private vineyard": {
    "en": "Private vineyard",
    "de": "Privates Weingut",
    "ru": "Частная винодельня",
    "it": "Vigneto privato",
    "pl": "Prywatna winnica"
  },
  "Coastal retreat": {
    "en": "Coastal retreat",
    "de": "Auszeit an der Küste",
    "ru": "Отдых на побережье",
    "it": "Ritiro sulla costa",
    "pl": "Wypoczynek na wybrzeżu"
  },
  "Alpine lodge": {
    "en": "Alpine lodge",
    "de": "Alpine Unterkunft",
    "ru": "Альпийский дом",
    "it": "Rifugio alpino",
    "pl": "Alpejski dom"
  },
  "Wild swimming": {
    "en": "Wild swimming",
    "de": "Schwimmen in der Natur",
    "ru": "Купание на природе",
    "it": "Nuoto nella natura",
    "pl": "Kąpiel na łonie natury"
  },
  "Private dining": {
    "en": "Private dining",
    "de": "Privates Dinner",
    "ru": "Индивидуальный ужин",
    "it": "Cena privata",
    "pl": "Prywatna kolacja"
  },
  "Scenic route": {
    "en": "Scenic route",
    "de": "Panoramaroute",
    "ru": "Живописный маршрут",
    "it": "Itinerario panoramico",
    "pl": "Trasa widokowa"
  },
  "Forest hideaway": {
    "en": "Forest hideaway",
    "de": "Auszeit im Wald",
    "ru": "Лесной отдых",
    "it": "Rifugio nel bosco",
    "pl": "Leśne zacisze"
  },
  "Grand tour": {
    "en": "Grand tour",
    "de": "Große Rundreise",
    "ru": "Большое путешествие",
    "it": "Gran tour",
    "pl": "Wielka podróż"
  },
  "Lakeside journey": {
    "en": "Lakeside journey",
    "de": "Reise zu den Seen",
    "ru": "Путешествие по озёрам",
    "it": "Viaggio tra i laghi",
    "pl": "Podróż po jeziorach"
  },
  "Mountain retreat": {
    "en": "Mountain retreat",
    "de": "Auszeit in den Bergen",
    "ru": "Отдых в горах",
    "it": "Ritiro in montagna",
    "pl": "Wypoczynek w górach"
  },
  "Vineyard journey": {
    "en": "Vineyard journey",
    "de": "Reise durch die Weinberge",
    "ru": "Путешествие по винодельням",
    "it": "Viaggio tra i vigneti",
    "pl": "Podróż po winnicach"
  },
  "Coastal journey": {
    "en": "Coastal journey",
    "de": "Küstenreise",
    "ru": "Путешествие по побережью",
    "it": "Viaggio lungo la costa",
    "pl": "Podróż wzdłuż wybrzeża"
  },
  "Winter journey": {
    "en": "Winter journey",
    "de": "Winterreise",
    "ru": "Зимнее путешествие",
    "it": "Viaggio invernale",
    "pl": "Zimowa podróż"
  },
  "Forest journey": {
    "en": "Forest journey",
    "de": "Waldreise",
    "ru": "Лесное путешествие",
    "it": "Viaggio nel bosco",
    "pl": "Podróż przez las"
  },
  "Gourmet": {
    "en": "Gourmet",
    "de": "Gastronomie",
    "ru": "Гастрономия",
    "it": "Gastronomia",
    "pl": "Gastronomia"
  },
  "Stay": {
    "en": "Stay",
    "de": "Unterkunft",
    "ru": "Проживание",
    "it": "Alloggio",
    "pl": "Noclegi"
  },
  "Sight": {
    "en": "Sight",
    "de": "Orte und Ausblicke",
    "ru": "Места и виды",
    "it": "Luoghi e panorami",
    "pl": "Miejsca i widoki"
  },
  "Experience": {
    "en": "Experience",
    "de": "Erlebnisse",
    "ru": "Впечатления",
    "it": "Esperienze",
    "pl": "Atrakcje"
  },
  "MLT location": {
    "en": "MLT location",
    "de": "MLT Ort",
    "ru": "Локация MLT",
    "it": "Luogo MLT",
    "pl": "Miejsce MLT"
  }
};
export function mapCountryLabel(value:string,locale:Locale):string{
  if(value==="All")return mapCountryLabels.All[locale];
  const key=(["Italy","Austria","Germany"] as const).find(country=>matchesMapCountry(value,country));
  if(!key)return value;
  const region=value.split(/\s*[,/;·—–-]\s*/u).slice(1).join(" / ");
  return mapCountryLabels[key][locale]+(region?` / ${region}`:"");
}
export function mapTypeLabel(value:string,locale:Locale):string{return mapTypeLabels[value as keyof typeof mapTypeLabels]?.[locale]||value;}
