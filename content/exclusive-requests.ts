import options from '../public/data/private-exclusive-requests.json';

export const exclusiveRequestOptions = options;
export const exclusiveRequestTitles = {
  "helicopter-flight": {
    "en": "Helicopter flight",
    "de": "Hubschrauberflug",
    "ru": "Полёт на вертолёте",
    "it": "Volo in elicottero",
    "pl": "Lot helikopterem"
  },
  "ferrari-rental": {
    "en": "Ferrari rental",
    "de": "Ferrari-Miete",
    "ru": "Аренда Ferrari",
    "it": "Noleggio Ferrari",
    "pl": "Wynajem Ferrari"
  },
  "michelin-chef-dinner": {
    "en": "Michelin-starred chef dinner",
    "de": "Dinner mit Michelin-Sternekoch",
    "ru": "Ужин от шеф-повара со звездой Мишлен",
    "it": "Cena con chef stellato Michelin",
    "pl": "Kolacja z szefem kuchni z gwiazdką Michelin"
  },
  "como-yacht-experience": {
    "en": "Como lake yacht experience",
    "de": "Yachterlebnis auf dem Comer See",
    "ru": "Прогулка на яхте по озеру Комо",
    "it": "Esperienza in yacht sul Lago di Como",
    "pl": "Rejs jachtem po jeziorze Como"
  }
};
export function exclusiveOptionsFor(locale:string){return options.map(option=>({...option,title:exclusiveRequestTitles[option.id as keyof typeof exclusiveRequestTitles]?.[locale as "en"|"de"|"ru"|"it"|"pl"]||option.title}));}

export type ExclusiveRequest = { id: string; title: string; price: number | null };
export const exclusiveRequestCopy = {
  en: { title: "Exclusive Requests", pending: 'Individual quote pending', included: 'Included in your journey total', total: 'Exclusive Requests total', save: 'Save individual quote', saved: 'Quote saved in the client account', price: 'Price, EUR', quoted: 'Quote saved', empty: 'Choose any options you would like. Your concierge will prepare an individual quote.' },
  ru: { title: "Особые пожелания", pending: 'Ожидается индивидуальный расчёт', included: 'Включено в итоговую стоимость поездки', total: 'Итого за особые пожелания', save: 'Сохранить индивидуальный расчёт', saved: 'Расчёт сохранён в кабинете клиента', price: 'Стоимость, EUR', quoted: 'Расчёт сохранён', empty: 'Отметьте желаемые опции. Консьерж подготовит индивидуальный расчёт.' },
  de: { title: "Exklusive Wünsche", pending: 'Individuelles Angebot ausstehend', included: 'Im Gesamtpreis Ihrer Reise enthalten', total: 'Summe für exklusive Wünsche', save: 'Individuelles Angebot speichern', saved: 'Angebot im Kundenkonto gespeichert', price: 'Preis, EUR', quoted: 'Angebot gespeichert', empty: 'Wählen Sie Ihre Wünsche. Ihr Concierge erstellt ein individuelles Angebot.' },
  it: { title: "Richieste esclusive", pending: 'Preventivo individuale in attesa', included: 'Incluso nel totale del viaggio', total: 'Totale richieste esclusive', save: 'Salva il preventivo individuale', saved: 'Preventivo salvato nell’account del cliente', price: 'Prezzo, EUR', quoted: 'Preventivo salvato', empty: 'Seleziona le opzioni desiderate. Il concierge preparerà un preventivo individuale.' },
  pl: { title: "Życzenia specjalne", pending: 'Oczekiwanie na indywidualną wycenę', included: 'Wliczone w całkowitą cenę podróży', total: 'Suma życzeń specjalnych', save: 'Zapisz indywidualną wycenę', saved: 'Wycena zapisana na koncie klienta', price: 'Cena, EUR', quoted: 'Wycena zapisana', empty: 'Wybierz dowolne opcje. Concierge przygotuje indywidualną wycenę.' },
};
export function exclusiveCopy(locale: string) {
  return exclusiveRequestCopy[locale as keyof typeof exclusiveRequestCopy] || exclusiveRequestCopy.en;
}
export function parseExclusiveRequests(raw?: string | null, locale="en"): ExclusiveRequest[] {
  try {
    const items: unknown = JSON.parse(raw || '[]');
    if (!Array.isArray(items)) return [];
    return exclusiveOptionsFor(locale).flatMap(option => {
      const item = items.find(item => item?.id === option.id);
      return item ? [{ ...option, price: typeof item.price === 'number' && Number.isFinite(item.price) && item.price >= 0 ? item.price : null }] : [];
    });
  } catch { return []; }
}
