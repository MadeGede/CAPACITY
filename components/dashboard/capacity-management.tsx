"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Boxes, CircleAlert, Clock3, Eye, Factory, Pause, Pencil, Play, Plus, X } from "lucide-react";
import { useCapacityCatalog } from "@/lib/data/capacities";
import { useDataMode } from "@/lib/data/mode";
import { showToast } from "@/lib/toast";
import { formatLeadTime, formatNumber } from "@/lib/capacity-format";
import { CapabilityIcon } from "@/components/capacity/capability-icon";
import type { CapacityListing } from "@/types/capacity-listing";

export const capacityStatusLabels = { active: "Active", limited: "Limited", paused: "Paused", fully_booked: "Fully Booked" } as const;

export function CapacityManagement() {
  const { ready, managedListings, setListingStatus } = useCapacityCatalog();
  const { mode, business } = useDataMode();
  const [pauseTarget, setPauseTarget] = useState<CapacityListing | null>(null);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const updating = useRef(false);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    if (!pauseTarget || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; };
  }, [pauseTarget]);

  const setStatus = async (listing: CapacityListing, pause: boolean) => {
    if (updating.current) return;
    updating.current = true;
    setChanging(true);
    try {
      const operation = setListingStatus(listing.id, pause ? "paused" : listing.availableCapacity > 0 ? "active" : "fully_booked");
      if (operation instanceof Promise) await operation;
      showToast(pause ? "Capacity listing paused" : "Capacity listing resumed");
      setError("");
      setPauseTarget(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "We couldn't update the listing. Please try again."); setPauseTarget(null); }
    finally { updating.current = false; setChanging(false); }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Provider workspace</p><h1 className="text-[28px] font-semibold tracking-tight sm:text-[32px]">My Capacity</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">Manage {mode === "real" ? business?.name || "your business" : "Precision Works"} production listings and the capacity available for new business.</p></div><Link href="/dashboard/capacity/new" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-500 px-4 text-xs font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"><Plus size={15} aria-hidden="true" />List Capacity</Link></div>
      {error && <p role="alert" className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs leading-6 text-red-700"><CircleAlert size={16} className="mt-1 shrink-0" aria-hidden="true" />{error}</p>}
      {!ready ? <p role="status" className="py-14 text-sm text-slate-500">Loading capacity listings…</p> : managedListings.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-lg border border-line bg-paper text-slate-400"><Factory size={22} aria-hidden="true" /></span><h2 className="mt-5 text-lg font-semibold">No capacity listed yet.</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-500">Publish your available production capacity to start receiving business opportunities.</p><Link href="/dashboard/capacity/new" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-500 px-4 text-xs font-semibold text-white">List Capacity<ArrowUpRight size={14} aria-hidden="true" /></Link></div> : <>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4 text-xs"><p className="font-semibold text-slate-700">{managedListings.length} {managedListings.length === 1 ? "capacity listing" : "capacity listings"}</p><div className="flex gap-4 text-[11px] text-slate-500"><span>{managedListings.filter((listing) => ["active", "limited"].includes(listing.status)).length} available</span><span>{managedListings.filter((listing) => listing.status === "paused").length} paused</span></div></div>
        <div className="grid gap-5 xl:grid-cols-2">
          {managedListings.map((listing) => {
            const utilization = listing.maximumCapacity > 0 ? Math.round((1 - listing.availableCapacity / listing.maximumCapacity) * 100) : 0;
            return <article key={listing.id} className="overflow-hidden rounded-lg border border-line bg-white"><div className="p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-paper text-slate-500"><CapabilityIcon category={listing.category} /></span><div className="min-w-0 flex-1"><h2 className="text-base font-semibold tracking-tight">{listing.capability}</h2><p className="mt-1 text-[11px] text-slate-500">{listing.category} · {listing.location}</p></div><span className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-medium ${listing.status === "active" ? "border-brand-100 bg-brand-50 text-brand-700" : "border-line bg-paper text-slate-500"}`}><span className={`h-1 w-1 rounded-full ${listing.status === "active" ? "bg-brand-500" : "bg-slate-400"}`} aria-hidden="true" />{capacityStatusLabels[listing.status]}</span></div><p className="mt-4 line-clamp-2 text-xs leading-6 text-slate-500">{listing.description}</p><dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-line pt-5"><div><dt className="text-[10px] text-slate-400">{listing.category === "Warehousing" ? "Total Capacity" : "Monthly Capacity"}</dt><dd className="mt-1.5 text-sm font-semibold">{formatNumber(listing.maximumCapacity)} <span className="text-[11px] font-normal text-slate-500">{listing.capacityUnit}</span></dd></div><div><dt className="text-[10px] text-slate-400">Currently Available</dt><dd className="mt-1.5 text-sm font-semibold text-brand-600">{formatNumber(listing.availableCapacity)} <span className="text-[11px] font-normal text-slate-500">{listing.capacityUnit}</span></dd></div><div><dt className="flex items-center gap-1 text-[10px] text-slate-400"><Boxes size={11} aria-hidden="true" />Minimum Order</dt><dd className="mt-1.5 text-xs font-medium text-slate-700">{formatNumber(listing.minimumOrder)} {listing.capacityUnit}</dd></div><div><dt className="flex items-center gap-1 text-[10px] text-slate-400"><Clock3 size={11} aria-hidden="true" />Lead Time</dt><dd className="mt-1.5 text-xs font-medium text-slate-700">{formatLeadTime(listing.leadTimeDays)}</dd></div></dl><div className="mt-5"><div className="mb-2 flex items-center justify-between text-[10px] text-slate-400"><span>Capacity committed</span><span>{utilization}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-paper" role="meter" aria-label={`${listing.capability} committed capacity`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={utilization}><div className="h-full rounded-full bg-slate-400" style={{ width: `${Math.max(0, Math.min(100, utilization))}%` }} /></div></div>{listing.status === "paused" && <p className="mt-4 text-[11px] leading-5 text-slate-500">Paused listings are hidden from available discovery and matching results.</p>}</div><div className="flex flex-wrap items-center gap-2 border-t border-line bg-paper/40 px-5 py-3.5 sm:px-6"><Link href={`/dashboard/capacity/${listing.id}/edit`} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-brand-500"><Pencil size={12} aria-hidden="true" />Edit</Link><button type="button" disabled={changing} onClick={() => listing.status === "paused" ? setStatus(listing, false) : setPauseTarget(listing)} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-brand-500">{listing.status === "paused" ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}{listing.status === "paused" ? "Resume" : "Pause"}</button><Link href={`/capacity/${listing.id}`} className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-[11px] font-semibold text-brand-600 hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-500"><Eye size={13} aria-hidden="true" />View</Link></div></article>;
          })}
        </div>
      </>}

      <dialog ref={dialogRef} aria-labelledby="pause-capacity-title" aria-describedby="pause-capacity-description" onCancel={() => setPauseTarget(null)} onClose={() => setPauseTarget(null)} onClick={(event) => { if (event.target === event.currentTarget) setPauseTarget(null); }} className="m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto overscroll-contain rounded-xl border border-line bg-white p-0 text-ink shadow-panel backdrop:bg-ink/40 backdrop:backdrop-blur-sm"><div className="relative p-6 sm:p-7"><button type="button" onClick={() => setPauseTarget(null)} aria-label="Close pause confirmation" className="absolute right-2 top-2 grid h-10 w-10 place-items-center rounded text-slate-400 hover:bg-paper focus-visible:ring-2 focus-visible:ring-brand-500"><X size={17} aria-hidden="true" /></button><span className="mb-5 grid h-11 w-11 place-items-center rounded-lg border border-line bg-paper text-slate-500"><Pause size={19} aria-hidden="true" /></span><h2 id="pause-capacity-title" className="text-xl font-semibold tracking-tight">Pause this capacity listing?</h2><p id="pause-capacity-description" className="mt-3 text-sm leading-7 text-slate-500">{pauseTarget?.capability} will remain in your workspace and be hidden from available discovery and matching results. You can resume it at any time.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setPauseTarget(null)} className="min-h-11 rounded-md border border-slate-200 px-4 text-xs font-semibold text-slate-600 focus-visible:ring-2 focus-visible:ring-brand-500">Keep Active</button><button type="button" disabled={changing} onClick={() => pauseTarget && setStatus(pauseTarget, true)} className="min-h-11 rounded-md bg-ink px-4 text-xs font-semibold text-white focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2">Pause Listing</button></div></div></dialog>
    </div>
  );
}
