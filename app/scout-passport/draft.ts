import type { ScoutFields } from "../../content/scout";

export type ScoutDraft = { fields: ScoutFields; photos: string[]; requestId: string; editToken: string };
// IndexedDB keeps photos with the draft without exhausting localStorage on phones.
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("mlt-scout", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function scoutDraft(operation: "get" | "put" | "delete", key: string, value?: ScoutDraft): Promise<ScoutDraft | undefined> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction("drafts", operation === "get" ? "readonly" : "readwrite");
      const store = transaction.objectStore("drafts");
      const request = operation === "get" ? store.get(key) : operation === "put" ? store.put(value, key) : store.delete(key);
      transaction.oncomplete = () => resolve(operation === "get" ? request.result : undefined);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { db.close(); }
}

export function newScoutIdentity() {
  return { requestId: crypto.randomUUID(), editToken: Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, "0")).join("") };
}
