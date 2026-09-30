"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bookmark, Check, SearchX, SlidersHorizontal, X } from "lucide-react";
import { categories } from "@/data/capacities";
import { isAvailableCapacity, useCapacityCatalog } from "@/lib/data/capacities";
import { activeFilterCount, defaultFilters, discoveryUrl, filterCapacities, parseDiscoveryFilters, type DiscoveryFilters } from "@/lib/capacity-discovery";
import { useSavedProviders } from "@/lib/data/saved-providers";
import { CapacityCard } from "./capacity-card";
import { CapacityFilters } from "./capacity-filters";
import { CapacitySearch } from "./capacity-search";
import { CapacitySort } from "./capacity-sort";
import { FilterDrawer } from "./filter-drawer";
import { useDataMode } from "@/lib/data/mode";
import { useRealWorkspace } from "@/lib/data/real-workspace";
import { PageSkeleton } from "@/components/ui/page-skeleton";

export function DirectoryNotice({ detail = false }: { detail?: boolean }) {
  const { mode } = useDataMode();
  return <span>{mode === "demo"
    ? detail ? "Sample profiles and estimates are for exploration. Availability and terms are subject to provider confirmation." : "Preview directory · Sample business profiles"
    : detail ? "Provider-submitted listings and estimates. Confirm availability, credentials, and final production terms with the provider." : "Provider-submitted capacity listings"}</span>;
}

