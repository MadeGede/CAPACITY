"use client";

import { Pencil } from "lucide-react";
import { formatNumber, formatPrice } from "@/lib/capacity-format";
import { requestDateLong } from "@/lib/request-format";
import type { DemandRequirement } from "@/types/matching";

export function RequirementSummary({ demand, onEdit }: { demand: DemandRequirement; onEdit: (step: number) => void }) {
  const formattedDate = requestDateLong(demand.completionDate);
  const budget = demand.budgetFlexible ? "Flexible budget" : `${demand.budgetMin ? `${formatPrice(demand.budgetMin)} – ` : "Up to "}${formatPrice(demand.budgetMax ?? 0)}`;
  const sections = [
    { title: "Production Requirement", values: [demand.capability, demand.category, demand.description] },
    { title: "Quantity", values: [`${formatNumber(demand.quantity ?? 0)} ${demand.unit}${demand.demandType === "recurring" ? " · first production" : " · one-time production"}`, ...(demand.demandType === "recurring" ? [`${formatNumber(demand.monthlyQuantity ?? 0)} ${demand.unit} / month for ${demand.durationMonths} months`] : [])] },
    { title: "Location", values: [demand.location === "any" ? "Any Location" : `${demand.location}, Indonesia`, demand.location !== "any" && demand.maxDistanceKm ? `${demand.maxDistanceKm} km preferred distance · planning preference` : "No distance preference"] },
    { title: "Timeline", values: [`Complete by ${formattedDate}`, `${demand.maxLeadTimeDays ? `Maximum ${demand.maxLeadTimeDays} days lead time` : "Flexible lead time"} · ${demand.urgency.charAt(0).toUpperCase() + demand.urgency.slice(1)} urgency`] },
    { title: "Budget", values: [budget, demand.demandType === "recurring" ? "Total per month · IDR" : "Total for this order · IDR"] },
    { title: "Additional Requirements", values: [demand.materials.length ? `Materials: ${demand.materials.join(", ")}` : "No material preference", demand.certifications.length ? `Certifications: ${demand.certifications.join(", ")}` : "No certification preference", ...(demand.qualityRequirements ? [`Quality: ${demand.qualityRequirements}`] : []), ...(demand.technicalNotes ? [`Technical notes: ${demand.technicalNotes}`] : [])] },
  ];

  return (
    <div className="divide-y divide-line rounded-lg border border-line">
      {sections.map((section, index) => (
        <section key={section.title} className="px-4 py-5 sm:px-5" aria-labelledby={`review-section-${index}`}>
          <div className="mb-2.5 flex items-start justify-between gap-3">
            <h3 id={`review-section-${index}`} className="text-xs font-semibold text-slate-500">{section.title}</h3>
            <button type="button" onClick={() => onEdit(index)} aria-label={`Edit ${section.title}`} className="-my-2 inline-flex min-h-8 items-center gap-1.5 rounded-sm text-[11px] font-semibold text-brand-600 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"><Pencil size={11} aria-hidden="true" />Edit</button>
          </div>
          {section.values.map((value, valueIndex) => <p key={valueIndex} className={`mt-1.5 whitespace-pre-wrap break-words leading-6 ${valueIndex === 0 ? "text-sm font-medium text-ink" : "text-xs text-slate-500"}`}>{value}</p>)}
        </section>
      ))}
    </div>
  );
}
