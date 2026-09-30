import { categories, getCapacity, locations, type Capacity } from "../data/capacities";
import type {
  CapacityRequest, DemoPerspective, ProposalDraft, RequestAction,
  RequestDraft, RequestStatus, RequestTimelineEvent,
} from "../types/requests";

export const statusLabels: Record<RequestStatus, string> = {
  pending_review: "Pending Review",
  provider_reviewing: "Provider Reviewing",
  negotiation: "Negotiation",
  accepted: "Accepted",
  rejected: "Rejected",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const terminalStatuses: readonly RequestStatus[] = ["rejected", "completed", "cancelled"];
const openStatuses: readonly RequestStatus[] = ["pending_review", "provider_reviewing", "negotiation"];
const attachmentTypes = ["PDF", "Drawing", "CAD File", "Image", "Document"];
const fractionalUnits = ["kg", "kilograms", "tons", "tonnes", "production hours", "hours"];
const positive = (value: number | null): value is number => typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 1_000_000_000_000;
const dateString = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function daysBetween(start: string, end: string): number {
  return (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000;
}

export function validateRequestDraft(draft: RequestDraft, today = dateString(new Date()), providers?: readonly Capacity[]): Record<string, string> {
  const errors: Record<string, string> = {};
  const provider = providers ? providers.find((item) => item.id === draft.providerId) : getCapacity(draft.providerId);
  if (!provider || provider.availableCapacity <= 0 || provider.listingStatus === "paused" || provider.listingStatus === "fully_booked") errors.providerId = "Choose an available provider.";
  if (!draft.buyerName.trim()) errors.buyerName = "Enter your business name.";
  if (!draft.capability.trim()) errors.capability = "Enter the capability you need.";
  if (!categories.includes(draft.category)) errors.category = "Choose a supported category.";
  if (!positive(draft.quantity)) errors.quantity = "Enter a quantity greater than zero.";
  else if (!fractionalUnits.includes(draft.unit.toLowerCase().trim()) && !Number.isInteger(draft.quantity)) errors.quantity = "Enter a whole-number quantity for this unit.";
  if (!draft.unit.trim()) errors.unit = "Enter a production unit.";
  if (draft.location !== "any" && !locations.includes(draft.location)) errors.location = "Choose a supported location.";
  if (!validDate(draft.preferredStartDate) || draft.preferredStartDate < today) errors.preferredStartDate = "Choose a valid start date today or later.";
  if (!validDate(draft.requiredCompletionDate) || draft.requiredCompletionDate < today) errors.requiredCompletionDate = "Choose a valid completion date today or later.";
  else if (validDate(draft.preferredStartDate) && draft.requiredCompletionDate < draft.preferredStartDate) errors.requiredCompletionDate = "Completion cannot be before the production start date.";
  if (draft.preferredLeadTimeDays !== null && (!Number.isInteger(draft.preferredLeadTimeDays) || draft.preferredLeadTimeDays < 0 || draft.preferredLeadTimeDays > 365)) errors.preferredLeadTimeDays = "Enter a lead time from 0 to 365 days, or leave it flexible.";
  if (!["standard", "priority", "urgent"].includes(draft.urgency)) errors.urgency = "Choose a supported urgency.";
  if (!["fixed", "slightly_flexible", "flexible"].includes(draft.budgetFlexibility)) errors.budgetFlexibility = "Choose a budget flexibility option.";
  if (draft.budgetFlexibility !== "flexible" && !positive(draft.budget)) errors.budget = "Enter a budget greater than zero, or choose Flexible.";
  else if (draft.budget !== null && !positive(draft.budget)) errors.budget = "Enter a valid budget greater than zero.";
  if (draft.description.trim().length < 15) errors.description = "Describe the product or production requirement in at least 15 characters.";
  if (!["one-time", "recurring"].includes(draft.demandType)) errors.demandType = "Choose a production demand type.";
  if (draft.demandType === "recurring" && (!positive(draft.durationMonths) || !Number.isInteger(draft.durationMonths) || draft.durationMonths > 60)) errors.durationMonths = "Enter a recurring duration between 1 and 60 months.";
  if (draft.attachments.some((item) => !item.id || !item.name.trim() || !attachmentTypes.includes(item.type))) errors.attachments = "Each attachment needs a name and supported document type.";
  if (new Set(draft.attachments.map((item) => item.id)).size !== draft.attachments.length) errors.attachments = "Attachment identifiers must be unique.";
  return errors;
}

export function validateProposal(draft: ProposalDraft, today = dateString(new Date())): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!positive(draft.quantity)) errors.quantity = "Enter a proposed quantity greater than zero.";
  if (!positive(draft.unitPrice)) errors.unitPrice = "Enter a unit price greater than zero.";
  if (positive(draft.quantity) && positive(draft.unitPrice) && !Number.isSafeInteger(Math.round(draft.quantity * draft.unitPrice))) errors.unitPrice = "The proposed total exceeds the supported amount.";
  if (!validDate(draft.startDate) || draft.startDate < today) errors.startDate = "Choose a valid production start date today or later.";
  if (!validDate(draft.completionDate) || draft.completionDate < today) errors.completionDate = "Choose a valid completion date today or later.";
  else if (validDate(draft.startDate) && draft.completionDate <= draft.startDate) errors.completionDate = "Completion must be after production starts.";
  if (!Number.isInteger(draft.leadTimeDays) || draft.leadTimeDays <= 0 || draft.leadTimeDays > 365) errors.leadTimeDays = "Enter a lead time from 1 to 365 days.";
  else if (validDate(draft.startDate) && validDate(draft.completionDate) && draft.leadTimeDays !== daysBetween(draft.startDate, draft.completionDate)) errors.leadTimeDays = "Lead time must equal the number of days between production start and completion.";
  return errors;
}

