export const scoutCategories = [
  { id: "gourmet", title: "Gourmet", hint: "Рестораны и вкус" },
  { id: "stay", title: "Stay", hint: "Жильё и кемпинги" },
  { id: "sight", title: "Sight", hint: "Места и виды" },
  { id: "experience", title: "Experience", hint: "Впечатления" },
] as const;

export const scoutStatuses = { pending: "На проверке", accepted: "Принято", rejected: "Отклонено", revision: "На доработку" } as const;
export type ScoutStatus = keyof typeof scoutStatuses;
export type ScoutFields = { scoutName: string; category: string; title: string; country: string; latitude: string; longitude: string; description: string; parking: string; booking: string };
export type ScoutCard = ScoutFields & { id: number; reference: string; photos: string[]; status: ScoutStatus; reviewNote: string; version: number; publishedPointId: number | null; isPublished: boolean; createdAt: string; updatedAt: string };
export const emptyScoutFields: ScoutFields = { scoutName: "", category: "gourmet", title: "", country: "", latitude: "", longitude: "", description: "", parking: "", booking: "" };

export async function scoutRequest(action: string, payload: object = {}, admin = false) {
  const response = await fetch("/api/scout.php", {
    method: "POST", cache: "no-store",
    headers: { "Content-Type": "application/json", ...(admin ? { Authorization: `Bearer ${localStorage.getItem("mlt-account-token") || ""}` } : {}) },
    body: JSON.stringify({ action, ...payload }),
  });
  let data;
  try { data = await response.json(); } catch { throw new Error("Сервис временно недоступен. Данные сохранены на этом устройстве; попробуйте ещё раз."); }
  if (!response.ok) throw new Error(data.error || "Не удалось выполнить запрос. Попробуйте ещё раз.");
  return data;
}

export function scoutEditLink(reference: string, editToken: string) {
  return `${location.origin}/scout-passport/?reference=${encodeURIComponent(reference)}#key=${encodeURIComponent(editToken)}`;
}
