"use client";

import { useEffect, useState } from "react";
import type { DepartureRule } from "../app/collections/[slug]/DepartureCalendar";

export type CatalogItem = {
  item_type?: string;
  collection_id?: string | null;
  slug?: string;
  title?: string;
  image_path?: string | null;
  data_json?: string | null;
  is_active?: number | boolean;
  [key: string]: unknown;
};

export const anyDepartureRule: DepartureRule = { mode: "any", weekdays: [], blockedDates: [], allowedDates: [] };

export function parseDepartureRule(dataJson?: string | null): DepartureRule {
  if (!dataJson) return anyDepartureRule;
  try {
    const value = (JSON.parse(dataJson) as { departureRule?: Partial<DepartureRule> }).departureRule;
    if (!value) return anyDepartureRule;
    return {
      mode: value.mode === "weekdays" ? "weekdays" : "any",
      weekdays: Array.isArray(value.weekdays) ? value.weekdays.map(Number).filter(day => day >= 0 && day <= 6) : [],
      blockedDates: Array.isArray(value.blockedDates) ? value.blockedDates.map(String) : [],
      allowedDates: Array.isArray(value.allowedDates) ? value.allowedDates.map(String) : [],
    };
  } catch {
    return anyDepartureRule;
  }
}

export function nextAllowedDeparture(value: string, rule: DepartureRule): string {
  const date = new Date(`${value}T12:00:00`);
  for (let offset = 0; offset < 370; offset += 1) {
    const key = date.toISOString().slice(0, 10);
    if (rule.allowedDates.includes(key) || (!rule.blockedDates.includes(key) && (rule.mode === "any" || rule.weekdays.includes(date.getDay())))) return key;
    date.setDate(date.getDate() + 1);
  }
  return value;
}

export function useCatalogItems(): CatalogItem[] {
  const [items, setItems] = useState<CatalogItem[]>([]);
  useEffect(() => {
    let alive = true;
    fetch("/api/catalog.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "list" }) })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => { if (alive && Array.isArray(data.items)) setItems(data.items); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return items;
}
