import { categories, locations, type Category } from "../data/capacities";
import type { DemandRequirement, DemandUnit } from "../types/matching";

export const demandUnits: DemandUnit[] = ["units", "pcs", "packages", "kg", "tons", "pallet spaces", "production hours"];
export const certificationOptions = ["ISO 9001", "Quality Control Process", "Food Grade", "HACCP"];

export const categoryOptions: Record<Category, { capabilities: string[]; materials: string[]; defaultUnit: DemandUnit }> = {
  "CNC & Machining": {
    capabilities: ["CNC Milling", "CNC Turning", "Metal Cutting", "Precision Components"],
    materials: ["Aluminum", "Steel", "Stainless steel", "Brass", "Engineering plastics"], defaultUnit: "units",
  },
  "Plastic Manufacturing": {
    capabilities: ["Injection Molding", "Plastic Components", "PET Production", "Plastic Packaging"],
    materials: ["PET", "PP", "HDPE", "ABS", "Polycarbonate", "Nylon"], defaultUnit: "units",
  },
  Packaging: {
    capabilities: ["Custom Packaging", "Box Production", "Flexible Packaging", "Product Labeling"],
    materials: ["Cardboard", "Kraft board", "Corrugated board", "Art carton", "Recycled paperboard"], defaultUnit: "packages",
  },
  "Food Production": {
    capabilities: ["Dry Ingredient Blending", "Pouch Filling", "Cookie Production", "Bulk Food Packing"],
    materials: ["Spice blends", "Dry seasonings", "Flour blends", "Cocoa", "Premixes"], defaultUnit: "kg",
  },
  Textile: {
    capabilities: ["Garment Production", "Fabric Cutting", "Embroidery", "Uniform Manufacturing"],
    materials: ["Cotton", "Polyester", "Twill", "Cotton jersey", "Linen blends"], defaultUnit: "pcs",
  },
  Printing: {
    capabilities: ["Offset Printing", "Digital Printing", "Product Labels", "Catalog Production"],
    materials: ["Art paper", "Uncoated paper", "Adhesive paper", "Synthetic label stock", "Book paper"], defaultUnit: "units",
  },
  "3D Printing": {
    capabilities: ["FDM Printing", "SLA Printing", "Resin Printing", "Functional Prototyping"],
    materials: ["PLA", "PETG", "ABS", "Nylon", "Engineering resin", "Standard resin"], defaultUnit: "units",
  },
  Assembly: {
    capabilities: ["Mechanical Assembly", "Cable Harness Assembly", "Manual PCB Assembly", "Hardware Kitting"],
    materials: ["Machined components", "Molded housings", "Wires and connectors", "Electronic components", "Customer-supplied kits"], defaultUnit: "units",
  },
  Warehousing: {
    capabilities: ["Pallet Storage", "Industrial Storage", "Inventory Handling", "Cross-docking"],
    materials: ["Dry packaged goods", "Packaged components", "Industrial components", "Non-hazardous supplies"], defaultUnit: "pallet spaces",
  },
};

export function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function createEmptyDemand(): DemandRequirement {
  return {
    category: "", capability: "", description: "", quantity: null, unit: "units", demandType: "one-time",
    monthlyQuantity: null, durationMonths: null, location: "any", maxDistanceKm: null,
    completionDate: "", maxLeadTimeDays: null, urgency: "standard", budgetMin: null, budgetMax: null,
    budgetFlexible: false, materials: [], certifications: [], qualityRequirements: "", technicalNotes: "",
  };
}

const numericFields = ["quantity", "monthlyQuantity", "durationMonths", "maxDistanceKm", "maxLeadTimeDays", "budgetMin", "budgetMax"] as const;
const textFields = ["capability", "description", "completionDate", "qualityRequirements", "technicalNotes"] as const;

