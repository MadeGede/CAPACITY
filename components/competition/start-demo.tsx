"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useDataMode } from "@/lib/data/mode";
import { useDemandState as useDemoDemand } from "@/lib/demand-store";
import { useRequestState as useDemoRequests } from "@/lib/request-store";
import { beginCompetitionPresentation } from "@/lib/competition-presentation";

export function useStartCompetitionDemo() {
  const router = useRouter();
  const { chooseMode } = useDataMode();
  const demand = useDemoDemand();
  const requests = useDemoRequests();
  return () => {
    // Explicit demo entry only: no writes to the real business workspace or reset of user edits.
    chooseMode("demo");
    demand.viewDemandMatches("demand-demo-cnc");
    requests.setPerspective("buyer");
    beginCompetitionPresentation();
    router.push("/dashboard/buyer");
  };
}

export function StartCompetitionDemo({ className = "", label = "Start Competition Demo" }: { className?: string; label?: string }) {
  const start = useStartCompetitionDemo();
  return <button type="button" onClick={start} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-5 text-xs font-semibold text-white transition hover:bg-brand-600 ${className}`}>{label}<ArrowRight className="h-4 w-4" aria-hidden="true" /></button>;
}
