import { capacities, categories, getCapacity, locations, type Capacity, type Location } from "../data/capacities";
import type { CapacityListing, CapacityListingDraft, ListingStatus } from "../types/capacity-listing";

export const MANAGED_PROVIDER_ID = "precision-works";
export const listingStatusLabels: Record<ListingStatus, string> = {
  active: "Active", limited: "Limited", paused: "Paused", fully_booked: "Fully Booked",
};

const provinces: Record<Location, string> = {
  Jakarta: "DKI Jakarta", Bekasi: "West Java", Tangerang: "Banten", Bandung: "West Java",
  Surabaya: "East Java", Semarang: "Central Java", Yogyakarta: "Special Region of Yogyakarta",
};
const supportedUnits = ["units", "pcs", "parts", "prints", "packages", "packs", "kg", "tons", "pallet spaces", "production hours"];
const finite = (value: number) => Number.isFinite(value) && value >= 0 && value <= 1_000_000_000_000;

export function validateCapacityListing(draft: CapacityListingDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.capability.trim()) errors.capability = "Enter a capability name.";
  if (!categories.includes(draft.category)) errors.category = "Choose a supported category.";
  if (draft.description.trim().length < 15) errors.description = "Describe this capacity in at least 15 characters.";
  if (!locations.includes(draft.location)) errors.location = "Choose a supported location.";
  if (!finite(draft.maximumCapacity) || draft.maximumCapacity <= 0) errors.maximumCapacity = "Enter a total capacity greater than zero.";
  if (!finite(draft.availableCapacity)) errors.availableCapacity = "Available capacity cannot be negative.";
  else if (draft.availableCapacity > draft.maximumCapacity) errors.availableCapacity = "Available capacity cannot exceed total capacity.";
  if (!supportedUnits.includes(draft.capacityUnit)) errors.capacityUnit = "Choose a supported capacity unit.";
  const fractional = ["kg", "tons", "production hours"].includes(draft.capacityUnit);
  for (const key of ["maximumCapacity", "availableCapacity", "minimumOrder"] as const) {
    if (!fractional && !Number.isInteger(draft[key])) errors[key] = "Use whole-number quantities for this unit.";
  }
  if (!finite(draft.minimumOrder) || draft.minimumOrder <= 0) errors.minimumOrder = "Enter a minimum order greater than zero.";
  else if (draft.minimumOrder > draft.maximumCapacity) errors.minimumOrder = "Minimum order cannot exceed total capacity.";
  if (!Number.isInteger(draft.leadTimeDays) || draft.leadTimeDays < 0 || draft.leadTimeDays > 365) errors.leadTimeDays = "Enter a lead time from 0 to 365 days.";
  if (!finite(draft.priceFrom) || draft.priceFrom <= 0) errors.priceFrom = "Enter a minimum price greater than zero.";
  if (!finite(draft.priceTo) || draft.priceTo <= 0) errors.priceTo = "Enter a maximum price greater than zero.";
  else if (draft.priceTo < draft.priceFrom) errors.priceTo = "Maximum price cannot be below the minimum price.";
  if (!Object.hasOwn(listingStatusLabels, draft.status)) errors.status = "Choose a supported listing status.";
  if (draft.status === "fully_booked" && draft.availableCapacity !== 0) errors.availableCapacity = "Set available capacity to zero for a fully booked listing.";
  if (![0, 7, 14, 30].includes(draft.availabilityDays)) errors.availabilityDays = "Choose availability now, within 7, 14, or 30 days.";
  for (const key of ["materials", "facilities", "certifications"] as const) {
    if (!Array.isArray(draft[key]) || draft[key].some((value) => typeof value !== "string" || !value.trim())) errors[key] = "Use a list of nonempty names.";
  }
  return errors;
}

export function normalizeListingStatus(status: ListingStatus, availableCapacity: number): ListingStatus {
  return status === "paused" ? "paused" : availableCapacity === 0 ? "fully_booked" : status === "fully_booked" ? "active" : status;
}

export function createInitialListings(): CapacityListing[] {
  const provider = getCapacity(MANAGED_PROVIDER_ID);
  if (!provider) throw new Error("The demo provider could not be found.");
  return [{
    id: provider.id, providerId: provider.id, capability: provider.capability, category: provider.category,
    description: provider.description, location: provider.location, maximumCapacity: provider.maximumCapacity,
    availableCapacity: provider.availableCapacity, capacityUnit: provider.capacityUnit, minimumOrder: provider.minimumOrder,
    leadTimeDays: provider.leadTimeDays, priceFrom: provider.priceFrom, priceTo: provider.priceTo,
    materials: [...provider.materials], facilities: [...provider.facilities], certifications: [...provider.certifications],
    status: "active", availabilityDays: provider.availabilityDays, updatedAt: "2026-09-23T00:00:00.000Z",
  }];
}

