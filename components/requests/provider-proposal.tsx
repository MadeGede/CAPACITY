"use client";

import { cloneElement, useRef, useState, type InputHTMLAttributes, type ReactElement } from "react";
import { FileCheck2, X } from "lucide-react";
import type { CapacityRequest, ProposalDraft } from "@/types/requests";
import { useRequestState } from "@/lib/data/requests";
import { validateProposal } from "@/lib/request-rules";
import { localDateString } from "@/lib/demand-options";
import { formatNumber, formatPrice } from "@/lib/capacity-format";
import { requestDate } from "@/lib/request-format";
import { showToast } from "@/lib/toast";

const fieldClass = "mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-blue-100";

export function ProviderProposalCard({ request }: { request: CapacityRequest }) {
  const proposal = request.proposal;
  if (!proposal) return null;
  return (
    <section className="relative overflow-hidden rounded-xl border border-blue-200 bg-white p-5 shadow-[0_20px_45px_-32px_rgba(29,78,216,.4)] sm:p-6" aria-labelledby="proposal-title">
      <span className="absolute inset-x-0 top-0 h-[3px] bg-brand-500" aria-hidden="true" />
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="proposal-title" className="flex items-center gap-2 text-sm font-bold text-ink"><FileCheck2 className="h-4 w-4 text-brand-600" aria-hidden="true" />Production Proposal</h2><span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{proposal.status === "accepted" ? "Agreed terms" : proposal.status === "revision_requested" ? "Revision requested" : "Awaiting buyer review"}</span></div>
      <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-3">
        <Metric label="Proposed quantity" value={`${formatNumber(proposal.quantity)} ${request.unit}${request.demandType === "recurring" ? "/month" : ""}`} />
        <Metric label="Unit price" value={`${formatPrice(proposal.unitPrice)} / ${request.unit}`} />
        <Metric label={request.demandType === "recurring" ? "Monthly total" : "Estimated total"} value={formatPrice(proposal.total)} featured />
        <Metric label="Production start" value={requestDate(proposal.startDate)} />
        <Metric label="Estimated completion" value={requestDate(proposal.completionDate)} />
        <Metric label="Lead time" value={`${proposal.leadTimeDays} days`} />
      </dl>
      {proposal.notes && <p className="mt-5 whitespace-pre-wrap break-words border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">{proposal.notes}</p>}
      {request.revisionNotes && <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-semibold text-ink">Buyer’s revision notes</p><p className="mt-1 whitespace-pre-wrap break-words text-xs leading-6 text-slate-600">{request.revisionNotes}</p></div>}
    </section>
  );
}

function Metric({ label, value, featured = false }: { label: string; value: string; featured?: boolean }) {
  return <div className={`min-w-0 ${featured ? "-m-2 rounded-lg border border-blue-100 bg-blue-50/70 p-2" : ""}`}><dt className="text-[10px] text-slate-500">{label}</dt><dd className={`mt-1.5 break-words font-semibold leading-6 ${featured ? "text-lg tracking-tight text-brand-700" : "text-sm text-ink"}`}>{value}</dd></div>;
}

export function ProviderProposalForm({ request, onClose }: { request: CapacityRequest; onClose: () => void }) {
  const { saveProposal } = useRequestState();
  const [draft, setDraft] = useState<ProposalDraft>(() => ({ quantity: request.proposal?.quantity || request.quantity, unitPrice: request.proposal?.unitPrice || 0, startDate: request.proposal?.startDate || localDateString(), completionDate: request.proposal?.completionDate || request.requiredCompletionDate, leadTimeDays: request.proposal?.leadTimeDays || 0, notes: request.proposal?.notes || "" }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const leadTimeDays = Math.round((Date.parse(`${draft.completionDate}T00:00:00Z`) - Date.parse(`${draft.startDate}T00:00:00Z`)) / 86400000);
  const update = (values: Partial<ProposalDraft>) => {
    setDraft((previous) => ({ ...previous, ...values }));
    setErrors((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => !(key in values) && !(key === "leadTimeDays" && ("startDate" in values || "completionDate" in values)))));
    setError("");
  };
  return (
    <form ref={form} noValidate aria-label="Production proposal" aria-busy={busy} onSubmit={async (event) => {
      event.preventDefault();
      if (submitting.current) return;
      const proposal = { ...draft, leadTimeDays };
      const validation = validateProposal(proposal);
      setErrors(validation); setError("");
      if (Object.keys(validation).length) {
        window.requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
        return;
      }
      submitting.current = true; setBusy(true);
      try { const operation = saveProposal(request.id, proposal); if (operation instanceof Promise) await operation; onClose(); showToast(request.proposal ? "Revised proposal sent" : "Proposal sent"); } catch (error) { setError(error instanceof Error ? error.message : "Unable to save the proposal."); }
      finally { submitting.current = false; setBusy(false); }
    }} className="rounded-lg border border-blue-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3"><h2 className="text-base font-bold text-ink">{request.proposal ? "Revise production proposal" : "Create production proposal"}</h2><button type="button" disabled={busy} onClick={onClose} aria-label="Close proposal form" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>
      <p className="mt-2 text-xs leading-6 text-slate-500">Propose specific terms for the buyer to review.{request.demandType === "recurring" ? " Quantities and totals are per month." : ""}</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label={`Proposed quantity (${request.unit})`} name="proposal-quantity" error={errors.quantity}><input id="proposal-quantity" type="number" min="0" step="any" value={draft.quantity || ""} onChange={(event) => update({ quantity: Number(event.target.value) })} className={fieldClass} /></Field>
        <Field label={`Estimated unit price (Rp / ${request.unit})`} name="proposal-price" error={errors.unitPrice}><input id="proposal-price" inputMode="numeric" value={draft.unitPrice ? formatPrice(draft.unitPrice) : ""} onChange={(event) => update({ unitPrice: Number(event.target.value.replace(/\D/g, "")) })} placeholder="Rp21.500" className={fieldClass} /></Field>
        <Field label="Production start date" name="proposal-start" error={errors.startDate}><input id="proposal-start" type="date" min={localDateString()} value={draft.startDate} onChange={(event) => update({ startDate: event.target.value })} className={fieldClass} /></Field>
        <Field label="Estimated completion date" name="proposal-completion" error={errors.completionDate}><input id="proposal-completion" type="date" min={draft.startDate || localDateString()} value={draft.completionDate} onChange={(event) => update({ completionDate: event.target.value })} className={fieldClass} /></Field>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4"><div><p className="text-[10px] text-slate-500">{request.demandType === "recurring" ? "Estimated monthly total" : "Estimated total"}</p><output className="mt-1 block text-lg font-bold text-ink">{formatPrice(Math.round(draft.quantity * draft.unitPrice) || 0)}</output></div><div><p className="text-[10px] text-slate-500">Lead time · from selected dates</p><p className="mt-1 text-lg font-bold text-ink">{Number.isFinite(leadTimeDays) && leadTimeDays >= 0 ? `${leadTimeDays} days` : "—"}</p></div></div>
      {errors.leadTimeDays && <p className="mt-2 text-xs text-red-700">{errors.leadTimeDays}</p>}
      <label htmlFor="proposal-notes" className="mt-5 block text-xs font-semibold text-slate-600">Provider notes</label><textarea id="proposal-notes" rows={3} value={draft.notes} onChange={(event) => update({ notes: event.target.value })} className={`${fieldClass} h-auto py-3`} />
      {error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
      <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className="min-h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-600">Cancel</button><button type="submit" disabled={busy} className="min-h-10 rounded-lg bg-ink px-4 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50">{busy ? "Sending proposal…" : request.proposal ? "Send revised proposal" : "Send Proposal"}</button></div>
    </form>
  );
}

function Field({ label, name, error, children }: { label: string; name: string; error?: string; children: ReactElement<InputHTMLAttributes<HTMLInputElement>> }) {
  return <div><label htmlFor={name} className="block text-xs font-semibold text-slate-600">{label}</label>{cloneElement(children, { "aria-invalid": Boolean(error), "aria-describedby": error ? `${name}-error` : undefined })}{error && <p id={`${name}-error`} role="alert" className="mt-1.5 text-xs text-red-700">{error}</p>}</div>;
}
