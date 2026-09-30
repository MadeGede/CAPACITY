"use client";

import Link from "next/link";
import { getSimilarCapacities } from "@/data/capacities";
import { isAvailableCapacity, useCapacityCatalog } from "@/lib/data/capacities";
import { CapacityDetail } from "./capacity-detail";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useDataMode } from "@/lib/data/mode";
import { useRealWorkspace } from "@/lib/data/real-workspace";

export function CatalogProfile({ id }: { id: string }) {
  const { ready, providers } = useCapacityCatalog();
  const { mode } = useDataMode();
  const real = useRealWorkspace();
  if (!ready) return <main id="main-content"><PageSkeleton label="Loading capacity profile" /></main>;
  if (mode === "real" && real.error) return <main id="main-content" className="mx-auto min-h-[60vh] max-w-xl px-5 pb-20 pt-36 text-center"><h1 className="text-2xl font-semibold">Unable to load this capacity listing.</h1><p className="mt-3 text-sm text-slate-500">Please try again.</p><button onClick={() => void real.refresh()} className="mt-6 rounded-md bg-ink px-5 py-3 text-xs font-semibold text-white">Retry</button></main>;
  const capacity = providers.find((provider) => provider.id === id);
  if (!capacity) return (
    <main id="main-content" className="mx-auto min-h-[60vh] max-w-2xl px-5 pb-20 pt-36 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Capacity listing not found</h1>
      <p className="mt-4 text-sm leading-6 text-slate-500">{mode === "real" ? "This listing is unavailable or has been removed." : "This listing is not available in your current workspace. Local demo listings are stored in the browser where they were created."}</p>
      <Link href="/discover" className="mt-6 inline-flex rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white">Discover capacity</Link>
    </main>
  );
  return <CapacityDetail capacity={capacity} similar={getSimilarCapacities(capacity, 3, providers.filter(isAvailableCapacity))} />;
}
