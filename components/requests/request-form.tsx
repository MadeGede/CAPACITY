"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChevronDown, CircleAlert, FileText, MapPin, Paperclip, Plus, Send, X } from "lucide-react";
import { locations, type Capacity } from "@/data/capacities";
import { CapabilityIcon } from "@/components/capacity/capability-icon";
import { AvailabilityBadge, VerificationBadge } from "@/components/capacity/badges";
import { formatCapacity, formatLeadTime, formatCurrencyInput } from "@/lib/capacity-format";
import { categoryOptions, certificationOptions, demandUnits, localDateString } from "@/lib/demand-options";
import { useDemandState } from "@/lib/data/demands";
import { useRequestState } from "@/lib/data/requests";
import { DEMO_BUYER_NAME } from "@/lib/demo-identity";
import { useCapacityCatalog } from "@/lib/data/capacities";
import { useDataMode } from "@/lib/data/mode";
import { showToast } from "@/lib/toast";
import { createRequestDraft } from "@/lib/request-prefill";
import { validateRequestDraft } from "@/lib/request-rules";
import type { RequestDraft } from "@/types/requests";
import { RequestField, RequestOptions, RequestSection, requestControl } from "./request-fields";
import { RequestSummary } from "./request-summary";
import { DemoExplanationCallout } from "@/components/competition/explanation-callout";

const numberValue = (value: string) => value === "" ? null : Number(value);
const attachmentTypes = ["PDF", "Drawing", "CAD File", "Image", "Document"] as const;
const criteria = [{ key: "capability", label: "Capability" }, { key: "capacity", label: "Capacity" }, { key: "location", label: "Location" }, { key: "availability", label: "Availability" }, { key: "leadTime", label: "Lead Time" }, { key: "cost", label: "Estimated Cost" }] as const;

