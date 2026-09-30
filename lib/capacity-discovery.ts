import { categories, locations, type Capacity, type Category, type Location, type CapacitySize } from "../data/capacities";

export const sortOptions = [
  { value: "best", label: "Best Match" },
  { value: "capacity", label: "Highest Capacity" },
  { value: "lead", label: "Shortest Lead Time" },
  { value: "minimum", label: "Lowest Minimum Order" },
] as const;
export type CapacitySortOrder = (typeof sortOptions)[number]["value"];
export type DiscoveryFilters = {
  query: string;
  category: Category | "";
  locations: Location[];
  availability: number | null;
  sizes: CapacitySize[];
  verified: boolean;
  leadTime: number | null;
  savedOnly: boolean;
  sort: CapacitySortOrder;
};

export const defaultFilters: DiscoveryFilters = {
  query: "", category: "", locations: [], availability: null, sizes: [],
  verified: false, leadTime: null, savedOnly: false, sort: "best",
};

export function parseDiscoveryFilters(params: URLSearchParams): DiscoveryFilters {
  const category = params.get("category");
  const sort = params.get("sort");
  const readThreshold = (key: string, allowed: number[]) => {
    const value = params.get(key);
    return value !== null && value.trim() !== "" && allowed.includes(Number(value)) ? Number(value) : null;
  };
  return {
    query: params.get("q") || "",
    category: categories.find((value) => value === category) || "",
    locations: locations.filter((value) => params.getAll("location").includes(value)),
    availability: readThreshold("availability", [0, 7, 14, 30]),
    sizes: (["Small", "Medium", "Large"] as const).filter((value) => params.getAll("size").includes(value)),
    verified: params.get("verified") === "1",
    leadTime: readThreshold("lead", [7, 14, 30]),
    savedOnly: params.get("saved") === "1",
    sort: sortOptions.find((option) => option.value === sort)?.value || "best",
  };
}

export function discoveryUrl(filters: DiscoveryFilters) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.category) params.set("category", filters.category);
  filters.locations.forEach((value) => params.append("location", value));
  if (filters.availability !== null) params.set("availability", String(filters.availability));
  filters.sizes.forEach((value) => params.append("size", value));
  if (filters.verified) params.set("verified", "1");
  if (filters.leadTime !== null) params.set("lead", String(filters.leadTime));
  if (filters.savedOnly) params.set("saved", "1");
  if (filters.sort !== "best") params.set("sort", filters.sort);
  return `/discover${params.size ? `?${params.toString()}` : ""}`;
}

export function filterCapacities(providers: readonly Capacity[], filters: DiscoveryFilters, savedIds: readonly string[] = []) {
  const terms = filters.query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const filtered = providers.filter((provider) => {
    const searchable = [provider.name, provider.capability, provider.category, provider.location, provider.description, provider.industry, ...provider.capabilities, ...provider.materials].join(" ").toLocaleLowerCase();
    return terms.every((term) => searchable.includes(term)) &&
      (!filters.category || provider.category === filters.category) &&
      (!filters.locations.length || filters.locations.includes(provider.location)) &&
      (filters.availability === null || provider.availabilityDays <= filters.availability) &&
      (!filters.sizes.length || filters.sizes.includes(provider.size)) &&
      (!filters.verified || provider.verified) &&
      (filters.leadTime === null || provider.leadTimeDays <= filters.leadTime) &&
      (!filters.savedOnly || savedIds.includes(provider.id));
  });
  return filtered.sort((a, b) => {
    const rank = b.ranking - a.ranking || a.name.localeCompare(b.name);
    switch (filters.sort) {
      case "capacity": return b.availableCapacity - a.availableCapacity || rank;
      case "lead": return a.leadTimeDays - b.leadTimeDays || rank;
      case "minimum": return a.minimumOrder - b.minimumOrder || rank;
      default: return rank;
    }
  });
}

export function activeFilterCount(filters: DiscoveryFilters) {
  return Number(!!filters.category) + filters.locations.length + Number(filters.availability !== null) +
    filters.sizes.length + Number(filters.verified) + Number(filters.leadTime !== null);
}
