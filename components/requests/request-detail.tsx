"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, Factory, FileText, MessageSquare, X } from "lucide-react";
import { useRequestState } from "@/lib/data/requests";
import { useCapacityCatalog } from "@/lib/data/capacities";
import { useDataMode } from "@/lib/data/mode";
import { useRealWorkspace } from "@/lib/data/real-workspace";
import { statusLabels } from "@/lib/request-rules";
import { formatNumber, formatPrice } from "@/lib/capacity-format";
import { requestDate } from "@/lib/request-format";
import { DEMO_BUYER_NAME, DEMO_PROVIDER_ID } from "@/lib/demo-identity";
import { showToast } from "@/lib/toast";
import type { CapacityRequest, RequestAction } from "@/types/requests";
import { DemoPerspectiveSwitcher } from "./demo-perspective";
import { RequestStatusBadge } from "./request-status-badge";
import { RequestTimeline } from "./request-timeline";
import { RequestDiscussion } from "./request-discussion";
import { ProviderProposalCard, ProviderProposalForm } from "./provider-proposal";
import { DemoExplanationCallout } from "@/components/competition/explanation-callout";

function Detail({ request }: { request: CapacityRequest }) {
  const { perspective, setPerspective, actOnRequest } = useRequestState();
  const { mode, business } = useDataMode();
  useEffect(() => {
    if (mode !== "real" || !business) return;
    const role = request.providerBusinessId === business.id ? "provider" : "buyer";
    if (perspective !== role) setPerspective(role);
  }, [mode, business, request.providerBusinessId, perspective, setPerspective]);
  const { providers } = useCapacityCatalog();
  const provider = providers.find((item) => item.id === request.providerId);
  const canOperate = mode === "real" ? Boolean(business && (perspective === "buyer" ? request.buyerBusinessId === business.id : request.providerBusinessId === business.id)) : perspective === "buyer" ? request.buyerName === DEMO_BUYER_NAME : request.providerId === DEMO_PROVIDER_ID || provider?.companyId === DEMO_PROVIDER_ID;
  const [showProposal, setShowProposal] = useState(false);
  const [action, setAction] = useState<RequestAction | null>(null);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const acting = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!action || !dialog.current) return;
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    element.showModal(); document.body.style.overflow = "hidden";
    return () => { element.close(); document.body.style.overflow = overflow; };
  }, [action]);
  const close = () => { setAction(null); setNote(""); setReason(""); setError(""); };
  const perform = async (next: RequestAction, details = "") => {
    if (acting.current || !canOperate) return;
    acting.current = true;
    setBusy(true);
    try { const operation = actOnRequest(request.id, next, details); if (operation instanceof Promise) await operation; close(); setShowProposal(false); showToast(({ accept_proposal: "Proposal accepted", start_collaboration: "Production collaboration started", complete: "Collaboration completed", cancel: "Request cancelled", reject_request: "Request rejected", request_revision: "Revision requested", start_review: "Request under review", start_negotiation: "Negotiation started", accept_request: "Request accepted" } as Record<RequestAction, string>)[next]); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update this request."); }
    finally { acting.current = false; setBusy(false); }
  };
  const needsConfirmation = (next: RequestAction) => { setError(""); setAction(next); };
  const open = ["pending_review", "provider_reviewing", "negotiation"].includes(request.status);
  const canProposal = canOperate && perspective === "provider" && request.status === "negotiation";
  const proposalReview = canOperate && perspective === "buyer" && request.status === "negotiation" && request.proposal?.status === "proposed";
  const start = request.proposal?.startDate ?? request.preferredStartDate;
  const completion = request.proposal?.completionDate ?? request.requiredCompletionDate;
  const fields = [
    ["Buyer", request.buyerName], ["Provider", provider?.name ?? request.providerId],
    ["Requested capability", request.capability], [request.demandType === "recurring" ? "Monthly quantity" : "Quantity", `${formatNumber(request.quantity)} ${request.unit}`],
    ["Production location", request.location === "any" ? "Flexible" : request.location],
    ["Preferred start", requestDate(request.preferredStartDate)], ["Required completion", requestDate(request.requiredCompletionDate)],
    ["Preferred lead time", request.preferredLeadTimeDays === null ? "Flexible" : `${request.preferredLeadTimeDays} days`],
    ["Requested budget", request.budget === null ? "Open to estimate" : formatPrice(request.budget)],
    ["Budget flexibility", request.budgetFlexibility.replaceAll("_", " ")],
  ];
  const title = action === "cancel" ? "Cancel this request?" : action === "reject_request" ? "Reject this request?" : action === "request_revision" ? "Request proposal changes" : action === "accept_proposal" ? "Accept this proposal?" : action === "start_collaboration" ? "Start production collaboration?" : action === "complete" ? "Mark production complete?" : "Confirm action";

  return <main id="main-content" className="request-detail-page min-h-screen bg-paper pb-20 pt-28 text-ink">
    <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><Link href="/requests" className="inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand-600"><ArrowLeft size={14} />All requests</Link><DemoPerspectiveSwitcher /></div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-5"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-brand-600">Business collaboration · {mode === "real" ? "Real Workspace" : "Demo Mode"}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{request.capability}</h1><p className="mt-3 text-sm text-slate-500">{request.id} · {provider?.name ?? "Provider"} · Submitted {requestDate(request.createdAt)}</p></div><RequestStatusBadge status={request.status} /></div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <DemoExplanationCallout id="collaboration">Use Provider perspective to review, negotiate, and send a Production Proposal. Use Buyer perspective to accept its terms and start Collaboration. Each action updates the shared timeline and dashboards.</DemoExplanationCallout>
          <section className="rounded-lg border border-line bg-white p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Production requirement</h2><span className="text-[11px] text-slate-400">{statusLabels[request.status]}</span></div><p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">{request.description}</p><dl className="mt-6 grid gap-5 border-t border-line pt-6 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label}><dt className="text-[11px] text-slate-400">{label}</dt><dd className="mt-1 text-sm font-medium capitalize text-slate-700">{value}</dd></div>)}</dl><div className="mt-6 space-y-3 border-t border-line pt-6 text-sm leading-6 text-slate-600">{request.materials.length > 0 && <p><strong className="text-ink">Materials:</strong> {request.materials.join(", ")}</p>}{request.certifications.length > 0 && <p><strong className="text-ink">Certifications:</strong> {request.certifications.join(", ")}</p>}{request.technicalRequirements && <p><strong className="text-ink">Technical requirements:</strong> {request.technicalRequirements}</p>}{request.qualityRequirements && <p><strong className="text-ink">Quality:</strong> {request.qualityRequirements}</p>}{request.additionalNotes && <p><strong className="text-ink">Additional notes:</strong> {request.additionalNotes}</p>}</div>{request.attachments.length > 0 && <div className="mt-6 border-t border-line pt-5"><h3 className="text-xs font-semibold">Document references</h3><ul className="mt-3 space-y-2">{request.attachments.map((attachment) => <li key={attachment.id} className="flex gap-2 text-xs text-slate-600"><FileText size={14} />{attachment.name} · {attachment.type}</li>)}</ul><p className="mt-3 text-[11px] text-slate-400">Document names only; no files are stored or transferred.</p></div>}</section>
          {request.matchContext && <section className="rounded-lg border border-line bg-white p-5 sm:p-7"><h2 className="text-sm font-semibold">Match analysis at request time</h2><p className="mt-3 text-2xl font-bold text-brand-600">{request.matchContext.score}% <span className="text-sm font-medium text-slate-500">{request.matchContext.classification}</span></p><p className="mt-2 text-xs text-slate-500">Snapshot from the buyer’s original search. Capacity may have changed since then.</p><dl className="mt-5 grid gap-3 sm:grid-cols-2">{Object.entries(request.matchContext.explanations).map(([factor, explanation]) => <div key={factor} className="rounded-md bg-paper p-3"><dt className="text-xs font-semibold capitalize">{factor.replace("leadTime", "Lead time")} · {request.matchContext?.breakdown[factor as keyof typeof request.matchContext.breakdown]}%</dt><dd className="mt-1 text-xs leading-5 text-slate-500">{explanation}</dd></div>)}</dl></section>}
          {request.proposal && <ProviderProposalCard request={request} />}
          {showProposal && <ProviderProposalForm key={request.proposal?.id ?? "new"} request={request} onClose={() => setShowProposal(false)} />}
          <RequestDiscussion request={request} readOnly={!canOperate} providerName={provider?.name} />
        </div>
        <aside className="space-y-6"><section className="rounded-lg border border-line bg-white p-5 sm:p-6"><h2 className="text-sm font-semibold">Next steps</h2><p className="mt-2 text-xs leading-6 text-slate-500">{perspective === "provider" ? "Review this request and agree on production terms." : "Review the provider’s response and confirm the terms before production."}</p><div className="mt-5 flex flex-col gap-2 text-xs font-semibold">
          {!canOperate && <p className="text-xs font-normal leading-6 text-slate-500">{mode === "real" ? "Only the participating buyer or provider business can manage this request." : "This request belongs to another demo business. Switch perspective to a participating business to manage it."}</p>}
          {canOperate && perspective === "provider" && request.status === "pending_review" && <button className="min-h-10 rounded-md bg-ink px-4 text-white" onClick={() => perform("start_review")}>Review Request</button>}
          {canOperate && perspective === "provider" && ["pending_review", "provider_reviewing"].includes(request.status) && <button className="min-h-10 rounded-md bg-brand-600 px-4 text-white" onClick={() => perform("start_negotiation")}>Start Negotiation</button>}
          {canProposal && <button className="min-h-10 rounded-md bg-brand-600 px-4 text-white" onClick={() => setShowProposal(true)}>{request.proposal ? "Revise Proposal" : "Send Proposal"}</button>}
          {canOperate && perspective === "provider" && open && !request.proposal && <button className="min-h-10 rounded-md border border-brand-200 px-4 text-brand-700" onClick={() => needsConfirmation("accept_request")}>Accept Original Request</button>}
          {proposalReview && <><button className="min-h-10 rounded-md bg-brand-600 px-4 text-white" onClick={() => needsConfirmation("accept_proposal")}>Accept Proposal</button><button className="min-h-10 rounded-md border border-line px-4 text-slate-600" onClick={() => needsConfirmation("request_revision")}>Request Revision</button></>}
          {canOperate && request.status === "accepted" && <button className="min-h-10 rounded-md bg-brand-600 px-4 text-white" onClick={() => needsConfirmation("start_collaboration")}>Start Collaboration</button>}
          {request.status === "in_progress" && <div className="rounded-md border border-blue-100 bg-brand-50 p-4 font-normal"><Factory size={16} className="text-brand-600" /><p className="mt-2 font-semibold">Production in progress · {mode === "real" ? "Production underway" : "35% demo milestone"}</p><p className="mt-1 text-slate-600">Started {requestDate(start)} · Expected {requestDate(completion)}</p>{mode === "demo" && <div className="mt-3 h-1.5 rounded-full bg-blue-100"><div className="h-full w-[35%] rounded-full bg-brand-600" /></div>}</div>}
          {canOperate && perspective === "provider" && request.status === "in_progress" && <button className="min-h-10 rounded-md bg-brand-600 px-4 text-white" onClick={() => needsConfirmation("complete")}>Mark Complete</button>}
          {canOperate && perspective === "provider" && open && <button className="min-h-10 rounded-md border border-red-200 px-4 text-red-700" onClick={() => needsConfirmation("reject_request")}>Reject Request</button>}
          {canOperate && perspective === "buyer" && ["pending_review", "provider_reviewing", "negotiation", "accepted"].includes(request.status) && <button className="min-h-10 rounded-md border border-red-200 px-4 text-red-700" onClick={() => needsConfirmation("cancel")}>Cancel Request</button>}
          {request.status === "completed" && <p className="flex gap-2 text-xs leading-6 text-brand-700"><CheckCircle2 size={16} />Production collaboration completed.</p>}
          {request.status === "rejected" && <p className="text-xs leading-6 text-red-700">{request.rejectionReason}</p>}
          {request.status === "cancelled" && <p className="text-xs leading-6 text-slate-500">This request was cancelled.</p>}
          {error && !action && <p role="alert" className="text-red-700">{error}</p>}
        </div></section><RequestTimeline request={request} /><Link href="/dashboard/collaborations" className="inline-flex items-center gap-2 text-xs font-semibold text-brand-600">View collaborations <ArrowRight size={14} /></Link></aside>
      </div>
    </div>
    <dialog ref={dialog} aria-labelledby="request-confirm-title" onCancel={close} className="m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto overscroll-contain rounded-xl border border-line bg-white p-6 text-ink shadow-panel backdrop:bg-ink/40"><div className="flex justify-between gap-3"><h2 id="request-confirm-title" className="text-lg font-semibold">{title}</h2><button type="button" onClick={close} aria-label="Close confirmation"><X size={18} /></button></div><p className="mt-3 text-sm leading-6 text-slate-500">{action === "cancel" ? "The request will stop and cannot be reopened." : action === "reject_request" ? "Share a clear reason so the buyer understands the decision." : action === "request_revision" ? "Describe the terms that need to change. The provider can send an updated proposal." : "This will update the shared buyer and provider workspace."}</p>{action === "reject_request" && <label className="mt-5 block text-xs font-semibold">Reason<select value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-line px-3 text-sm"><option value="">Choose a reason</option><option>Capacity unavailable</option><option>Technical requirement unsupported</option><option>Timeline cannot be met</option><option>Budget mismatch</option><option value="Other">Other</option></select></label>}{["reject_request", "request_revision", "cancel"].includes(action ?? "") && <label className="mt-4 block text-xs font-semibold">{action === "request_revision" ? "Requested changes" : "Additional details"}<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="mt-2 w-full rounded-md border border-line p-3 text-sm" /></label>}{error && <p role="alert" className="mt-3 flex gap-2 text-xs text-red-700"><CircleAlert size={14} />{error}</p>}<div className="mt-6 flex justify-end gap-3 text-xs font-semibold"><button type="button" onClick={close} className="min-h-10 rounded-md border border-line px-4">Back</button><button type="button" disabled={busy} onClick={() => { if (!action) return; if (action === "reject_request" && (!reason || (reason === "Other" && !note.trim()))) { setError("Choose a reason and describe other reasons."); return; } if (action === "request_revision" && !note.trim()) { setError("Describe the changes you need."); return; } perform(action, action === "reject_request" ? `${reason}${note.trim() ? `: ${note.trim()}` : ""}` : note); }} className={`min-h-10 rounded-md px-4 text-white disabled:opacity-50 ${["cancel", "reject_request"].includes(action ?? "") ? "bg-red-700 hover:bg-red-800" : "bg-ink hover:bg-brand-600"}`}>Confirm</button></div></dialog>
  </main>;
}

export function RequestDetail({ id }: { id: string }) {
  const { ready, requests } = useRequestState();
  const { mode } = useDataMode();
  const real = useRealWorkspace();
  if (!ready) return <main className="min-h-screen bg-paper px-5 pb-20 pt-32" role="status"><div className="mx-auto max-w-7xl animate-pulse space-y-5"><div className="h-5 w-36 rounded bg-slate-200" /><div className="h-10 w-1/2 rounded bg-slate-200" /><div className="h-80 rounded-lg bg-white" /></div></main>;
  if (mode === "real" && real.error) return <main className="mx-auto min-h-screen max-w-xl px-5 pb-20 pt-36 text-center"><h1 className="text-2xl font-semibold">Unable to load this request.</h1><p className="mt-3 text-sm text-slate-500">Please try again.</p><button onClick={() => void real.refresh()} className="mt-6 rounded-md bg-ink px-5 py-3 text-xs font-semibold text-white">Retry</button></main>;
  const request = requests.find((item) => item.id === id);
  if (!request) return <main className="mx-auto min-h-screen max-w-xl px-5 pb-20 pt-36 text-center"><MessageSquare className="mx-auto h-9 w-9 text-slate-300" /><h1 className="mt-5 text-3xl font-semibold">Request not found</h1><p className="mt-3 text-sm text-slate-500">{mode === "real" ? "This request is unavailable or belongs to another business." : "The request may have moved or belongs to another browser demo session."}</p><Link href="/requests" className="mt-6 inline-flex min-h-10 items-center rounded-md bg-ink px-5 text-sm font-semibold text-white">View Requests</Link></main>;
  return <Detail key={request.id} request={request} />;
}
