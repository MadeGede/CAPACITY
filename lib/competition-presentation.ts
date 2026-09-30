"use client";

import { useSyncExternalStore } from "react";

type Presentation = { active: boolean; open: boolean; step: number; dismissed: string[] };
const initial: Presentation = { active: false, open: false, step: 1, dismissed: [] };
const key = "capacity-competition-presentation-v1";
let state = initial;
let hydrated = false;
const listeners = new Set<() => void>();
function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(key) || "null");
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const item = value as Record<string, unknown>;
      state = { active: item.active === true, open: false, step: typeof item.step === "number" && Number.isInteger(item.step) && item.step >= 0 && item.step < 8 ? item.step : 1,
        dismissed: Array.isArray(item.dismissed) ? item.dismissed.filter((id): id is string => typeof id === "string").slice(0, 20) : [] };
    }
  } catch { /* Presentation remains usable without storage. No product records are stored here. */ }
}
function publish(update: Partial<Presentation>) {
  hydrate(); state = { ...state, ...update };
  try { sessionStorage.setItem(key, JSON.stringify({ ...state, open: false })); } catch { /* Optional presentation state. */ }
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) { listeners.add(listener); hydrate(); return () => { listeners.delete(listener); }; }
export const beginCompetitionPresentation = () => publish({ active: true, open: false, step: 1, dismissed: [] });
export const endCompetitionPresentation = () => publish({ active: false, open: false });
export const openCompetitionGuide = () => publish({ active: true, open: true });
export const closeCompetitionGuide = () => publish({ open: false });
export const exploreCompetitionStep = (step: number) => publish({ step: Math.max(0, Math.min(7, step)), open: false });
export const dismissCompetitionCallout = (id: string) => publish({ dismissed: Array.from(new Set([...state.dismissed, id])) });
export function useCompetitionPresentation() { return useSyncExternalStore(subscribe, () => state, () => initial); }
