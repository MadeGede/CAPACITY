"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { useDemandState } from "@/lib/data/demands";

export function RequestCapacity({ name, providerId }: { name: string; providerId: string }) {
  const router = useRouter();
  const { ready, selectedRequest, submittedDemand, selectRequest } = useDemandState();
  const handleRequest = () => {
    if (submittedDemand && selectedRequest?.providerId !== providerId) {
      selectRequest(providerId, submittedDemand);
    }
    router.push(`/request/${providerId}`);
  };
  return (
    <button type="button" disabled={!ready} onClick={handleRequest} aria-label={`Request capacity from ${name}`} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-500 px-4 py-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:text-sm">
      Request Capacity <ArrowUpRight size={16} aria-hidden="true" />
    </button>
  );
}
