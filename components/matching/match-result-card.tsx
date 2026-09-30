"use client";

import Link from "next/link";
import { useDemandState } from "@/lib/data/demands";
import { ArrowRight, Check, Info, MapPin } from "lucide-react";
import { AvailabilityBadge, VerificationBadge } from "@/components/capacity/badges";
import { CapabilityIcon } from "@/components/capacity/capability-icon";
import { SaveProvider } from "@/components/capacity/save-provider";
import { formatCapacity, formatLeadTime, formatPrice } from "@/lib/capacity-format";
import type { DemandRequirement, MatchResult } from "@/types/matching";
import { MatchScore } from "./match-score";
import { MatchBreakdown } from "./match-breakdown";
import { RequestMatch } from "./request-match";

export function MatchResultCard({ result, demand, isBest }: { result: MatchResult; demand: DemandRequirement; isBest: boolean }) {
  const { provider, estimatedCost } = result;
  const href = `/capacity/${provider.id}?from=matches`;
  const { selectRequest } = useDemandState();
  const matchContext = { score: result.score, classification: result.classification, breakdown: result.breakdown, explanations: result.explanations };
  const preserveContext = () => selectRequest(provider.id, demand, matchContext);

  return (
    <article aria-labelledby={`match-${provider.id}`} className={`surface-premium overflow-hidden rounded-xl transition-[border-color,box-shadow] duration-200 hover:border-blue-200 hover:shadow-soft ${isBest ? "!border-blue-300 shadow-[0_20px_55px_-36px_rgba(29,78,216,.5)]" : ""}`}>
      {isBest && <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50/60 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-600 sm:px-6"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" /> Best Match <span className="ml-1 text-[10px] font-normal normal-case tracking-normal text-slate-500">Highest compatibility for this demand</span></div>}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2.5 text-[10px] font-medium text-slate-500"><span className="grid h-7 w-7 shrink-0 place-items-center rounded border border-slate-200 bg-slate-50 text-slate-500"><CapabilityIcon category={provider.category} className="h-3.5 w-3.5" /></span>{provider.category}</div>
            <h2 id={`match-${provider.id}`} className="text-lg font-bold leading-6 tracking-tight text-ink"><Link href={href} onClick={preserveContext} className="rounded hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600">{provider.name}</Link></h2>
            <div className="mt-2"><VerificationBadge verified={provider.verified} /></div>
            <p className="mt-3 text-sm font-semibold text-slate-700">{provider.capability}</p>
            <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{provider.location}, Indonesia</p>
          </div>
          <MatchScore score={result.score} classification={result.classification} />
        </div>
        <p className="mt-4 max-w-3xl text-xs leading-6 text-slate-500">{provider.description}</p>
        <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-y border-slate-100 py-4 lg:grid-cols-[1.15fr_.65fr_.9fr_1.3fr]">
          <div><dt className="text-[10px] text-slate-500">Available capacity</dt><dd className="mt-1.5 text-xs font-semibold leading-5 text-ink">{formatCapacity(provider)}</dd></div>
          <div><dt className="text-[10px] text-slate-500">Lead time</dt><dd className="mt-1.5 text-xs font-semibold leading-5 text-ink">{formatLeadTime(provider.leadTimeDays)}</dd></div>
          <div><dt className="text-[10px] text-slate-500">Availability</dt><dd className="mt-2"><AvailabilityBadge days={provider.availabilityDays} /></dd></div>
          <div><dt className="text-[10px] text-slate-500">Estimated pricing</dt><dd className="mt-1.5 text-xs font-semibold leading-5 text-ink">{formatPrice(provider.priceFrom)} – {formatPrice(provider.priceTo)}<span className="font-normal text-slate-500"> / {provider.priceUnit}</span></dd></div>
        </dl>
        {estimatedCost && <p className="mt-3 text-[11px] leading-5 text-slate-500">Estimate for your requirement: <strong className="font-semibold text-slate-700">{formatPrice(estimatedCost.min)} – {formatPrice(estimatedCost.max)}</strong><span className="ml-1">({estimatedCost.basis})</span></p>}
        <div className="mt-5">
          <h3 className="text-xs font-semibold text-ink">Why this matches</h3>
          {result.reasons.length > 0 ? <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">{result.reasons.map((reason) => <li key={reason} className="flex items-start gap-2 text-[11px] leading-5 text-slate-600"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />{reason}</li>)}</ul> : <p className="mt-2 text-[11px] leading-5 text-slate-500">This provider has limited alignment with the submitted requirements. Review the analysis before considering this capacity.</p>}
        </div>
        {result.warnings.length > 0 && <div className="mt-4 rounded-md border border-amber-100 bg-amber-50/50 px-3.5 py-3"><h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-700"><Info className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />Items to review</h3><ul className="space-y-1.5">{result.warnings.map((warning) => <li key={warning} className="text-[11px] leading-5 text-slate-600">{warning}</li>)}</ul></div>}
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={href} onClick={preserveContext} className="brand-button inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:flex-none">View Capacity <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
          <RequestMatch providerId={provider.id} demand={demand} matchContext={matchContext} className="flex-1 sm:flex-none" />
          <SaveProvider id={provider.id} name={provider.name} label="Save Provider" className="w-full sm:w-auto" />
        </div>
      </div>
      <MatchBreakdown result={result} />
    </article>
  );
}
