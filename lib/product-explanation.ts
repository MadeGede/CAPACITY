import { createDemoDemands } from "@/data/demands";
import { demoRequests } from "@/data/requests";
import { getCapacity } from "@/data/capacities";
import { calculateMatchScore, MATCH_WEIGHTS } from "@/lib/matching";
import type { MatchCriterion } from "@/types/matching";

export const matchingFactors: { key: MatchCriterion; label: string; description: string }[] = [
  { key: "capability", label: "Capability", description: "The production process a business can perform." },
  { key: "capacity", label: "Capacity", description: "Available output compared with the required quantity and planning window." },
  { key: "location", label: "Location", description: "Fit with the preferred city or regional grouping." },
  { key: "availability", label: "Availability", description: "When the listed production capacity becomes available." },
  { key: "leadTime", label: "Lead Time", description: "Production timing compared with the preferred lead time and deadline." },
  { key: "cost", label: "Estimated Cost", description: "An estimated order range compared with the buyer’s budget." },
];

/** Public explanation of the seeded example, using the unchanged product scorer. */
export function getIllustrativeScenario() {
  const demand = createDemoDemands()[0].requirement;
  const provider = getCapacity("precision-works");
  if (!provider) throw new Error("The illustrative Precision Works fixture is missing.");
  const proposal = demoRequests.find((request) => request.id === "REQ-2026-00124")?.proposal;
  if (!proposal) throw new Error("The illustrative production proposal is missing.");
  const evaluatedAt = new Date();
  const match = calculateMatchScore(provider, demand, evaluatedAt);
  const factors = matchingFactors.map((factor) => ({ ...factor, weight: MATCH_WEIGHTS[factor.key] * 100, score: match.breakdown[factor.key], contribution: match.breakdown[factor.key] * MATCH_WEIGHTS[factor.key] }));
  return { demand, match, proposal, factors, weightedTotal: factors.reduce((total, factor) => total + factor.contribution, 0), evaluatedAt };
}

export const productFaq = [
  { question: "What is production capacity?", answer: "The output, space, or production time a business can provide using its machines, facilities, and teams—for example, CNC components per month or available pallet spaces." },
  { question: "Who can use CAPACITY?", answer: "Businesses that need additional production capability and businesses with available capacity. A business can act as a buyer for one process and a provider for another." },
  { question: "How does Smart Matching work?", answer: "A deterministic compatibility engine scores six factors with published weights. It ranks available providers and shows the reasons, assumptions, and limitations behind each score." },
  { question: "Does CAPACITY manufacture products?", answer: "No. CAPACITY supports capacity discovery and business collaboration. The participating businesses carry out production and agree on the final terms." },
  { question: "What happens after a match?", answer: "The buyer sends a Capacity Request. The provider reviews it, discusses requirements, and can send a Production Proposal. Agreement can then move into an active Collaboration." },
  { question: "What can I try without an account?", answer: "The Competition Demo includes discovery, demand, matching, requests, proposals, and collaboration on this device. Real accounts and shared database persistence require a configured Supabase environment." },
];
