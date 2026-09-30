"use client";

import Link from "next/link";
import { ArrowRight, Check, Clock3, Cog, MapPin } from "lucide-react";
import type { Capacity } from "@/data/capacities";
import { AvailabilityBadge, VerificationBadge } from "@/components/capacity/badges";
import { BackToDiscover } from "@/components/capacity/back-to-discover";
import { CapabilityIcon } from "@/components/capacity/capability-icon";
import { CapacityCard } from "@/components/capacity/capacity-card";
import { CapacityMetrics, ProductionInformation } from "@/components/capacity/provider-overview";
import { ProviderCertifications, ProviderInfo, ProviderLocation } from "@/components/capacity/provider-info";
import { RequestCapacity } from "@/components/capacity/request-capacity";
import { SaveProvider } from "@/components/capacity/save-provider";
import { useDataMode } from "@/lib/data/mode";
import { useDemandState } from "@/lib/data/demands";

export function CapacityDetail({ capacity, similar }: { capacity: Capacity; similar: Capacity[] }) {
  const { mode } = useDataMode();
  const { selectedRequest } = useDemandState();
  const matchContext = selectedRequest?.providerId === capacity.id ? selectedRequest.matchContext : undefined;
  const unavailable = capacity.availableCapacity <= 0 || capacity.listingStatus === "paused" || capacity.listingStatus === "fully_booked";
  return (
    <main id="main-content" className="bg-paper/65 pt-[72px]">
      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-[1240px] px-5 pb-8 pt-6 sm:px-8 sm:pb-9 sm:pt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BackToDiscover />
            <span className="text-[10px] font-medium tracking-wide text-slate-400">{mode === "real" ? "Business capacity profile" : "Sample provider profile"}</span>
          </div>
          <div className="mt-8 grid items-end gap-7 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-12">
            <div className="min-w-0">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-brand-100 bg-brand-50 text-brand-500">
                  <CapabilityIcon category={capacity.category} className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Production partner</p>
                  <p className="mt-1 text-xs font-medium text-slate-600">{capacity.category}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <h1 className="text-balance text-3xl font-semibold leading-[1.15] tracking-[-0.04em] sm:text-[40px]">{capacity.name}</h1>
                <VerificationBadge verified={capacity.verified} />
                {matchContext && <span className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-brand-600" title="Compatibility with your selected production requirement">{matchContext.score}% Compatibility</span>}
              </div>
              <p className="mt-3 text-base font-medium text-slate-600 sm:text-lg">{capacity.capability}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin size={14} aria-hidden="true" />
                  {capacity.location}, Indonesia
                </span>
                {unavailable ? <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600">{capacity.listingStatus === "paused" ? "Listing Paused" : "Fully Booked"}</span> : <AvailabilityBadge days={capacity.availabilityDays} />}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2 lg:grid-cols-1">
              {unavailable ? <button type="button" disabled className="min-h-11 rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500">Capacity unavailable</button> : <RequestCapacity name={capacity.name} providerId={capacity.id} />}
              <SaveProvider id={capacity.id} name={capacity.name} label="Save Provider" className="min-h-11 w-full px-4 py-3 text-sm" />
              <span className="mt-0.5 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 min-[380px]:col-span-2 lg:col-span-1">
                <Clock3 size={12} aria-hidden="true" />
                {capacity.responseTime}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-5 py-6 sm:px-8 sm:py-8">
        <CapacityMetrics capacity={capacity} />

        <div className="mt-6 grid items-start gap-6 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-6">
            <section aria-labelledby="about-provider-heading" className="rounded-lg border border-line bg-white p-5 sm:p-7">
              <h2 id="about-provider-heading" className="text-lg font-semibold tracking-tight">About This Provider</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">{capacity.about}</p>
              <div className="mt-6 border-t border-line pt-6">
                <h3 className="text-sm font-semibold">Capabilities</h3>
                <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {capacity.capabilities.map((capability) => (
                    <li key={capability} className="flex items-start gap-2.5 text-sm leading-6 text-slate-600">
                      <Check size={15} className="mt-1 shrink-0 text-brand-500" aria-hidden="true" />
                      {capability}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section aria-labelledby="facilities-heading" className="rounded-lg border border-line bg-white p-5 sm:p-7">
              <h2 id="facilities-heading" className="text-lg font-semibold tracking-tight">Machines & Facilities</h2>
              <p className="mt-2 text-xs leading-6 text-slate-500">Equipment and facilities supporting this capacity.</p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {capacity.facilities.map((facility) => (
                  <li key={facility} className="flex items-center gap-3 rounded-md border border-line bg-paper/40 px-3.5 py-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-line bg-white text-slate-400">
                      <Cog size={17} strokeWidth={1.5} aria-hidden="true" />
                    </span>
                    <span className="text-xs font-medium leading-5 text-slate-600">{facility}</span>
                  </li>
                ))}
              </ul>
            </section>

            <ProductionInformation capacity={capacity} />
            <p className="px-1 text-[11px] leading-5 text-slate-500">Pricing is indicative. Final capacity, schedules, and estimates depend on production specifications and provider confirmation.</p>
          </div>

          <aside aria-label="Provider company details" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <div className="sm:row-span-2 lg:row-auto"><ProviderInfo capacity={capacity} /></div>
            <ProviderLocation capacity={capacity} />
            <ProviderCertifications capacity={capacity} illustrative={mode === "demo"} />
          </aside>
        </div>

        <section aria-labelledby="similar-capacity-heading" className="pb-10 pt-14 sm:pb-14 sm:pt-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-500">Keep exploring</p>
              <h2 id="similar-capacity-heading" className="text-2xl font-semibold tracking-tight">Similar Capacity</h2>
              <p className="mt-2 text-sm text-slate-500">More production partners in related industries.</p>
            </div>
            <Link href="/discover" className="inline-flex min-h-10 items-center gap-2 rounded-sm text-xs font-semibold text-slate-600 transition-colors hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-4">
              Explore all capacity <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {similar.map((provider) => <CapacityCard key={provider.id} capacity={provider} />)}
          </div>
        </section>
      </div>
    </main>
  );
}
