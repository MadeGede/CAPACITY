import { capacities, type Capacity, type Location } from "../data/capacities";
import type { DemandRequirement, MatchResult, MatchBreakdown, MatchCriterion } from "../types/matching";
import { formatPrice } from "./capacity-format";

export const MATCH_WEIGHTS: Record<MatchCriterion, number> = {
  capability: 0.3,
  capacity: 0.2,
  location: 0.15,
  availability: 0.15,
  leadTime: 0.1,
  cost: 0.1,
};

const DAY_MS = 86_400_000;
const MONTH_DAYS = 30;
const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const normalize = (value: string) => value.toLowerCase().trim().replace(/\s+/g, " ");
const display = (value: number) => numberFormat.format(value);
const score = (value: number) => Number.isFinite(value) ? Math.round(Math.min(100, Math.max(0, value))) : 0;
const positive = (value: number | null | undefined): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

// These are explicit editorial relationships, not text similarity or an AI model.
// A shared category alone is not evidence that a specific process is supported.
const relatedCapabilities: Record<string, readonly string[]> = {
  "cnc milling": ["3-axis milling", "cnc machining", "precision turning & milling"],
  "cnc turning": ["precision turning & milling", "cnc machining", "shaft production"],
  "metal cutting": ["precision cutting", "thread cutting", "cnc milling", "cnc turning"],
  "precision components": ["metal component production", "cnc machining", "precision turning & milling", "tooling & cnc components"],
  "plastic components": ["injection molding", "technical plastic parts", "plastic component molding"],
  "pet production": ["thermoforming", "thermoformed plastic trays"],
  "plastic packaging": ["thermoforming", "protective trays", "packaging inserts", "thermoformed plastic trays"],
  "custom packaging": ["custom product packaging", "folding cartons", "paper boxes", "corrugated packaging"],
  "box production": ["shipping cartons", "die-cut boxes", "folding cartons", "paper boxes"],
  "flexible packaging": ["pouch filling", "pouch packing"],
  "product labeling": ["product labels", "inventory labeling", "digital printing & labels"],
  "fabric cutting": ["cut & sew", "small-batch sewing", "garment production", "workwear production"],
  embroidery: ["logo embroidery"],
  "uniform manufacturing": ["uniform production", "corporate uniforms", "workwear production"],
  "garment production": ["cut & sew", "small-batch sewing", "casualwear production", "workwear production"],
  "fdm printing": ["engineering fdm printing", "industrial 3d printing"],
  "sla printing": ["resin printing", "prototype & resin printing"],
  "resin printing": ["sla printing"],
  "functional prototyping": ["fit-check prototypes", "production fixtures", "prototype enclosures"],
  "mechanical assembly": ["enclosure integration", "mechanical product assembly"],
  "hardware kitting": ["light kitting"],
  "pallet storage": ["industrial storage", "flexible pallet storage", "warehouse capacity"],
  "industrial storage": ["pallet storage", "flexible pallet storage", "warehouse capacity"],
  "inventory handling": ["pallet handling", "stock reconciliation", "dispatch preparation"],
  "cross-docking": ["scheduled dispatch", "dispatch preparation"],
};

// Approximate regional relationships only; these scores do not imply road distances.
const locationRelationships: Record<Location, Record<Location, number>> = {
  Jakarta: { Jakarta: 100, Bekasi: 80, Tangerang: 80, Bandung: 65, Surabaya: 35, Semarang: 50, Yogyakarta: 40 },
  Bekasi: { Jakarta: 80, Bekasi: 100, Tangerang: 80, Bandung: 65, Surabaya: 40, Semarang: 55, Yogyakarta: 45 },
  Tangerang: { Jakarta: 80, Bekasi: 80, Tangerang: 100, Bandung: 60, Surabaya: 35, Semarang: 50, Yogyakarta: 40 },
  Bandung: { Jakarta: 65, Bekasi: 65, Tangerang: 60, Bandung: 100, Surabaya: 45, Semarang: 60, Yogyakarta: 55 },
  Surabaya: { Jakarta: 35, Bekasi: 40, Tangerang: 35, Bandung: 45, Surabaya: 100, Semarang: 65, Yogyakarta: 60 },
  Semarang: { Jakarta: 50, Bekasi: 55, Tangerang: 50, Bandung: 60, Surabaya: 65, Semarang: 100, Yogyakarta: 80 },
  Yogyakarta: { Jakarta: 40, Bekasi: 45, Tangerang: 40, Bandung: 55, Surabaya: 60, Semarang: 80, Yogyakarta: 100 },
};

