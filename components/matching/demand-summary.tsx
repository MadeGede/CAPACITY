"use client";

import Link from "next/link";
import { CalendarDays, Check, MapPin, Pencil, SlidersHorizontal } from "lucide-react";
import { formatNumber, formatPrice } from "@/lib/capacity-format";
import { requestDate } from "@/lib/request-format";
import { useDemandState } from "@/lib/data/demands";
import type { DemandRequirement } from "@/types/matching";

function formatDate(value: string) {
  return requestDate(value);
}

export function DemandSummary({ demand }: { demand: DemandRequirement }) {
  const { saveDraft } = useDemandState();
  const quantity = demand.demandType === "recurring" ? demand.monthlyQuantity : demand.quantity;
  const budget = demand.budgetFlexible ? "Flexible budget" : demand.budgetMin !== null && demand.budgetMin > 0
    ? `${formatPrice(demand.budgetMin)} – ${formatPrice(demand.budgetMax ?? 0)}`
    : `Up to ${formatPrice(demand.budgetMax ?? 0)}`;

  return (
    <section aria-labelledby="demand-summary-heading" className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id="demand-summary-heading" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500"><SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" /> Your requirements</h2>
        <Link href="/match" onClick={() => saveDraft(demand)} className="inline-flex min-h-8 items-center gap-1.5 rounded text-xs font-semibold text-brand-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"><Pencil className="h-3 w-3" aria-hidden="true" /> Edit Requirements</Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_1.2fr]">
        <div>
          <h3 className="text-base font-bold tracking-tight text-ink">{demand.capability}</h3>
          <p className="mt-1 text-xs text-slate-500">{demand.category}</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">{formatNumber(quantity ?? 0)} {demand.unit}{demand.demandType === "recurring" ? "/month" : ""}</p>
          {demand.demandType === "recurring" && <p className="mt-1 text-[11px] text-slate-500">Recurring · {demand.durationMonths} months</p>}
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400"><MapPin className="h-3 w-3" aria-hidden="true" /> Preferred location</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">{demand.location === "any" ? "Any location" : demand.location}</p>
          <p className="mt-1 text-[11px] text-slate-500">{demand.maxDistanceKm === null ? "No distance preference" : `${demand.maxDistanceKm} km preferred radius`}</p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400"><CalendarDays className="h-3 w-3" aria-hidden="true" /> Complete by</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">{formatDate(demand.completionDate)}</p>
          <p className="mt-1 text-[11px] text-slate-500">{demand.maxLeadTimeDays === null ? "Flexible lead time" : `Lead time ≤ ${demand.maxLeadTimeDays} days`} · <span className="capitalize">{demand.urgency}</span></p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Budget</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{budget}</p>
          <p className="mt-1 text-[11px] text-slate-500">{demand.demandType === "recurring" ? "Per monthly production run" : "For this production requirement"}</p>
        </div>
      </div>
      {(demand.materials.length > 0 || demand.certifications.length > 0) && <div className="mt-5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-4">{[...demand.materials, ...demand.certifications].map((requirement) => <span key={requirement} className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[10px] text-slate-600"><Check className="h-3 w-3 text-slate-400" aria-hidden="true" />{requirement}</span>)}</div>}
      <details className="mt-4">
        <summary className="w-fit cursor-pointer rounded text-[11px] font-medium text-slate-500 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600">How these requirements are evaluated</summary>
        <div className="mt-3 space-y-2 text-[11px] leading-5 text-slate-500">
          <p>Scores use six weighted rules against sample provider data. Timing considers availability and production lead time against your completion date. Location uses city relationships; the preferred distance is recorded but is not measured or scored.</p>
          <p>Materials and certifications are checked against listed information and surfaced as review notes. Your description, quality requirements, technical notes, and recurring duration remain context for the provider; they are not independently verified.</p>
          {demand.description && <p className="border-t border-slate-100 pt-3"><span className="font-semibold text-slate-600">Production brief:</span> {demand.description}</p>}
          {demand.qualityRequirements && <p><span className="font-semibold text-slate-600">Quality:</span> {demand.qualityRequirements}</p>}
          {demand.technicalNotes && <p><span className="font-semibold text-slate-600">Technical notes:</span> {demand.technicalNotes}</p>}
        </div>
      </details>
    </section>
  );
}
