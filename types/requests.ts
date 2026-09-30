import type { Category, Location } from "../data/capacities";
import type { MatchBreakdown, MatchClassification, MatchCriterion } from "./matching";

export type RequestStatus =
  | "pending_review"
  | "provider_reviewing"
  | "negotiation"
  | "accepted"
  | "rejected"
  | "in_progress"
  | "completed"
  | "cancelled";

export type DemoPerspective = "buyer" | "provider";
export interface RequestAttachment {
  id: string;
  name: string;
  type: "PDF" | "Drawing" | "CAD File" | "Image" | "Document";
}

export interface RequestMatchContext {
  score: number;
  classification: MatchClassification;
  breakdown: MatchBreakdown;
  explanations: Record<MatchCriterion, string>;
}

export interface RequestDraft {
  providerId: string;
  buyerName: string;
  capability: string;
  category: Category;
  quantity: number | null;
  unit: string;
  location: Location | "any";
  preferredStartDate: string;
  requiredCompletionDate: string;
  preferredLeadTimeDays: number | null;
  urgency: "standard" | "priority" | "urgent";
  budget: number | null;
  budgetFlexibility: "fixed" | "slightly_flexible" | "flexible";
  materials: string[];
  description: string;
  technicalRequirements: string;
  qualityRequirements: string;
  certifications: string[];
  additionalNotes: string;
  attachments: RequestAttachment[];
  message: string;
  demandType: "one-time" | "recurring";
  durationMonths: number | null;
  matchContext?: RequestMatchContext;
}

export interface RequestMessage {
  id: string;
  author: DemoPerspective;
  body: string;
  createdAt: string;
}

export interface RequestTimelineEvent {
  id: string;
  title: string;
  status: RequestStatus;
  createdAt: string;
  actor: DemoPerspective;
  description?: string;
}

export interface ProviderProposal {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  startDate: string;
  completionDate: string;
  leadTimeDays: number;
  notes: string;
  status: "proposed" | "revision_requested" | "accepted";
  createdAt: string;
}

export type ProposalDraft = Pick<ProviderProposal,
  "quantity" | "unitPrice" | "startDate" | "completionDate" | "leadTimeDays" | "notes"
>;

export interface CapacityRequest extends Omit<RequestDraft, "quantity"> {
  quantity: number;
  id: string;
  buyerBusinessId?: string;
  providerBusinessId?: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  messages: RequestMessage[];
  timeline: RequestTimelineEvent[];
  proposal: ProviderProposal | null;
  rejectionReason?: string;
  revisionNotes?: string;
}

export type RequestAction =
  | "start_review"
  | "start_negotiation"
  | "accept_request"
  | "reject_request"
  | "accept_proposal"
  | "request_revision"
  | "start_collaboration"
  | "complete"
  | "cancel";
