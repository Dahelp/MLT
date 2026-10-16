import translations from "./acquisition-translations.json";
import type { Listing } from "../app/[locale]/acquisitions/Acquisitions";
const dictionary = translations as Record<string, Partial<Record<string, string>>>;
export const acquisitionLocale = (locale: string) => (({ en: "en-IE", de: "de-DE", ru: "ru-RU", it: "it-IT", pl: "pl-PL" } as Record<string, string>)[locale] || "en-IE");
export const acquisitionText = (text: string, locale: string): string => locale === "en" ? text : dictionary[text]?.[locale] || text;
export const acquisitionMoney = (value: number, locale: string) => new Intl.NumberFormat(acquisitionLocale(locale), { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
/** Translate supplied wording without altering the vehicle facts or seller qualifications. */
export function localizeListing(item: Listing, locale: string): Listing {
  if (locale === "en") return item;
  const t = (text: string) => acquisitionText(text, locale);
  const rows = (value: string | undefined, transform: (row: Record<string, unknown>) => unknown) => {
    try { const data = JSON.parse(value || "[]"); return Array.isArray(data) ? JSON.stringify(data.filter(row => row && typeof row === "object").map(transform)) : value; } catch { return value; }
  };
  return { ...item, subtitle: t(item.subtitle), description: item.description.split(/\n\s*\n/).map(t).join("\n\n"), included: item.included.split("\n").map(t).join("\n"),
    specifications_json: rows(item.specifications_json, row => ({ ...row, label: typeof row.label === "string" ? t(row.label) : "", value: typeof row.value === "string" ? t(row.value) : "" })),
    equipment_json: rows(item.equipment_json, row => ({ ...row, title: typeof row.title === "string" ? t(row.title) : "", items: Array.isArray(row.items) ? row.items.filter((value): value is string => typeof value === "string").map(t) : [] })),
  };
}
