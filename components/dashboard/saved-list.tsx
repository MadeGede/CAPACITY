"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { useSavedProviders } from "@/lib/data/saved-providers";
import { useCapacityCatalog } from "@/lib/data/capacities";
import { formatCapacity } from "@/lib/capacity-format";
import { showToast } from "@/lib/toast";
import { useDemandState } from "@/lib/data/demands";
import { VerificationBadge } from "@/components/capacity/badges";

export function SavedList() {
  const { newDemand } = useDemandState();
  const { ids, toggle } = useSavedProviders();
  const { providers, ready } = useCapacityCatalog();
  const saved = ids.map((id) => providers.find((provider) => provider.id === id)).filter((provider) => !!provider);
  return <div className="space-y-6"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-brand-600">Buyer workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Saved Providers</h1><p className="mt-2 text-sm text-slate-500">Review production partners you saved during discovery and matching.</p></div>{!ready ? <div role="status" className="h-48 animate-pulse rounded-lg bg-white" /> : saved.length === 0 ? <div className="rounded-lg border border-dashed border-line bg-white px-5 py-16 text-center"><Bookmark className="mx-auto text-slate-400" /><h2 className="mt-4 text-lg font-semibold">No providers saved yet.</h2><p className="mt-2 text-sm text-slate-500">Save promising providers to compare them later.</p><Link href="/discover" className="mt-5 inline-flex rounded-md bg-ink px-5 py-3 text-xs font-semibold text-white">Discover Capacity</Link></div> : <div className="grid gap-4 lg:grid-cols-2">{saved.map((provider) => <article key={provider.id} className="rounded-lg border border-line bg-white p-5"><div className="flex flex-wrap justify-between gap-2"><h2 className="text-base font-semibold">{provider.name}</h2><VerificationBadge verified={provider.verified} /></div><p className="mt-2 text-xs text-slate-500">{provider.capability} · {provider.location}, Indonesia</p><dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 text-xs"><div><dt className="text-slate-400">Available capacity</dt><dd className="mt-1 font-semibold">{formatCapacity(provider)}</dd></div><div><dt className="text-slate-400">Lead time</dt><dd className="mt-1 font-semibold">{provider.leadTimeDays} days</dd></div></dl><div className="mt-5 flex flex-wrap gap-2"><Link href={`/capacity/${provider.id}`} className="rounded-md bg-ink px-3 py-2 text-[11px] font-semibold text-white">View Provider</Link><Link href="/match" onClick={newDemand} className="rounded-md border border-line px-3 py-2 text-[11px] font-semibold">Create Demand</Link><button onClick={() => { void Promise.resolve(toggle(provider.id)).catch(() => showToast("Unable to update saved providers. Please try again.")); }} className="rounded-md px-3 py-2 text-[11px] font-semibold text-red-700">Remove Saved</button></div></article>)}</div>}</div>;
}
