import type { Capacity, Category, Location } from "@/data/capacities";

export type DemandUnit = "units" | "pcs" | "packages" | "kg" | "tons" | "pallet spaces" | "production hours";
export interface DemandRequirement {
  category: Category | "";
  capability: string;
  description: string;
  quantity: number | null;
  unit: DemandUnit;
  demandType: "one-time" | "recurring";
  monthlyQuantity: number | null;
  durationMonths: number | null;
  location: Location | "any";
  maxDistanceKm: number | null;
  completionDate: string;
  maxLeadTimeDays: number | null;
  urgency: "standard" | "priority" | "urgent";
  budgetMin: number | null;
  budgetMax: number | null;
  budgetFlexible: boolean;
  materials: string[];
  certifications: string[];
  qualityRequirements: string;
  technicalNotes: string;
}

export type MatchCriterion = "capability" | "capacity" | "location" | "availability" | "leadTime" | "cost";
export type MatchBreakdown = Record<MatchCriterion, number> & { total: number };
export type MatchClassification = "Strong Match" | "Good Match" | "Potential Match" | "Limited Match";
export interface MatchResult {
  provider: Capacity;
  score: number;
  classification: MatchClassification;
  breakdown: MatchBreakdown;
  reasons: string[];
  warnings: string[];
  explanations: Record<MatchCriterion, string>;
  estimatedCost: { min: number; max: number; basis: string } | null;
}

export interface SelectedCapacityRequest {
  providerId: string;
  demand: DemandRequirement;
  createdAt: string;
  matchContext?: Pick<MatchResult, "score" | "classification" | "breakdown" | "explanations">;
}

export interface SavedDemand {
  id: string;
  name: string;
  status: "draft" | "matching" | "open" | "fulfilled" | "closed";
  requirement: DemandRequirement;
  createdAt: string;
  updatedAt: string;
  matchHistory: { evaluated: number; bestScore: number; strongMatches: number; updatedAt: string } | null;
}
