import { statusLabels } from "@/lib/request-rules";
import type { RequestStatus } from "@/types/requests";

const statusStyles: Record<RequestStatus, string> = {
  pending_review: "border-slate-200 bg-slate-50 text-slate-600",
  provider_reviewing: "border-blue-100 bg-blue-50/60 text-brand-600",
  negotiation: "border-blue-100 bg-blue-50/60 text-brand-600",
  accepted: "border-emerald-100 bg-emerald-50/70 text-emerald-700",
  in_progress: "border-blue-100 bg-blue-50/60 text-brand-600",
  completed: "border-emerald-100 bg-emerald-50/70 text-emerald-700",
  rejected: "border-slate-200 bg-slate-50 text-slate-600",
  cancelled: "border-slate-200 bg-slate-50 text-slate-500",
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-semibold leading-4 ${statusStyles[status]}`}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />{statusLabels[status]}</span>;
}
