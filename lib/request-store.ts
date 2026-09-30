"use client";

import { useSyncExternalStore } from "react";
import { categories } from "@/data/capacities";
import { demoRequests } from "@/data/requests";
import type { CapacityRequest, DemoPerspective, ProposalDraft, RequestDraft } from "@/types/requests";
import { addRequestMessage, createRequest, setRequestProposal, statusLabels, transitionRequest, validateProposal } from "./request-rules";
import { restoreMatchContext } from "./match-context";
import { getCatalogSnapshot } from "./capacity-store";

const STORAGE_KEY = "capacity-requests-v1";
type State = { ready: boolean; requests: CapacityRequest[]; perspective: DemoPerspective; sessionOnly: boolean };
const initial: State = { ready: false, requests: [], perspective: "buyer", sessionOnly: false };
let state = initial;
const listeners = new Set<() => void>();
type Action = Parameters<typeof transitionRequest>[1];
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const isNumber = (value: unknown) => typeof value === "number" && Number.isFinite(value);
const isDate = (value: unknown) => typeof value === "string" && Number.isFinite(new Date(value).getTime());

function restoreRequest(value: unknown): CapacityRequest | null {
  if (!isRecord(value)) return null;
  const strings = ["id", "providerId", "buyerName", "capability", "category", "unit", "location", "preferredStartDate", "requiredCompletionDate", "urgency", "budgetFlexibility", "description", "technicalRequirements", "qualityRequirements", "additionalNotes", "message", "demandType"];
  if (strings.some((key) => typeof value[key] !== "string")) return null;
  if (!getCatalogSnapshot().some((provider) => provider.id === value.providerId) || !categories.includes(value.category as CapacityRequest["category"]) || !Object.hasOwn(statusLabels, String(value.status))) return null;
  if (!isNumber(value.quantity) || (value.quantity as number) <= 0 || !isDate(value.createdAt) || !isDate(value.updatedAt)) return null;
  for (const key of ["budget", "preferredLeadTimeDays", "durationMonths"]) if (value[key] !== null && !isNumber(value[key])) return null;
  for (const key of ["materials", "certifications"]) if (!Array.isArray(value[key]) || (value[key] as unknown[]).some((item) => typeof item !== "string")) return null;
  if (!Array.isArray(value.attachments) || value.attachments.some((item) => !isRecord(item) || typeof item.id !== "string" || typeof item.name !== "string" || !["PDF", "Drawing", "CAD File", "Image", "Document"].includes(String(item.type)))) return null;
  if (!Array.isArray(value.messages) || value.messages.some((item) => !isRecord(item) || typeof item.id !== "string" || typeof item.body !== "string" || !["buyer", "provider"].includes(String(item.author)) || !isDate(item.createdAt))) return null;
  if (!Array.isArray(value.timeline) || value.timeline.some((item) => !isRecord(item) || typeof item.id !== "string" || typeof item.title !== "string" || !Object.hasOwn(statusLabels, String(item.status)) || !["buyer", "provider"].includes(String(item.actor)) || !isDate(item.createdAt))) return null;
  for (const key of ["rejectionReason", "revisionNotes"]) if (value[key] !== undefined && typeof value[key] !== "string") return null;
  if (value.proposal !== null) {
    const proposal = value.proposal;
    if (!isRecord(proposal) || typeof proposal.id !== "string" || typeof proposal.notes !== "string" || !["proposed", "revision_requested", "accepted"].includes(String(proposal.status)) || !isDate(proposal.startDate) || !isDate(proposal.completionDate) || !isDate(proposal.createdAt) || ["quantity", "unitPrice", "total", "leadTimeDays"].some((key) => !isNumber(proposal[key]))) return null;
    const terms: ProposalDraft = { quantity: Number(proposal.quantity), unitPrice: Number(proposal.unitPrice), startDate: String(proposal.startDate), completionDate: String(proposal.completionDate), leadTimeDays: Number(proposal.leadTimeDays), notes: proposal.notes };
    if (Object.keys(validateProposal(terms, "0000-01-01")).length || Math.abs(Number(proposal.total) - terms.quantity * terms.unitPrice) > 0.01) return null;
  }
  return { ...value, matchContext: restoreMatchContext(value.matchContext) } as unknown as CapacityRequest;
}

function hydrate() {
  if (state.ready) return;
  let requests = demoRequests;
  let perspective: DemoPerspective = "buyer";
  let sessionOnly = false;
  let seeded = false;
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (isRecord(value)) {
      if (Array.isArray(value.requests)) requests = value.requests.map(restoreRequest).filter((item): item is CapacityRequest => item !== null);
      if (value.perspective === "provider") perspective = "provider";
    } else seeded = true;
  } catch { sessionOnly = true; }
  state = { ready: true, requests, perspective, sessionOnly };
  if (seeded) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ requests, perspective })); } catch { state = { ...state, sessionOnly: true }; }
  }
}

function publish(values: Partial<State>) {
  hydrate();
  state = { ...state, ...values };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ requests: state.requests, perspective: state.perspective })); } catch { state = { ...state, sessionOnly: true }; }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  hydrate();
  return () => { listeners.delete(listener); };
}

function updateRequest(id: string, transform: (request: CapacityRequest) => CapacityRequest) {
  hydrate();
  const current = state.requests.find((request) => request.id === id);
  if (!current) throw new Error("This request could not be found.");
  const updated = transform(current);
  publish({ requests: state.requests.map((request) => request.id === id ? updated : request) });
  return updated;
}

function create(draft: RequestDraft) {
  hydrate();
  const year = new Date().getFullYear();
  const highest = state.requests.reduce((highest, request) => {
    const match = request.id.match(new RegExp(`^REQ-${year}-(\\d+)$`));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 100);
  const id = `REQ-${year}-${String(highest + 1).padStart(5, "0")}`;
  const request = createRequest(draft, id, new Date(), getCatalogSnapshot());
  publish({ requests: [request, ...state.requests], perspective: "buyer" });
  return request;
}

const setPerspective = (perspective: DemoPerspective) => publish({ perspective });
const actOnRequest = (id: string, action: Action, details?: string) => updateRequest(id, (request) => transitionRequest(request, action, state.perspective, details));
const sendMessage = (id: string, body: string) => updateRequest(id, (request) => addRequestMessage(request, body, state.perspective));
const saveProposal = (id: string, proposal: ProposalDraft) => updateRequest(id, (request) => setRequestProposal(request, proposal, state.perspective));

export function resetDemoRequests() {
  publish({ requests: demoRequests, perspective: "buyer", sessionOnly: false });
}

export function useRequestState() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => initial);
  return { ...snapshot, setPerspective, create, actOnRequest, sendMessage, saveProposal };
}
