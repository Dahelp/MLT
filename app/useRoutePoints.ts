"use client";

import { useEffect, useSyncExternalStore } from "react";
import { mapPoints } from "../content/mlt";
import { mapCoordinates } from "../content/map";

export type RoutePoint = { id: string; country: string; name: string; type: string; className: string };
type PointResponse = { slug: string; title: string; country_name: string; latitude: string | number; longitude: string | number; category?: string };
type Snapshot = { points: RoutePoint[]; coordinates: Record<string, [number, number]> };
const initial: Snapshot = { points: mapPoints, coordinates: mapCoordinates };
let current = initial, pending: Promise<void> | null = null, loadedAt = 0;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const categoryNames: Record<string, string> = { gourmet: "Gourmet", stay: "Stay", sight: "Sight", experience: "Experience" };

async function refresh() {
  if (pending || Date.now() - loadedAt < 60000) return pending;
  pending = fetch("/api/scout.php?action=points", { cache: "no-store" }).then(async response => {
    if (!response.ok) throw new Error("Route points unavailable");
    const data = await response.json();
    if (!Array.isArray(data.points)) return;
    const points = new Map<string, RoutePoint>(initial.points.map(point => [point.id, point]));
    const coordinates = { ...mapCoordinates };
    for (const row of data.points as PointResponse[]) {
      const lat = Number(row.latitude), lng = Number(row.longitude);
      if (row.latitude == null || row.longitude == null || !row.slug || typeof row.title !== "string" || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
      points.set(row.slug, { id: row.slug, name: row.title, country: row.country_name || "", type: categoryNames[row.category || ""] || "MLT location", className: "pin-catalog" });
      coordinates[row.slug] = [lng, lat];
    }
    current = { points: [...points.values()], coordinates }; loadedAt = Date.now();
    listeners.forEach(listener => listener());
  }).catch(() => { /* Preserve existing map content through network failures. */ }).finally(() => { pending = null; });
  return pending;
}

/** One shared catalog keeps every map, its selection list and staff choices in sync. */
export function useRoutePoints(enabled = true) {
  const value = useSyncExternalStore(subscribe, () => current, () => initial);
  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const visible = () => { if (!document.hidden) void refresh(); };
    const timer = window.setInterval(visible, 60000);
    document.addEventListener("visibilitychange", visible);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, [enabled]);
  return value;
}
