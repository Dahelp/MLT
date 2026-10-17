import type { Locale } from "./i18n";
export type CollectionId = "signature" | "concierge" | "private" | "honeymoon";
export type IconName = "globe" | "user" | "menu" | "chevron" | "arrow-left" | "arrow-right" | "pin" | "calendar" | "travellers";
export type ContentLocale = "en" | "de" | "ru";
export type Product = { n: string; title: string; copy: Record<Locale, string>; image: string };
export type PackageVariant = { id: string; title: string; benefits: Record<ContentLocale, string[]>; supplement?: number };

const baseTr = {
  en: { build:"Build your journey:", country:"Country", dates:"Choose your travel dates", departure:"Departure", returning:"Return", travellers:"Travellers", included:"1–2 guests included · +€190 from the 3rd guest", experience:"Select your experience:", selected:"Selected", choose:"Choose", ideal:"Ideal for", total:"Total", pay:"Sign in & pay", concierge:"Talk to a concierge", explore:"Explore", contact:"Contact", collections:"Collections", experiences:"Experiences", map:"Smart map", email:"Email us", privacy:"Privacy", imprint:"Imprint", days:"days", menu:"Explore MLT", journeys:"Journeys", vehicles:"Vehicles", account:"Sign in", prepared:"Tell us where you would like to begin. We will prepare every essential detail for your journey.", europe:"Individual Road Expeditions across Europe." },
  de: { build:"Stellen Sie Ihre Reise zusammen:", country:"Land", dates:"Reisedauer wählen", departure:"Abreise", returning:"Rückkehr", travellers:"Reisende", included:"1–2 Gäste inklusive · +190 € ab dem 3. Gast", experience:"Erlebnis auswählen:", selected:"Gewählt", choose:"Wählen", ideal:"Ideal für", total:"Gesamt", pay:"Anmelden & zahlen", concierge:"Concierge kontaktieren", explore:"Entdecken", contact:"Kontakt", collections:"Kollektionen", experiences:"Erlebnisse", map:"Smart Map", email:"E-Mail", privacy:"Datenschutz", imprint:"Impressum", days:"Tage", menu:"MLT entdecken", journeys:"Reisen", vehicles:"Fahrzeuge", account:"Anmelden", prepared:"Sagen Sie uns, wo Ihre Reise beginnen soll. Wir bereiten alle wichtigen Details für Sie vor.", europe:"Individuelle Road Expeditions durch Europa." },
  ru: { build:"Соберите путешествие:", country:"Страна", dates:"Выберите длительность", departure:"Отправление", returning:"Возвращение", travellers:"Путешественники", included:"1–2 гостя включены · +€190 с 3-го гостя", experience:"Выберите впечатление:", selected:"Выбрано", choose:"Выбрать", ideal:"Идеально для", total:"Итого", pay:"Войти и оплатить", concierge:"Связаться с консьержем", explore:"Разделы", contact:"Контакты", collections:"Коллекции", experiences:"Впечатления", map:"Карта", email:"Написать нам", privacy:"Конфиденциальность", imprint:"Реквизиты", days:"дней", menu:"Откройте MLT", journeys:"Маршруты", vehicles:"Автодома", account:"Войти", prepared:"Расскажите, откуда хотите начать. Мы подготовим все важные детали путешествия.", europe:"Индивидуальные автопутешествия по Европе." },
} satisfies Record<ContentLocale, Record<string,string>>;
export const tr = {
  ...baseTr,
  it: { ...baseTr.en, build:"Crea il tuo viaggio:",country:"Paese",dates:"Scegli la durata",departure:"Partenza",returning:"Ritorno",travellers:"Viaggiatori",included:"1–2 ospiti inclusi · +€190 dal 3° ospite",experience:"Scegli la tua esperienza:",selected:"Selezionato",choose:"Scegli",ideal:"Ideale per",total:"Totale",pay:"Accedi e paga",concierge:"Parla con un concierge",days:"giorni" },
  pl: { ...baseTr.en, build:"Zaplanuj swoją podróż:",country:"Kraj",dates:"Wybierz czas podróży",departure:"Wyjazd",returning:"Powrót",travellers:"Podróżni",included:"1–2 osoby w cenie · +€190 od 3. osoby",experience:"Wybierz doświadczenie:",selected:"Wybrano",choose:"Wybierz",ideal:"Idealne dla",total:"Razem",pay:"Zaloguj się i zapłać",concierge:"Porozmawiaj z concierge",days:"dni" },
};

