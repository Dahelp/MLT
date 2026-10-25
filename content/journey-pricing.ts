import pricing from "../public/data/journey-pricing.json";

/** Approved fixed package tariffs shared with PHP. */
export const journeyRates = pricing.collections;
export type JourneyCollectionId = keyof typeof journeyRates;
export const freedomPlusRates: Record<number, number> = pricing.freedomPlus;
export const signatureTailoredRates: Record<number, number> = pricing.signatureTailored;
export const extraGuestRate = pricing.extraGuestRate;

export function parseCatalogData(value?: string | null): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch { return {}; }
}

export function resolveJourneyRates(id: JourneyCollectionId, dataJson?: string | null): { d: number; p: number }[] {
  if (["freedom", "signature", "concierge", "private"].includes(id)) return journeyRates[id];
  const pricing = parseCatalogData(dataJson).pricing;
  const rows = Array.isArray(pricing)
    ? pricing.map(row => ({ d: Number(row?.days), p: Number(row?.price) }))
    : pricing && typeof pricing === "object"
      ? Object.entries(pricing).map(([days, price]) => ({ d: Number(days), p: Number(price) })) : [];
  const valid = rows.filter(row => Number.isInteger(row.d) && row.d > 0 && Number.isFinite(row.p) && row.p >= 0);
  return valid.length ? [...new Map(valid.map(row => [row.d, row])).values()].sort((a, b) => a.d - b.d) : journeyRates[id];
}

export function journeyPrice(id: string, days: number, basePrice: number, upgraded = false): number {
  if (!upgraded) return basePrice;
  // Durations supplied only by the catalog retain a defined price.
  if (id === "freedom") return freedomPlusRates[days] ?? basePrice + 300;
  if (id === "signature") return basePrice;
  return basePrice;
}

export function journeyTotal(basePrice: number, guests: number): number {
  return basePrice + Math.max(0, guests - 2) * extraGuestRate;
}

export function collectionRateLabel(id: JourneyCollectionId, locale: "en" | "de" | "ru" | "it" | "pl" = "en", rows = journeyRates[id]): string {
  const first = rows[0];
  if (!first.p) return "On request";
  const amount = new Intl.NumberFormat(locale === "en" ? "en-GB" : locale, { maximumFractionDigits: 0 }).format(first.p);
  const labels = { en: ["From", `for ${first.d} days`], de: ["Ab", `für ${first.d} Tage`], ru: ["От", `за ${first.d} дней`], it: ["Da", `per ${first.d} giorni`], pl: ["Od", `za ${first.d} dni`] }[locale];
  return labels[0] + " €" + amount + " " + labels[1];
}

export function collectionDurationLabel(id: JourneyCollectionId, locale: "en" | "de" | "ru" | "it" | "pl" = "en", rows = journeyRates[id]): string {
  return rows[0].d + "–" + rows[rows.length - 1].d + " " + { en: "days", de: "Tage", ru: "дней", it: "giorni", pl: "dni" }[locale];
}
