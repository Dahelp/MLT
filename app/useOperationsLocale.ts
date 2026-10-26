"use client";
import {useSyncExternalStore} from "react";
import type {StaffLocale} from "../content/operations-navigation";

const key = "mlt-operations-locale";
function subscribe(listener: () => void) {
  const update = () => {document.documentElement.dataset.operationsLocale = snapshot(); listener()};
  window.addEventListener("storage", update);
  window.addEventListener("mlt-operations-locale", update);
  return () => {
    window.removeEventListener("storage", update);
    window.removeEventListener("mlt-operations-locale", update);
  };
}
function snapshot(): StaffLocale {
  const value = localStorage.getItem(key);
  return value === "ru" || value === "de" ? value : "en";
}
function changeLocale(value: StaffLocale) {
  localStorage.setItem(key, value);
  document.documentElement.dataset.operationsLocale = value;
  window.dispatchEvent(new Event("mlt-operations-locale"));
}
export function useOperationsLocale() {
  return [useSyncExternalStore(subscribe, snapshot, () => "en" as StaffLocale), changeLocale] as const;
}

const subscribeHydration = () => () => {};
export function useOperationsHydrated() {
  return useSyncExternalStore(subscribeHydration, () => true, () => false);
}
