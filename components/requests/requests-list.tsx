"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StartDemandLink } from "@/components/matching/start-demand-link";
import { ArrowRight, ClipboardList, Search, SearchX, X } from "lucide-react";
import { useCapacityCatalog } from "@/lib/data/capacities";
import { requestsForPerspective } from "@/lib/dashboard";
import { useRequestState } from "@/lib/data/requests";
import { useDataMode } from "@/lib/data/mode";
import { useRealWorkspace } from "@/lib/data/real-workspace";
import type { RequestStatus } from "@/types/requests";
import { DemoPerspectiveSwitcher } from "./demo-perspective";
import { RequestCard } from "./request-card";

const tabs: { value: string; label: string; statuses?: RequestStatus[] }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending", statuses: ["pending_review", "provider_reviewing"] },
  { value: "negotiation", label: "Negotiation", statuses: ["negotiation"] },
  { value: "accepted", label: "Accepted", statuses: ["accepted"] },
  { value: "in_progress", label: "In Progress", statuses: ["in_progress"] },
  { value: "completed", label: "Completed", statuses: ["completed"] },
  { value: "rejected", label: "Rejected", statuses: ["rejected"] },
  { value: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
];
const focusClass = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600";

export function RequestsList() {
  const { ready, requests, perspective, sessionOnly } = useRequestState();
  const { mode, business } = useDataMode();
  const real = useRealWorkspace();
  const { providers } = useCapacityCatalog();
  const relevant = useMemo(() => requestsForPerspective(requests, perspective, providers, mode === "real" ? business?.id : undefined), [requests, perspective, providers, mode, business?.id]);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [providerId, setProviderId] = useState("");
  const providerOptions = useMemo(() => Array.from(new Set(relevant.map((request) => request.providerId))).map((id) => ({ id, name: providers.find((item) => item.id === id)?.name ?? id })).sort((a, b) => a.name.localeCompare(b.name)), [relevant, providers]);
  const filtered = useMemo(() => {
    const statuses = tabs.find((item) => item.value === tab)?.statuses;
    const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    return relevant.filter((request) => {
      const content = [request.id, providers.find((item) => item.id === request.providerId)?.name, request.capability, request.buyerName].join(" ").toLocaleLowerCase();
      return (!statuses || statuses.includes(request.status)) && (!providerId || providerId === request.providerId) && terms.every((term) => content.includes(term));
    }).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || b.id.localeCompare(a.id));
  }, [relevant, providers, tab, query, providerId]);
  const clear = () => { setTab("all"); setQuery(""); setProviderId(""); };
  const filteredView = tab !== "all" || Boolean(query.trim()) || Boolean(providerId);

  return (
    <>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 pb-8 pt-10 sm:px-8 sm:pb-10 sm:pt-12 lg:px-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600"><span className="h-px w-5 bg-brand-500" aria-hidden="true" /> Business collaboration</p>
            <span className="text-[10px] font-medium text-slate-400">{mode === "real" ? "Secure business workspace" : "Demo workspace · no external messages sent"}</span>
          </div>
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div><h1 className="text-[30px] font-bold tracking-[-0.035em] text-ink sm:text-[40px]">Capacity Requests</h1><p className="mt-3 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">Track your production requests and provider collaborations.</p></div>
            <div className="flex flex-wrap items-center gap-3"><DemoPerspectiveSwitcher /><StartDemandLink className={`inline-flex min-h-11 items-center gap-2 rounded-lg bg-ink px-4 text-xs font-semibold text-white hover:bg-brand-600 ${focusClass}`}>Find Capacity <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></StartDemandLink></div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
        {sessionOnly && <p role="status" className="mb-5 rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-3 text-xs leading-6 text-slate-600">Browser storage is unavailable. Request changes are kept for this visit and may be lost when this page is refreshed.</p>}
        {mode === "real" && real.error ? <div role="alert" className="rounded-lg border border-red-100 bg-white p-8 text-center"><h2 className="text-lg font-semibold">Unable to load capacity requests.</h2><p className="mt-2 text-sm text-slate-500">Please try again.</p><button onClick={() => void real.refresh()} className="mt-5 rounded-md bg-ink px-5 py-3 text-xs font-semibold text-white">Retry</button></div> : !ready ? <div role="status" aria-label="Loading capacity requests" className="grid min-h-[45vh] animate-pulse gap-4 py-10"><div className="h-14 rounded-lg bg-white" /><div className="h-28 rounded-lg bg-white" /><div className="h-28 rounded-lg bg-white" /></div> : relevant.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center sm:py-20">
            <span className="mx-auto mb-6 grid h-12 w-12 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400"><ClipboardList className="h-5 w-5" aria-hidden="true" /></span>
            <h2 className="text-xl font-bold tracking-tight text-ink">No capacity requests yet.</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-500">Start by discovering available capacity or creating a production requirement.</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><StartDemandLink className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-5 text-xs font-semibold text-white hover:bg-brand-600 ${focusClass}`}>Find Capacity <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></StartDemandLink><Link href="/discover" className={`inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-xs font-semibold text-slate-600 hover:border-blue-200 ${focusClass}`}>Discover Providers</Link></div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row">
              <form role="search" onSubmit={(event) => event.preventDefault()} className="flex min-h-12 flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-blue-100"><Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" /><label htmlFor="request-search" className="sr-only">Search requests</label><input id="request-search" type="search" placeholder="Search requests..." value={query} onChange={(event) => setQuery(event.target.value)} className="h-12 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400 [&::-webkit-search-cancel-button]:hidden" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear request search" className={`grid h-8 w-8 place-items-center rounded text-slate-400 hover:bg-slate-50 ${focusClass}`}><X className="h-4 w-4" aria-hidden="true" /></button>}</form>
              <select aria-label="Filter requests by provider" value={providerId} onChange={(event) => setProviderId(event.target.value)} className={`min-h-12 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 sm:max-w-[260px] ${focusClass}`}><option value="">All providers</option>{providerOptions.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select>
            </div>
            <div className="mt-5 overflow-x-auto border-b border-slate-200" role="group" aria-label="Filter requests by status">
              <div className="flex w-max min-w-full gap-5">{tabs.map((item) => {
                const count = relevant.filter((request) => !item.statuses || item.statuses.includes(request.status)).length;
                return <button key={item.value} type="button" aria-pressed={tab === item.value} onClick={() => setTab(item.value)} className={`inline-flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-0.5 text-xs font-semibold ${focusClass} ${tab === item.value ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-ink"}`}>{item.label}<span className={`rounded px-1.5 py-0.5 text-[10px] tabular-nums ${tab === item.value ? "bg-blue-50 text-brand-600" : "bg-slate-100 text-slate-400"}`}>{count}</span></button>;
              })}</div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 py-5"><p role="status" aria-live="polite" aria-atomic="true" className="text-xs text-slate-500"><span className="font-semibold text-slate-700">{filtered.length}</span> {filtered.length === 1 ? "request" : "requests"} · {perspective === "buyer" ? "Buyer perspective" : "Provider perspective"}</p><div className="flex items-center gap-4">{filteredView && <button type="button" onClick={clear} className={`min-h-8 rounded text-[11px] font-semibold text-brand-600 hover:underline ${focusClass}`}>Clear filters</button>}<span className="text-[10px] text-slate-400">Most recently updated</span></div></div>
            {filtered.length > 0 ? <div className="space-y-4">{filtered.map((request) => <RequestCard key={request.id} request={request} provider={providers.find((item) => item.id === request.providerId)} />)}</div> : <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><SearchX className="mx-auto h-7 w-7 text-slate-400" aria-hidden="true" /><h2 className="mt-5 text-lg font-semibold text-ink">No requests found.</h2><p className="mt-3 text-sm leading-6 text-slate-500">Try a different request ID, provider, or capability, or clear your filters.</p><button type="button" onClick={clear} className={`mt-6 min-h-11 rounded-lg bg-ink px-5 text-xs font-semibold text-white hover:bg-brand-600 ${focusClass}`}>Clear Filters</button></div>}
          </>
        )}
      </div>
    </>
  );
}
