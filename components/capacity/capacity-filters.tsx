import { useId } from "react";
import { categories, locations, type CapacitySize } from "@/data/capacities";
import type { DiscoveryFilters } from "@/lib/capacity-discovery";

type Props = {
  filters: DiscoveryFilters;
  onChange: (updates: Partial<DiscoveryFilters>) => void;
  onClear: () => void;
  categoryCounts: Record<string, number>;
};

const checkClass = "h-3.5 w-3.5 shrink-0 accent-[#1d4ed8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600";
const labelClass = "flex min-h-8 cursor-pointer items-center gap-2.5 rounded py-1.5 text-xs text-slate-600 hover:text-ink";
const legendClass = "mb-2 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500";

export function CapacityFilters({ filters, onChange, onClear, categoryCounts }: Props) {
  const id = useId();
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink">Filters</h2>
        <button type="button" onClick={onClear} className="min-h-8 rounded text-[11px] font-semibold text-brand-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600">Clear Filters</button>
      </div>
      <div className="space-y-5">
        <fieldset className="border-b border-slate-200 pb-5">
          <legend className={legendClass}>Category</legend>
          {["", ...categories].map((category) => (
            <label key={category} className={`${labelClass} ${filters.category === category ? "font-semibold !text-ink" : ""}`}>
              <input type="radio" name={`${id}-category`} value={category} checked={filters.category === category} onChange={() => onChange({ category: category as DiscoveryFilters["category"] })} className={checkClass} />
              <span className="flex-1">{category || "All Categories"}</span>
              <span className="text-[10px] tabular-nums text-slate-400" aria-label={`${categoryCounts[category] || 0} capacities`}>{categoryCounts[category] || 0}</span>
            </label>
          ))}
        </fieldset>
        <fieldset className="border-b border-slate-200 pb-5">
          <legend className={legendClass}>Location</legend>
          {locations.map((location) => (
            <label key={location} className={labelClass}>
              <input type="checkbox" checked={filters.locations.includes(location)} onChange={(event) => onChange({ locations: event.target.checked ? [...filters.locations, location] : filters.locations.filter((value) => value !== location) })} className={checkClass} />
              {location}
            </label>
          ))}
        </fieldset>
        <fieldset className="border-b border-slate-200 pb-5">
          <legend className={legendClass}>Availability</legend>
          {[0, 7, 14, 30].map((days) => (
            <label key={days} className={labelClass}>
              <input type="radio" name={`${id}-availability`} checked={filters.availability === days} onChange={() => onChange({ availability: days })} className={checkClass} />
              {days === 0 ? "Available Now" : `Within ${days} Days`}
            </label>
          ))}
        </fieldset>
        <fieldset className="border-b border-slate-200 pb-5">
          <legend className={legendClass}>Capacity</legend>
          {(["Small", "Medium", "Large"] as CapacitySize[]).map((size) => (
            <label key={size} className={labelClass}>
              <input type="checkbox" checked={filters.sizes.includes(size)} onChange={(event) => onChange({ sizes: event.target.checked ? [...filters.sizes, size] : filters.sizes.filter((value) => value !== size) })} className={checkClass} />
              {size}
            </label>
          ))}
          <p className="mt-1 text-[10px] leading-4 text-slate-400">Production scale within each industry.</p>
        </fieldset>
        <fieldset className="border-b border-slate-200 pb-5">
          <legend className={legendClass}>Verification</legend>
          <label className={labelClass}>
            <input type="checkbox" checked={filters.verified} onChange={(event) => onChange({ verified: event.target.checked })} className={checkClass} />
            Verified Provider
          </label>
        </fieldset>
        <fieldset>
          <legend className={legendClass}>Lead time</legend>
          {[7, 14, 30].map((days) => (
            <label key={days} className={labelClass}>
              <input type="radio" name={`${id}-lead`} checked={filters.leadTime === days} onChange={() => onChange({ leadTime: days })} className={checkClass} />
              ≤ {days} Days
            </label>
          ))}
        </fieldset>
      </div>
    </div>
  );
}
