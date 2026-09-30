const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createHarness } = require("./helpers/dom-harness.cjs");

function setup(pathname = "/match", options = {}) {
  const state = { demands: [], saved: [], calls: [], fail: false };
  let identity = { mode: "real", ready: true, user: { id: "user-1" }, business: { id: "buyer-1", name: "Buyer", city: "Jakarta" }, identityError: "", refreshIdentity: async () => {}, ...options.identity };
  const client = { from(table) {
    const query = { operation: "select", payload: null, filters: {} };
    for (const operation of ["select", "insert", "update", "delete", "upsert", "order", "limit", "or", "in"]) query[operation] = (value) => {
      if (["insert", "update", "delete", "upsert"].includes(operation)) { query.operation = operation; query.payload = value; }
      return query;
    };
    query.eq = (key, value) => { query.filters[key] = value; return query; };
    query.single = query.maybeSingle = () => { query.one = true; return query; };
    query.then = (resolve, reject) => Promise.resolve().then(() => {
      state.calls.push({ table, operation: query.operation, payload: query.payload });
      if (state.fail) return { data: null, error: { message: "offline" } };
      let data = [];
      if (table === "demands") {
        if (query.operation === "insert") state.demands.unshift({ ...state.demands[0], ...query.payload, id: "new-demand", created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        if (query.operation === "update") state.demands = state.demands.map((row) => row.id === query.filters.id ? { ...row, ...query.payload } : row);
        data = state.demands.filter((row) => !query.filters.id || row.id === query.filters.id);
      }
      if (table === "saved_providers") {
        if (query.operation === "upsert") state.saved.push({ capacity_listing_id: query.payload.capacity_listing_id });
        if (query.operation === "delete") state.saved = state.saved.filter((row) => row.capacity_listing_id !== query.filters.capacity_listing_id);
        data = state.saved;
      }
      return { data: query.one ? data[0] ?? null : data, error: null };
    }).then(resolve, reject);
    return query;
  } };
  const mode = { useDataMode: () => identity, DataModeProvider: ({ children }) => children };
  const h = createHarness(`http://localhost:3000${pathname}`, { "./mode": mode, "@/lib/data/mode": mode, "@/lib/supabase/client": { getSupabaseBrowserClient: () => client } });
  const { createDemoDemands } = h.load("data/demands.ts");
  const requirement = createDemoDemands()[0].requirement;
  const row = { id: "existing-demand", business_id: "buyer-1", title: "Existing CNC", category: requirement.category, capability: requirement.capability, description: requirement.description, quantity: requirement.quantity, unit: requirement.unit, demand_type: requirement.demandType, monthly_quantity: null, expected_duration_months: null, preferred_location: requirement.location, maximum_distance: requirement.maxDistanceKm, required_completion_date: requirement.completionDate, preferred_lead_time_days: requirement.maxLeadTimeDays, urgency: requirement.urgency, budget_min: 0, budget_max: requirement.budgetMax, budget_flexible: requirement.budgetFlexible, materials: requirement.materials, required_certifications: requirement.certifications, quality_requirements: requirement.qualityRequirements, technical_notes: requirement.technicalNotes, status: "open", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  state.demands = [row];
  const { useRealWorkspace } = h.load("lib/data/real-workspace.tsx");
  let workspace;
  function Probe() { workspace = useRealWorkspace(); return null; }
  const settle = async () => {
    // Restoration and the route fetch intentionally run in separate React effects.
    for (let turn = 0; turn < 3; turn++) await h.act(async () => { await new Promise((resolve) => setTimeout(resolve, 15)); });
  };
  return { h, state, requirement, row, Probe, settle, get workspace() { return workspace; }, identity: (next) => { identity = { ...identity, ...next }; } };
}

test("public product explanation does not query private workspace data or require identity", async () => {
  const s = setup("/how-it-works", { identity: { user: null, business: null } });
  const view = s.h.mount(s.Probe);
  try {
    await s.settle();
    assert.deepEqual(s.state.calls, []);
    assert.equal(s.workspace.error, "");
  } finally { view.close(); s.h.close(); }
});

test("new and duplicated real demands insert instead of overwriting the first saved demand", async () => {
  const s = setup(); const view = s.h.mount(s.Probe);
  try {
    await s.settle(); assert.equal(s.workspace.activeDemandId, null);
    s.h.act(() => s.workspace.newDemand());
    await s.h.act(async () => { await s.workspace.refresh(); });
    assert.equal(s.workspace.activeDemandId, null);
    await s.h.act(async () => { await s.workspace.submitDemand(s.requirement); });
    assert.equal(s.state.calls.filter((call) => call.table === "demands" && call.operation === "insert").length, 1);
    assert.equal(s.state.demands.find((row) => row.id === "existing-demand").title, "Existing CNC");
    await s.h.act(async () => { await s.workspace.duplicateDemand("existing-demand"); });
    await s.h.act(async () => { await s.workspace.refresh(); });
    assert.equal(s.workspace.activeDemandId, null);
    assert.equal(s.workspace.submittedDemand, null);
  } finally { view.close(); s.h.close(); }
});

test("real demand duplication prepares a new draft and the list navigates after completion", async () => {
  const s = setup("/dashboard/demands");
  const { DemandsList } = s.h.load("components/dashboard/demands-list.tsx");
  function Screen() { return s.h.React.createElement(s.h.React.Fragment, null, s.h.React.createElement(s.Probe), s.h.React.createElement(DemandsList)); }
  const view = s.h.mount(Screen);
  try {
    await s.settle();
    const duplicate = Array.from(view.container.querySelectorAll("button")).find((item) => item.textContent.trim() === "Duplicate");
    s.h.click(duplicate);
    await s.settle();
    assert.equal(s.h.navigations.at(-1), "/match");
    assert.equal(s.workspace.activeDemandId, null);
    assert.equal(s.workspace.submittedDemand, null);
    assert.equal(s.workspace.draft.quantity, 5000);
    assert.equal(s.state.calls.some((call) => call.operation === "insert"), false);
  } finally { view.close(); s.h.close(); }
});

test("public catalog refresh restores saved providers and repeated save mutations are guarded", async () => {
  const s = setup("/discover"); s.state.saved = [{ capacity_listing_id: "provider-1" }];
  const view = s.h.mount(s.Probe);
  try {
    await s.settle(); assert.deepEqual(s.workspace.savedIds, ["provider-1"]);
    assert.equal(s.state.calls.some((call) => call.table === "demands"), false);
    await s.h.act(async () => { await Promise.all([s.workspace.toggleSaved("provider-2"), s.workspace.toggleSaved("provider-2")]); });
    assert.equal(s.state.calls.filter((call) => call.operation === "upsert").length, 1);
  } finally { view.close(); s.h.close(); }
});

test("real navigation context survives remount and is scoped to user and business", async () => {
  const s = setup(); let view = s.h.mount(s.Probe);
  try {
    await s.settle();
    s.h.act(() => { s.workspace.viewDemandMatches("existing-demand"); s.workspace.selectRequest("provider-1", s.requirement); s.workspace.setPerspective("provider"); });
    view.close(); view = s.h.mount(s.Probe); await s.settle();
    assert.equal(s.workspace.activeDemandId, "existing-demand");
    assert.equal(s.workspace.selectedRequest.providerId, "provider-1");
    assert.equal(s.workspace.submittedDemand.quantity, 5000);
    assert.equal(s.workspace.perspective, "provider");
    view.close(); s.identity({ user: { id: "user-2" }, business: { id: "business-2" } });
    view = s.h.mount(s.Probe); await s.settle();
    assert.equal(s.workspace.selectedRequest, null); assert.equal(s.workspace.activeDemandId, null);
  } finally { view.close(); s.h.close(); }
});

test("real match history persists once and reloads from the database", async () => {
  const s = setup(); const view = s.h.mount(s.Probe);
  try {
    await s.settle(); s.h.act(() => s.workspace.viewDemandMatches("existing-demand"));
    s.h.act(() => { s.workspace.recordMatches({ evaluated: 7, bestScore: 94, strongMatches: 1 }); s.workspace.recordMatches({ evaluated: 7, bestScore: 94, strongMatches: 1 }); });
    await s.settle();
    assert.equal(s.workspace.demands[0].matchHistory.bestScore, 94);
    s.h.act(() => s.workspace.recordMatches({ evaluated: 7, bestScore: 94, strongMatches: 1 }));
    await s.h.act(async () => { await s.workspace.refresh(); });
    assert.equal(s.workspace.demands[0].matchHistory.bestScore, 94);
    assert.equal(s.workspace.demands[0].requirement.budgetMin, 0);
    assert.equal(s.state.calls.filter((call) => call.table === "demands" && call.operation === "update").length, 1);
  } finally { view.close(); s.h.close(); }
});

test("failed real queries show an error without demo substitution, and retry recovers", async () => {
  const s = setup(); s.state.fail = true; const view = s.h.mount(s.Probe);
  try {
    await s.settle(); assert.match(s.workspace.error, /Unable to load/); assert.deepEqual(s.workspace.providers, []); assert.deepEqual(s.workspace.demands, []);
    s.state.fail = false; await s.h.act(async () => { await s.workspace.refresh(); });
    assert.equal(s.workspace.error, ""); assert.equal(s.workspace.demands[0].id, "existing-demand");
  } finally { view.close(); s.h.close(); }
});

test("missing real identity never produces an apparently empty authenticated workspace", async () => {
  const s = setup("/dashboard/buyer", { identity: { user: null, business: null, identityError: "Account unavailable" } });
  const view = s.h.mount(s.Probe);
  try { await s.settle(); assert.equal(s.workspace.error, "Account unavailable"); assert.equal(s.state.calls.length, 0); }
  finally { view.close(); s.h.close(); }
});

test("anonymous real discovery can retry a network failure without requiring a business", async () => {
  const s = setup("/discover", { identity: { user: null, business: null } });
  s.state.fail = true; const view = s.h.mount(s.Probe);
  try {
    await s.settle(); assert.match(s.workspace.error, /Unable to load/);
    s.state.fail = false; await s.h.act(async () => { await s.workspace.refresh(); });
    assert.equal(s.workspace.error, ""); assert.equal(s.workspace.ready, true);
  } finally { view.close(); s.h.close(); }
});

test("corrupt session context restores safe empty values without database entities", () => {
  const s = setup();
  try {
    const { restoreWorkspaceSession } = s.h.load("lib/data/workspace-session.ts");
    assert.equal(restoreWorkspaceSession("broken").submittedDemand, null);
    const result = restoreWorkspaceSession(JSON.stringify({ draft: { quantity: "bad" }, submittedDemand: { quantity: -1 }, selectedRequest: { providerId: "demo-provider", demand: {} }, demands: [s.row] }));
    assert.equal(result.draft.quantity, null); assert.equal(result.selectedRequest, null); assert.equal(result.demands, undefined);
  } finally { s.h.close(); }
});

test("real request validation blocks paused, fully booked and zero-available providers", () => {
  const s = setup();
  try {
    const { validateRequestDraft } = s.h.load("lib/request-rules.ts");
    const { capacities } = s.h.load("data/capacities.ts");
    const { createRequestDraft } = s.h.load("lib/request-prefill.ts");
    const provider = capacities[0]; const draft = createRequestDraft(provider, s.requirement);
    for (const changed of [{ listingStatus: "paused" }, { listingStatus: "fully_booked" }, { availableCapacity: 0 }]) {
      assert.equal(validateRequestDraft(draft, undefined, [{ ...provider, ...changed }]).providerId, "Choose an available provider.");
    }
  } finally { s.h.close(); }
});
