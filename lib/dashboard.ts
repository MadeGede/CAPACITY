import type { Capacity } from "@/data/capacities";
import type { SavedDemand } from "@/types/matching";
import type { CapacityRequest, DemoPerspective } from "@/types/requests";
import { DEMO_BUYER_NAME, DEMO_PROVIDER_ID } from "@/lib/demo-identity";

export const collaborationStatuses = ["accepted", "in_progress", "completed", "cancelled"];
export function requestsForPerspective(requests: CapacityRequest[], role: DemoPerspective, providers: Capacity[], businessId?: string) {
  if (businessId) return requests.filter((request) => role === "buyer" ? request.buyerBusinessId === businessId : request.providerBusinessId === businessId);
  const managed = new Set(providers.filter((provider) => provider.id === DEMO_PROVIDER_ID || provider.companyId === DEMO_PROVIDER_ID).map((provider) => provider.id));
  return requests.filter((request) => role === "buyer" ? request.buyerName === DEMO_BUYER_NAME : managed.has(request.providerId));
}

function normalizedUnit(unit: string) {
  const value = unit.toLowerCase().trim();
  if (["units", "unit", "pcs", "pieces", "parts"].includes(value)) return { unit: "units", factor: 1 };
  if (["kg", "kilograms"].includes(value)) return { unit: "kg", factor: 1 };
  if (["tons", "tonnes"].includes(value)) return { unit: "kg", factor: 1000 };
  if (["pallets", "pallet spaces"].includes(value)) return { unit: "pallet spaces", factor: 1 };
  if (["production hours", "hours"].includes(value)) return { unit: "production hours", factor: 1 };
  return { unit: value, factor: 1 };
}

export function capacityUtilization(providers: Capacity[], requests: CapacityRequest[]) {
  const groups = new Map<string, { unit: string; period: string; total: number; declaredAvailable: number; manualCommitted: number; activeCommitments: number; plannedCommitted: number; plannedAvailable: number; utilization: number }>();
  for (const provider of providers) {
    const normalized = normalizedUnit(provider.capacityUnit);
    const key = `${normalized.unit}${provider.capacityPeriod}`;
    const group = groups.get(key) ?? { unit: normalized.unit, period: provider.capacityPeriod, total: 0, declaredAvailable: 0, manualCommitted: 0, activeCommitments: 0, plannedCommitted: 0, plannedAvailable: 0, utilization: 0 };
    group.total += provider.maximumCapacity * normalized.factor;
    group.declaredAvailable += provider.availableCapacity * normalized.factor;
    group.manualCommitted += Math.max(0, provider.maximumCapacity - provider.availableCapacity) * normalized.factor;
    for (const request of requests.filter((item) => item.providerId === provider.id && item.status === "in_progress")) {
      const requested = normalizedUnit(request.unit);
      if (requested.unit === normalized.unit) group.activeCommitments += (request.proposal?.quantity ?? request.quantity) * requested.factor;
    }
    groups.set(key, group);
  }
  return Array.from(groups.values()).map((group) => {
    const plannedCommitted = Math.min(group.total, group.manualCommitted + group.activeCommitments);
    return { ...group, plannedCommitted, plannedAvailable: Math.max(0, group.total - plannedCommitted), utilization: group.total > 0 ? Math.round(plannedCommitted / group.total * 100) : 0 };
  });
}

export function responseTimeHours(requests: CapacityRequest[]) {
  const times = requests.flatMap((request) => {
    const replies = [...request.timeline.filter((item) => item.actor === "provider").map((item) => item.createdAt), ...request.messages.filter((item) => item.author === "provider").map((item) => item.createdAt)].map((value) => Date.parse(value)).filter(Number.isFinite);
    return replies.length ? [Math.max(0, Math.min(...replies) - Date.parse(request.createdAt)) / 3_600_000] : [];
  });
  return times.length ? times.reduce((sum, value) => sum + value, 0) / times.length : null;
}

export type WorkspaceActivity = { id: string; title: string; detail: string; date: string; href: string };
export function workspaceActivity(requests: CapacityRequest[], demands: SavedDemand[], role: DemoPerspective, providers: Capacity[]): WorkspaceActivity[] {
  const events = requests.flatMap((request) => {
    const provider = providers.find((item) => item.id === request.providerId);
    return [
      ...request.timeline.map((event) => ({ id: event.id, title: event.title, detail: `${provider?.name ?? request.providerId} · ${request.id}`, date: event.createdAt, href: `/requests/${request.id}` })),
      ...request.messages.filter((message) => message.author !== role).map((message) => ({ id: message.id, title: role === "buyer" ? "Provider message received" : "Buyer message received", detail: `${role === "buyer" ? provider?.name ?? request.providerId : request.buyerName} · ${request.id}`, date: message.createdAt, href: `/requests/${request.id}` })),
    ];
  });
  if (role === "buyer") for (const demand of demands) {
    events.push({ id: `demand-${demand.id}-${demand.updatedAt}`, title: demand.matchHistory ? "Capacity matches updated" : "Production demand saved", detail: demand.name, date: demand.matchHistory?.updatedAt ?? demand.updatedAt, href: "/dashboard/demands" });
  }
  return events.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
