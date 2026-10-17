import type { Locale } from "./i18n";

export const carouselLabels: Record<Locale, { previous: string; next: string }> = {
  en: { previous: "Previous item", next: "Next item" },
  de: { previous: "Vorheriger Eintrag", next: "Nächster Eintrag" },
  ru: { previous: "Предыдущий элемент", next: "Следующий элемент" },
  it: { previous: "Elemento precedente", next: "Elemento successivo" },
  pl: { previous: "Poprzedni element", next: "Następny element" },
};