type Unit = { dimension: "count" | "package" | "mass" | "space" | "time"; scale: number };
function unitDefinition(value: string): Unit | null {
  const unit = normalize(value).split("/")[0].trim();
  if (["unit", "units", "pc", "pcs", "piece", "pieces", "part", "parts", "print", "prints"].includes(unit)) return { dimension: "count", scale: 1 };
  if (["package", "packages", "pack", "packs"].includes(unit)) return { dimension: "package", scale: 1 };
  if (["kg", "kilogram", "kilograms"].includes(unit)) return { dimension: "mass", scale: 1 };
  if (["ton", "tons", "tonne", "tonnes"].includes(unit)) return { dimension: "mass", scale: 1000 };
  if (["pallet", "pallets", "pallet space", "pallet spaces"].includes(unit)) return { dimension: "space", scale: 1 };
  if (["hour", "hours", "production hour", "production hours"].includes(unit)) return { dimension: "time", scale: 1 };
  return null;
}

function convertQuantity(quantity: number | null, from: string, to: string): number | null {
  if (!positive(quantity)) return null;
  const source = unitDefinition(from);
  const destination = unitDefinition(to);
  if (!source || !destination || source.dimension !== destination.dimension) return null;
  const converted = quantity * source.scale / destination.scale;
  return Number.isFinite(converted) ? converted : null;
}

function requestedQuantity(demand: DemandRequirement): number | null {
  return demand.demandType === "recurring" ? demand.monthlyQuantity : demand.quantity;
}

function daysUntilCompletion(demand: DemandRequirement, now: Date): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(demand.completionDate) || !Number.isFinite(now.getTime())) return null;
  const [year, month, day] = demand.completionDate.split("-").map(Number);
  const deadline = new Date(Date.UTC(year, month - 1, day));
  if (deadline.getUTCFullYear() !== year || deadline.getUTCMonth() !== month - 1 || deadline.getUTCDate() !== day) return null;
  const today = Date.UTC(now.getFullYear(), now.getMonth() , now.getDate());
  return Math.round((deadline.getTime() - today) / DAY_MS);
}

function isMonthlyProduction(provider: Capacity) {
  return provider.capacityPeriod === "/month" && unitDefinition(provider.capacityUnit)?.dimension !== "space";
}

export function calculateCapabilityScore(provider: Capacity, demand: DemandRequirement): number {
  const requested = normalize(demand.capability);
  const offered = [provider.capability, ...provider.capabilities].map(normalize);
  if (requested && offered.includes(requested)) return 100;
  if (requested && relatedCapabilities[requested]?.some((related) => offered.includes(related))) return 80;
  return demand.category && provider.category === demand.category ? 50 : 0;
}

type CapacityAssessment = { requested: number | null; available: number; prorated: boolean; days: number | null; score: number };
function assessCapacity(provider: Capacity, demand: DemandRequirement, now: Date): CapacityAssessment {
  const requested = convertQuantity(requestedQuantity(demand), demand.unit, provider.capacityUnit);
  const days = daysUntilCompletion(demand, now);
  const prorated = isMonthlyProduction(provider) && demand.demandType === "one-time";
  // Monthly capacity is not a promise that a full month's output fits a shorter
  // deadline. Use a disclosed linear throughput assumption, never multiple months.
  const productionDays = days === null ? MONTH_DAYS : Math.min(MONTH_DAYS, Math.max(0, days - Math.max(0, provider.availabilityDays)));
  const available = Math.max(0, provider.availableCapacity) * (prorated ? productionDays / MONTH_DAYS : 1);
  const ratio = requested === null ? 0 : available / requested;
  let capacityScore = 0;
  if (requested !== null && calculateCapabilityScore(provider, demand) > 0) {
    if (ratio >= 1) capacityScore = 100;
    // A near-fit is distinct from both full coverage and a material shortfall.
    else if (ratio >= 0.9) capacityScore = 90;
    else if (ratio >= 0.8) capacityScore = 80;
    else if (ratio >= 0.6) capacityScore = 60;
    else if (ratio >= 0.5) capacityScore = 50;
    else capacityScore = Math.floor(Math.max(0, ratio) * 80);
  }
  return { requested, available, prorated, days, score: score(capacityScore) };
}

export function calculateCapacityScore(provider: Capacity, demand: DemandRequirement, now = new Date()): number {
  return assessCapacity(provider, demand, now).score;
}

export function calculateLocationScore(provider: Capacity, demand: DemandRequirement): number {
  return demand.location === "any" ? 100 : locationRelationships[demand.location]?.[provider.location] ?? 0;
}

