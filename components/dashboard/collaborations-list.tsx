"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Handshake } from "lucide-react";
import { useRequestState } from "@/lib/data/requests";
import { useCapacityCatalog } from "@/lib/data/capacities";
import { useDataMode } from "@/lib/data/mode";
import { requestsForPerspective } from "@/lib/dashboard";
import { formatNumber, formatPrice } from "@/lib/capacity-format";
import { requestDate } from "@/lib/request-format";
import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import type { RequestStatus } from "@/types/requests";

const tabs: { label: string; value: string; statuses: RequestStatus[] }[] = [
  { label: "All", value: "all", statuses: ["accepted", "in_progress", "completed", "cancelled"] },
  { label: "Active", value: "active", statuses: ["accepted", "in_progress"] },
  { label: "Completed", value: "completed", statuses: ["completed"] },
  { label: "Cancelled", value: "cancelled", statuses: ["cancelled"] },
];
export function CollaborationsList() {
  const { ready, requests, perspective } = useRequestState();
  const { providers } = useCapacityCatalog();
  const { mode, business } = useDataMode();
  const [tab, setTab] = useState("all");
  const relevant = useMemo(() => requestsForPerspective(requests, perspective, providers, mode === "real" ? business?.id : undefined), [requests, perspective, providers, mode, business?.id]);
  const filtered = relevant.filter((item) => tabs.find((value) => value.value === tab)?.statuses.includes(item.status)).sort((a,b) => Date.parse(b.updatedAt)-Date.parse(a.updatedAt));
  return <div className="space-y-6"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-brand-600">Business collaboration</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Collaborations</h1><p className="mt-2 text-sm text-slate-500">Track agreed production work from acceptance to completion.</p></div><div className="flex gap-5 overflow-x-auto border-b border-line">{tabs.map((item) => <button key={item.value} onClick={() => setTab(item.value)} aria-pressed={tab === item.value} className={`min-h-11 shrink-0 border-b-2 text-xs font-semibold ${tab === item.value ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500"}`}>{item.label} <span className="ml-1 text-[10px]">{relevant.filter((request) => item.statuses.includes(request.status)).length}</span></button>)}</div>{!ready ? <div role="status" className="h-48 animate-pulse rounded-lg bg-white" /> : filtered.length === 0 ? <div className="rounded-lg border border-dashed border-line bg-white px-5 py-16 text-center"><Handshake className="mx-auto text-slate-400" /><h2 className="mt-4 text-lg font-semibold">No {tab === "all" ? "" : `${tab} `}collaborations.</h2><p className="mt-2 text-sm text-slate-500">Accepted capacity requests will appear here.</p><Link href="/requests" className="mt-5 inline-flex text-xs font-semibold text-brand-600">View Requests →</Link></div> : <div className="grid gap-4 lg:grid-cols-2">{filtered.map((item) => { const partner = perspective === "buyer" ? providers.find((value) => value.id === item.providerId)?.name ?? item.providerId : item.buyerName; return <article key={item.id} className="rounded-lg border border-line bg-white p-5"><div className="flex justify-between gap-3"><span className="text-[11px] font-semibold text-slate-500">{item.id}</span><RequestStatusBadge status={item.status} /></div><h2 className="mt-3 text-base font-semibold">{partner}</h2><p className="mt-1 text-xs text-slate-500">{item.capability} · {formatNumber(item.proposal?.quantity ?? item.quantity)} {item.unit}</p><dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-5 text-xs"><div><dt className="text-slate-400">Start date</dt><dd className="mt-1 font-medium">{requestDate(item.proposal?.startDate ?? item.preferredStartDate)}</dd></div><div><dt className="text-slate-400">Expected completion</dt><dd className="mt-1 font-medium">{requestDate(item.proposal?.completionDate ?? item.requiredCompletionDate)}</dd></div><div><dt className="text-slate-400">{item.proposal ? "Agreed value" : "Requested budget"}</dt><dd className="mt-1 font-medium">{item.proposal?.total || item.budget ? formatPrice(item.proposal?.total ?? item.budget ?? 0) : "To be agreed"}</dd></div><div><dt className="text-slate-400">Progress</dt><dd className="mt-1 font-medium">{item.status === "completed" ? "Complete" : item.status === "in_progress" ? mode === "real" ? "In progress" : "35% demo milestone" : "Awaiting production"}</dd></div></dl>{item.status === "in_progress" && mode === "demo" && <div className="mt-4 h-1.5 rounded-full bg-slate-100"><div className="h-full w-[35%] rounded-full bg-brand-600" /></div>}<Link href={`/requests/${item.id}`} className="mt-5 inline-flex min-h-9 items-center text-xs font-semibold text-brand-600">Open Collaboration →</Link></article>; })}</div>}</div>;
}
