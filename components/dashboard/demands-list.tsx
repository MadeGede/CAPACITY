"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Copy, Plus, Search } from "lucide-react";
import { useDemandState } from "@/lib/data/demands";
import { formatNumber } from "@/lib/capacity-format";
import { requestDate } from "@/lib/request-format";
import { showToast } from "@/lib/toast";

const labels = { draft: "Draft", matching: "Matching", open: "Open", fulfilled: "Fulfilled", closed: "Closed" };
export function DemandsList() {
  const router = useRouter();
  const { ready, demands, newDemand, editDemand, viewDemandMatches, duplicateDemand, closeDemand } = useDemandState();
  const [closing, setClosing] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mutating = useRef(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { const dialog = dialogRef.current; if (!dialog || !closing) return; const overflow = document.body.style.overflow; dialog.showModal(); document.body.style.overflow = "hidden"; return () => { dialog.close(); document.body.style.overflow = overflow; }; }, [closing]);
  const [query, setQuery] = useState("");
  const filtered = demands.filter((item) => `${item.name} ${item.requirement.category} ${item.requirement.location}`.toLowerCase().includes(query.toLowerCase().trim()));
  const create = () => { newDemand(); router.push("/match"); };
  const edit = (id: string) => { editDemand(id); router.push("/match"); };
  const matches = (id: string) => { viewDemandMatches(id); router.push("/match/results"); };
  const duplicate = async (id: string) => {
    if (mutating.current) return;
    mutating.current = true; setBusy(true);
    try {
      const operation = duplicateDemand(id);
      if (operation instanceof Promise) await operation;
      showToast("Demand duplicated"); router.push("/match");
    } catch { showToast("Unable to duplicate this demand. Please try again."); }
    finally { mutating.current = false; setBusy(false); }
  };
  return <div className="space-y-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-brand-600">Buyer workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">My Demands</h1><p className="mt-2 text-sm text-slate-500">Your production requirements and match history in one place.</p></div><button onClick={create} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-brand-600 px-4 text-xs font-semibold text-white"><Plus size={14} />Create Demand</button></div>
    {!ready ? <div role="status" className="animate-pulse space-y-3"><div className="h-14 rounded-lg bg-white" /><div className="h-40 rounded-lg bg-white" /></div> : demands.length === 0 ? <div className="rounded-lg border border-dashed border-line bg-white px-5 py-16 text-center"><ClipboardList className="mx-auto text-slate-400" /><h2 className="mt-4 text-lg font-semibold">No production demands yet.</h2><p className="mt-2 text-sm text-slate-500">Create a requirement to discover available business capacity.</p><button onClick={create} className="mt-5 rounded-md bg-ink px-5 py-3 text-xs font-semibold text-white">Create Demand</button></div> : <><label className="flex max-w-md items-center gap-2 rounded-md border border-line bg-white px-3"><Search size={15} className="text-slate-400" /><span className="sr-only">Search demands</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search demands" className="h-11 w-full text-sm outline-none" /></label><div className="space-y-3">{filtered.map((item) => <article key={item.id} id={item.id} className="scroll-mt-28 rounded-lg border border-line bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-base font-semibold">{item.name}</h2><p className="mt-1 text-xs text-slate-500">{item.requirement.category} · {formatNumber(item.requirement.quantity ?? 0)} {item.requirement.unit} · {item.requirement.location === "any" ? "Flexible location" : item.requirement.location}</p></div><span className="h-fit rounded-md border border-line bg-paper px-2 py-1 text-[10px] font-semibold text-slate-600">{labels[item.status]}</span></div><div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 text-xs text-slate-500"><span>Needed by {requestDate(item.requirement.completionDate)}</span><span>{item.matchHistory ? `${item.matchHistory.evaluated} providers evaluated · Best ${item.matchHistory.bestScore}%` : "Matches not viewed yet"}</span>{item.matchHistory && <span>Updated {requestDate(item.matchHistory.updatedAt)}</span>}</div><div className="mt-4 flex flex-wrap items-center gap-2"><button onClick={() => matches(item.id)} className="min-h-9 rounded-md bg-ink px-3 text-[11px] font-semibold text-white">View Matches</button><button onClick={() => edit(item.id)} className="min-h-9 rounded-md border border-line px-3 text-[11px] font-semibold text-slate-600">Edit Requirement</button><button disabled={busy} onClick={() => void duplicate(item.id)} className="inline-flex min-h-9 items-center gap-1 rounded-md border border-line px-3 text-[11px] font-semibold text-slate-600"><Copy size={12} />Duplicate</button>{item.status !== "closed" && <button onClick={() => setClosing(item.id)} className="min-h-9 rounded-md px-3 text-[11px] font-semibold text-red-700">Close Demand</button>}</div></article>)}{filtered.length === 0 && <div className="rounded-lg border border-line bg-white p-8 text-center text-sm text-slate-500">No demands match your search.</div>}</div></>}
    <dialog ref={dialogRef} aria-labelledby="close-demand-title" onCancel={() => setClosing(null)} className="m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto overscroll-contain rounded-lg border border-line bg-white p-6 shadow-panel backdrop:bg-slate-900/40"><h2 id="close-demand-title" className="text-lg font-semibold">Close this demand?</h2><p className="mt-3 text-sm leading-6 text-slate-500">It will remain in your history, but will no longer appear as active.</p><div className="mt-6 flex justify-end gap-2"><button onClick={() => setClosing(null)} className="rounded-md border border-line px-4 py-2 text-xs">Keep Open</button><button disabled={busy} onClick={async () => { if (!closing || mutating.current) return; mutating.current = true; setBusy(true); try { const operation = closeDemand(closing); if (operation instanceof Promise) await operation; setClosing(null); showToast("Demand closed"); } catch { showToast("Unable to close this demand."); } finally { mutating.current = false; setBusy(false); } }} className="rounded-md bg-ink px-4 py-2 text-xs font-semibold text-white">Close Demand</button></div></dialog>
  </div>;
}
