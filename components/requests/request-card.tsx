import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import type { Capacity } from "@/data/capacities";
import { CapabilityIcon } from "@/components/capacity/capability-icon";
import { formatNumber, formatPrice } from "@/lib/capacity-format";
import { requestDate } from "@/lib/request-format";
import type { CapacityRequest } from "@/types/requests";
import { RequestStatusBadge } from "./request-status-badge";

function updatedLabel(value: string) {
  return requestDate(value, true);
}

export function RequestCard({ request, provider: suppliedProvider }: { request: CapacityRequest; provider?: Capacity }) {
  const provider = suppliedProvider;
  const estimate = request.proposal?.total ?? request.budget;
  const recurring = request.demandType === "recurring";
  const estimateLabel = request.proposal ? "Proposed value" : "Requested budget";
  const href = `/requests/${encodeURIComponent(request.id)}`;

  return (
    <article aria-labelledby={`request-${request.id}`} className="rounded-xl border border-slate-200 bg-white p-5 transition-[border-color,box-shadow] hover:border-blue-200 hover:shadow-soft sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href={href} className="rounded text-[11px] font-semibold tracking-[0.04em] text-slate-500 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600">{request.id}</Link>
        <RequestStatusBadge status={request.status} />
      </div>
      <div className="grid gap-5 sm:grid-cols-[1fr_auto] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] lg:items-center lg:gap-8">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500"><CapabilityIcon category={request.category} className="h-4 w-4" /></span>
          <div className="min-w-0">
            <h2 id={`request-${request.id}`} className="text-base font-bold leading-6 tracking-tight text-ink"><Link href={href} className="rounded hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600">{provider?.name ?? request.providerId}</Link></h2>
            <p className="mt-1 text-xs leading-5 text-slate-600">{request.capability}</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-400">Requested by {request.buyerName}</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-5 border-y border-slate-100 py-4 sm:col-span-2 sm:row-start-2 lg:col-auto lg:row-auto lg:border-y-0 lg:py-0">
          <div><dt className="text-[10px] text-slate-500">{recurring ? "Monthly quantity" : "Requested quantity"}</dt><dd className="mt-1.5 text-xs font-semibold leading-5 text-slate-700">{formatNumber(request.quantity)} {request.unit}{recurring ? "/month" : ""}</dd>{recurring && <p className="mt-1 text-[10px] text-slate-400">{request.durationMonths} months</p>}</div>
          <div><dt className="text-[10px] text-slate-500">Estimated value{recurring ? " / month" : ""}</dt><dd className="mt-1.5 text-xs font-semibold leading-5 text-slate-700">{estimate === null ? "To be agreed" : formatPrice(estimate)}</dd><p className="mt-1 text-[10px] text-slate-400">{estimate === null ? "No estimate provided" : estimateLabel}</p></div>
        </dl>
        <Link href={href} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:col-start-2 sm:row-start-1 lg:col-auto lg:row-auto">View Request <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-[10px] leading-5 text-slate-400"><Clock3 className="h-3 w-3 shrink-0" aria-hidden="true" />Updated <time dateTime={request.updatedAt}>{updatedLabel(request.updatedAt)} WIB</time></p>
    </article>
  );
}
