import { categories, locations, type Capacity, type Category, type Location } from "@/data/capacities";
import type { CapacityListing, ListingStatus } from "@/types/capacity-listing";
import type { DemandRequirement, SavedDemand } from "@/types/matching";
import type { CapacityRequest, ProviderProposal, RequestMessage, RequestTimelineEvent } from "@/types/requests";

export interface BusinessRow { id: string; name: string; description: string; business_type: string; primary_industry: string; location_city: string; location_province: string; verification_status: string; years_operating: number }
export interface ListingRow {
  id: string; business_id: string; title: string; category: string; description: string; location_city: string; location_province: string;
  total_capacity: number; available_capacity: number; capacity_unit: string; minimum_order: number; lead_time_days: number;
  estimated_price_min: number; estimated_price_max: number; pricing_unit: string; availability_status: string; listing_status: ListingStatus;
  supported_materials: string[]; machines_facilities: string[]; certifications: string[]; updated_at: string; businesses?: BusinessRow | null;
}
export interface DemandRow {
  id: string; business_id: string; title: string; category: string; capability: string; description: string; quantity: number | null; unit: string;
  demand_type: string; monthly_quantity: number | null; expected_duration_months: number | null; preferred_location: string;
  maximum_distance: number | null; required_completion_date: string | null; preferred_lead_time_days: number | null; urgency: string;
  budget_min: number | null; budget_max: number | null; budget_flexible: boolean; materials: string[]; required_certifications: string[];
  quality_requirements: string; technical_notes: string; status: SavedDemand["status"]; created_at: string; updated_at: string;
  match_history?: SavedDemand["matchHistory"];
}
export interface RequestRow {
  id: string; public_id: string; buyer_business_id: string; provider_business_id: string; capacity_listing_id: string; demand_id: string | null;
  requested_capability: string; category: string; quantity: number; unit: string; production_location: string; preferred_start_date: string | null; required_completion_date: string | null;
  preferred_lead_time_days: number | null; urgency: string; budget: number | null; budget_flexibility: string; materials: string[];
  product_description: string; technical_specifications: string; quality_requirements: string; certifications_required: string[];
  additional_notes: string; attachment_references: CapacityRequest["attachments"]; message: string; demand_type: string; duration_months: number | null;
  match_context: CapacityRequest["matchContext"] | null; rejection_reason: string | null; revision_notes: string | null;
  status: CapacityRequest["status"]; created_at: string; updated_at: string;
}
export interface MessageRow { id: string; request_id: string; sender_business_id: string; message: string; created_at: string }
export interface ProposalRow { id: string; request_id: string; quantity: number; unit_price: number; estimated_total: number; production_start_date: string; estimated_completion_date: string; lead_time_days: number; provider_notes: string; status: string; created_at: string }
export interface TimelineRow { id: string; request_id: string; event_type: string; title: string; description: string; created_by: string | null; created_at: string }

const city = (value: string): Location | null => locations.includes(value as Location) ? value as Location : null;
const category = (value: string): Category | null => categories.includes(value as Category) ? value as Category : null;
const availabilityDays = (value: string) => ({ available_now: 0, within_7_days: 7, within_14_days: 14, within_30_days: 30, unavailable: 365 }[value] ?? 0);

export function listingToCapacity(row: ListingRow): Capacity | null {
  const location = city(row.location_city), group = category(row.category);
  if (!location || !group || !Number.isFinite(Number(row.total_capacity)) || Number(row.total_capacity) <= 0) return null;
  const business = row.businesses;
  return {
    id: row.id, companyId: row.business_id, listingStatus: row.listing_status,
    name: business?.name || "Business provider", capability: row.title, category: group, location,
    province: row.location_province || business?.location_province || "Indonesia", description: row.description,
    about: business?.description || row.description, availableCapacity: Number(row.available_capacity), maximumCapacity: Number(row.total_capacity),
    capacityUnit: row.capacity_unit, capacityPeriod: row.capacity_unit === "pallet spaces" ? "" : "/month", minimumOrder: Number(row.minimum_order), minimumOrderUnit: row.capacity_unit,
    leadTimeDays: row.lead_time_days, availabilityDays: availabilityDays(row.availability_status),
    size: Number(row.total_capacity) >= 20000 ? "Large" : Number(row.total_capacity) >= 3000 ? "Medium" : "Small",
    verified: business?.verification_status === "verified", ranking: 0,
    priceFrom: Number(row.estimated_price_min), priceTo: Number(row.estimated_price_max), priceUnit: row.pricing_unit,
    capabilities: [row.title], facilities: row.machines_facilities || [], materials: row.supported_materials || [],
    schedule: "Contact provider for schedule", certifications: row.certifications || [], businessType: business?.business_type || "Production partner",
    yearsOperating: business?.years_operating || 0, clientType: "Business clients", industry: business?.primary_industry || group,
    responseTime: "Contact provider",
  };
}

export function listingToManaged(row: ListingRow): CapacityListing | null {
  const location = city(row.location_city), group = category(row.category);
  if (!location || !group) return null;
  return { id: row.id, providerId: row.business_id, capability: row.title, category: group, description: row.description,
    location, maximumCapacity: Number(row.total_capacity), availableCapacity: Number(row.available_capacity), capacityUnit: row.capacity_unit,
    minimumOrder: Number(row.minimum_order), leadTimeDays: row.lead_time_days, priceFrom: Number(row.estimated_price_min), priceTo: Number(row.estimated_price_max),
    materials: row.supported_materials || [], facilities: row.machines_facilities || [], certifications: row.certifications || [],
    status: row.listing_status, availabilityDays: availabilityDays(row.availability_status), updatedAt: row.updated_at };
}