export function DiscoveryExplorer() {
  const { providers, ready } = useCapacityCatalog();
  const { mode } = useDataMode();
  const real = useRealWorkspace();
  const capacities = useMemo(() => providers.filter(isAvailableCapacity), [providers]);
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const filters = useMemo(() => parseDiscoveryFilters(new URLSearchParams(paramsKey)), [paramsKey]);
  const { ids } = useSavedProviders();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const results = useMemo(() => filterCapacities(capacities, filters, ids), [capacities, filters, ids]);
  const activeCount = activeFilterCount(filters);
  const savedCount = capacities.filter((capacity) => ids.includes(capacity.id)).length;
  const categoryCounts = useMemo(() => {
    const ungrouped = filterCapacities(capacities, { ...filters, category: "" }, ids);
    return Object.fromEntries([["", ungrouped.length], ...categories.map((category) => [category, ungrouped.filter((provider) => provider.category === category).length])]);
  }, [capacities, filters, ids]);

  useEffect(() => {
    try { sessionStorage.setItem("capacity-discovery-url", discoveryUrl(filters)); } catch { /* Back link has a safe fallback. */ }
  }, [filters]);

  const update = (values: Partial<DiscoveryFilters>) => {
    // Reading the current URL also retains rapid successive input updates.
    const current = parseDiscoveryFilters(new URLSearchParams(window.location.search));
    window.history.replaceState(null, "", discoveryUrl({ ...current, ...values }));
  };
  const clearFilters = () => update({ ...defaultFilters, sort: filters.sort, savedOnly: filters.savedOnly });

  const chips: { label: string; clear: Partial<DiscoveryFilters> }[] = [
    ...(filters.query.trim() ? [{ label: `“${filters.query.trim()}”`, clear: { query: "" } }] : []),
    ...(filters.category ? [{ label: filters.category, clear: { category: "" as const } }] : []),
    ...filters.locations.map((location) => ({ label: location, clear: { locations: filters.locations.filter((value) => value !== location) } })),
    ...(filters.availability !== null ? [{ label: filters.availability === 0 ? "Available Now" : `Available within ${filters.availability} days`, clear: { availability: null } }] : []),
    ...filters.sizes.map((size) => ({ label: `${size} capacity`, clear: { sizes: filters.sizes.filter((value) => value !== size) } })),
    ...(filters.verified ? [{ label: "Verified", clear: { verified: false } }] : []),
    ...(filters.leadTime !== null ? [{ label: `Lead time ≤ ${filters.leadTime} days`, clear: { leadTime: null } }] : []),
  ];

  if (!ready) return <PageSkeleton label="Loading available capacity" />;
  if (mode === "real" && real.error) return <div className="mx-auto max-w-7xl px-5 py-20 text-center sm:px-8"><h2 className="text-xl font-semibold">Unable to load capacity listings.</h2><p className="mt-3 text-sm text-slate-500">Please try again.</p><button onClick={() => void real.refresh()} className="mt-6 rounded-md bg-ink px-5 py-3 text-xs font-semibold text-white">Retry</button></div>;

  return (
    <div className="mx-auto grid max-w-7xl items-start gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[218px_minmax(0,1fr)] lg:gap-9 lg:px-10 lg:py-10">
      <aside aria-label="Capacity filters" className="hidden border-r border-slate-200 pr-6 lg:block">
        <CapacityFilters filters={filters} onChange={update} onClear={clearFilters} categoryCounts={categoryCounts} />
      </aside>
      <section aria-label="Capacity results" className="min-w-0">
        <CapacitySearch value={filters.query} onChange={(query) => update({ query })} />
        <div className="mt-5 flex items-center justify-between gap-3 border-b border-slate-200">
          <div className="flex gap-5" aria-label="Capacity view">
            <button type="button" aria-pressed={!filters.savedOnly} onClick={() => update({ savedOnly: false })} className={`flex h-11 items-center gap-2 border-b-2 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 ${!filters.savedOnly ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-ink"}`}>All capacity</button>
            <button type="button" aria-pressed={filters.savedOnly} onClick={() => update({ savedOnly: true })} className={`flex h-11 items-center gap-1.5 border-b-2 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 ${filters.savedOnly ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-ink"}`}>
              <Bookmark className="h-3.5 w-3.5" aria-hidden="true" /> Saved <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{savedCount}</span>
            </button>
          </div>
          <button type="button" aria-haspopup="dialog" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)} className="mb-1 inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 lg:hidden">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" /> Filters {activeCount > 0 && <span className="rounded bg-blue-50 px-1.5 text-brand-600">{activeCount}</span>}
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 py-5">
          <div role="status" aria-live="polite" aria-atomic="true">
            <h2 className="text-sm font-semibold text-ink"><span className="tabular-nums">{results.length}</span> {results.length === 1 ? "capacity" : "capacities"} available</h2>
            <p className="mt-1 text-[11px] text-slate-500">{filters.savedOnly ? "Your saved providers, ready to revisit." : "Production opportunities across Indonesia."}</p>
          </div>
          <CapacitySort value={filters.sort} onChange={(sort) => update({ sort })} />
        </div>
        {chips.length > 0 && (
          <div className="-mt-1 mb-5 flex flex-wrap items-center gap-2" aria-label="Active filters">
            {chips.map((chip) => <button type="button" key={chip.label} onClick={() => update(chip.clear)} aria-label={`Remove ${chip.label} filter`} className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-600 transition hover:border-blue-200 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"><span className="truncate">{chip.label}</span><X className="h-3 w-3 shrink-0" aria-hidden="true" /></button>)}
            <button type="button" onClick={clearFilters} className="min-h-8 rounded px-1 text-[11px] font-semibold text-brand-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600">Clear all</button>
          </div>
        )}
        {(filters.sort === "capacity" || filters.sort === "minimum") && <p className="mb-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] leading-5 text-slate-500">Sorted by stated quantity. Units vary by industry; choose a category to compare similar capabilities.</p>}
        {results.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">{results.map((capacity) => <CapacityCard key={capacity.id} capacity={capacity} />)}</div>
            <p className="mt-8 flex items-center justify-center gap-1.5 text-[11px] text-slate-400"><Check className="h-3.5 w-3.5" aria-hidden="true" /> You’re viewing all {results.length} {results.length === 1 ? "capacity" : "capacities"}.</p>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center sm:py-20">
            <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">{filters.savedOnly && savedCount === 0 ? <Bookmark className="h-5 w-5" aria-hidden="true" /> : <SearchX className="h-5 w-5" aria-hidden="true" />}</span>
            <h3 className="text-lg font-bold tracking-tight text-ink">{filters.savedOnly && savedCount === 0 ? "No saved providers yet" : "No capacity found"}</h3>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">{filters.savedOnly && savedCount === 0 ? "Save providers as you explore to keep the right capabilities close at hand." : "Try adjusting your search or filters to discover more available production capacity."}</p>
            <button type="button" onClick={filters.savedOnly && savedCount === 0 ? () => update({ ...defaultFilters }) : clearFilters} className="mt-6 h-11 rounded-lg bg-ink px-5 text-xs font-semibold text-white hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">{filters.savedOnly && savedCount === 0 ? "Explore capacities" : "Clear Filters"}</button>
          </div>
        )}
      </section>
      <FilterDrawer open={drawerOpen} onClose={closeDrawer} count={results.length}>
        <CapacityFilters filters={filters} onChange={update} onClear={clearFilters} categoryCounts={categoryCounts} />
      </FilterDrawer>
    </div>
  );
}
