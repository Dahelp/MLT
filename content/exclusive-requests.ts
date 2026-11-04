import options from '../public/data/private-exclusive-requests.json';

export const exclusiveRequestOptions = options;
export type ExclusiveRequest = { id: string; title: string; price: number | null };
export const exclusiveRequestCopy = {
  en: { pending: 'Individual quote pending', included: 'Included in your journey total', total: 'Exclusive Requests total', save: 'Save individual quote', saved: 'Quote saved in the client account', price: 'Price, EUR', quoted: 'Quote saved', empty: 'Choose any options you would like. Your concierge will prepare an individual quote.' },
  ru: { pending: 'Ожидается индивидуальный расчёт', included: 'Включено в итоговую стоимость поездки', total: 'Итого за Exclusive Requests', save: 'Сохранить индивидуальный расчёт', saved: 'Расчёт сохранён в кабинете клиента', price: 'Стоимость, EUR', quoted: 'Расчёт сохранён', empty: 'Отметьте желаемые опции. Консьерж подготовит индивидуальный расчёт.' },
  de: { pending: 'Individuelles Angebot ausstehend', included: 'Im Gesamtpreis Ihrer Reise enthalten', total: 'Exclusive Requests gesamt', save: 'Individuelles Angebot speichern', saved: 'Angebot im Kundenkonto gespeichert', price: 'Preis, EUR', quoted: 'Angebot gespeichert', empty: 'Wählen Sie Ihre Wünsche. Ihr Concierge erstellt ein individuelles Angebot.' },
  it: { pending: 'Preventivo individuale in attesa', included: 'Incluso nel totale del viaggio', total: 'Totale Exclusive Requests', save: 'Salva il preventivo individuale', saved: 'Preventivo salvato nell’account del cliente', price: 'Prezzo, EUR', quoted: 'Preventivo salvato', empty: 'Seleziona le opzioni desiderate. Il concierge preparerà un preventivo individuale.' },
  pl: { pending: 'Oczekiwanie na indywidualną wycenę', included: 'Wliczone w całkowitą cenę podróży', total: 'Suma Exclusive Requests', save: 'Zapisz indywidualną wycenę', saved: 'Wycena zapisana na koncie klienta', price: 'Cena, EUR', quoted: 'Wycena zapisana', empty: 'Wybierz dowolne opcje. Concierge przygotuje indywidualną wycenę.' },
};
export function exclusiveCopy(locale: string) {
  return exclusiveRequestCopy[locale as keyof typeof exclusiveRequestCopy] || exclusiveRequestCopy.en;
}
export function parseExclusiveRequests(raw?: string | null): ExclusiveRequest[] {
  try {
    const items: unknown = JSON.parse(raw || '[]');
    if (!Array.isArray(items)) return [];
    return options.flatMap(option => {
      const item = items.find(item => item?.id === option.id);
      return item ? [{ ...option, price: typeof item.price === 'number' && Number.isFinite(item.price) && item.price >= 0 ? item.price : null }] : [];
    });
  } catch { return []; }
}
