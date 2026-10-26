"use client";
import {useSyncExternalStore} from "react";
import type {StaffLocale} from "../content/operations-navigation";

const key = "mlt-operations-locale";
function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("mlt-operations-locale", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("mlt-operations-locale", listener);
  };
}
function snapshot(): StaffLocale {
  const value = localStorage.getItem(key);
  return value === "ru" || value === "de" ? value : "en";
}
function changeLocale(value: StaffLocale) {
  localStorage.setItem(key, value);
  window.dispatchEvent(new Event("mlt-operations-locale"));
}
export function useOperationsLocale() {
  return [useSyncExternalStore(subscribe, snapshot, () => "en" as StaffLocale), changeLocale] as const;
}
