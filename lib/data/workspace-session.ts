import { createEmptyDemand, normalizeDemand, validateDemand } from "@/lib/demand-options";
import { restoreMatchContext } from "@/lib/match-context";
import type { DemandRequirement, SelectedCapacityRequest } from "@/types/matching";
import type { DemoPerspective } from "@/types/requests";

/** Only transient form/navigation context is cached. Supabase remains the entity source. */
export type WorkspaceSession = {
  draft: DemandRequirement;
  submittedDemand: DemandRequirement | null;
  selectedRequest: SelectedCapacityRequest | null;
  activeDemandId: string | null;
  perspective: DemoPerspective;
};
export function emptyWorkspaceSession(): WorkspaceSession {
  return { draft: createEmptyDemand(), submittedDemand: null, selectedRequest: null, activeDemandId: null, perspective: "buyer" };
}
export const workspaceSessionKey = (userId: string, businessId: string) => `capacity-real-session-v1:${userId}:${businessId}`;
export function restoreWorkspaceSession(raw: string | null): WorkspaceSession {
  const result = emptyWorkspaceSession();
  try {
    const source: unknown = JSON.parse(raw || "null");
    if (!source || typeof source !== "object" || Array.isArray(source)) return result;
    const value = source as Record<string, unknown>;
    const submitted = (candidate: unknown) => {
      if (!candidate) return null;
      const demand = normalizeDemand(candidate);
      return Object.keys(validateDemand(demand, "0000-01-01")).length ? null : demand;
    };
    result.draft = normalizeDemand(value.draft);
    result.submittedDemand = submitted(value.submittedDemand);
    result.activeDemandId = typeof value.activeDemandId === "string" ? value.activeDemandId : null;
    result.perspective = value.perspective === "provider" ? "provider" : "buyer";
    if (value.selectedRequest && typeof value.selectedRequest === "object") {
      const selected = value.selectedRequest as Record<string, unknown>;
      const demand = submitted(selected.demand);
      if (typeof selected.providerId === "string" && selected.providerId && demand) {
        result.selectedRequest = { providerId: selected.providerId, demand, createdAt: typeof selected.createdAt === "string" ? selected.createdAt : "", matchContext: restoreMatchContext(selected.matchContext) };
      }
    }
  } catch { /* Corrupt or obsolete context must never restore database entities. */ }
  return result;
}
