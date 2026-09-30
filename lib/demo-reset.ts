"use client";

import { resetDemoCatalog } from "./capacity-store";
import { resetDemoDemands } from "./demand-store";
import { resetDemoRequests } from "./request-store";
import { resetDemoSavedProviders } from "./saved-providers";
import { resetDemoNotifications } from "./notification-store";

/** Restore each shared store in place so mounted pages update without a reload. */
export function resetDemoData() {
  resetDemoCatalog();
  resetDemoDemands();
  resetDemoRequests();
  resetDemoSavedProviders();
  resetDemoNotifications();
}
