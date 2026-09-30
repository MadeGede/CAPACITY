"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, Info, SearchX, SlidersHorizontal } from "lucide-react";
import { locations } from "@/data/capacities";
import { useDemandState } from "@/lib/data/demands";
import { useCapacityCatalog } from "@/lib/data/capacities";
import { useDataMode } from "@/lib/data/mode";
import { useRealWorkspace } from "@/lib/data/real-workspace";
import { MATCH_WEIGHTS, rankProviders } from "@/lib/matching";
import { DemandSummary } from "./demand-summary";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { MatchResultCard } from "./match-result-card";
import { DemoExplanationCallout } from "@/components/competition/explanation-callout";

type ResultsSort = "match" | "capacity" | "lead" | "location" | "cost";
type ResultFilters = { verified: boolean; availableNow: boolean; lead: string; location: string };
const emptyFilters: ResultFilters = { verified: false, availableNow: false, lead: "", location: "" };
const selectClass = "min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600";
const focusClass = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600";

export function MatchResults() {
  const { mode } = useDataMode();
  const real = useRealWorkspace();
  const { ready, submittedDemand, saveDraft, recordMatches } = useDemandState();
  const { ready: catalogReady, providers } = useCapacityCatalog();
  const [filters, setFilters] = useState<ResultFilters>(emptyFilters);
  const [sort, setSort] = useState<ResultsSort>("match");
  const [visibleCount, setVisibleCount] = useState(6);
  const matches = useMemo(() => submittedDemand ? rankProviders(submittedDemand, providers) : [], [submittedDemand, providers]);
  useEffect(() => {
    if (ready && catalogReady && submittedDemand) recordMatches({ evaluated: matches.length, bestScore: matches[0]?.score ?? 0, strongMatches: matches.filter((item) => item.score >= 90).length });
  }, [ready, catalogReady, submittedDemand, matches, recordMatches]);
  const filtered = useMemo(() => matches.filter(({ provider }) =>
    (!filters.verified || provider.verified) &&
    (!filters.availableNow || provider.availabilityDays === 0) &&
    (!filters.lead || provider.leadTimeDays <= Number(filters.lead)) &&
    (!filters.location || provider.location === filters.location),
  ).sort((a, b) => {
    const scoreOrder = b.score - a.score || b.breakdown.capability - a.breakdown.capability || b.provider.ranking - a.provider.ranking || a.provider.name.localeCompare(b.provider.name);
    switch (sort) {
      case "capacity": return b.provider.availableCapacity - a.provider.availableCapacity || scoreOrder;
      case "lead": return a.provider.leadTimeDays - b.provider.leadTimeDays || scoreOrder;
      case "location": return b.breakdown.location - a.breakdown.location || scoreOrder;
      case "cost": return (a.estimatedCost?.min ?? Infinity) - (b.estimatedCost?.min ?? Infinity) || scoreOrder;
      default: return scoreOrder;
    }
  }), [matches, filters, sort]);
  const activeFilters = Number(filters.verified) + Number(filters.availableNow) + Number(Boolean(filters.lead)) + Number(Boolean(filters.location));
  const updateFilters = (update: Partial<ResultFilters>) => { setFilters((current) => ({ ...current, ...update })); setVisibleCount(6); };
  const clearFilters = () => { setFilters(emptyFilters); setVisibleCount(6); };

  if (!ready || !catalogReady) {
    return <PageSkeleton label="Preparing your capacity matches" />;
  }
  if (mode === "real" && real.error) return <section role="alert" className="mx-auto max-w-xl px-5 py-20 text-center"><h1 className="text-2xl font-semibold">Unable to load capacity matches.</h1><p className="mt-3 text-sm text-slate-500">Your production data is temporarily unavailable.</p><button type="button" onClick={() => void real.refresh()} className="mt-6 min-h-10 rounded-md bg-ink px-5 text-xs font-semibold text-white">Try Again</button></section>;

  if (!submittedDemand) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-20 text-center sm:py-28">
        <span className="mx-auto mb-6 grid h-12 w-12 place-items-center rounded-xl border border-blue-100 bg-blue-50 text-brand-600"><SlidersHorizontal className="h-5 w-5" aria-hidden="true" /></span>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Smart Matching</p>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Start with your production requirements.</h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-slate-500">Tell us the capability, quantity, location, and timeline you need. Your ranked capacity matches will appear here.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/match" className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-5 text-xs font-semibold text-white hover:bg-brand-600 ${focusClass}`}>Create Requirements <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          <Link href="/discover" className={`inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-xs font-semibold text-slate-600 hover:border-slate-300 ${focusClass}`}>Explore capacity</Link>
        </div>
      </section>
    );
  }

  const best = matches[0];
  const strongCount = matches.filter((result) => result.score >= 90).length;
  const noStrongMatches = matches.length > 0 && !matches.some((result) => result.score > 75);
  const editDemand = () => saveDraft(submittedDemand);

  return (
    <>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 pb-8 pt-6 sm:px-8 sm:pb-10 lg:px-10">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <Link href="/match" onClick={editDemand} className={`inline-flex min-h-9 items-center gap-1.5 rounded text-xs font-medium text-slate-500 hover:text-brand-600 ${focusClass}`}><ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to requirements</Link>
            <span className="text-[10px] font-medium text-slate-400">{mode === "real" ? "Live capacity listings" : "Sample provider directory"}</span>
          </div>
          <DemoExplanationCallout id="matching">CAPACITY evaluates six weighted compatibility factors and explains the result. A high score still requires review of quantity, scheduling, and price assumptions.</DemoExplanationCallout>
          <div className="grid items-end gap-7 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
            <div>
              <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600"><span className="h-px w-5 bg-brand-500" aria-hidden="true" /> Smart Matching</p>
              <h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em] text-ink sm:text-[40px]">Your Capacity Matches</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500">CAPACITY compared your production requirements with available business capacity.</p>
            </div>
            <dl className="grid grid-cols-3 divide-x divide-slate-200 border-y border-slate-200 py-5 lg:border-y-0 lg:py-1">
              <div className="pr-3"><dd className="text-[28px] font-bold leading-none tracking-tight tabular-nums text-ink sm:text-3xl">{matches.length}</dd><dt className="mt-2 text-[10px] leading-4 text-slate-500 sm:text-xs">Providers evaluated</dt></div>
              <div className="px-3 sm:px-5"><dd className="text-[28px] font-bold leading-none tracking-tight tabular-nums text-ink sm:text-3xl">{strongCount}</dd><dt className="mt-2 text-[10px] leading-4 text-slate-500 sm:text-xs">Strong matches <span className="block text-[10px] text-slate-400">90% and above</span></dt></div>
              <div className="pl-3 sm:pl-5"><dd className="text-[28px] font-bold leading-none tracking-tight tabular-nums text-brand-600 sm:text-3xl">{best ? `${best.score}%` : "—"}</dd><dt className="mt-2 text-[10px] leading-4 text-slate-500 sm:text-xs">Best match</dt></div>
            </dl>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
        <DemandSummary demand={submittedDemand} />
        <p className="mt-4 flex items-start gap-2 px-1 text-[11px] leading-5 text-slate-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />Compatibility scores support business discovery and decision-making. Final production terms are agreed directly between participating businesses.</p>
        <details className="mt-3 rounded-lg border border-line bg-white p-4 text-xs text-slate-600"><summary className="cursor-pointer font-semibold text-brand-700">How Matching Works</summary><p className="mt-3 leading-6">Providers are ranked using compatibility between your production requirement and currently available provider capacity.</p><dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-3">{([['Capability', MATCH_WEIGHTS.capability], ['Capacity', MATCH_WEIGHTS.capacity], ['Location', MATCH_WEIGHTS.location], ['Availability', MATCH_WEIGHTS.availability], ['Lead Time', MATCH_WEIGHTS.leadTime], ['Estimated Cost', MATCH_WEIGHTS.cost]] as const).map(([label, weight]) => <div key={label} className="flex justify-between gap-2 border-b border-slate-100 pb-1"><dt>{label}</dt><dd className="font-semibold">{Math.round(weight * 100)}%</dd></div>)}</dl></details>

        {noStrongMatches && (
          <section className="mt-7 rounded-lg border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="no-strong-matches-heading">
            <h2 id="no-strong-matches-heading" className="text-base font-semibold text-ink">No strong matches yet.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">We found some providers that partially match your requirements. Consider adjusting quantity, location, timeline, or budget to discover more options.</p>
            <Link href="/match" onClick={editDemand} className={`mt-3 inline-flex min-h-10 items-center gap-2 rounded text-xs font-semibold text-brand-600 hover:underline ${focusClass}`}>Adjust Requirements <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
          </section>
        )}

        <section className="mt-8" aria-labelledby="matched-providers-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div role="status" aria-live="polite" aria-atomic="true"><h2 id="matched-providers-heading" className="text-lg font-bold tracking-tight text-ink">Recommended providers</h2><p className="mt-1 text-xs text-slate-500">{filtered.length} of {matches.length} evaluated providers{activeFilters > 0 ? " match your filters" : " ranked for your requirements"}.</p></div>
            <label className="flex items-center gap-2 text-[11px] text-slate-500">Sort by
              <select aria-label="Sort matched providers" value={sort} onChange={(event) => { setSort(event.target.value as ResultsSort); setVisibleCount(6); }} className={`${selectClass} !w-auto max-w-[200px]`}>
                <option value="match">Best Match</option><option value="capacity">Highest Capacity</option><option value="lead">Shortest Lead Time</option><option value="location">Closest Location</option><option value="cost">Lowest Estimated Cost</option>
              </select>
            </label>
          </div>
          <div className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-3.5 sm:grid-cols-2 lg:grid-cols-[auto_auto_1fr_1fr_auto] lg:items-center lg:gap-5">
            <label className="flex min-h-10 cursor-pointer items-center gap-2 text-xs font-medium text-slate-600"><input type="checkbox" checked={filters.verified} onChange={(event) => updateFilters({ verified: event.target.checked })} className={`h-3.5 w-3.5 accent-[#1d4ed8] ${focusClass}`} />Verified Only</label>
            <label className="flex min-h-10 cursor-pointer items-center gap-2 text-xs font-medium text-slate-600"><input type="checkbox" checked={filters.availableNow} onChange={(event) => updateFilters({ availableNow: event.target.checked })} className={`h-3.5 w-3.5 accent-[#1d4ed8] ${focusClass}`} />Available Now</label>
            <select aria-label="Filter matches by lead time" value={filters.lead} onChange={(event) => updateFilters({ lead: event.target.value })} className={selectClass}><option value="">Any lead time</option>{[7, 14, 21, 30].map((days) => <option key={days} value={days}>Lead time ≤ {days} days</option>)}</select>
            <select aria-label="Filter matches by location" value={filters.location} onChange={(event) => updateFilters({ location: event.target.value })} className={selectClass}><option value="">All locations</option>{locations.map((location) => <option key={location} value={location}>{location}</option>)}</select>
            <button type="button" onClick={clearFilters} disabled={activeFilters === 0} className={`min-h-10 rounded text-left text-[11px] font-semibold text-brand-600 hover:underline disabled:text-slate-400 disabled:no-underline ${focusClass}`}>Clear filters{activeFilters > 0 ? ` (${activeFilters})` : ""}</button>
          </div>
          {sort === "capacity" && <p className="mb-4 text-[11px] leading-5 text-slate-500">Capacity is sorted by listed quantity. Units differ between industries; check each provider’s production capability.</p>}
          {sort === "location" && <p className="mb-4 text-[11px] leading-5 text-slate-500">Location order uses city and regional fit, not measured distance.</p>}
          {sort === "cost" && <p className="mb-4 text-[11px] leading-5 text-slate-500">Sorted by the lower estimate for your required quantity. Providers without a comparable estimate appear last.</p>}

          {filtered.length > 0 ? (
            <>
              <div className="space-y-5">{filtered.slice(0, visibleCount).map((result) => <MatchResultCard key={result.provider.id} result={result} demand={submittedDemand} isBest={result.provider.id === best?.provider.id} />)}</div>
              <div className="pb-5 pt-7 text-center">
                <p className="text-[11px] text-slate-500">Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} providers</p>
                {visibleCount < filtered.length && <button type="button" onClick={() => setVisibleCount((count) => count + 6)} className={`mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:text-brand-600 ${focusClass}`}>Show more providers <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /></button>}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
              <SearchX className="mx-auto h-7 w-7 text-slate-400" aria-hidden="true" />
              <h3 className="mt-5 text-lg font-semibold text-ink">No providers match these filters.</h3>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">Clear the result filters to return to your ranked recommendations. Your production requirements will stay the same.</p>
              <button type="button" onClick={clearFilters} className={`mt-6 min-h-11 rounded-lg bg-ink px-5 text-xs font-semibold text-white hover:bg-brand-600 ${focusClass}`}>Clear Filters</button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