function assertValid(errors: Record<string, string>) {
  const first = Object.values(errors)[0];
  if (first) throw new Error(first);
}

function assertActor(actor: DemoPerspective) {
  if (actor !== "buyer" && actor !== "provider") throw new Error("Choose the buyer or provider perspective.");
}

function assertOpen(request: CapacityRequest, actor: DemoPerspective) {
  assertActor(actor);
  if (terminalStatuses.includes(request.status)) throw new Error(`This request is ${statusLabels[request.status].toLowerCase()} and cannot be changed.`);
}

function timestamp(request: CapacityRequest | null, now: Date): string {
  if (!Number.isFinite(now.getTime())) throw new Error("A valid event date is required.");
  // Keep a chronology even if a tab has an old clock or the supplied demo time is earlier.
  const previous = request ? Date.parse(request.updatedAt) : -Infinity;
  return new Date(Math.max(now.getTime(), Number.isFinite(previous) ? previous : -Infinity)).toISOString();
}

function event(title: string, status: RequestStatus, actor: DemoPerspective, createdAt: string, description?: string): RequestTimelineEvent {
  return { id: crypto.randomUUID(), title, status, actor, createdAt, ...(description ? { description } : {}) };
}

function updated(request: CapacityRequest, changes: Partial<CapacityRequest>, timelineEvent: RequestTimelineEvent): CapacityRequest {
  return { ...request, ...changes, updatedAt: timelineEvent.createdAt, timeline: [...request.timeline, timelineEvent] };
}

export function createRequest(draft: RequestDraft, id: string, now = new Date(), providers?: readonly Capacity[]): CapacityRequest {
  assertValid(validateRequestDraft(draft, dateString(now), providers));
  if (!id.trim()) throw new Error("A request identifier is required.");
  const createdAt = timestamp(null, now);
  const message = draft.message.trim();
  const copy = structuredClone(draft);
  return {
    ...copy,
    buyerName: draft.buyerName.trim(), capability: draft.capability.trim(),
    quantity: draft.quantity as number, unit: draft.unit.trim(), description: draft.description.trim(), message,
    id, status: "pending_review", createdAt, updatedAt: createdAt, proposal: null,
    messages: message ? [{ id: crypto.randomUUID(), author: "buyer", body: message, createdAt }] : [],
    timeline: [event("Request Submitted", "pending_review", "buyer", createdAt)],
  };
}

