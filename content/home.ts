import type { Locale } from "./i18n";
import { collectionRateLabel, collectionDurationLabel, resolveJourneyRates, type JourneyCollectionId } from "./journey-pricing";
import type { CatalogItem } from "./catalog-client";

export const homeCollections = [
  { id: "freedom", name: "Freedom", image: "/collection-freedom-carousel-v2.jpg", eyebrow: "Self-directed discovery", copy: "A fully equipped premium motorhome, a curated map and the freedom to follow your own rhythm." },
  { id: "signature", name: "Signature", image: "/collection-signature-carousel-v2.jpg", eyebrow: "Curated end to end", copy: "A personal route, reserved stays and remarkable roads — every essential detail already considered." },
  { id: "concierge", name: "Concierge", image: "/collection-concierge-carousel-v2.jpg", eyebrow: "Always one step ahead", copy: "Your journey, supported by a dedicated MLT concierge, available around the clock." },
  { id: "private", name: "Private", image: "/collection-private-carousel-v2.jpg", eyebrow: "A private world in motion", copy: "A five-star travelling residence with driver, private team and service shaped entirely around you." },
  { id: "honeymoon", name: "Honeymoon", image: "/collection-honeymoon-carousel-v2.jpg", eyebrow: "A private journey for two", copy: "Romantic roads, private stays and beautiful moments composed entirely around the two of you." },
] as const;

export const philosophyImages = ["/philosophy-curated-routes.webp", "/philosophy-personal-concierge.webp", "/experience-wine-v2.webp"];

const russianCollections = [
  { eyebrow: "Самостоятельные открытия", copy: "Полностью оборудованный премиальный автодом, продуманная карта и свобода следовать собственному ритму." },
  { eyebrow: "Продумано от начала до конца", copy: "Персональный маршрут, забронированные места и удивительные дороги — каждая важная деталь уже учтена." },
  { eyebrow: "Всегда на шаг впереди", copy: "Ваше путешествие с личным консьержем MLT, который доступен круглосуточно." },
  { eyebrow: "Личный мир в движении", copy: "Пятизвёздочная резиденция на колёсах с водителем, персональной командой и сервисом, полностью созданным для вас." },
  { eyebrow: "Личное путешествие для двоих", copy: "Романтические дороги, приватные стоянки и прекрасные моменты, созданные только для вас двоих." },
] as const;

const germanCollections = [
  { eyebrow: "Selbstbestimmt entdecken", copy: "Ein vollständig ausgestattetes Premium-Reisemobil, eine kuratierte Karte und die Freiheit, dem eigenen Rhythmus zu folgen." },
  { eyebrow: "Von Anfang bis Ende kuratiert", copy: "Eine persönliche Route, reservierte Stellplätze und besondere Straßen — alle wichtigen Details sind vorbereitet." },
  { eyebrow: "Immer einen Schritt voraus", copy: "Ihre Reise mit einem persönlichen MLT Concierge, der rund um die Uhr erreichbar ist." },
  { eyebrow: "Eine private Welt in Bewegung", copy: "Eine Fünf-Sterne-Residenz auf Rädern mit Fahrer, privatem Team und vollständig persönlichem Service." },
  { eyebrow: "Eine private Reise zu zweit", copy: "Romantische Straßen, private Stellplätze und besondere Momente — nur für Sie beide komponiert." },
] as const;
const italianCollections = [
  { eyebrow:"Scoperte indipendenti", copy:"Un camper premium attrezzato, una mappa curata e la libertà di seguire il tuo ritmo." },
  { eyebrow:"Curato in ogni dettaglio", copy:"Un itinerario personale, soste prenotate e strade straordinarie." },
  { eyebrow:"Sempre un passo avanti", copy:"Un viaggio con il supporto di un concierge MLT dedicato, disponibile 24 ore su 24." },
  { eyebrow:"Un mondo privato in movimento", copy:"Una residenza di lusso su ruote con autista, team privato e servizio su misura." },
  { eyebrow:"Un viaggio privato per due", copy:"Strade romantiche, soste riservate e momenti pensati solo per voi." },
] as const;
const polishCollections = [
  { eyebrow:"Niezależne odkrywanie", copy:"Wyposażony kamper premium, przygotowana mapa i wolność podróżowania we własnym tempie." },
  { eyebrow:"Wszystko dopracowane", copy:"Osobista trasa, zarezerwowane miejsca i niezwykłe drogi." },
  { eyebrow:"Zawsze krok naprzód", copy:"Podróż ze wsparciem osobistego concierge MLT, dostępnego przez całą dobę." },
  { eyebrow:"Prywatny świat w ruchu", copy:"Luksusowa rezydencja na kołach z kierowcą, prywatnym zespołem i obsługą na miarę." },
  { eyebrow:"Prywatna podróż we dwoje", copy:"Romantyczne drogi, prywatne postoje i chwile przygotowane tylko dla Was." },
] as const;