export function calculateAvailabilityScore(provider: Capacity): number {
  const days = provider.availabilityDays;
  if (!Number.isFinite(days) || days < 0) return 20;
  if (days === 0) return 100;
  if (days <= 7) return 90;
  if (days <= 14) return 75;
  if (days <= 30) return 55;
  return 20;
}

export function calculateLeadTimeScore(provider: Capacity, demand: DemandRequirement, now = new Date()): number {
  const lead = provider.leadTimeDays;
  if (!Number.isFinite(lead) || lead < 0) return 0;
  let preferenceScore = 100;
  if (positive(demand.maxLeadTimeDays) && lead > demand.maxLeadTimeDays) {
    const ratio = lead / demand.maxLeadTimeDays;
    preferenceScore = ratio <= 1.5 ? 70 : ratio <= 2 ? 50 : 30;
  }
  const remaining = daysUntilCompletion(demand, now);
  if (remaining === null) return preferenceScore;
  if (remaining < 0) return 0;
  const earliest = Math.max(0, provider.availabilityDays) + lead;
  if (earliest <= remaining) return preferenceScore;
  return Math.min(preferenceScore, earliest - remaining <= 7 ? 40 : 20);
}

function estimateCost(provider: Capacity, demand: DemandRequirement): MatchResult["estimatedCost"] {
  if (calculateCapabilityScore(provider, demand) === 0) return null;
  // Both output and pricing units must describe the requested quantity. A cheap
  // per-part rate must not be compared to a demand measured in kilograms or hours.
  if (convertQuantity(requestedQuantity(demand), demand.unit, provider.capacityUnit) === null) return null;
  const quantity = convertQuantity(requestedQuantity(demand), demand.unit, provider.priceUnit);
  if (quantity === null || !positive(provider.priceFrom) || !positive(provider.priceTo) || provider.priceTo < provider.priceFrom) return null;
  const minimum = convertQuantity(provider.minimumOrder, provider.minimumOrderUnit, provider.priceUnit) ?? 0;
  const billableQuantity = Math.max(quantity, minimum);
  const min = billableQuantity * provider.priceFrom;
  const max = billableQuantity * provider.priceTo;
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  const monthlyPrice = normalize(provider.priceUnit).endsWith("/month");
  const period = demand.demandType === "recurring" ? "per month" : monthlyPrice ? "for one month of storage" : "for this order";
  const unit = provider.priceUnit.split("/")[0];
  const minimumNote = minimum > quantity ? "; based on the provider minimum order" : "";
  return { min, max, basis: `${display(billableQuantity)} ${unit}${billableQuantity === 1 ? "" : "s"} ${period}${minimumNote}` };
}

export function calculateCostScore(provider: Capacity, demand: DemandRequirement): number {
  const estimate = estimateCost(provider, demand);
  if (!estimate) return 0;
  if (demand.budgetFlexible || !positive(demand.budgetMax)) return 80;
  // The upper estimate is conservative. A range crossing the budget is disclosed
  // rather than described as a confirmed fit based only on its lowest quote.
  const ratio = estimate.max / demand.budgetMax;
  if (ratio <= 1) return 100;
  if (ratio <= 1.15) return 85;
  if (ratio <= 1.3) return 70;
  if (ratio <= 1.75) return 50;
  return 30;
}

const materialAliases: Record<string, readonly string[]> = {
  pp: ["polypropylene", "polypropylene sheet"],
  pet: ["pet sheet"],
  steel: ["mild steel", "carbon steel", "tool steel", "stainless steel"],
  cardboard: ["corrugated board", "single-wall corrugated board", "double-wall corrugated board", "art carton", "recycled paperboard"],
  cotton: ["cotton jersey", "lightweight cotton", "poly-cotton"],
  polyester: ["polyester blends", "poly-cotton"],
};

function materialSupported(material: string, provider: Capacity) {
  const requested = normalize(material);
  const supported = provider.materials.map(normalize);
  return supported.includes(requested) || materialAliases[requested]?.some((alias) => supported.includes(alias)) || false;
}

