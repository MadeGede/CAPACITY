"use client";

import { useCapacityCatalog as useDemoCatalog } from "@/lib/capacity-store";
import { useDataMode } from "./mode";
import { useRealWorkspace } from "./real-workspace";
export { isAvailableCapacity, listingStatusLabels, validateCapacityListing } from "@/lib/capacity-store";

export function useCapacityCatalog() {
  const demo = useDemoCatalog();
  const real = useRealWorkspace();
  const { mode } = useDataMode();
  return mode === "demo" ? demo : { ready: real.ready, providers: real.providers, managedListings: real.managedListings, sessionOnly: false,
    createListing: real.createListing, updateListing: real.updateListing, setListingStatus: real.setListingStatus, error: real.error };
}