const baseCopy = {
  en: {
    nav: ["Collections", "Experiences", "Smart Map", "About"], concierge: "Talk to a concierge", eyebrow: "Individual Motorhome Expeditions", titleA: "We don’t rent", titleB: "motorhomes.", hero: "We create moments that stay with you forever – through Europe’s most remarkable landscapes, with every detail considered.", choose: "Choose a collection", route: "Create your route", film: "Watch the film", scroll: "Discover MLT", philosophy: "The MLT philosophy", freedom: "Freedom, already taken care of.", freedomCopy: "Most companies sell you the freedom to do everything yourself. We create the freedom to simply live the moment. No planning. No stress. Only the road, the view and the people you love.", pillars: ["Curated routes, not maps", "A personal concierge, not a call centre", "Memories, not itineraries"], ways: "Five ways to travel", collectionTitle: "One standard. Your level of freedom.", collectionCopy: "Every MLT collection is a complete journey, shaped around the way you want to move.", details: "Explore collection", reason: "Every journey begins with a reason.", reasonCopy: "People do not buy a motorhome. They choose the story they will still be telling ten years from now.", story: "Find your story", mapLabel: "MLT Smart Map", mapTitle: "Remarkable places. One intelligent route.", mapCopy: "Explore curated campsites, vineyards, lakes, mountain passes and quiet coastlines. Choose what calls to you; MLT will compose the journey between them.", openMap: "Open the map", quote: "The most valuable memories cannot be bought. They can only be lived.", conversation: "A private conversation", contactTitle: "Your journey begins here.", contactCopy: "Tell us what you are imagining. Your MLT concierge will return with a considered first proposal.", start: "Start a conversation", footer: "Individual road expeditions across Europe" },
  de: {
    nav: ["Kollektionen", "Erlebnisse", "Smart Map", "Über MLT"], concierge: "Concierge kontaktieren", eyebrow: "Individuelle Straßenexpeditionen", titleA: "Wir vermieten keine", titleB: "Reisemobile.", hero: "Wir schaffen Momente, die für immer bleiben — in Europas außergewöhnlichsten Landschaften und bis ins Detail durchdacht.", choose: "Kollektion wählen", route: "Route gestalten", film: "Film ansehen", scroll: "MLT entdecken", philosophy: "Die MLT Philosophie", freedom: "Freiheit, um die sich bereits jemand gekümmert hat.", freedomCopy: "Wir schaffen die Freiheit, den Moment einfach zu leben. Keine Planung. Kein Stress. Nur die Straße, die Aussicht und die Menschen, die Sie lieben.", pillars: ["Kuratierte Routen statt Karten", "Persönlicher Concierge statt Callcenter", "Erinnerungen statt Reisepläne"], ways: "Fünf Arten zu reisen", collectionTitle: "Ein Standard. Ihre Freiheit.", collectionCopy: "Jede MLT Kollektion ist eine vollständige Reise — abgestimmt auf Ihre Art zu reisen.", details: "Kollektion entdecken", reason: "Jede Reise beginnt mit einem Grund.", reasonCopy: "Menschen wählen die Geschichte, die sie noch in zehn Jahren erzählen werden.", story: "Ihre Geschichte finden", mapLabel: "MLT Smart Map", mapTitle: "Besondere Orte. Eine intelligente Route.", mapCopy: "Wählen Sie besondere Orte; MLT komponiert die Reise dazwischen.", openMap: "Karte öffnen", quote: "Die wertvollsten Erinnerungen kann man nicht kaufen. Man kann sie nur erleben.", conversation: "Ein privates Gespräch", contactTitle: "Ihre Reise beginnt hier.", contactCopy: "Erzählen Sie uns, was Sie sich vorstellen. Ihr MLT Concierge meldet sich mit einem sorgfältig ausgearbeiteten ersten Vorschlag.", start: "Gespräch beginnen", footer: "Individuelle Straßenexpeditionen durch Europa" },
  ru: {
    nav: ["Коллекции", "Впечатления", "Умная карта", "О MLT"], concierge: "Связаться с консьержем", eyebrow: "Индивидуальные автомобильные экспедиции", titleA: "", titleB: "", hero: "Мы создаём моменты, которые остаются с вами навсегда — среди самых удивительных пейзажей Европы, с вниманием к каждой детали.", choose: "Выбрать коллекцию", route: "Создать маршрут", film: "Смотреть фильм", scroll: "Открыть MLT", philosophy: "Философия MLT", freedom: "Свобода, о которой уже позаботились.", freedomCopy: "Мы создаём свободу просто жить моментом. Без планирования. Без стресса. Только дорога, вид и люди, которых вы любите.", pillars: ["Курированные маршруты, а не карты", "Персональный консьерж, а не колл-центр", "Воспоминания, а не планы поездки"], ways: "Пять способов путешествовать", collectionTitle: "Один стандарт. Ваш уровень свободы.", collectionCopy: "Каждая коллекция MLT — целостное путешествие, созданное вокруг вашего ритма.", details: "Открыть коллекцию", reason: "Каждое путешествие начинается с причины.", reasonCopy: "Люди выбирают историю, которую будут рассказывать и через десять лет.", story: "Найти свою историю", mapLabel: "Умная карта MLT", mapTitle: "Особенные места. Один умный маршрут.", mapCopy: "Выбирайте интересные места; MLT составит путешествие между ними.", openMap: "Открыть карту", quote: "Самые ценные воспоминания нельзя купить. Их можно только пережить.", conversation: "Личный разговор", contactTitle: "Ваше путешествие начинается здесь.", contactCopy: "Расскажите, каким вы видите своё путешествие. Консьерж MLT вернётся с продуманным первым предложением.", start: "Начать разговор", footer: "Индивидуальные автомобильные экспедиции по Европе" },
} as const;
export const homeCopy = {
  ...baseCopy,
  it: { nav: ["Collezioni", "Esperienze", "Mappa", "Chi siamo"], concierge: "Parla con un concierge", eyebrow: "Viaggi su strada su misura", titleA: "Non noleggiamo", titleB: "camper.", hero: "Creiamo momenti indimenticabili tra i paesaggi più belli d’Europa, curando ogni dettaglio.", choose: "Scegli una collezione", route: "Crea il tuo itinerario", film: "Guarda il film", scroll: "Scopri MLT", philosophy: "La filosofia MLT", freedom: "La libertà, già organizzata per te.", freedomCopy: "Ti diamo la libertà di vivere il momento. Nessun piano, nessuno stress. Solo la strada, il panorama e le persone che ami.", pillars: ["Itinerari curati, non semplici mappe", "Un concierge personale, non un call center", "Ricordi, non programmi"], ways: "Cinque modi di viaggiare", collectionTitle: "Un solo standard. La tua libertà.", collectionCopy: "Ogni collezione MLT è un viaggio completo, pensato per il tuo modo di viaggiare.", details: "Scopri la collezione", reason: "Ogni viaggio nasce da un motivo.", reasonCopy: "Scegli la storia che racconterai ancora tra dieci anni.", story: "Trova la tua storia", mapLabel: "Mappa intelligente MLT", mapTitle: "Luoghi straordinari. Un itinerario intelligente.", mapCopy: "Scegli i luoghi che ti ispirano; MLT creerà il percorso tra loro.", openMap: "Apri la mappa", quote: "I ricordi più preziosi non si possono comprare. Si possono solo vivere.", conversation: "Una conversazione privata", contactTitle: "Il tuo viaggio inizia qui.", contactCopy: "Raccontaci cosa immagini. Il tuo concierge MLT preparerà una prima proposta su misura.", start: "Inizia una conversazione", footer: "Viaggi su strada su misura in Europa" },
  pl: { nav: ["Kolekcje", "Doświadczenia", "Mapa", "O nas"], concierge: "Porozmawiaj z concierge", eyebrow: "Indywidualne wyprawy drogowe", titleA: "Nie wynajmujemy", titleB: "kamperów.", hero: "Tworzymy niezapomniane chwile w najpiękniejszych zakątkach Europy, dbając o każdy szczegół.", choose: "Wybierz kolekcję", route: "Zaplanuj trasę", film: "Obejrzyj film", scroll: "Poznaj MLT", philosophy: "Filozofia MLT", freedom: "Wolność, o którą już zadbaliśmy.", freedomCopy: "Dajemy Ci swobodę cieszenia się chwilą. Bez planowania i stresu. Tylko droga, widoki i bliscy.", pillars: ["Starannie wybrane trasy, nie tylko mapy", "Osobisty concierge, nie infolinia", "Wspomnienia, nie harmonogramy"], ways: "Pięć sposobów podróżowania", collectionTitle: "Jeden standard. Twoja wolność.", collectionCopy: "Każda kolekcja MLT to kompletna podróż dopasowana do Twojego stylu.", details: "Poznaj kolekcję", reason: "Każda podróż zaczyna się od powodu.", reasonCopy: "Wybierasz historię, którą będziesz opowiadać jeszcze za dziesięć lat.", story: "Znajdź swoją historię", mapLabel: "Inteligentna mapa MLT", mapTitle: "Niezwykłe miejsca. Jedna inteligentna trasa.", mapCopy: "Wybierz miejsca, które Cię inspirują; MLT ułoży podróż między nimi.", openMap: "Otwórz mapę", quote: "Najcenniejszych wspomnień nie można kupić. Trzeba je przeżyć.", conversation: "Prywatna rozmowa", contactTitle: "Twoja podróż zaczyna się tutaj.", contactCopy: "Opowiedz nam o swoich planach. Concierge MLT przygotuje dla Ciebie pierwszą propozycję.", start: "Rozpocznij rozmowę", footer: "Indywidualne wyprawy drogowe po Europie" },
};


const collectionCardTranslations = { en: homeCollections, de: germanCollections, ru: russianCollections, it: italianCollections, pl: polishCollections };

export function homeCollectionCards(locale: Locale, catalog: CatalogItem[] = []) {
  return homeCollections.map((item, index) => {
    const record = catalog.find(entry => entry.item_type === "collection" && entry.slug === item.id && Boolean(entry.is_active));
    const rows = resolveJourneyRates(item.id as JourneyCollectionId, record?.data_json);
    return { ...item, ...collectionCardTranslations[locale][index],
      rate: collectionRateLabel(item.id as JourneyCollectionId, locale, rows), days: collectionDurationLabel(item.id as JourneyCollectionId, locale, rows) };
  });
}