export function demandToSaved(row: DemandRow): SavedDemand | null {
  const group = category(row.category);
  if (!group) return null;
  const requirement: DemandRequirement = { category: group, capability: row.capability, description: row.description, quantity: row.quantity ? Number(row.quantity) : null,
    unit: row.unit as DemandRequirement["unit"], demandType: row.demand_type as DemandRequirement["demandType"], monthlyQuantity: row.monthly_quantity ? Number(row.monthly_quantity) : null,
    durationMonths: row.expected_duration_months, location: city(row.preferred_location) ?? "any", maxDistanceKm: row.maximum_distance,
    completionDate: row.required_completion_date ?? "", maxLeadTimeDays: row.preferred_lead_time_days, urgency: row.urgency as DemandRequirement["urgency"],
    budgetMin: row.budget_min !== null ? Number(row.budget_min) : null, budgetMax: row.budget_max !== null ? Number(row.budget_max) : null, budgetFlexible: row.budget_flexible,
    materials: row.materials || [], certifications: row.required_certifications || [], qualityRequirements: row.quality_requirements, technicalNotes: row.technical_notes };
  const history = row.match_history;
  const matchHistory = history && [history.evaluated, history.bestScore, history.strongMatches].every((value) => Number.isFinite(value) && value >= 0) && history.bestScore <= 100 && history.strongMatches <= history.evaluated && Number.isFinite(Date.parse(history.updatedAt)) ? history : null;
  return { id: row.id, name: row.title, status: row.status, requirement, createdAt: row.created_at, updatedAt: row.updated_at, matchHistory };
}

export function requestToView(row: RequestRow, names: Map<string,string>, messages: MessageRow[], proposals: ProposalRow[], timeline: TimelineRow[]): CapacityRequest | null {
  const group = category(row.category);
  if (!group) return null;
  const latest = proposals.filter((item) => item.request_id === row.id && item.status !== "withdrawn").sort((a,b) => Date.parse(b.created_at)-Date.parse(a.created_at))[0];
  const proposal: ProviderProposal | null = latest ? { id: latest.id, quantity: Number(latest.quantity), unitPrice: Number(latest.unit_price), total: Number(latest.estimated_total),
    startDate: latest.production_start_date, completionDate: latest.estimated_completion_date, leadTimeDays: latest.lead_time_days, notes: latest.provider_notes,
    status: latest.status === "accepted" ? "accepted" : latest.status === "revision_requested" ? "revision_requested" : "proposed", createdAt: latest.created_at } : null;
  const mappedMessages: RequestMessage[] = messages.filter((item) => item.request_id === row.id).map((item) => ({ id: item.id, author: item.sender_business_id === row.buyer_business_id ? "buyer" : "provider", body: item.message, createdAt: item.created_at }));
  const mappedTimeline: RequestTimelineEvent[] = timeline.filter((item) => item.request_id === row.id).map((item) => ({ id: item.id, title: item.title, description: item.description, createdAt: item.created_at,
    status: ({ request_submitted: "pending_review", start_review: "provider_reviewing", start_negotiation: "negotiation", proposal_sent: "negotiation", accept_proposal: "accepted", accept_request: "accepted", request_revision: "negotiation", start_collaboration: "in_progress", complete: "completed", reject_request: "rejected", cancel: "cancelled" } as Record<string,CapacityRequest["status"]>)[item.event_type] || row.status,
    actor: ["start_review","start_negotiation","proposal_sent","accept_request","complete","reject_request"].includes(item.event_type) ? "provider" : "buyer" }));
  return { id: row.public_id, providerId: row.capacity_listing_id, buyerBusinessId: row.buyer_business_id, providerBusinessId: row.provider_business_id,
    buyerName: names.get(row.buyer_business_id) || "Business buyer", capability: row.requested_capability, category: group,
    quantity: Number(row.quantity), unit: row.unit, location: city(row.production_location) ?? "any", preferredStartDate: row.preferred_start_date || "", requiredCompletionDate: row.required_completion_date || "",
    preferredLeadTimeDays: row.preferred_lead_time_days, urgency: row.urgency as CapacityRequest["urgency"], budget: row.budget ? Number(row.budget) : null,
    budgetFlexibility: row.budget_flexibility as CapacityRequest["budgetFlexibility"], materials: row.materials || [], description: row.product_description,
    technicalRequirements: row.technical_specifications, qualityRequirements: row.quality_requirements, certifications: row.certifications_required || [],
    additionalNotes: row.additional_notes, attachments: Array.isArray(row.attachment_references) ? row.attachment_references : [], message: row.message,
    demandType: row.demand_type as CapacityRequest["demandType"], durationMonths: row.duration_months, matchContext: row.match_context ?? undefined,
    status: row.status, createdAt: row.created_at, updatedAt: row.updated_at, messages: mappedMessages, timeline: mappedTimeline, proposal,
    rejectionReason: row.rejection_reason || undefined, revisionNotes: row.revision_notes || undefined };
}
