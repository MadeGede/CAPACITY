"use client";

import { useSyncExternalStore } from "react";
import type { Capacity } from "../data/capacities";
import type { CapacityListing, CapacityListingDraft, ListingStatus } from "../types/capacity-listing";
import { composeCapacityCatalog, createInitialListings, MANAGED_PROVIDER_ID, normalizeListingStatus, restoreCapacityListing, validateCapacityListing } from "./capacity-listing-rules";

export { isAvailableCapacity, listingStatusLabels, validateCapacityListing } from "./capacity-listing-rules";

const STORAGE_KEY = "capacity-listings-v1";
type CatalogState = { ready: boolean; providers: Capacity[]; managedListings: CapacityListing[]; sessionOnly: boolean };
const initialListings = createInitialListings();
const initial: CatalogState = { ready: false, providers: composeCapacityCatalog(initialListings), managedListings: initialListings, sessionOnly: false };
let state = initial;
const listeners = new Set<() => void>();

function hydrate(force = false) {
  if ((state.ready && !force) || typeof window === "undefined") return;
  let managedListings = createInitialListings();
  let sessionOnly = false;
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (Array.isArray(stored)) {
      const restored = stored.map(restoreCapacityListing).filter((listing): listing is CapacityListing => listing !== null);
      const unique = Array.from(new Map(restored.map((listing) => [listing.id, listing])).values());
      managedListings = unique.some((listing) => listing.id === MANAGED_PROVIDER_ID) ? unique : [...managedListings, ...unique];
    }
  } catch { sessionOnly = true; }
  state = { ready: true, providers: composeCapacityCatalog(managedListings), managedListings, sessionOnly };
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  hydrate(true);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  hydrate();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function publish(managedListings: CapacityListing[]) {
  state = { ...state, ready: true, managedListings, providers: composeCapacityCatalog(managedListings) };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(managedListings)); }
  catch { state = { ...state, sessionOnly: true }; }
  listeners.forEach((listener) => listener());
}

function checked(draft: CapacityListingDraft): CapacityListingDraft {
  const firstError = Object.values(validateCapacityListing(draft))[0];
  if (firstError) throw new Error(firstError);
  return {
    ...structuredClone(draft), capability: draft.capability.trim(), description: draft.description.trim(),
    status: normalizeListingStatus(draft.status, draft.availableCapacity),
    materials: Array.from(new Set(draft.materials.map((value) => value.trim()))),
    facilities: Array.from(new Set(draft.facilities.map((value) => value.trim()))),
    certifications: Array.from(new Set(draft.certifications.map((value) => value.trim()))),
  };
}

function createListing(draft: CapacityListingDraft): string {
  hydrate();
  const listing: CapacityListing = { ...checked(draft), id: `local-capacity-${crypto.randomUUID()}`, providerId: MANAGED_PROVIDER_ID, updatedAt: new Date().toISOString() };
  publish([...state.managedListings, listing]);
  return listing.id;
}

function updateListing(id: string, draft: CapacityListingDraft): void {
  hydrate();
  const current = state.managedListings.find((listing) => listing.id === id);
  if (!current || current.providerId !== MANAGED_PROVIDER_ID) throw new Error("This listing is not managed by the demo provider.");
  const update: CapacityListing = { ...checked(draft), id: current.id, providerId: current.providerId, updatedAt: new Date().toISOString() };
  publish(state.managedListings.map((listing) => listing.id === id ? update : listing));
}

function setListingStatus(id: string, status: ListingStatus): void {
  hydrate();
  const current = state.managedListings.find((listing) => listing.id === id);
  if (!current) throw new Error("This listing could not be found.");
  updateListing(id, { ...current, status, availableCapacity: status === "fully_booked" ? 0 : current.availableCapacity });
}

export function getCatalogSnapshot(): Capacity[] {
  hydrate();
  return state.providers;
}

export function resetDemoCatalog() {
  publish(createInitialListings());
}

export function useCapacityCatalog() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => initial);
  return { ...snapshot, createListing, updateListing, setListingStatus };
}