export function calculateMatchScore(provider: Capacity, demand: DemandRequirement, now = new Date()): MatchResult {
  const capacity = assessCapacity(provider, demand, now);
  const breakdown: MatchBreakdown = {
    capability: calculateCapabilityScore(provider, demand),
    capacity: capacity.score,
    location: calculateLocationScore(provider, demand),
    availability: calculateAvailabilityScore(provider),
    leadTime: calculateLeadTimeScore(provider, demand, now),
    cost: calculateCostScore(provider, demand),
    total: 0,
  };
  const criteria = Object.keys(MATCH_WEIGHTS) as MatchCriterion[];
  criteria.forEach((criterion) => { breakdown[criterion] = score(breakdown[criterion]); });
  breakdown.total = score(criteria.reduce((total, criterion) => total + breakdown[criterion] * MATCH_WEIGHTS[criterion], 0));
  const estimatedCost = estimateCost(provider, demand);
  const reasons: string[] = [];
  const warnings: string[] = [];
  const explanations = {} as Record<MatchCriterion, string>;

  if (breakdown.capability === 100) {
    explanations.capability = `“${demand.capability}” is explicitly listed in this provider's capabilities.`;
    reasons.push("Your requested capability is listed by this provider.");
  } else if (breakdown.capability === 80) {
    explanations.capability = `An explicitly related capability is listed; confirm the exact ${demand.capability} process before proceeding.`;
    reasons.push("The provider offers a related production capability.");
    warnings.push("Related capability only: confirm the exact process and specifications with the provider.");
  } else if (breakdown.capability === 50) {
    explanations.capability = `The ${demand.category} category matches, but the requested capability is not listed.`;
    warnings.push(`Category match only: ${demand.capability || "the requested capability"} is not confirmed in this profile.`);
  } else {
    explanations.capability = "No exact capability, explicit related process, or category match was found.";
    warnings.push("This provider does not list a suitable capability for your requirement.");
  }

  const cadence = demand.demandType === "recurring" ? "each month" : "for this order";
  if (breakdown.capability === 0) {
    explanations.capacity = "Capacity is not treated as usable because the provider's capability is unrelated.";
  } else if (capacity.requested === null) {
    explanations.capacity = `Demand is in ${demand.unit}; capacity is listed in ${provider.capacityUnit}. These units cannot be converted reliably.`;
    warnings.push("Capacity units are incompatible; a provider-specific conversion or revised unit is required.");
  } else {
    explanations.capacity = `${display(capacity.requested)} ${provider.capacityUnit} requested ${cadence}; ${display(capacity.available)} ${provider.capacityUnit} estimated available${capacity.prorated ? " within the planning window" : provider.capacityPeriod ? provider.capacityPeriod : ""}.`;
    if (capacity.prorated) {
      explanations.capacity += " Monthly output is prorated over a 30-day month after availability begins, capped at one month; the provider must confirm actual scheduling.";
    }
    if (breakdown.capacity === 100 && breakdown.capability >= 80) {
      reasons.push(demand.demandType === "recurring" ? "Listed monthly capacity covers your monthly requirement." : "Estimated available capacity covers your requested quantity.");
    } else if (breakdown.capacity < 100) {
      warnings.push(`Estimated available capacity is below the ${display(capacity.requested)} ${provider.capacityUnit} requested ${cadence}.`);
    }
  }
  if (demand.demandType === "recurring") {
    warnings.push(`Monthly capacity is a current snapshot; availability across the ${positive(demand.durationMonths) ? `${display(demand.durationMonths)}-month` : "full"} commitment requires confirmation.`);
  }
  const quantityInMinimumUnit = convertQuantity(requestedQuantity(demand), demand.unit, provider.minimumOrderUnit);
  if (breakdown.capability > 0 && quantityInMinimumUnit !== null && quantityInMinimumUnit < provider.minimumOrder) {
    warnings.push(`Your quantity is below the minimum order of ${display(provider.minimumOrder)} ${provider.minimumOrderUnit}; the cost estimate uses that minimum.`);
  }

  if (demand.location === "any") {
    explanations.location = "Any location was selected, so every provider receives the full location score.";
  } else if (breakdown.location === 100) {
    explanations.location = `The provider is in your preferred city, ${demand.location}.`;
    reasons.push("The provider is in your preferred city.");
  } else if (breakdown.location === 80) {
    explanations.location = `${provider.location} and ${demand.location} are in the same illustrative regional grouping. No route distance is calculated.`;
    reasons.push("The provider is in a nearby regional grouping.");
  } else {
    explanations.location = `${provider.location} is a different city from ${demand.location}; the score uses a fixed regional relationship table, not measured travel distance.`;
  }
  if (positive(demand.maxDistanceKm)) warnings.push(`The ${display(demand.maxDistanceKm)} km distance preference is recorded but not scored; exact geographic distance is unavailable.`);

  explanations.availability = provider.availabilityDays === 0
    ? "Listed as available now: 100 points. This is a mock capacity snapshot, not a reserved slot."
    : `Listed availability begins within ${provider.availabilityDays} days: ${breakdown.availability} points. This is not a reserved slot.`;
  if (provider.availabilityDays === 0 && breakdown.capability >= 80) reasons.push("The provider lists capacity available now.");

  const earliest = Math.max(0, provider.availabilityDays) + Math.max(0, provider.leadTimeDays);
  const timelineFits = capacity.days === null || earliest <= capacity.days;
  const preferenceFits = !positive(demand.maxLeadTimeDays) || provider.leadTimeDays <= demand.maxLeadTimeDays;
  explanations.leadTime = `${provider.leadTimeDays}-day production lead time plus ${provider.availabilityDays}-day availability delay gives an earliest estimated completion in ${earliest} days.`;
  if (positive(demand.maxLeadTimeDays)) explanations.leadTime += ` Your preferred production lead time is ${demand.maxLeadTimeDays} days.`;
  if (capacity.days !== null) explanations.leadTime += ` Your completion deadline is ${capacity.days} days away.`;
  if (!timelineFits) warnings.push(`Earliest estimated completion is in ${earliest} days, after your ${capacity.days}-day deadline; availability delay is included.`);
  if (!preferenceFits) warnings.push(`The provider's ${provider.leadTimeDays}-day lead time exceeds your ${demand.maxLeadTimeDays}-day preference.`);
  if (timelineFits && preferenceFits && breakdown.capability >= 80) reasons.push("Availability and lead time fit your requested timeline.");

  if (!estimatedCost) {
    explanations.cost = breakdown.capability === 0
      ? "No relevant order estimate is calculated for an unrelated capability."
      : "An order estimate cannot be compared because output or pricing units are incompatible or pricing is unavailable.";
  } else {
    explanations.cost = `${formatPrice(estimatedCost.min)}–${formatPrice(estimatedCost.max)} estimated for ${estimatedCost.basis}. `;
    if (demand.budgetFlexible || !positive(demand.budgetMax)) {
      explanations.cost += "Budget is flexible or unspecified, so a neutral score of 80 is used.";
    } else if (estimatedCost.max <= demand.budgetMax) {
      explanations.cost += "The upper estimate fits your maximum budget.";
      if (breakdown.capability >= 80) reasons.push("The full estimated cost range fits your maximum budget.");
    } else {
      explanations.cost += "The upper estimate exceeds your maximum budget; the score uses that upper estimate conservatively.";
      warnings.push(estimatedCost.min <= demand.budgetMax
        ? "The estimated price range crosses your maximum budget; final pricing may exceed it."
        : "The estimated cost exceeds your maximum budget.");
    }
    if (positive(demand.budgetMin) && estimatedCost.max < demand.budgetMin) {
      explanations.cost += " The estimate is below your preferred budget range; lower cost is not penalized.";
    }
    if (demand.demandType === "one-time" && normalize(provider.priceUnit).endsWith("/month")) {
      warnings.push("Storage pricing is for one month; total storage duration and handling charges require confirmation.");
    }
  }

  const missingMaterials = demand.materials.filter((material) => !materialSupported(material, provider));
  if (missingMaterials.length) warnings.push(`Materials not listed by this provider: ${missingMaterials.join(", ")}. Confirm suitability; these are not scored.`);
  const missingCertifications = demand.certifications.filter((certification) => !provider.certifications.map(normalize).includes(normalize(certification)));
  if (missingCertifications.length) warnings.push(`Requested certifications not listed: ${missingCertifications.join(", ")}. Do not assume compliance; these are not scored.`);
  if (demand.qualityRequirements.trim() || demand.technicalNotes.trim()) warnings.push("Quality requirements and technical notes need provider review and are not scored.");
  if (demand.urgency !== "standard") warnings.push("Urgency is recorded for provider review and does not change the compatibility score.");

  const total = breakdown.total;
  return {
    provider,
    score: total,
    classification: total >= 90 ? "Strong Match" : total >= 75 ? "Good Match" : total >= 60 ? "Potential Match" : "Limited Match",
    breakdown,
    reasons,
    warnings,
    explanations,
    estimatedCost,
  };
}

export function rankProviders(demand: DemandRequirement, providers: readonly Capacity[] = capacities, now = new Date()): MatchResult[] {
  return providers
    .filter((provider) => provider.availableCapacity > 0 && provider.listingStatus !== "paused" && provider.listingStatus !== "fully_booked")
    .map((provider) => calculateMatchScore(provider, demand, now))
    .sort((a, b) => b.score - a.score || b.breakdown.capability - a.breakdown.capability || b.provider.ranking - a.provider.ranking || a.provider.name.localeCompare(b.provider.name));
}
