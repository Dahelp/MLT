import { scoutCopy, scoutCategoriesFor, scoutPath } from "./scout-i18n";
import type { Locale } from "./i18n";

export const scoutCategories = scoutCategoriesFor("ru");
export const scoutStatuses = scoutCopy.ru.statuses;
export type ScoutStatus = keyof typeof scoutStatuses;
export type ScoutFields = { scoutName: string; category: string; title: string; country: string; latitude: string; longitude: string; description: string; parking: string; booking: string };
export type ScoutCard = ScoutFields & { id: number; reference: string; photos: string[]; status: ScoutStatus; reviewNote: string; version: number; publishedPointId: number | null; isPublished: boolean; createdAt: string; updatedAt: string };
export const emptyScoutFields: ScoutFields = { scoutName: "", category: "gourmet", title: "", country: "", latitude: "", longitude: "", description: "", parking: "", booking: "" };

export async function scoutRequest(action: string, payload: object = {}, admin = false, locale: Locale = "ru") {
  const t = scoutCopy[locale].errors;
  const response = await fetch("/api/scout.php", {
    method: "POST", cache: "no-store",
    headers: { "Content-Type": "application/json", "X-MLT-Locale": locale, ...(admin ? { Authorization: `Bearer ${localStorage.getItem("mlt-account-token") || ""}` } : {}) },
    body: JSON.stringify({ action, ...payload }),
  }).catch(() => { throw new Error(t.offline); });
  let data;
  try { data = await response.json(); } catch { throw new Error(t.unavailable); }
  if (!response.ok) throw new Error(data.code && data.code in t ? t[data.code as keyof typeof t] : response.status === 429 ? t.rateLimited : response.status >= 500 ? t.unavailable : response.status === 403 ? t.adminRequired : t.requestFailed);
  return data;
}

export function scoutEditLink(reference: string, editToken: string, locale: Locale = "ru") {
  return `${location.origin}${scoutPath(locale)}?reference=${encodeURIComponent(reference)}#key=${encodeURIComponent(editToken)}`;
}
