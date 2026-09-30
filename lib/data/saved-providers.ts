"use client";
import { useSavedProviders as useDemoSaved } from "@/lib/saved-providers";
import { useDataMode } from "./mode";
import { useRealWorkspace } from "./real-workspace";
export function useSavedProviders(): { ids: string[]; toggle: (id: string) => void | Promise<void> } {
  const demo = useDemoSaved(); const real = useRealWorkspace(); const { mode } = useDataMode();
  return mode === "demo" ? demo : { ids: real.savedIds, toggle: real.toggleSaved };
}
