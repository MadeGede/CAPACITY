"use client";

import { useSyncExternalStore } from "react";

const KEY = "capacity-read-notifications";
const empty: string[] = [];
let read = empty;
let ready = false;
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  if (!ready) {
    try { const value: unknown = JSON.parse(localStorage.getItem(KEY) || "[]"); if (Array.isArray(value)) read = value.filter((item): item is string => typeof item === "string"); } catch { /* Reading is still available for this visit. */ }
    ready = true;
  }
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function markRead(ids: string[]) {
  read = Array.from(new Set([...read, ...ids])).slice(-500);
  try { localStorage.setItem(KEY, JSON.stringify(read)); } catch { /* Keep the local visit state. */ }
  listeners.forEach((listener) => listener());
}
export function resetDemoNotifications() {
  read = [];
  ready = true;
  try { localStorage.setItem(KEY, "[]"); } catch { /* Keep this visit's demo state. */ }
  listeners.forEach((listener) => listener());
}
export function useReadNotifications() {
  return { readIds: useSyncExternalStore(subscribe, () => read, () => empty), markRead };
}
