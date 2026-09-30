"use client";

import { useSyncExternalStore } from "react";
import { showToast } from "./toast";

const STORAGE_KEY = "capacity-saved-providers";
export const initialSavedProviderIds = ["precision-works", "packpro-indonesia"];
const empty: string[] = [];
let saved: string[] = empty;
let initialized = false;
const listeners = new Set<() => void>();

function readSaved() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const value: unknown = stored === null ? initialSavedProviderIds : JSON.parse(stored);
    if (Array.isArray(value)) {
      const ids = Array.from(new Set(value.filter((id): id is string => typeof id === "string")));
      if (JSON.stringify(saved) !== JSON.stringify(ids)) saved = ids;
    } else if (!initialized) saved = [...initialSavedProviderIds];
  } catch {
    if (!initialized) saved = [...initialSavedProviderIds];
    // Storage may be malformed or unavailable; saving still works for the current visit.
  }
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  readSaved();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    window.addEventListener("storage", onStorage);
    if (!initialized) {
      readSaved();
      initialized = true;
    }
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function toggle(id: string) {
  if (!initialized) { readSaved(); initialized = true; }
  const wasSaved = saved.includes(id);
  saved = wasSaved ? saved.filter((value) => value !== id) : [...saved, id];
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* Keep in-memory state. */ }
  listeners.forEach((listener) => listener());
  showToast(wasSaved ? "Provider removed from saved list" : "Provider saved");
}

export function resetDemoSavedProviders() {
  saved = [...initialSavedProviderIds];
  initialized = true;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* Keep this visit's demo state. */ }
  listeners.forEach((listener) => listener());
}

export function useSavedProviders() {
  const ids = useSyncExternalStore(subscribe, () => saved, () => empty);
  return { ids, toggle };
}
