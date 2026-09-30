"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDemandState } from "@/lib/data/demands";
import type { DemoPerspective } from "@/types/requests";

export function FirstUse({ businessId, role }: { businessId: string; role: DemoPerspective }) {
  const { newDemand } = useDemandState();
  const [visible, setVisible] = useState(false);
  const key = `capacity-onboarding-${businessId}-${role}`;
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setVisible(localStorage.getItem(key) !== "skipped"); }
      catch { setVisible(true); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [key]);
  if (!visible) return null;
  const buyer = role === "buyer";
  const steps = buyer
    ? ["Create production requirement", "Review capacity matches", "Send request"]
    : ["List available capacity", "Receive business requests", "Start collaborations"];
  return <section aria-labelledby="first-use-title" className="rounded-lg border border-blue-200 bg-blue-50/50 p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Getting started</p><h2 id="first-use-title" className="mt-2 text-base font-semibold">{buyer ? "Find your first production partner" : "Put your available capacity to work"}</h2></div><button type="button" onClick={() => { try { localStorage.setItem(key, "skipped"); } catch { /* This visit only. */ } setVisible(false); }} className="min-h-9 text-xs font-semibold text-slate-500 hover:underline">Skip</button></div>
    <ol className="mt-5 grid gap-3 sm:grid-cols-3">{steps.map((step, index) => <li key={step} className="flex gap-3 text-xs text-slate-600"><span className="font-bold tabular-nums text-brand-600">0{index + 1}</span>{step}</li>)}</ol>
    <Link href={buyer ? "/match" : "/dashboard/capacity/new"} onClick={buyer ? newDemand : undefined} className="mt-5 inline-flex min-h-10 items-center rounded-md bg-ink px-4 text-xs font-semibold text-white">{buyer ? "Create Your First Demand" : "List Your Capacity"}</Link>
  </section>;
}
