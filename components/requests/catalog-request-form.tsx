"use client";

import Link from "next/link";
import { isAvailableCapacity, useCapacityCatalog } from "@/lib/data/capacities";
import { RequestForm } from "./request-form";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useDataMode } from "@/lib/data/mode";
import { useRealWorkspace } from "@/lib/data/real-workspace";

export function CatalogRequestForm({ providerId }: { providerId: string }) {
  const { ready, providers } = useCapacityCatalog();
  const { mode } = useDataMode();
  const real = useRealWorkspace();
  if (!ready) return <main id="main-content"><PageSkeleton label="Loading provider capacity" /></main>;
  if (mode === "real" && real.error) return <main id="main-content" className="mx-auto min-h-[60vh] max-w-xl px-5 pb-20 pt-36 text-center"><h1 className="text-2xl font-semibold">Unable to load provider capacity.</h1><button onClick={() => void real.refresh()} className="mt-6 rounded-md bg-ink px-5 py-3 text-xs font-semibold text-white">Retry</button></main>;
  const provider = providers.find((item) => item.id === providerId);
  if (!provider || !isAvailableCapacity(provider)) return (
    <main id="main-content" className="mx-auto min-h-[60vh] max-w-2xl px-5 pb-20 pt-36 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{provider ? "This capacity is currently unavailable" : "Capacity listing not found"}</h1>
      <p className="mt-4 text-sm leading-6 text-slate-500">{provider ? "The listing is paused or fully booked. Existing collaborations remain available in your workspace." : "This listing is not available in the current capacity directory."}</p>
      <Link href="/discover" className="mt-6 inline-flex rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white">Discover available capacity</Link>
    </main>
  );
  return <RequestForm key={provider.id} provider={provider} />;
}