export const configs: Record<CollectionId, { hero:string; packages:PackageVariant[]; products:Product[] }> = {
  signature:{ hero:"/collection-signature.webp", packages:[
    {id:"signature",title:"Signature",benefits:{en:["Personal route","Reserved premium campsites","Panoramic roads","Restaurants & activities"],de:["Persönliche Route","Reservierte Premium-Stellplätze","Panoramastraßen","Restaurants & Aktivitäten"],ru:["Личный маршрут","Премиальные стоянки","Панорамные дороги","Рестораны и впечатления"]}},
    {id:"tailored",title:"Signature Tailored",supplement:500,benefits:{en:["Everything in Signature","Personal travel scenario","Activities matched to you","Special moments"],de:["Alles aus Signature","Persönliches Reiseszenario","Passende Aktivitäten","Besondere Momente"],ru:["Всё из Signature","Личный сценарий","Подобранные активности","Особенные моменты"]}},
  ], products:[] },
  concierge:{ hero:"/collection-concierge.webp", packages:[{id:"concierge",title:"Concierge",benefits:{en:["24/7 online concierge","Live route changes","Campsites booked","Dining reservations"],de:["Online-Concierge rund um die Uhr","Flexible Routenänderungen","Gebuchte Stellplätze","Restaurantreservierungen"],ru:["Онлайн-консьерж 24/7","Изменения маршрута","Бронирование стоянок","Резервации ресторанов"]}}], products:[] },
  private:{ hero:"/collection-private.webp", packages:[{id:"private",title:"Private",benefits:{en:["Private driver","Technician and chef","Private excursions","VIP transfers"],de:["Privatfahrer","Techniker und Koch","Private Ausflüge","VIP-Transfers"],ru:["Личный водитель","Техник и повар","Частные экскурсии","VIP-трансферы"]}}], products:[] },
  honeymoon:{ hero:"/collection-honeymoon.webp", packages:[{id:"honeymoon",title:"Honeymoon",benefits:{en:["Premium motorhome for two","Romantic route","Private stays","Dedicated concierge"],de:["Premium-Reisemobil für zwei","Romantische Route","Private Stellplätze","Persönlicher Concierge"],ru:["Премиальный автодом для двоих","Романтический маршрут","Приватные стоянки","Личный консьерж"]}}], products:[] },
};

export const extraBenefits: Record<string, { it: string[]; pl: string[] }> = {
  signature: { it: ["Itinerario personale", "Campeggi premium prenotati", "Strade panoramiche", "Ristoranti e attività"], pl: ["Osobista trasa", "Kempingi premium", "Drogi widokowe", "Restauracje i atrakcje"] },
  tailored: { it: ["Tutto di Signature", "Programma su misura", "Attività scelte per te", "Momenti speciali"], pl: ["Wszystko z Signature", "Indywidualny plan podróży", "Atrakcje dopasowane do Ciebie", "Wyjątkowe chwile"] },
  concierge: { it: ["Concierge online 24/7", "Modifiche dell’itinerario", "Campeggi prenotati", "Ristoranti prenotati"], pl: ["Concierge online 24/7", "Zmiany trasy", "Zarezerwowane kempingi", "Rezerwacje restauracji"] },
  private: { it: ["Autista privato", "Tecnico e chef", "Escursioni private", "Transfer VIP"], pl: ["Prywatny kierowca", "Technik i szef kuchni", "Prywatne wycieczki", "Transfery VIP"] },
  honeymoon: { it: ["Camper premium per due", "Itinerario romantico", "Soste private", "Concierge dedicato"], pl: ["Kamper premium dla dwojga", "Romantyczna trasa", "Prywatne postoje", "Osobisty concierge"] },
};

export const tailoredInterests = [
  {id:"mountains",en:"Mountains",de:"Berge",ru:"Горы"},{id:"restaurants",en:"Restaurants",de:"Restaurants",ru:"Рестораны"},
  {id:"wineries",en:"Wineries",de:"Weingüter",ru:"Винодельни"},{id:"lakes",en:"Lakes",de:"Seen",ru:"Озёра"},
  {id:"spa",en:"Spa",de:"Spa",ru:"Спа"},{id:"hiking",en:"Hiking",de:"Wandern",ru:"Пешие прогулки"},
  {id:"castles",en:"Castles",de:"Schlösser",ru:"Замки"},{id:"cycling",en:"Cycling",de:"Fahrräder",ru:"Велосипеды"},
  {id:"yachts",en:"Yachts",de:"Yachten",ru:"Яхты"},{id:"photo-session",en:"Photo session",de:"Fotoshooting",ru:"Фотосессия"},
  {id:"sunrise",en:"Sunrise",de:"Sonnenaufgang",ru:"Рассвет"},{id:"birthday",en:"Birthday",de:"Geburtstag",ru:"День рождения"},
  {id:"proposal",en:"Proposal",de:"Heiratsantrag",ru:"Предложение"},{id:"anniversary",en:"Anniversary",de:"Jahrestag",ru:"Годовщина"},
] as const;
