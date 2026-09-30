const assert = require("node:assert/strict");
const { test, after } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const { createHarness } = require("./helpers/dom-harness.cjs");

const harness = createHarness();
const { listingToCapacity, listingToManaged, demandToSaved, requestToView } = harness.load("lib/data/mappers.ts");
after(() => harness.close());

const listing = {
  id: "listing-1", business_id: "provider-1", title: "CNC Milling", category: "CNC & Machining", description: "Machining capacity",
  location_city: "Bekasi", location_province: "West Java", total_capacity: 10000, available_capacity: 6500,
  capacity_unit: "units", minimum_order: 500, lead_time_days: 14, estimated_price_min: 18000, estimated_price_max: 25000,
  pricing_unit: "unit", availability_status: "available_now", listing_status: "active", supported_materials: ["Aluminum"],
  machines_facilities: ["CNC mill"], certifications: ["ISO 9001"], updated_at: "2026-09-28T00:00:00Z",
  businesses: { id: "provider-1", name: "Precision Works", description: "Precision production", business_type: "Manufacturer", primary_industry: "Engineering", location_city: "Bekasi", location_province: "West Java", verification_status: "unverified", years_operating: 12 },
};

test("real listings use database values without inheriting demo verification or capacity", () => {
  const provider = listingToCapacity(listing);
  assert.equal(provider.name, "Precision Works");
  assert.equal(provider.availableCapacity, 6500);
  assert.equal(provider.maximumCapacity, 10000);
  assert.equal(provider.verified, false);
  assert.deepEqual(provider.materials, ["Aluminum"]);
  assert.equal(provider.companyId, "provider-1");
  assert.equal(listingToManaged(listing).status, "active");
});

test("malformed or unsupported listing records are omitted safely", () => {
  assert.equal(listingToCapacity({ ...listing, total_capacity: 0 }), null);
  assert.equal(listingToCapacity({ ...listing, category: "Unknown" }), null);
  assert.equal(listingToManaged({ ...listing, location_city: "Unknown" }), null);
});

test("demand and request records retain persistence identifiers and business roles", () => {
  const demand = demandToSaved({ id: "demand-1", business_id: "buyer-1", title: "CNC parts", category: "CNC & Machining", capability: "CNC Milling", description: "Parts", quantity: 5000, unit: "units", demand_type: "one-time", monthly_quantity: null, expected_duration_months: null, preferred_location: "Jakarta", maximum_distance: null, required_completion_date: "2026-10-20", preferred_lead_time_days: 21, urgency: "priority", budget_min: 90000000, budget_max: 110000000, budget_flexible: false, materials: ["Aluminum"], required_certifications: [], quality_requirements: "", technical_notes: "", status: "open", created_at: "2026-09-28T00:00:00Z", updated_at: "2026-09-28T00:00:00Z" });
  assert.equal(demand.id, "demand-1");
  assert.equal(demand.requirement.quantity, 5000);
  const request = requestToView({ id: "uuid-1", public_id: "REQ-2026-00001", buyer_business_id: "buyer-1", provider_business_id: "provider-1", capacity_listing_id: "listing-1", demand_id: "demand-1", requested_capability: "CNC Milling", category: "CNC & Machining", quantity: 5000, unit: "units", production_location: "Jakarta", preferred_start_date: "2026-10-01", required_completion_date: "2026-10-20", preferred_lead_time_days: 21, urgency: "priority", budget: 110000000, budget_flexibility: "flexible", materials: ["Aluminum"], product_description: "Parts", technical_specifications: "", quality_requirements: "", certifications_required: [], additional_notes: "", attachment_references: [], message: "", demand_type: "one-time", duration_months: null, match_context: null, rejection_reason: null, revision_notes: null, status: "negotiation", created_at: "2026-09-28T00:00:00Z", updated_at: "2026-09-28T00:00:00Z" }, new Map([["buyer-1", "NusaTech Industries"]]), [{ id: "message-1", request_id: "uuid-1", sender_business_id: "provider-1", message: "We can help", created_at: "2026-09-28T01:00:00Z" }], [{ id: "proposal-1", request_id: "uuid-1", quantity: 5000, unit_price: 21500, estimated_total: 107500000, production_start_date: "2026-10-01", estimated_completion_date: "2026-10-15", lead_time_days: 14, provider_notes: "", status: "pending", created_at: "2026-09-28T02:00:00Z" }], []);
  assert.equal(request.id, "REQ-2026-00001");
  assert.equal(request.location, "Jakarta");
  assert.equal(request.buyerBusinessId, "buyer-1");
  assert.equal(request.providerBusinessId, "provider-1");
  assert.equal(request.messages[0].author, "provider");
  assert.equal(request.proposal.total, 107500000);
});

test("migration enables RLS for every Phase 7 table and keeps privileged RPC logic private", () => {
  const migration = fs.readFileSync(path.resolve(__dirname, "../supabase/migrations/202609280001_phase7_mvp.sql"), "utf8");
  for (const table of ["profiles","businesses","business_members","capacity_listings","demands","saved_providers","capacity_requests","request_messages","request_proposals","request_timeline_events","notifications"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security;`));
  }
  assert.match(migration, /create function private\.perform_request_action/);
  assert.match(migration, /create function public\.apply_request_action[\s\S]+security invoker/);
  assert.match(migration, /generated always as \(quantity \* unit_price\) stored/);
});
