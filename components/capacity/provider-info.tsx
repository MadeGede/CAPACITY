import { BadgeCheck, Building2, MapPin } from "lucide-react";
import type { Capacity } from "@/data/capacities";

export function ProviderInfo({ capacity }: { capacity: Capacity }) {
  const rows = [
    { label: "Business Type", value: capacity.businessType },
    { label: "Years Operating", value: `${capacity.yearsOperating} years` },
    { label: "Typical Client Type", value: capacity.clientType },
    { label: "Primary Industry", value: capacity.industry },
    { label: "Response Time", value: capacity.responseTime },
  ];

  return (
    <section id="company" aria-labelledby="company-heading" className="scroll-mt-28 rounded-lg border border-line bg-white p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <Building2 size={17} className="text-slate-400" aria-hidden="true" />
        <h2 id="company-heading" className="text-base font-semibold tracking-tight">Company Information</h2>
      </div>
      <dl className="mt-5 divide-y divide-line">
        {rows.map(({ label, value }) => (
          <div key={label} className="py-3.5 first:pt-0 last:pb-0">
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="mt-1.5 text-sm font-medium leading-6 text-slate-700">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ProviderLocation({ capacity }: { capacity: Capacity }) {
  return (
    <section aria-labelledby="location-heading" className="rounded-lg border border-line bg-white p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <MapPin size={17} className="text-slate-400" aria-hidden="true" />
        <h2 id="location-heading" className="text-base font-semibold tracking-tight">Location</h2>
      </div>
      <div className="mt-5 border-l-2 border-brand-100 pl-4">
        <p className="text-sm font-semibold">{capacity.location}</p>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">{capacity.province}, Indonesia</p>
      </div>
      <p className="mt-4 text-xs leading-6 text-slate-500">Production facility based in {capacity.location}. Logistics and delivery arrangements depend on your project requirements.</p>
    </section>
  );
}

export function ProviderCertifications({ capacity, illustrative = true }: { capacity: Capacity; illustrative?: boolean }) {
  return (
    <section aria-labelledby="certifications-heading" className="rounded-lg border border-line bg-white p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <BadgeCheck size={17} className="text-slate-400" aria-hidden="true" />
        <h2 id="certifications-heading" className="text-base font-semibold tracking-tight">Certifications & Quality</h2>
      </div>
      <ul className="mt-5 flex flex-wrap gap-2" aria-label={illustrative ? "Example provider credentials" : "Self-reported provider credentials"}>
        {capacity.certifications.map((certification) => (
          <li key={certification} className="inline-flex items-center gap-1.5 rounded-md border border-line bg-paper/60 px-2.5 py-1.5 text-[11px] font-medium leading-5 text-slate-600">
            <BadgeCheck size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
            {certification}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] leading-5 text-slate-500">{illustrative ? "Example credentials for this sample provider profile." : "Self-reported by the provider. Confirm credentials directly before agreeing on production."}</p>
    </section>
  );
}
