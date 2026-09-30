import type { SelectedCapacityRequest } from "@/types/matching";

export function restoreMatchContext(value: unknown): SelectedCapacityRequest["matchContext"] {
  if (!value || typeof value !== "object") return undefined;
  const context = value as Record<string, unknown>;
  const validScore = (score: unknown) => typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= 100;
  if (!validScore(context.score) || !["Strong Match", "Good Match", "Potential Match", "Limited Match"].includes(String(context.classification))) return undefined;
  const breakdown = context.breakdown as Record<string, unknown> | null;
  const explanations = context.explanations as Record<string, unknown> | null;
  const keys = ["capability", "capacity", "location", "availability", "leadTime", "cost"];
  if (!breakdown || !explanations || !validScore(breakdown.total) || keys.some((key) => !validScore(breakdown[key]) || typeof explanations[key] !== "string")) return undefined;
  // All fields of the shared context shape have been checked above.
  return value as SelectedCapacityRequest["matchContext"];
}
