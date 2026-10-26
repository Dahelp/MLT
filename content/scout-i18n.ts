import translations from "../public/data/scout-i18n.json";
import type { Locale } from "./i18n";

export const scoutCopy = translations;
export const scoutCategoryIds = ["gourmet", "stay", "sight", "experience"] as const;
export function scoutCategoriesFor(locale: Locale) {
  return scoutCategoryIds.map(id => ({ id, title: scoutCopy[locale].categories[id], hint: scoutCopy[locale].categoryHints[id] }));
}
export function scoutFormat(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
}
export function scoutPath(locale: Locale) { return `/${locale}/scout-passport/`; }
export function isScoutPath(path: string) { return /^\/(?:en\/|de\/|ru\/|it\/|pl\/)?scout-passport(?:\/|$)/.test(path); }
