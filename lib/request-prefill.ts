import type { Capacity } from "@/data/capacities";
import type { DemandRequirement } from "@/types/matching";
import type { RequestDraft, RequestMatchContext } from "@/types/requests";
import { DEMO_BUYER_NAME } from "./demo-identity";

/** Carry the submitted requirement and its existing analysis forward without rescoring. */
export function createRequestDraft(provider: Capacity, demand?: DemandRequirement, matchContext?: RequestMatchContext): RequestDraft {
  return {
    providerId: provider.id, buyerName: DEMO_BUYER_NAME, category: provider.category,
    capability: demand?.capability || "", quantity: demand ? (demand.demandType === "recurring" ? demand.monthlyQuantity : demand.quantity) : null,
    unit: demand?.unit || (provider.capacityUnit === "parts" || provider.capacityUnit === "prints" ? "units" : provider.capacityUnit === "packs" ? "packages" : provider.capacityUnit),
    location: demand?.location || "any", preferredStartDate: "", requiredCompletionDate: demand?.completionDate || "",
    preferredLeadTimeDays: demand?.maxLeadTimeDays ?? null, urgency: demand?.urgency || "standard",
    budget: demand?.budgetMax ?? null, budgetFlexibility: demand?.budgetFlexible ? "flexible" : "fixed",
    materials: [...(demand?.materials || [])], description: demand?.description || "", technicalRequirements: demand?.technicalNotes || "",
    qualityRequirements: demand?.qualityRequirements || "", certifications: [...(demand?.certifications || [])], additionalNotes: "", attachments: [], message: "",
    demandType: demand?.demandType || "one-time", durationMonths: demand?.durationMonths ?? null, matchContext,
  };
}
