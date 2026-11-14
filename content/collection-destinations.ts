import type { Locale } from "./i18n";

export const collectionDestinations = [
  { id: "rome", labels: { en: "Italy / Rome", de: "Italien / Rom", ru: "Италия / Рим", it: "Italia / Roma", pl: "Włochy / Rzym" } },
  { id: "venice", labels: { en: "Italy / Venice", de: "Italien / Venedig", ru: "Италия / Венеция", it: "Italia / Venezia", pl: "Włochy / Wenecja" } },
  { id: "milan", labels: { en: "Italy / Milan", de: "Italien / Mailand", ru: "Италия / Милан", it: "Italia / Milano", pl: "Włochy / Mediolan" } },
  { id: "salzburg", labels: { en: "Austria / Salzburg", de: "Österreich / Salzburg", ru: "Австрия / Зальцбург", it: "Austria / Salisburgo", pl: "Austria / Salzburg" } },
  { id: "munich", labels: { en: "Germany / Munich", de: "Deutschland / München", ru: "Германия / Мюнхен", it: "Germania / Monaco", pl: "Niemcy / Monachium" } },
] as const;

export type CollectionDestinationId = (typeof collectionDestinations)[number]["id"];

export const collectionDestinationCopy: Record<Locale, { label: string; developing: string }> = {
  en: { label: "Country / City", developing: "Our team is developing this journey - for now, begin your experience in Italy / Rome." },
  de: { label: "Land / Stadt", developing: "Unser Team entwickelt diese Reise gerade für Sie - starten Sie vorerst in Italien / Rom." },
  ru: { label: "Страна / Город", developing: "Наша команда уже разрабатывает этот маршрут - пока вы можете начать путешествие из Италии / Рима." },
  it: { label: "Paese / Città", developing: "Il nostro team sta creando questo itinerario: per ora, iniziate la vostra esperienza da Italia / Roma." },
  pl: { label: "Kraj / Miasto", developing: "Nasz zespół pracuje nad tą trasą - na ten moment rozpocznij swoją podróż we Włoszech / Rzymie." },
};
