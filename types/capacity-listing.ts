import type { Category, Location } from "../data/capacities";

export type ListingStatus = "active" | "limited" | "paused" | "fully_booked";

export interface CapacityListing {
  id: string;
  providerId: string;
  capability: string;
  category: Category;
  description: string;
  location: Location;
  maximumCapacity: number;
  availableCapacity: number;
  capacityUnit: string;
  minimumOrder: number;
  leadTimeDays: number;
  priceFrom: number;
  priceTo: number;
  materials: string[];
  facilities: string[];
  certifications: string[];
  status: ListingStatus;
  availabilityDays: number;
  updatedAt: string;
}

export type CapacityListingDraft = Omit<CapacityListing, "id" | "providerId" | "updatedAt">;
