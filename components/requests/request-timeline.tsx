import { Check, Circle } from "lucide-react";
import type { CapacityRequest, RequestStatus } from "@/types/requests";
import { requestDate } from "@/lib/request-format";

const stages: { status: RequestStatus; title: string }[] = [
  { status: "pending_review", title: "Request submitted" },
  { status: "provider_reviewing", title: "Provider reviewing" },
  { status: "negotiation", title: "Negotiation" },
  { status: "accepted", title: "Production agreement" },
  { status: "in_progress", title: "Production" },
  { status: "completed", title: "Completed" },
];

export function RequestTimeline({ request }: { request: CapacityRequest }) {
  const current = stages.findIndex((stage) => stage.status === request.status);
  const future = current >= 0 ? stages.slice(current + 1) : [];
  return (
    <section className="surface-premium rounded-xl p-5 sm:p-6" aria-labelledby="request-timeline-title">
      <h2 id="request-timeline-title" className="text-sm font-bold text-ink">Collaboration Timeline</h2>
      <ol className="mt-6">
        {request.timeline.map((event, index) => (
          <li key={event.id} className="relative flex gap-3 pb-6 last:pb-0">
            {(index < request.timeline.length - 1 || future.length > 0) && <span className="absolute bottom-0 left-[9px] top-5 w-px bg-slate-200" aria-hidden="true" />}
            <span className={`relative z-10 grid h-5 w-5 shrink-0 place-items-center rounded-full ${index === request.timeline.length - 1 ? "bg-brand-600 text-white shadow-[0_0_0_4px_#dbeafe]" : "bg-blue-50 text-brand-600"}`}><Check className="h-3 w-3" aria-hidden="true" /></span>
            <div className="min-w-0"><p className="text-xs font-semibold leading-5 text-ink">{event.title}</p><time dateTime={event.createdAt} className="mt-1 block text-[10px] text-slate-400">{requestDate(event.createdAt, true)}</time>{event.description && <p className="mt-1.5 break-words text-[11px] leading-5 text-slate-500">{event.description}</p>}</div>
          </li>
        ))}
        {future.map((stage, index) => (
          <li key={stage.status} className="relative flex gap-3 pb-6 last:pb-0">
            {index < future.length - 1 && <span className="absolute bottom-0 left-[9px] top-5 w-px bg-slate-100" aria-hidden="true" />}
            <span className="relative z-10 grid h-5 w-5 shrink-0 place-items-center bg-white"><Circle className="h-3.5 w-3.5 text-slate-200" aria-hidden="true" /></span>
            <p className="text-xs leading-5 text-slate-400">{stage.title}<span className="sr-only"> — upcoming</span></p>
          </li>
        ))}
      </ol>
    </section>
  );
}
