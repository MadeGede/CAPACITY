"use client";

import { useSyncExternalStore } from "react";
import type { DemandRequirement, SelectedCapacityRequest, SavedDemand } from "@/types/matching";
import { createEmptyDemand, normalizeDemand, validateDemand } from "./demand-options";
import { createDemoDemands } from "@/data/demands";
import { restoreMatchContext } from "./match-context";
export { restoreMatchContext } from "./match-context";

const STORAGE_KEY = "capacity-demand-v1";
type DemandState = {
  ready: boolean;
  draft: DemandRequirement;
  submittedDemand: DemandRequirement | null;
  selectedRequest: SelectedCapacityRequest | null;
  demands: SavedDemand[];
  activeDemandId: string | null;
};
const initial: DemandState = { ready: false, draft: createEmptyDemand(), submittedDemand: null, selectedRequest: null, demands: [], activeDemandId: null };
let state = initial;
const listeners = new Set<() => void>();

function restoreSubmitted(value: unknown) {
  if (!value) return null;
  const demand = normalizeDemand(value);
  // An earlier saved deadline remains reviewable and is scored as overdue.
  return Object.keys(validateDemand(demand, "0000-01-01")).length === 0 ? demand : null;
}

function hydrate() {
  if (state.ready) return;
  const demoDemands = createDemoDemands();
  let restored: Partial<DemandState> = { demands: demoDemands, activeDemandId: demoDemands[0].id, submittedDemand: demoDemands[0].requirement };
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const data = raw as Record<string, unknown>;
      restored = { ...restored, draft: normalizeDemand(data.draft), submittedDemand: restoreSubmitted(data.submittedDemand) };
      if (Array.isArray(data.demands)) restored.demands = data.demands.flatMap((value: unknown) => {
        if (!value || typeof value !== "object") return [];
        const item = value as SavedDemand;
        if (typeof item.id !== "string" || typeof item.name !== "string" || !["draft", "matching", "open", "fulfilled", "closed"].includes(item.status) || !Number.isFinite(Date.parse(item.createdAt)) || !Number.isFinite(Date.parse(item.updatedAt))) return [];
        const history = item.matchHistory;
        const matchHistory = history && [history.evaluated, history.bestScore, history.strongMatches].every((number) => Number.isFinite(number) && number >= 0) && history.bestScore <= 100 && Number.isFinite(Date.parse(history.updatedAt)) ? history : null;
        return [{ ...item, requirement: normalizeDemand(item.requirement), matchHistory }];
      });
      if (Object.hasOwn(data, "activeDemandId")) restored.activeDemandId = typeof data.activeDemandId === "string" && restored.demands?.some((item) => item.id === data.activeDemandId) ? data.activeDemandId : null;
      const request = data.selectedRequest as Record<string, unknown> | null;
      if (request && typeof request.providerId === "string" && request.providerId) {
        const demand = restoreSubmitted(request.demand);
        if (demand) restored.selectedRequest = { providerId: request.providerId, demand, createdAt: typeof request.createdAt === "string" ? request.createdAt : "", matchContext: restoreMatchContext(request.matchContext) };
      }
    }
  } catch { /* Invalid or unavailable storage falls back to a fresh local draft. */ }
  state = { ...state, ...restored, ready: true };
  persist();
}

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, ready: undefined })); } catch { /* Local demo remains usable in memory when storage is blocked. */ }
}

function publish(values: Partial<DemandState>) {
  hydrate();
  state = { ...state, ...values, ready: true };
  persist();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  hydrate();
  return () => { listeners.delete(listener); };
}

function saveRequirement(requirement: DemandRequirement, status: SavedDemand["status"]) {
  hydrate();
  const id = state.activeDemandId || crypto.randomUUID();
  const current = state.demands.find((item) => item.id === id);
  const now = new Date().toISOString();
  const item: SavedDemand = { id, name: requirement.capability || "Untitled production demand", requirement: structuredClone(requirement), status, createdAt: current?.createdAt || now, updatedAt: now, matchHistory: null };
  publish({ activeDemandId: id, draft: requirement, demands: current ? state.demands.map((value) => value.id === id ? item : value) : [item, ...state.demands] });
}
const saveDraft = (draft: DemandRequirement) => saveRequirement(draft, "draft");
const submitDemand = (demand: DemandRequirement) => { saveRequirement(demand, "open"); publish({ submittedDemand: demand, selectedRequest: null }); };
const selectRequest = (providerId: string, demand: DemandRequirement, matchContext?: SelectedCapacityRequest["matchContext"]) => publish({ selectedRequest: { providerId, demand, createdAt: new Date().toISOString(), matchContext } });
const newDemand = () => publish({ activeDemandId: null, draft: createEmptyDemand(), submittedDemand: null, selectedRequest: null });
function editDemand(id: string) {
  hydrate(); const demand = state.demands.find((item) => item.id === id);
  if (demand) publish({ activeDemandId: id, draft: structuredClone(demand.requirement), selectedRequest: null });
}
function viewDemandMatches(id: string) {
  hydrate(); const demand = state.demands.find((item) => item.id === id);
  if (demand) publish({ activeDemandId: id, draft: structuredClone(demand.requirement), submittedDemand: structuredClone(demand.requirement), selectedRequest: null });
}
function duplicateDemand(id: string) {
  hydrate(); const demand = state.demands.find((item) => item.id === id);
  if (!demand) return;
  const copy = { ...structuredClone(demand), id: crypto.randomUUID(), name: `${demand.name} (copy)`, status: "draft" as const, matchHistory: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  publish({ demands: [copy, ...state.demands], activeDemandId: copy.id, draft: copy.requirement, submittedDemand: null, selectedRequest: null });
  return copy.id;
}
const closeDemand = (id: string) => { hydrate(); publish({ demands: state.demands.map((item) => item.id === id ? { ...item, status: "closed", updatedAt: new Date().toISOString() } : item) }); };
export function resetDemoDemands() {
  const demands = createDemoDemands();
  publish({ demands, activeDemandId: demands[0].id, draft: createEmptyDemand(), submittedDemand: demands[0].requirement, selectedRequest: null });
}
function recordMatches(summary: Omit<NonNullable<SavedDemand["matchHistory"]>, "updatedAt">) {
  hydrate(); const current = state.demands.find((item) => item.id === state.activeDemandId);
  if (!current || ["closed", "fulfilled"].includes(current.status)) return;
  const history = current.matchHistory;
  if (history && history.evaluated === summary.evaluated && history.bestScore === summary.bestScore && history.strongMatches === summary.strongMatches) return;
  const now = new Date().toISOString();
  publish({ demands: state.demands.map((item) => item.id === current.id ? { ...item, status: "open", updatedAt: now, matchHistory: { ...summary, updatedAt: now } } : item) });
}

export function useDemandState() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => initial);
  return { ...snapshot, saveDraft, submitDemand, selectRequest, newDemand, editDemand, viewDemandMatches, duplicateDemand, closeDemand, recordMatches };
}
