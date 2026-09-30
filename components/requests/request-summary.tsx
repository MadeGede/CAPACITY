import { FileText } from "lucide-react";
import type { Capacity } from "@/data/capacities";
import type { RequestDraft } from "@/types/requests";
import { formatNumber, formatPrice } from "@/lib/capacity-format";
import { requestDateLong } from "@/lib/request-format";

const dateLabel = (date: string) => date ? requestDateLong(date) : "To be agreed";

export function RequestSummary({ draft, provider }: { draft: RequestDraft; provider: Capacity }) {
  const budgetFlexibility = { fixed: "Fixed Budget", slightly_flexible: "Slightly Flexible", flexible: "Flexible" }[draft.budgetFlexibility];
  const sections = [
    { title: "Provider", values: [provider.name, `${provider.capability} · ${provider.location}, Indonesia`] },
    { title: "Production Requirement", values: [draft.capability, draft.description, `Buyer: ${draft.buyerName || "Business buyer"}`] },
    { title: "Quantity & Location", values: [`${formatNumber(draft.quantity ?? 0)} ${draft.unit}${draft.demandType === "recurring" ? ` / month for ${draft.durationMonths} months` : " · one-time production"}`, draft.location === "any" ? "Any Location" : `${draft.location}, Indonesia`] },
    { title: "Production Timeline", values: [`Preferred start: ${dateLabel(draft.preferredStartDate)}`, `Complete by: ${dateLabel(draft.requiredCompletionDate)}`, `${draft.preferredLeadTimeDays ? `${draft.preferredLeadTimeDays} days preferred lead time` : "Flexible lead time"} · ${draft.urgency.charAt(0).toUpperCase() + draft.urgency.slice(1)} urgency`] },
    { title: "Budget", values: [draft.budget === null ? "Open to provider estimate" : `${formatPrice(draft.budget)}${draft.demandType === "recurring" ? " / month" : " for this order"}`, budgetFlexibility] },
    { title: "Technical Requirements", values: [draft.materials.length ? `Materials: ${draft.materials.join(", ")}` : "No material preference specified", ...(draft.technicalRequirements ? [`Specifications: ${draft.technicalRequirements}`] : []), ...(draft.qualityRequirements ? [`Quality: ${draft.qualityRequirements}`] : []), ...(draft.certifications.length ? [`Certifications: ${draft.certifications.join(", ")}`] : []), ...(draft.additionalNotes ? [`Notes: ${draft.additionalNotes}`] : [])] },
  ];

  return (
    <div>
      <div className="border-b border-line px-5 py-6 sm:px-7"><h2 className="text-xl font-semibold tracking-tight">Request Summary</h2><p className="mt-2 text-xs leading-6 text-slate-500">Review your production requirement before sending it for provider review.</p></div>
      <div className="divide-y divide-line px-5 sm:px-7">
        {sections.map((section) => <section key={section.title} className="py-5"><h3 className="mb-2 text-[11px] font-semibold text-slate-500">{section.title}</h3>{section.values.map((value, index) => <p key={index} className={`mt-1.5 whitespace-pre-wrap break-words leading-6 ${index === 0 ? "text-sm font-medium text-ink" : "text-xs text-slate-600"}`}>{value}</p>)}</section>)}
        <section className="py-5"><h3 className="mb-3 text-[11px] font-semibold text-slate-500">Attachments</h3>{draft.attachments.length ? <ul className="space-y-2">{draft.attachments.map((attachment) => <li key={attachment.id} className="flex items-center gap-2 text-xs text-slate-600"><FileText size={14} className="shrink-0 text-slate-400" aria-hidden="true" /><span className="min-w-0 break-words">{attachment.name}</span><span className="shrink-0 text-[10px] text-slate-400">{attachment.type}</span></li>)}</ul> : <p className="text-xs text-slate-500">No attachments added.</p>}<p className="mt-2 text-[10px] leading-5 text-slate-400">Attachment names are demo references; no files are transferred.</p></section>
        <section className="py-5"><h3 className="mb-2 text-[11px] font-semibold text-slate-500">Message to Provider</h3><p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">{draft.message || "No introduction message added."}</p></section>
      </div>
    </div>
  );
}