/** Restore only supported values; storage is untrusted and may come from an older version. */
export function normalizeDemand(value: unknown): DemandRequirement {
  const draft = createEmptyDemand();
  if (!value || typeof value !== "object" || Array.isArray(value)) return draft;
  const source = value as Record<string, unknown>;
  for (const key of textFields) if (typeof source[key] === "string") draft[key] = source[key].slice(0, 5000);
  for (const key of numericFields) if (typeof source[key] === "number" && Number.isFinite(source[key])) draft[key] = source[key];
  if (categories.some((category) => category === source.category)) draft.category = source.category as Category;
  if (demandUnits.includes(source.unit as DemandUnit)) draft.unit = source.unit as DemandUnit;
  if (source.demandType === "recurring") draft.demandType = "recurring";
  if (locations.some((location) => location === source.location)) draft.location = source.location as DemandRequirement["location"];
  if (source.urgency === "urgent" || source.urgency === "priority") draft.urgency = source.urgency;
  draft.budgetFlexible = source.budgetFlexible === true;
  if (Array.isArray(source.materials)) draft.materials = source.materials.filter((item): item is string => typeof item === "string").slice(0, 30).map((item) => item.slice(0, 100));
  if (Array.isArray(source.certifications)) draft.certifications = source.certifications.filter((item): item is string => typeof item === "string").slice(0, 30).map((item) => item.slice(0, 100));
  return draft;
}

function validPositive(value: number | null) {
  return value !== null && Number.isFinite(value) && value > 0 && value <= 1_000_000_000_000;
}

export function validateDemandStep(demand: DemandRequirement, step: number, today = localDateString()): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 0) {
    if (!demand.category) errors.category = "Choose a production category.";
    if (!demand.category || !categoryOptions[demand.category]?.capabilities.includes(demand.capability)) errors.capability = "Choose a capability for this category.";
    if (demand.description.trim().length < 15) errors.description = "Describe your requirement in at least 15 characters.";
  }
  if (step === 1) {
    const wholeQuantity = !["kg", "tons", "production hours"].includes(demand.unit);
    if (!validPositive(demand.quantity) || (wholeQuantity && !Number.isInteger(demand.quantity))) errors.quantity = wholeQuantity ? "Enter a positive whole-number quantity." : "Enter a quantity greater than zero.";
    if (!demandUnits.includes(demand.unit)) errors.unit = "Choose a supported unit.";
    if (demand.demandType === "recurring") {
      if (!validPositive(demand.monthlyQuantity) || (wholeQuantity && !Number.isInteger(demand.monthlyQuantity))) errors.monthlyQuantity = "Enter a valid monthly capacity greater than zero.";
      if (!validPositive(demand.durationMonths) || !Number.isInteger(demand.durationMonths) || (demand.durationMonths ?? 0) > 60) errors.durationMonths = "Choose a duration between 1 and 60 months.";
    }
  }
  if (step === 2) {
    if (demand.location !== "any" && !locations.includes(demand.location)) errors.location = "Choose a location or Any Location.";
    if (demand.maxDistanceKm !== null && ![25, 50, 100, 250].includes(demand.maxDistanceKm)) errors.maxDistanceKm = "Choose a supported distance preference.";
  }
  if (step === 3) {
    const date = new Date(`${demand.completionDate}T12:00:00`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(demand.completionDate) || !Number.isFinite(date.getTime()) || localDateString(date) !== demand.completionDate || demand.completionDate <= today) errors.completionDate = "Choose a valid completion date after today.";
    if (demand.maxLeadTimeDays !== null && ![7, 14, 21, 30].includes(demand.maxLeadTimeDays)) errors.maxLeadTimeDays = "Choose a supported lead time or Flexible.";
  }
  if (step === 4 && !demand.budgetFlexible) {
    if (!validPositive(demand.budgetMax)) errors.budgetMax = "Enter a maximum budget greater than zero, or choose Budget Flexible.";
    if (demand.budgetMin !== null && (!Number.isFinite(demand.budgetMin) || demand.budgetMin < 0 || demand.budgetMin > (demand.budgetMax ?? 0))) errors.budgetMin = "Minimum budget must be between zero and your maximum budget.";
  }
  return errors;
}

export function validateDemand(demand: DemandRequirement, today = localDateString()) {
  return Object.assign({}, ...Array.from({ length: 6 }, (_, step) => validateDemandStep(demand, step, today))) as Record<string, string>;
}
