import Link from "next/link";
import { ArrowRight, Boxes, Clock3, MapPin, Package } from "lucide-react";
import type { Capacity } from "@/data/capacities";
import { formatCapacity, formatLeadTime, formatMinimumOrder, formatPrice } from "@/lib/capacity-format";
import { AvailabilityBadge, VerificationBadge } from "./badges";
import { CapabilityIcon } from "./capability-icon";
import { SaveProvider } from "./save-provider";

export function CapacityCard({ capacity }: { capacity: Capacity }) {
  return (
    <article className="surface-premium surface-premium-interactive group flex min-w-0 flex-col rounded-xl" aria-labelledby={`provider-${capacity.id}`}>
      <div className="flex-1 p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 group-hover:border-blue-100 group-hover:bg-blue-50 group-hover:text-brand-600">
            <CapabilityIcon category={capacity.category} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 id={`provider-${capacity.id}`} className="text-sm font-bold leading-5 tracking-tight text-ink">
              <Link className="rounded hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600" href={`/capacity/${capacity.id}`}>{capacity.name}</Link>
            </h3>
            <div className="mt-1 flex min-h-4 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[11px] text-slate-500">{capacity.category}</span>
              <VerificationBadge verified={capacity.verified} />
            </div>
          </div>
        </div>
        <p className="mt-5 text-base font-semibold tracking-tight text-ink">{capacity.capability}</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {capacity.location}, Indonesia</p>
        <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">{capacity.description}</p>
        <dl className="mt-5 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-slate-100 pt-4 min-[380px]:grid-cols-[1.4fr_1fr_0.75fr]">
          <div className="col-span-2 min-[380px]:col-span-1">
            <dt className="flex items-center gap-1 text-[10px] text-slate-500"><Boxes className="h-3 w-3" aria-hidden="true" /> Available capacity</dt>
            <dd className="mt-1 text-[11px] font-semibold leading-5 text-ink">{formatCapacity(capacity)}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-[10px] text-slate-500"><Package className="h-3 w-3" aria-hidden="true" /> Minimum order</dt>
            <dd className="mt-1 text-[11px] font-semibold leading-5 text-ink">{formatMinimumOrder(capacity)}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-[10px] text-slate-500"><Clock3 className="h-3 w-3" aria-hidden="true" /> Lead time</dt>
            <dd className="mt-1 text-[11px] font-semibold leading-5 text-ink">{formatLeadTime(capacity.leadTimeDays)}</dd>
          </div>
        </dl>
      </div>
      <div className="border-t border-slate-100 bg-slate-50/50 px-5 pb-4 pt-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <AvailabilityBadge days={capacity.availabilityDays} />
          <span className="text-[10px] text-slate-500">Estimate from <span className="font-medium text-slate-700">{formatPrice(capacity.priceFrom)}/{capacity.priceUnit}</span></span>
        </div>
        <div className="flex gap-2">
          <Link href={`/capacity/${capacity.id}`} className="brand-button inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
            View Capacity <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <SaveProvider id={capacity.id} name={capacity.name} />
        </div>
      </div>
    </article>
  );
}
