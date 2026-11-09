"use client";

import { useEffect, useSyncExternalStore } from "react";
import { publishedRoutePoint, type RoutePoint, type PointResponse } from "../content/route-points";
export type { RoutePoint } from "../content/route-points";

type Snapshot = { points: RoutePoint[]; coordinates: Record<string, [number, number]> };
const initial: Snapshot = { points: [], coordinates: {} };
let current = initial, pending: Promise<void> | null = null, loadedAt = 0;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

async function refresh() {
  if (pending || Date.now() - loadedAt < 60000) return pending;
  pending = fetch("/api/scout.php?action=points", { cache: "no-store" }).then(async response => {
    if (!response.ok) throw new Error("Route points unavailable");
    const data = await response.json();
    if (!Array.isArray(data.points)) return;
    const points = new Map<string, RoutePoint>();
    const coordinates: Snapshot["coordinates"] = {};
    for (const row of data.points as PointResponse[]) {
      const point=publishedRoutePoint(row);
      if (!point) continue;
      points.set(point.id,point);
      coordinates[point.id] = [Number(row.longitude),Number(row.latitude)];
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