function pricingUnit(unit: string): string {
  return ({ units: "unit", pcs: "piece", parts: "part", prints: "print", packages: "package", packs: "pack", kg: "kg", tons: "ton", "pallet spaces": "pallet/month", "production hours": "hour" } as Record<string, string>)[unit] || unit;
}

function listingProvider(listing: CapacityListing): Capacity {
  const company = getCapacity(listing.providerId);
  if (!company) throw new Error("This capacity listing has no provider company.");
  const existingCompanyListing = listing.id === company.id && listing.category === company.category;
  return {
    ...company,
    id: listing.id, companyId: company.id, listingStatus: normalizeListingStatus(listing.status, listing.availableCapacity),
    capability: listing.capability, category: listing.category, description: listing.description,
    about: existingCompanyListing ? company.about : `${company.name} offers ${listing.capability.toLowerCase()}. ${listing.description}`,
    location: listing.location, province: provinces[listing.location],
    availableCapacity: listing.availableCapacity, maximumCapacity: listing.maximumCapacity,
    capacityUnit: listing.capacityUnit, capacityPeriod: listing.capacityUnit === "pallet spaces" ? "" : "/month",
    minimumOrder: listing.minimumOrder, minimumOrderUnit: listing.capacityUnit === "pallet spaces" ? "pallets" : listing.capacityUnit,
    leadTimeDays: listing.leadTimeDays, availabilityDays: listing.availabilityDays,
    priceFrom: listing.priceFrom, priceTo: listing.priceTo, priceUnit: pricingUnit(listing.capacityUnit),
    materials: [...listing.materials], facilities: [...listing.facilities], certifications: [...listing.certifications],
    capabilities: existingCompanyListing ? Array.from(new Set([listing.capability, ...company.capabilities])) : [listing.capability],
    size: listing.maximumCapacity <= 5000 ? "Small" : listing.maximumCapacity <= 20000 ? "Medium" : "Large",
    industry: existingCompanyListing ? company.industry : listing.category,
  };
}

/** Compose local listing fields with one existing company record; never copy companies into storage. */
export function composeCapacityCatalog(listings: readonly CapacityListing[]): Capacity[] {
  const byId = new Map(listings.map((listing) => [listing.id, listing]));
  const providers = capacities.map((provider) => {
    const listing = byId.get(provider.id);
    return listing ? listingProvider(listing) : { ...provider, companyId: provider.id, listingStatus: "active" as const };
  });
  for (const listing of listings) {
    if (!getCapacity(listing.id)) providers.push(listingProvider(listing));
  }
  return providers;
}

export function isAvailableCapacity(provider: Capacity): boolean {
  return provider.availableCapacity > 0 && provider.listingStatus !== "paused" && provider.listingStatus !== "fully_booked";
}

/** Storage is untrusted: restore only owned, valid listing records and known fields. */
export function restoreCapacityListing(value: unknown): CapacityListing | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  if (source.providerId !== MANAGED_PROVIDER_ID || typeof source.id !== "string" || !/^(precision-works|local-capacity-[a-f0-9-]{36})$/.test(source.id)) return null;
  for (const key of ["capability", "category", "description", "location", "capacityUnit", "status", "updatedAt"]) if (typeof source[key] !== "string") return null;
  for (const key of ["maximumCapacity", "availableCapacity", "minimumOrder", "leadTimeDays", "priceFrom", "priceTo", "availabilityDays"]) if (typeof source[key] !== "number") return null;
  for (const key of ["materials", "facilities", "certifications"]) if (!Array.isArray(source[key]) || (source[key] as unknown[]).some((item) => typeof item !== "string")) return null;
  if (!Number.isFinite(Date.parse(source.updatedAt as string))) return null;
  const draft: CapacityListingDraft = {
    capability: source.capability as string, category: source.category as CapacityListing["category"], description: source.description as string,
    location: source.location as CapacityListing["location"], maximumCapacity: source.maximumCapacity as number,
    availableCapacity: source.availableCapacity as number, capacityUnit: source.capacityUnit as string,
    minimumOrder: source.minimumOrder as number, leadTimeDays: source.leadTimeDays as number,
    priceFrom: source.priceFrom as number, priceTo: source.priceTo as number,
    materials: [...source.materials as string[]], facilities: [...source.facilities as string[]], certifications: [...source.certifications as string[]],
    status: source.status as ListingStatus, availabilityDays: source.availabilityDays as number,
  };
  if (Object.keys(validateCapacityListing(draft)).length) return null;
  return { ...draft, id: source.id, providerId: MANAGED_PROVIDER_ID, updatedAt: source.updatedAt as string, status: normalizeListingStatus(draft.status, draft.availableCapacity) };
}
