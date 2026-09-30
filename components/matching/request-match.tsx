"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { useDemandState } from "@/lib/data/demands";
import type { DemandRequirement, SelectedCapacityRequest } from "@/types/matching";

export function RequestMatch({ providerId, demand, matchContext, className = "" }: { providerId: string; demand: DemandRequirement; matchContext?: SelectedCapacityRequest["matchContext"]; className?: string }) {
  const router = useRouter();
  const { selectRequest } = useDemandState();
  return (
    <button type="button" onClick={() => { selectRequest(providerId, demand, matchContext); router.push(`/request/${providerId}`); }} className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${className}`}>
      Request Capacity <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );
}