export function RequestForm({ provider }: { provider: Capacity }) {
  const router = useRouter();
  const requestState = useRequestState();
  const demandState = useDemandState();
  const { providers } = useCapacityCatalog();
  const { mode, business } = useDataMode();
  const [draft, setDraft] = useState<RequestDraft | null>(null);
  const [review, setReview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submissionError, setSubmissionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentType, setAttachmentType] = useState<(typeof attachmentTypes)[number]>("PDF");
  const [attachmentError, setAttachmentError] = useState("");
  const initializedProvider = useRef("");
  const submittingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const pageHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!requestState.ready || !demandState.ready || initializedProvider.current === provider.id) return;
    const selected = demandState.selectedRequest?.providerId === provider.id ? demandState.selectedRequest : null;
    setDraft({ ...createRequestDraft(provider, selected?.demand, selected?.matchContext), preferredStartDate: localDateString() });
    initializedProvider.current = provider.id;
  }, [requestState.ready, demandState.ready, demandState.selectedRequest, provider]);

  const change = (changes: Partial<RequestDraft>) => {
    setDraft((previous) => previous ? { ...previous, ...changes } : previous);
    setErrors((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => !(key in changes) && !(changes.budgetFlexibility === "flexible" && key === "budget"))));
  };
  const fieldProps = (name: keyof RequestDraft, hint = false) => ({ id: `request-${name}`, name, "aria-invalid": Boolean(errors[name]), "aria-describedby": [hint ? `request-${name}-hint` : "", errors[name] ? `request-${name}-error` : ""].filter(Boolean).join(" ") || undefined, className: `${requestControl} ${errors[name] ? "!border-red-400" : ""}` });
  const toggle = (name: "materials" | "certifications", value: string) => { if (draft) change({ [name]: draft[name].includes(value) ? draft[name].filter((item) => item !== value) : [...draft[name], value] }); };
  const focusPage = () => window.requestAnimationFrame(() => { pageHeading.current?.focus({ preventScroll: true }); pageHeading.current?.scrollIntoView({ block: "start", behavior: "instant" }); });

  const addAttachment = () => {
    const name = attachmentName.trim();
    if (!draft) return;
    if (!name || name.length > 160) return setAttachmentError("Enter a document name between 1 and 160 characters.");
    if (draft.attachments.length >= 10) return setAttachmentError("You can add up to 10 document references.");
    if (draft.attachments.some((attachment) => attachment.name.toLowerCase() === name.toLowerCase())) return setAttachmentError("This document name has already been added.");
    change({ attachments: [...draft.attachments, { id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, type: attachmentType }] });
    setAttachmentName("");
    setAttachmentError("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || submittingRef.current) return;
    const normalizedDraft = { ...draft, buyerName: mode === "real" ? business?.name || "Business buyer" : DEMO_BUYER_NAME };
    const nextErrors = validateRequestDraft(normalizedDraft, undefined, providers);
    if (Object.keys(nextErrors).length) {
      setReview(false);
      setErrors(nextErrors);
      window.requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    if (!review) { setDraft(normalizedDraft); setErrors({}); setReview(true); focusPage(); return; }
    submittingRef.current = true;
    setSubmitting(true);
    setSubmissionError("");
    try {
      const creation = requestState.create(normalizedDraft);
      const request = creation instanceof Promise ? await creation : creation;
      showToast("Request submitted");
      router.push(`/requests/${request.id}`);
    } catch (error) {
      submittingRef.current = false;
      setSubmitting(false);
      setSubmissionError(error instanceof Error ? error.message : "We couldn't save your request. Please try again.");
    }
  };

  const today = localDateString();

  return (
    <main id="top" className="bg-paper pb-14 pt-[72px]">
      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-7xl px-5 pb-8 pt-6 sm:px-8 sm:pb-10 lg:px-10">
          <Link href={`/capacity/${provider.id}`} className="mb-5 inline-flex min-h-10 items-center gap-2 text-xs text-slate-500 hover:text-brand-600"><ArrowLeft size={14} aria-hidden="true" />Back to provider</Link>
          <DemoExplanationCallout id="request">Matching continues into a structured B2B negotiation workflow. The selected requirement and compatibility context travel with your Capacity Request.</DemoExplanationCallout>
          <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Business collaboration</p><h1 ref={pageHeading} tabIndex={-1} className="scroll-mt-28 text-[30px] font-bold leading-tight tracking-[-0.035em] outline-none sm:text-[38px]">Request Capacity</h1><p className="mt-3 text-sm leading-7 text-slate-500">Send your production requirement directly to this provider.</p></div><span className="rounded-md border border-line bg-paper/60 px-3 py-2 text-[10px] text-slate-500">{mode === "real" ? "Secure business request" : `Demo workspace · ${requestState.sessionOnly ? "Current session only" : "Requests stay on this device"}`}</span></div>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-5 rounded-lg border border-line bg-paper/35 px-4 py-5 sm:px-5">
            <div className="flex min-w-0 items-center gap-3.5"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line bg-white text-brand-500"><CapabilityIcon category={provider.category} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-x-3 gap-y-1.5"><p className="text-sm font-semibold">{provider.name}</p><VerificationBadge verified={provider.verified} /></div><p className="mt-1.5 text-xs text-slate-500">{provider.capability}</p><p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400"><MapPin size={11} aria-hidden="true" />{provider.location}, Indonesia</p></div></div>
            <dl className="flex flex-wrap gap-x-7 gap-y-3 text-xs"><div><dt className="text-[10px] text-slate-400">Available Capacity</dt><dd className="mt-1.5 font-semibold text-slate-700">{formatCapacity(provider)}</dd></div><div><dt className="text-[10px] text-slate-400">Lead Time</dt><dd className="mt-1.5 font-semibold text-slate-700">{formatLeadTime(provider.leadTimeDays)}</dd></div><div className="self-center"><AvailabilityBadge days={provider.availabilityDays} /></div></dl>
          </div>
        </div>
      </div>

      {!draft || !requestState.ready || !demandState.ready ? <div className="mx-auto min-h-[400px] max-w-7xl px-5 py-10 text-sm text-slate-500" role="status">Preparing your capacity request…</div> : (
        <div className="mx-auto grid max-w-7xl items-start gap-6 px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-10">
          <div className="min-w-0">
            <ol className="mb-5 flex items-center gap-4 text-xs" aria-label="Request progress"><li className={`inline-flex items-center gap-2 font-semibold ${review ? "text-slate-500" : "text-brand-600"}`} aria-current={!review ? "step" : undefined}><span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] ${review ? "bg-brand-50 text-brand-500" : "bg-brand-500 text-white"}`}>{review ? <Check size={12} aria-hidden="true" /> : "1"}</span>Request details</li><li className="h-px w-8 bg-slate-200" aria-hidden="true" /><li className={`inline-flex items-center gap-2 font-semibold ${review ? "text-brand-600" : "text-slate-400"}`} aria-current={review ? "step" : undefined}><span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] ${review ? "bg-brand-500 text-white" : "border border-slate-200 bg-white"}`}>2</span>Review & send</li></ol>
            <form ref={formRef} onSubmit={submit} noValidate aria-label="Capacity request" className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
              {Object.keys(errors).length > 0 && <div role="alert" className="mx-5 mt-5 flex gap-2.5 rounded-md border border-red-200 bg-red-50 px-3.5 py-3 text-xs leading-6 text-red-700 sm:mx-7"><CircleAlert size={16} className="mt-1 shrink-0" aria-hidden="true" />Please check the highlighted fields before reviewing your request.</div>}
              {review ? <RequestSummary draft={draft} provider={provider} /> : <>
                {draft.matchContext && <div className="mx-5 mt-5 rounded-md border border-brand-100 bg-brand-50/50 p-3.5 text-xs leading-6 text-brand-700 sm:mx-7">Your production requirement has been carried over from Smart Matching. Review the details and add anything the provider should know.</div>}
                <RequestSection number="01" title="Production Requirement" description="Describe the capacity you want this provider to support.">
                  <div className="grid gap-5 sm:grid-cols-2"><RequestField name="buyerName" label={mode === "real" ? "Your Business" : "Demo Business"}><input {...fieldProps("buyerName")} value={mode === "real" ? business?.name || "Business buyer" : DEMO_BUYER_NAME} readOnly aria-readonly="true" className={`${requestControl} bg-paper`} /></RequestField><RequestField name="capability" label="Requested Capability" error={errors.capability}><input {...fieldProps("capability")} list="provider-capability-options" value={draft.capability} maxLength={160} onChange={(event) => change({ capability: event.target.value })} placeholder="e.g. CNC Milling" /><datalist id="provider-capability-options">{Array.from(new Set([provider.capability, ...provider.capabilities])).map((capability) => <option key={capability} value={capability} />)}</datalist></RequestField></div>
                  <div className="grid gap-5 sm:grid-cols-2"><RequestField name="quantity" label={draft.demandType === "recurring" ? "Monthly Quantity" : "Quantity"} error={errors.quantity}><input {...fieldProps("quantity")} type="number" min="0" step={["kg", "tons", "production hours"].includes(draft.unit) ? "any" : "1"} value={draft.quantity ?? ""} placeholder="e.g. 5000" onChange={(event) => change({ quantity: numberValue(event.target.value) })} /></RequestField><RequestField name="unit" label="Unit" error={errors.unit}><select {...fieldProps("unit")} value={draft.unit} onChange={(event) => change({ unit: event.target.value })}>{Array.from(new Set([...demandUnits, draft.unit].filter(Boolean))).map((unit) => <option key={unit}>{unit}</option>)}</select></RequestField></div>
                  <div className="grid gap-5 sm:grid-cols-2"><RequestField name="location" label="Preferred Location" error={errors.location}><select {...fieldProps("location")} value={draft.location} onChange={(event) => change({ location: event.target.value as RequestDraft["location"] })}><option value="any">Any Location</option>{locations.map((location) => <option key={location}>{location}</option>)}</select></RequestField><RequestField name="demandType" label="Production Frequency"><select {...fieldProps("demandType")} value={draft.demandType} onChange={(event) => change({ demandType: event.target.value as RequestDraft["demandType"] })}><option value="one-time">One-Time Production</option><option value="recurring">Recurring Production</option></select></RequestField></div>
                  {draft.demandType === "recurring" && <RequestField name="durationMonths" label="Expected Duration (months)" error={errors.durationMonths}><input {...fieldProps("durationMonths")} type="number" min="1" max="60" step="1" value={draft.durationMonths ?? ""} placeholder="e.g. 6" onChange={(event) => change({ durationMonths: numberValue(event.target.value) })} /></RequestField>}
                </RequestSection>
                <RequestSection number="02" title="Production Timeline">
                  <div className="grid gap-5 sm:grid-cols-2"><RequestField name="preferredStartDate" label="Preferred Start Date" error={errors.preferredStartDate}><input {...fieldProps("preferredStartDate")} type="date" min={today} value={draft.preferredStartDate} onChange={(event) => change({ preferredStartDate: event.target.value })} /></RequestField><RequestField name="requiredCompletionDate" label="Required Completion Date" error={errors.requiredCompletionDate}><input {...fieldProps("requiredCompletionDate")} type="date" min={today} value={draft.requiredCompletionDate} onChange={(event) => change({ requiredCompletionDate: event.target.value })} /></RequestField></div>
                  <div className="grid gap-5 sm:grid-cols-2"><RequestField name="preferredLeadTimeDays" label="Preferred Lead Time (days)" error={errors.preferredLeadTimeDays} optional><input {...fieldProps("preferredLeadTimeDays")} type="number" min="0" max="365" step="1" placeholder="Flexible" value={draft.preferredLeadTimeDays ?? ""} onChange={(event) => change({ preferredLeadTimeDays: numberValue(event.target.value) })} /></RequestField><RequestField name="urgency" label="Urgency"><select {...fieldProps("urgency")} value={draft.urgency} onChange={(event) => change({ urgency: event.target.value as RequestDraft["urgency"] })}><option value="standard">Standard</option><option value="priority">Priority</option><option value="urgent">Urgent</option></select></RequestField></div>
                </RequestSection>
                <RequestSection number="03" title="Budget" description={`Your estimated total ${draft.demandType === "recurring" ? "monthly production" : "order"} budget, in Indonesian Rupiah.`}>
                  <div className="grid gap-5 sm:grid-cols-2"><RequestField name="budget" label="Estimated Budget" error={errors.budget} optional={draft.budgetFlexibility === "flexible"}><div className="relative"><span className="pointer-events-none absolute left-3.5 top-3 text-sm font-medium text-slate-400" aria-hidden="true">Rp</span><input {...fieldProps("budget")} className={`${requestControl} pl-11 ${errors.budget ? "!border-red-400" : ""}`} type="text" inputMode="numeric" maxLength={22} value={draft.budget === null ? "" : formatCurrencyInput(draft.budget)} placeholder="25.000.000" onChange={(event) => { const digits = event.target.value.replace(/\D/g, ""); change({ budget: digits ? Number(digits) : null }); }} /></div></RequestField><RequestField name="budgetFlexibility" label="Budget Flexibility"><select {...fieldProps("budgetFlexibility")} value={draft.budgetFlexibility} onChange={(event) => change({ budgetFlexibility: event.target.value as RequestDraft["budgetFlexibility"] })}><option value="fixed">Fixed Budget</option><option value="slightly_flexible">Slightly Flexible</option><option value="flexible">Flexible</option></select></RequestField></div>
                </RequestSection>
                <RequestSection number="04" title="Technical Requirements" description="Give the provider enough detail to evaluate feasibility and prepare a proposal.">
                  <RequestOptions label="Materials" options={Array.from(new Set([...categoryOptions[draft.category].materials, ...draft.materials]))} selected={draft.materials} onToggle={(value) => toggle("materials", value)} />
                  <RequestField name="description" label="Product / Component Description" error={errors.description}><textarea {...fieldProps("description")} rows={4} maxLength={5000} value={draft.description} onChange={(event) => change({ description: event.target.value })} placeholder="Describe the product, component, or production service you need." /></RequestField>
                  <RequestField name="technicalRequirements" label="Technical Specifications" optional><textarea {...fieldProps("technicalRequirements")} rows={3} maxLength={5000} value={draft.technicalRequirements} onChange={(event) => change({ technicalRequirements: event.target.value })} placeholder="Dimensions, tolerances, finish, processing, or handling requirements." /></RequestField>
                  <RequestField name="qualityRequirements" label="Quality Requirements" optional><textarea {...fieldProps("qualityRequirements")} rows={3} maxLength={5000} value={draft.qualityRequirements} onChange={(event) => change({ qualityRequirements: event.target.value })} placeholder="Inspection procedures, test standards, or acceptance criteria." /></RequestField>
                  <RequestOptions label="Certifications Required" options={Array.from(new Set([...certificationOptions, ...draft.certifications]))} selected={draft.certifications} onToggle={(value) => toggle("certifications", value)} />
                  <RequestField name="additionalNotes" label="Additional Notes" optional><textarea {...fieldProps("additionalNotes")} rows={3} maxLength={5000} value={draft.additionalNotes} onChange={(event) => change({ additionalNotes: event.target.value })} placeholder="Packaging, delivery preferences, or other context for this request." /></RequestField>
                </RequestSection>
                <RequestSection number="05" title="Attach Specification" description="Add document names for reference. No files are uploaded or transferred.">
                  <div className="rounded-md border border-dashed border-slate-300 bg-paper/50 p-4"><div className="mb-4 flex items-center gap-2 text-xs font-medium text-slate-600"><Paperclip size={15} aria-hidden="true" />Document references</div><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]"><RequestField name="attachmentName" label="Document Name"><input id="request-attachmentName" aria-invalid={Boolean(attachmentError)} aria-describedby={attachmentError ? "attachment-error" : undefined} className={requestControl} maxLength={160} value={attachmentName} onChange={(event) => { setAttachmentName(event.target.value); setAttachmentError(""); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addAttachment(); } }} placeholder="product-specification.pdf" /></RequestField><RequestField name="attachmentType" label="Type"><select id="request-attachmentType" className={requestControl} value={attachmentType} onChange={(event) => setAttachmentType(event.target.value as (typeof attachmentTypes)[number])}>{attachmentTypes.map((type) => <option key={type}>{type}</option>)}</select></RequestField></div>{attachmentError && <p id="attachment-error" role="alert" className="mt-2 text-xs text-red-700">{attachmentError}</p>}<button type="button" onClick={addAttachment} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"><Plus size={13} aria-hidden="true" />Add Attachment</button></div>
                  {draft.attachments.length > 0 && <ul className="space-y-2">{draft.attachments.map((attachment) => <li key={attachment.id} className="flex items-center gap-2.5 rounded-md border border-line px-3 py-2"><FileText size={15} className="shrink-0 text-slate-400" aria-hidden="true" /><span className="min-w-0 flex-1 break-words text-xs text-slate-600">{attachment.name}<span className="ml-2 text-[10px] text-slate-400">{attachment.type}</span></span><button type="button" onClick={() => change({ attachments: draft.attachments.filter((item) => item.id !== attachment.id) })} aria-label={`Remove ${attachment.name}`} className="grid h-9 w-9 shrink-0 place-items-center rounded text-slate-400 hover:bg-paper hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-brand-500"><X size={14} aria-hidden="true" /></button></li>)}</ul>}
                </RequestSection>
                <RequestSection number="06" title="Message to Provider"><RequestField name="message" label="Introduction Message" optional><textarea {...fieldProps("message")} rows={4} maxLength={5000} value={draft.message} onChange={(event) => change({ message: event.target.value })} placeholder="Introduce your business and provide any additional information that may help the provider evaluate this request." /></RequestField></RequestSection>
              </>}
              {submissionError && <p role="alert" className="mx-5 mb-5 rounded-md bg-red-50 p-3 text-sm leading-6 text-red-700 sm:mx-7">{submissionError}</p>}
              <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-white/95 px-5 py-5 backdrop-blur-sm sm:px-7">{review ? <button type="button" onClick={() => { setReview(false); focusPage(); }} disabled={submitting} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-4 text-xs font-semibold text-slate-600 hover:bg-paper focus-visible:ring-2 focus-visible:ring-brand-500"><ArrowLeft size={14} aria-hidden="true" />Back</button> : <span className="text-[11px] text-slate-400">Review before sending</span>}<button type="submit" disabled={submitting} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-500 px-4 py-3 text-xs font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-60 sm:px-5">{submitting ? "Sending Request…" : review ? "Send Capacity Request" : "Review Request"}{review ? <Send size={14} aria-hidden="true" /> : <ArrowRight size={14} aria-hidden="true" />}</button></div>
            </form>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-28" aria-label="Request context">
            {draft.matchContext && <section className="rounded-lg border border-brand-100 bg-white p-5"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-600">Matched through CAPACITY</p><div className="mt-4 flex items-baseline gap-2"><span className="text-4xl font-semibold tracking-tight text-ink">{draft.matchContext.score}%</span><span className="text-xs text-slate-500">Compatibility</span></div><p className="mt-2 text-xs font-medium text-slate-600">{draft.matchContext.classification}</p><p className="mt-3 text-[11px] leading-5 text-slate-500">From your matching results. Changes to this request may affect compatibility.</p><details className="group mt-4 border-t border-line pt-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-semibold text-brand-600">View Match Analysis<ChevronDown size={14} className="transition-transform group-open:rotate-180" aria-hidden="true" /></summary><dl className="mt-4 space-y-3">{criteria.map(({ key, label }) => <div key={key}><div className="mb-1.5 flex items-center justify-between text-[11px]"><dt className="text-slate-500">{label}</dt><dd className="font-medium text-slate-700">{draft.matchContext!.breakdown[key]}%</dd></div><div className="h-1 rounded-full bg-paper" aria-hidden="true"><div className="h-full rounded-full bg-brand-500/70" style={{ width: `${Math.max(0, Math.min(100, draft.matchContext!.breakdown[key]))}%` }} /></div><p className="mt-1.5 text-[10px] leading-5 text-slate-400">{draft.matchContext!.explanations[key]}</p></div>)}</dl></details></section>}
            <section className="rounded-lg border border-line bg-white p-5"><h2 className="text-sm font-semibold">What happens next?</h2><ol className="mt-5 space-y-4">{["The provider reviews your requirements.", "Discuss specifications, timing, and cost.", "Agree on a production proposal together."].map((text, index) => <li key={text} className="flex gap-3 text-xs leading-6 text-slate-500"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-paper text-[10px] font-semibold text-slate-500">{index + 1}</span>{text}</li>)}</ol><p className="mt-5 border-t border-line pt-4 text-[11px] leading-6 text-slate-400">{mode === "real" ? "Your request will be visible to the selected provider business in CAPACITY." : "This is a local demo. Sending a request creates a collaboration record here; it does not contact an external business."}</p></section>
          </aside>
        </div>
      )}
    </main>
  );
}
