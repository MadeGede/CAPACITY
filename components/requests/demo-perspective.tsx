"use client";

import { useId } from "react";
import { useRequestState } from "@/lib/data/requests";
import { useDataMode } from "@/lib/data/mode";
import type { DemoPerspective } from "@/types/requests";

export function DemoPerspectiveSwitcher() {
  const id = useId();
  const { ready, perspective, setPerspective } = useRequestState();
  const { mode } = useDataMode();
  return (
    <div className="inline-flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white py-1.5 pl-3.5 pr-2">
      <label htmlFor={id} className="text-[11px] font-medium text-slate-500">View as</label>
      <select id={id} aria-label={mode === "real" ? "Business role" : "Demo perspective"} value={perspective} disabled={!ready} onChange={(event) => setPerspective(event.target.value as DemoPerspective)} className="min-h-8 rounded bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 disabled:opacity-50">
        <option value="buyer">Buyer</option>
        <option value="provider">Provider</option>
      </select>
    </div>
  );
}
