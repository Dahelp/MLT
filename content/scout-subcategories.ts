import taxonomy from "../public/data/scout-subcategories.json";
import type { Locale } from "./i18n";

export function scoutSubcategoriesFor(category: string, locale: Locale) {
  const items = taxonomy[category as keyof typeof taxonomy] || [];
  return items.map(item => ({id: item.id, title: item.title[locale], hint: item.hint[locale]}));
}

export function scoutSubcategoryLabels(category: string, selected: string[], other: string, locale: Locale) {
  return scoutSubcategoriesFor(category, locale).filter(item => selected.includes(item.id))
    .map(item => item.id === "other" && other ? `${item.title}: ${other}` : item.title);
}