export function transitionRequest(request: CapacityRequest, action: RequestAction, actor: DemoPerspective, details = "", now = new Date()): CapacityRequest {
  assertOpen(request, actor);
  const createdAt = timestamp(request, now);
  const note = details.trim();
  const allowed = (role: DemoPerspective, statuses: readonly RequestStatus[]) => {
    if (actor !== role) throw new Error(`Only the ${role} can perform this action.`);
    if (!statuses.includes(request.status)) throw new Error(`This action is not available while the request is ${statusLabels[request.status].toLowerCase()}.`);
  };
  switch (action) {
    case "start_review":
      allowed("provider", ["pending_review"]);
      return updated(request, { status: "provider_reviewing" }, event("Provider Reviewing", "provider_reviewing", actor, createdAt));
    case "start_negotiation":
      allowed("provider", ["pending_review", "provider_reviewing"]);
      return updated(request, { status: "negotiation" }, event("Negotiation Started", "negotiation", actor, createdAt));
    case "accept_request":
      allowed("provider", openStatuses);
      if (request.proposal) throw new Error("A production proposal is already under discussion. The buyer must accept the proposal.");
      return updated(request, { status: "accepted" }, event("Request Accepted", "accepted", actor, createdAt, "The provider accepted the original request terms."));
    case "reject_request":
      allowed("provider", openStatuses);
      if (!note) throw new Error("Enter a reason before rejecting the request.");
      return updated(request, { status: "rejected", rejectionReason: note }, event("Request Rejected", "rejected", actor, createdAt, note));
    case "accept_proposal":
      allowed("buyer", ["negotiation"]);
      if (!request.proposal || request.proposal.status !== "proposed") throw new Error("A current production proposal is required before acceptance.");
      return updated(request, { status: "accepted", proposal: { ...request.proposal, status: "accepted" }, revisionNotes: undefined }, event("Proposal Accepted", "accepted", actor, createdAt, "Production collaboration has been agreed."));
    case "request_revision":
      allowed("buyer", ["negotiation"]);
      if (!request.proposal || request.proposal.status !== "proposed") throw new Error("A current production proposal is required before requesting a revision.");
      if (!note) throw new Error("Describe the changes you need before requesting a revision.");
      return updated(request, {
        proposal: { ...request.proposal, status: "revision_requested" }, revisionNotes: note,
        messages: [...request.messages, { id: crypto.randomUUID(), author: actor, body: note, createdAt }],
      }, event("Proposal Revision Requested", "negotiation", actor, createdAt, note));
    case "start_collaboration":
      if (request.status !== "accepted") throw new Error("Accept the request or proposal before starting collaboration.");
      return updated(request, { status: "in_progress" }, event("Production Started", "in_progress", actor, createdAt));
    case "complete":
      allowed("provider", ["in_progress"]);
      return updated(request, { status: "completed" }, event("Production Completed", "completed", actor, createdAt, "Production collaboration completed successfully."));
    case "cancel":
      allowed("buyer", [...openStatuses, "accepted"]);
      return updated(request, { status: "cancelled" }, event("Request Cancelled", "cancelled", actor, createdAt, note || undefined));
    default:
      throw new Error("Unsupported request action.");
  }
}

export function addRequestMessage(request: CapacityRequest, body: string, actor: DemoPerspective, now = new Date()): CapacityRequest {
  assertOpen(request, actor);
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Enter a message before sending.");
  if (trimmed.length > 10000) throw new Error("Keep messages under 10,000 characters.");
  const createdAt = timestamp(request, now);
  return { ...request, updatedAt: createdAt, messages: [...request.messages, { id: crypto.randomUUID(), author: actor, body: trimmed, createdAt }] };
}

export function setRequestProposal(request: CapacityRequest, draft: ProposalDraft, actor: DemoPerspective, now = new Date()): CapacityRequest {
  assertOpen(request, actor);
  if (actor !== "provider") throw new Error("Only the provider can create a production proposal.");
  if (request.status !== "negotiation") throw new Error("Start negotiation before creating a production proposal.");
  assertValid(validateProposal(draft, dateString(now)));
  if (!fractionalUnits.includes(request.unit.toLowerCase().trim()) && !Number.isInteger(draft.quantity)) throw new Error("Enter a whole-number proposed quantity for this unit.");
  const createdAt = timestamp(request, now);
  const proposal = {
    ...draft, id: crypto.randomUUID(), notes: draft.notes.trim(),
    total: Math.round(draft.quantity * draft.unitPrice), status: "proposed" as const, createdAt,
  };
  return updated(request, { proposal, revisionNotes: undefined }, event(request.proposal ? "Revised Proposal Sent" : "Production Proposal Sent", "negotiation", actor, createdAt, proposal.notes || undefined));
}
