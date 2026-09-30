const assert = require("node:assert/strict");
const { test, after } = require("node:test");
const { createHarness } = require("./helpers/dom-harness.cjs");

const harness = createHarness("http://localhost:3000/dashboard");
const { React, act, load, mount } = harness;
const catalog = load("lib/capacity-store.ts");
const demands = load("lib/demand-store.ts");
const requests = load("lib/request-store.ts");
const saved = load("lib/saved-providers.ts");
const reset = load("lib/demo-reset.ts");
const { rankProviders } = load("lib/matching.ts");
const { capacityUtilization } = load("lib/dashboard.ts");
let current;
function Observer() {
  current = {
    catalog: catalog.useCapacityCatalog(), demands: demands.useDemandState(),
    requests: requests.useRequestState(), saved: saved.useSavedProviders(),
  };
  return React.createElement("span", null, current.requests.ready ? "ready" : "loading");
}
const view = mount(Observer);
after(() => { view.close(); harness.close(); });

test("demo reset restores one coherent buyer/provider story", () => {
  act(() => reset.resetDemoData());
  const primary = current.requests.requests.find((item) => item.id === "REQ-2026-00124");
  assert.equal(primary.buyerName, "NusaTech Industries");
  assert.equal(primary.providerId, "precision-works");
  assert.equal(primary.status, "negotiation");
  assert.equal(primary.quantity, 5000);
  assert.equal(primary.proposal.total, 107500000);
  assert.equal(primary.proposal.unitPrice, 21500);
  assert.equal(primary.proposal.leadTimeDays, 15);
  assert.equal((Date.parse(`${primary.proposal.completionDate}T00:00:00Z`) - Date.parse(`${primary.proposal.startDate}T00:00:00Z`)) / 86400000, 15);
  if (new Date().getFullYear() === 2026 && new Date().getMonth() === 8 && new Date().getDate() === 28) assert.equal(primary.proposal.completionDate, "2026-10-13");
  assert.equal(current.demands.demands[0].requirement.quantity, 5000);
  assert.equal(current.demands.demands[0].requirement.budgetMax, 110000000);
  assert.equal(current.catalog.providers.find((item) => item.id === "precision-works").availableCapacity, 6500);
  assert.equal(rankProviders(current.demands.demands[0].requirement, catalog.getCatalogSnapshot())[0].score, 94);
  assert.deepEqual(current.saved.ids, ["precision-works", "packpro-indonesia"]);
});

test("paused and fully booked listings remain managed but leave discovery and matching", () => {
  act(() => current.catalog.setListingStatus("precision-works", "paused"));
  assert.equal(current.catalog.managedListings.find((item) => item.id === "precision-works").status, "paused");
  assert.ok(!catalog.getCatalogSnapshot().filter(catalog.isAvailableCapacity).some((item) => item.id === "precision-works"));
  assert.ok(!rankProviders(current.demands.demands[0].requirement, catalog.getCatalogSnapshot()).some((item) => item.provider.id === "precision-works"));
  act(() => current.catalog.setListingStatus("precision-works", "active"));
  assert.ok(rankProviders(current.demands.demands[0].requirement, catalog.getCatalogSnapshot()).some((item) => item.provider.id === "precision-works"));
  const listing = current.catalog.managedListings[0];
  act(() => current.catalog.updateListing(listing.id, { ...listing, availableCapacity: 0, status: "fully_booked" }));
  assert.equal(current.catalog.managedListings[0].status, "fully_booked");
  assert.ok(!rankProviders(current.demands.demands[0].requirement, catalog.getCatalogSnapshot()).some((item) => item.provider.id === "precision-works"));
  act(() => reset.resetDemoData());
});

test("a proposal moves through agreement and production, and dashboard utilization follows", () => {
  const before = capacityUtilization(current.catalog.providers.filter((item) => item.companyId === "precision-works"), current.requests.requests);
  act(() => current.requests.actOnRequest("REQ-2026-00124", "accept_proposal"));
  assert.equal(current.requests.requests.find((item) => item.id === "REQ-2026-00124").status, "accepted");
  act(() => current.requests.actOnRequest("REQ-2026-00124", "start_collaboration"));
  const active = current.requests.requests.find((item) => item.id === "REQ-2026-00124");
  assert.equal(active.status, "in_progress");
  const after = capacityUtilization(current.catalog.providers.filter((item) => item.companyId === "precision-works"), current.requests.requests);
  assert.ok(after.find((item) => item.unit === "units").utilization >= before.find((item) => item.unit === "units").utilization);
  assert.ok(localStorage.getItem("capacity-requests-v1").includes('"in_progress"'));
  act(() => current.requests.setPerspective("provider"));
  act(() => current.requests.actOnRequest("REQ-2026-00124", "complete"));
  assert.equal(current.requests.requests.find((item) => item.id === "REQ-2026-00124").status, "completed");
  act(() => reset.resetDemoData());
  assert.equal(current.requests.requests.find((item) => item.id === "REQ-2026-00124").status, "negotiation");
  assert.equal(current.requests.perspective, "buyer");
});

test("a new demand can complete matching, request, provider proposal, buyer agreement, and collaboration", () => {
  act(() => reset.resetDemoData());
  const demand = { ...current.demands.demands[0].requirement, description: "New aluminum mounting component production batch for a customer order." };
  act(() => current.demands.newDemand());
  act(() => current.demands.submitDemand(demand));
  const match = rankProviders(demand, catalog.getCatalogSnapshot())[0];
  assert.equal(match.provider.id, "precision-works");
  assert.equal(match.score, 94);
  act(() => current.demands.selectRequest(match.provider.id, demand));
  const seeded = current.requests.requests.find((item) => item.id === "REQ-2026-00124");
  const draft = {
    providerId: match.provider.id, buyerName: "NusaTech Industries", capability: demand.capability,
    category: demand.category, quantity: demand.quantity, unit: demand.unit, location: demand.location,
    preferredStartDate: seeded.preferredStartDate, requiredCompletionDate: seeded.requiredCompletionDate,
    preferredLeadTimeDays: 15, urgency: "standard", budget: 110000000, budgetFlexibility: "slightly_flexible",
    materials: ["Aluminum"], description: demand.description, technicalRequirements: "Aluminum 6061, first-article approval.",
    qualityRequirements: "Dimensional inspection", certifications: [], additionalNotes: "", attachments: [],
    message: "Please confirm a production slot.", demandType: "one-time", durationMonths: null,
  };
  let created;
  act(() => { created = current.requests.create(draft); });
  assert.equal(created.status, "pending_review");
  act(() => current.requests.setPerspective("provider"));
  act(() => current.requests.actOnRequest(created.id, "start_review"));
  act(() => current.requests.actOnRequest(created.id, "start_negotiation"));
  act(() => current.requests.saveProposal(created.id, {
    quantity: 5000, unitPrice: 21500, startDate: seeded.proposal.startDate,
    completionDate: seeded.proposal.completionDate, leadTimeDays: 15, notes: "Includes inspection.",
  }));
  assert.equal(current.requests.requests.find((item) => item.id === created.id).proposal.total, 107500000);
  act(() => current.requests.setPerspective("buyer"));
  act(() => current.requests.actOnRequest(created.id, "accept_proposal"));
  act(() => current.requests.actOnRequest(created.id, "start_collaboration"));
  assert.equal(current.requests.requests.find((item) => item.id === created.id).status, "in_progress");
  act(() => reset.resetDemoData());
  assert.equal(current.requests.requests.some((item) => item.id === created.id), false);
});
