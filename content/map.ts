import type { Locale } from "./i18n";

export const mapCoordinates: Record<string, [number, number]> = {
  como: [9.2572, 45.984], dolomites: [11.925, 46.54], tuscany: [11.17, 43.06], amalfi: [14.602, 40.634], tyrol: [11.39, 47.27], salzburg: [13.055, 47.81], vienna: [16.373, 48.208], bavaria: [11.08, 47.56], blackforest: [8.19, 48.1],
  "dolomites-grand-tour": [11.925, 46.54], "lakes-of-bavaria": [11.26, 47.65], "alpine-escape": [12.64, 47.13], "wine-roads-collection": [11.17, 43.06], "mediterranean-discovery": [14.602, 40.634], "winter-alps-expedition": [12.03, 46.53], "black-forest-experience": [8.19, 48.1],
};

export const mapCopy = {
  en: { eyebrow: "MLT / Smart Map", title: "Remarkable places. One intelligent route.", intro: "Explore curated places across Europe. Choose what calls to you; MLT will compose the journey between them.", country: "Choose country", all: "All", selected: "Selected places", empty: "Choose places on the map", remove: "Remove", distance: "You will travel", conversation: "A private conversation", contactTitle: "Your journey begins here.", contactCopy: "Tell us what you are imagining. Your MLT concierge will return with a considered first proposal.", start: "Start a conversation", choose: "Choose a collection" },
  de: { eyebrow: "MLT / Smart Map", title: "Besondere Orte. Eine intelligente Route.", intro: "Entdecken Sie besondere Orte in Europa. Wählen Sie Ihre Ziele; MLT gestaltet die Reise dazwischen.", country: "Land wählen", all: "Alle", selected: "Ausgewählte Orte", empty: "Wählen Sie Orte auf der Karte", remove: "Entfernen", distance: "Sie fahren", conversation: "Ein privates Gespräch", contactTitle: "Ihre Reise beginnt hier.", contactCopy: "Erzählen Sie uns von Ihrer Reise. Ihr MLT Concierge erstellt einen durchdachten ersten Vorschlag.", start: "Gespräch beginnen", choose: "Kollektion wählen" },
  ru: { eyebrow: "MLT / Умная карта", title: "Особенные места. Один умный маршрут.", intro: "Исследуйте избранные места Европы. Выберите то, что вам близко, а MLT составит маршрут между ними.", country: "Выбор страны", all: "Все", selected: "Выбранные места", empty: "Выберите точки на карте", remove: "Удалить", distance: "Вы проедете", conversation: "Личный разговор", contactTitle: "Ваше путешествие начинается здесь.", contactCopy: "Расскажите, каким вы видите своё путешествие. Консьерж MLT вернётся с продуманным первым предложением.", start: "Начать разговор", choose: "Выбрать коллекцию" },
  it: { eyebrow: "MLT / Mappa intelligente", title: "Luoghi straordinari. Un itinerario intelligente.", intro: "Esplora luoghi selezionati in Europa. Scegli le tue mete; MLT creerà il percorso tra loro.", country: "Scegli il paese", all: "Tutti", selected: "Luoghi selezionati", empty: "Scegli i luoghi sulla mappa", remove: "Rimuovi", distance: "Percorrerai", conversation: "Una conversazione privata", contactTitle: "Il tuo viaggio inizia qui.", contactCopy: "Raccontaci cosa immagini. Il tuo concierge MLT preparerà una prima proposta su misura.", start: "Inizia una conversazione", choose: "Scegli una collezione" },
  pl: { eyebrow: "MLT / Inteligentna mapa", title: "Niezwykłe miejsca. Jedna inteligentna trasa.", intro: "Odkrywaj wybrane miejsca w Europie. Wybierz cele, a MLT ułoży podróż między nimi.", country: "Wybierz kraj", all: "Wszystkie", selected: "Wybrane miejsca", empty: "Wybierz miejsca na mapie", remove: "Usuń", distance: "Przejedziesz", conversation: "Prywatna rozmowa", contactTitle: "Twoja podróż zaczyna się tutaj.", contactCopy: "Opowiedz nam o swoich planach. Concierge MLT przygotuje pierwszą propozycję.", start: "Rozpocznij rozmowę", choose: "Wybierz kolekcję" },
} as const;


export const mapCountries = ["All", "Italy", "Austria", "Germany"] as const;

export const mapViews: Record<string, { center: [number, number]; zoom: number }> = {
  All: { center: [10.8, 46.2], zoom: 4.4 }, Italy: { center: [11.7, 43.7], zoom: 5.2 }, Austria: { center: [13.25, 47.55], zoom: 6.2 }, Germany: { center: [9.7, 49.6], zoom: 5.4 },
};
export const mapCountryFiles = ["italy", "austria", "germany"] as const;
export const mapStatusLabels = {
  en: { loading: "Loading map…", error: "Map tiles are temporarily unavailable.", routing: "Building route on real roads…", ready: "Road route ready", routeError: "Road route is temporarily unavailable", add: "Add", remove: "Remove" },
  de: { loading: "Karte wird geladen…", error: "Die Kartenansicht ist vorübergehend nicht verfügbar.", routing: "Route über reale Straßen wird berechnet…", ready: "Straßenroute ist bereit", routeError: "Die Straßenroute ist vorübergehend nicht verfügbar", add: "Hinzufügen", remove: "Entfernen" },
  ru: { loading: "Загружаем карту…", error: "Карта временно недоступна.", routing: "Строим маршрут по реальным дорогам…", ready: "Маршрут по дорогам готов", routeError: "Маршрутизатор временно недоступен", add: "Добавить", remove: "Удалить" },
  it: { loading: "Caricamento mappa…", error: "La mappa non è disponibile al momento.", routing: "Creazione del percorso…", ready: "Percorso pronto", routeError: "Il percorso non è disponibile al momento", add: "Aggiungi", remove: "Rimuovi" },
  pl: { loading: "Ładowanie mapy…", error: "Mapa jest chwilowo niedostępna.", routing: "Wyznaczanie trasy…", ready: "Trasa jest gotowa", routeError: "Trasa jest chwilowo niedostępna", add: "Dodaj", remove: "Usuń" },
} as const;
