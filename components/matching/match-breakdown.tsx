import { ChevronDown, Info } from "lucide-react";
import { MATCH_WEIGHTS } from "@/lib/matching";
import type { MatchCriterion, MatchResult } from "@/types/matching";

const criteria: { key: MatchCriterion; label: string }[] = [
  { key: "capability", label: "Capability" },
  { key: "capacity", label: "Capacity" },
  { key: "location", label: "Location" },
  { key: "availability", label: "Availability" },
  { key: "leadTime", label: "Lead time" },
  { key: "cost", label: "Estimated cost" },
];

export function MatchBreakdown({ result }: { result: MatchResult }) {
  return (
    <details className="group/analysis border-t border-slate-200">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-b-lg px-5 py-3 text-xs font-semibold text-brand-600 transition hover:bg-blue-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 sm:px-6 [&::-webkit-details-marker]:hidden">
        <span>View Match Analysis<span className="sr-only"> for {result.provider.name}</span></span>
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open/analysis:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-slate-100 bg-slate-50/50 px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-ink">Compatibility breakdown</h3>
          <span className="text-[11px] text-slate-500">Weighted total <strong className="ml-1 font-semibold text-ink">{result.score}%</strong></span>
        </div>
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {criteria.map(({ key, label }) => (
            <div key={key}>
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-slate-700">{label} <span className="ml-1 text-[10px] font-normal text-slate-400">{Math.round(MATCH_WEIGHTS[key] * 100)}% weight</span></span>
                <span className="font-semibold tabular-nums text-ink">{result.breakdown[key]}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200" role="meter" aria-label={`${label} fit`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={result.breakdown[key]}>
                <div className="h-full rounded-full bg-brand-500/80" style={{ width: `${result.breakdown[key]}%` }} />
              </div>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">{result.explanations[key]}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 flex items-start gap-2 border-t border-slate-200 pt-4 text-[11px] leading-5 text-slate-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />Each criterion contributes its score × weight. The total is rounded to a whole percentage; it is a requirement-fit indicator, not a confirmation of provider acceptance.</p>
      </div>
    </details>
  );
}
