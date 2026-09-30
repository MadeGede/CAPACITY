import { ChevronDown } from "lucide-react";
import { sortOptions, type CapacitySortOrder } from "@/lib/capacity-discovery";

export function CapacitySort({ value, onChange }: { value: CapacitySortOrder; onChange: (value: CapacitySortOrder) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="capacity-sort" className="hidden text-xs text-slate-500 sm:block">Sort by</label>
      <div className="relative">
        <select id="capacity-sort" aria-label="Sort capacities" value={value} onChange={(event) => onChange(event.target.value as CapacitySortOrder)} className="h-10 max-w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-xs font-medium text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-blue-100">
          {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-3.5 h-3 w-3 text-slate-500" aria-hidden="true" />
      </div>
    </div>
  );
}
