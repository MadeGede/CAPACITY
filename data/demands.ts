import { createEmptyDemand, localDateString } from "../lib/demand-options";
import type { SavedDemand } from "../types/matching";

// Seeded once into the same demand store used by the creation wizard.
export function createDemoDemands(): SavedDemand[] {
  const now = new Date();
  const deadline = (days: number) => localDateString(new Date(now.getTime() + days * 86400000));
  const requirement = { ...createEmptyDemand(), budgetFlexible: false, budgetMin: 0, budgetMax: 110000000 };
  return [
    { id: "demand-demo-cnc", name: "CNC Components", status: "open", createdAt: now.toISOString(), updatedAt: now.toISOString(), matchHistory: null,
      requirement: { ...requirement, category: "CNC & Machining", capability: "CNC Milling", description: "Aluminum mounting components for our industrial equipment production line.", quantity: 5000, unit: "units", location: "Jakarta", completionDate: deadline(21), maxLeadTimeDays: 21, materials: ["Aluminum"] } },
    { id: "demand-demo-packaging", name: "Custom Packaging", status: "open", createdAt: now.toISOString(), updatedAt: now.toISOString(), matchHistory: null,
      requirement: { ...requirement, category: "Packaging", capability: "Custom Packaging", description: "Custom kraft cartons with printed branding for our production components.", quantity: 20000, unit: "packages", location: "Tangerang", completionDate: deadline(14), maxLeadTimeDays: 14, materials: ["Kraft board"] } },
  ];
}
