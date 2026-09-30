import { Banknote, Boxes, Clock3, Layers3 } from "lucide-react";
import type { Capacity } from "@/data/capacities";
import { formatCapacity, formatLeadTime, formatMinimumOrder, formatNumber, formatPrice } from "@/lib/capacity-format";

export function CapacityMetrics({ capacity }: { capacity: Capacity }) {
  const period = capacity.capacityPeriod.replace(/^\//, "");
  const metrics = [
    { label: "Available Capacity", value: formatNumber(capacity.availableCapacity), detail: `${capacity.capacityUnit}${period ? ` / ${period}` : ""}`, icon: Boxes },
    { label: "Minimum Order", value: formatNumber(capacity.minimumOrder), detail: capacity.minimumOrderUnit, icon: Layers3 },
    { label: "Lead Time", value: formatLeadTime(capacity.leadTimeDays), detail: "Average turnaround", icon: Clock3 },
    { label: "Estimated Pricing", value: formatPrice(capacity.priceFrom), detail: `to ${formatPrice(capacity.priceTo)} / ${capacity.priceUnit}`, icon: Banknote },
  ];

  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-lg border border-line bg-white lg:grid-cols-4">
      {metrics.map(({ label, value, detail, icon: Icon }, index) => (
        <div key={label} className={`min-w-0 px-4 py-5 sm:px-6 sm:py-6 ${index % 2 === 0 ? "border-r border-line" : ""} ${index < 2 ? "border-b border-line lg:border-b-0" : ""} ${index === 1 ? "lg:border-r lg:border-line" : ""}`}>
          <dt className="flex items-center gap-2 text-[11px] font-medium text-slate-500 sm:text-xs">
            <Icon size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
            {label}
          </dt>
          <dd className="mt-3">
            <span className="block text-[23px] font-semibold leading-tight tracking-tight text-ink sm:text-[26px]">{value}</span>
            <span className="mt-1.5 block text-[11px] leading-5 text-slate-500 sm:text-xs">{detail}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ProductionInformation({ capacity }: { capacity: Capacity }) {
  const period = capacity.capacityPeriod.replace(/^\//, "");
  const availabilityPercent = Math.round((capacity.availableCapacity / capacity.maximumCapacity) * 100);
  const productionRows = [
    { label: period === "month" ? "Maximum monthly capacity" : "Maximum capacity", value: `${formatNumber(capacity.maximumCapacity)} ${capacity.capacityUnit}${period ? `/${period}` : ""}` },
    { label: "Currently available capacity", value: formatCapacity(capacity) },
    { label: "Minimum order quantity", value: formatMinimumOrder(capacity) },
    { label: "Average lead time", value: formatLeadTime(capacity.leadTimeDays) },
    { label: "Supported materials", value: capacity.materials.join(", ") },
    { label: "Production schedule", value: capacity.schedule },
  ];

  return (
    <section id="production" aria-labelledby="production-heading" className="scroll-mt-28 rounded-lg border border-line bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="production-heading" className="text-lg font-semibold tracking-tight">Production Information</h2>
        <span className="text-[11px] text-slate-500">{period === "month" ? "Monthly capacity" : "Capacity allocation"}</span>
      </div>
      <div className="my-6 rounded-md border border-line bg-paper/50 px-4 py-4 sm:px-5">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs">
          <span className="font-medium text-slate-600">Available for new demand</span>
          <span className="font-semibold tabular-nums text-brand-600">{availabilityPercent}% available</span>
        </div>
        <div
          role="meter"
          aria-label="Available share of total capacity"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={availabilityPercent}
          className="h-2 overflow-hidden rounded-full bg-slate-200"
        >
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${availabilityPercent}%` }} />
        </div>
        <p className="mt-3 text-[11px] leading-5 text-slate-500">
          {formatNumber(capacity.availableCapacity)} of {formatNumber(capacity.maximumCapacity)} {capacity.capacityUnit}{period ? ` per ${period}` : ""} are open for additional demand.
        </p>
      </div>
      <dl className="divide-y divide-line">
        {productionRows.map(({ label, value }) => (
          <div key={label} className="grid gap-1.5 py-3.5 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:gap-5">
            <dt className="text-xs leading-6 text-slate-500 sm:text-sm">{label}</dt>
            <dd className="text-sm font-medium leading-6 text-slate-700">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
