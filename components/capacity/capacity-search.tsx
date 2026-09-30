import { Search, X } from "lucide-react";

export function CapacitySearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <form role="search" onSubmit={(event) => event.preventDefault()} className="flex h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-soft focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-blue-100">
      <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
      <label htmlFor="capacity-search" className="sr-only">Search capability, industry, or provider</label>
      <input id="capacity-search" type="search" autoComplete="off" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search capability, industry, or provider..." className="h-full w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400 [&::-webkit-search-cancel-button]:hidden" />
      {value && <button type="button" onClick={() => onChange("")} className="grid h-8 w-8 shrink-0 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600" aria-label="Clear search"><X className="h-4 w-4" /></button>}
    </form>
  );
}
