const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createHarness } = require("./helpers/dom-harness.cjs");

function button(container, name) { return Array.from(container.querySelectorAll("button")).find((item) => item.textContent.trim() === name); }

test("public explanation uses the unchanged scorer, actual factor scores and seeded proposal", () => {
  const h = createHarness("http://localhost:3000/how-it-works");
  try {
    const story = h.load("lib/product-explanation.ts");
    const { MATCH_WEIGHTS, calculateMatchScore } = h.load("lib/matching.ts");
    const scenario = story.getIllustrativeScenario();
    assert.deepEqual(Object.values(MATCH_WEIGHTS), [.3, .2, .15, .15, .1, .1]);
    assert.deepEqual(scenario.factors.map((item) => item.score), [100, 90, 80, 100, 100, 85]);
    assert.deepEqual(scenario.factors.map((item) => item.contribution), [30, 18, 12, 15, 10, 8.5]);
    assert.equal(scenario.weightedTotal, 93.5);
    assert.equal(scenario.match.score, 94);
    assert.deepEqual(scenario.match, calculateMatchScore(scenario.match.provider, scenario.demand, scenario.evaluatedAt));
    assert.equal(scenario.proposal.quantity * scenario.proposal.unitPrice, 107500000);
    assert.equal(scenario.proposal.total, 107500000);
    assert.equal(scenario.proposal.leadTimeDays, 15);
    assert.equal(story.productFaq.length, 6);
  } finally { h.close(); }
});

test("how-it-works exposes seven stages, six truthful factors, semantic architecture and working destinations", () => {
  const h = createHarness("http://localhost:3000/how-it-works");
  let view;
  try {
    const page = h.load("app/how-it-works/page.tsx");
    assert.match(page.metadata.title, /How CAPACITY Works/);
    view = h.mount(page.default);
    const { container } = view;
    assert.equal(container.querySelector('[aria-label="Complete CAPACITY workflow"]').children.length, 7);
    assert.equal(container.querySelectorAll("details").length, 6);
    assert.equal(container.querySelectorAll("table tbody tr").length, 6);
    assert.match(container.querySelector("table tfoot").textContent, /93\.5/);
    assert.match(container.textContent, /4,550 units/);
    assert.match(container.textContent, /not confirmed coverage/);
    assert.match(container.textContent, /upper end exceeds/);
    assert.match(container.textContent, /not active/);
    assert.match(container.textContent, /not implemented/);
    assert.match(container.textContent, /Supabase Auth/);
    assert.match(container.textContent, /does not automatically reserve or release/);
    for (const anchor of container.querySelectorAll('nav[aria-label="Product explanation sections"] a')) assert.ok(container.querySelector(anchor.getAttribute("href")));
    assert.ok(container.querySelector('a[href="/discover"]'));
    h.click(button(container, "Start Competition Demo"));
    assert.equal(h.navigations.at(-1), "/dashboard/buyer");
  } finally { view?.close(); h.close(); }
});

test("demo guide is opt-in, preserves existing edits and follows the latest request without business transitions", () => {
  const h = createHarness("http://localhost:3000/dashboard/buyer");
  let view;
  try {
    const { React } = h;
    const presentation = h.load("lib/competition-presentation.ts");
    const { StartCompetitionDemo } = h.load("components/competition/start-demo.tsx");
    const { CompetitionDemoGuide } = h.load("components/competition/demo-guide.tsx");
    const { DemoExplanationCallout } = h.load("components/competition/explanation-callout.tsx");
    let requests, demands, catalog;
    function Rehearsal() {
      requests = h.load("lib/request-store.ts").useRequestState();
      demands = h.load("lib/demand-store.ts").useDemandState();
      catalog = h.load("lib/capacity-store.ts").useCapacityCatalog();
      return React.createElement(React.Fragment, null, React.createElement(StartCompetitionDemo), React.createElement(CompetitionDemoGuide), React.createElement(DemoExplanationCallout, { id: "test" }, "Six factors, explained."));
    }
    view = h.mount(Rehearsal);
    assert.equal(view.container.querySelector("aside"), null);
    assert.equal(view.container.querySelector("dialog"), null);
    const original = structuredClone(requests.requests);
    h.act(() => catalog.setListingStatus("precision-works", "paused"));
    h.click(button(view.container, "Start Competition Demo"));
    assert.equal(h.navigations.at(-1), "/dashboard/buyer");
    assert.deepEqual(requests.requests, original);
    assert.equal(catalog.providers.find((item) => item.id === "precision-works").listingStatus, "paused");
    assert.equal(demands.submittedDemand.quantity, 5000);
    assert.equal(requests.perspective, "buyer");
    assert.ok(view.container.querySelector("aside"));
    h.act(() => catalog.setListingStatus("precision-works", "active"));
    const guide = () => {
      h.act(() => presentation.openCompetitionGuide());
      const dialog = view.container.querySelector("dialog[open]");
      assert.ok(dialog);
      assert.equal(document.body.style.overflow, "hidden");
      assert.equal(dialog.querySelectorAll('[aria-label="Competition demo steps"] li').length, 8);
      return dialog;
    };
    const go = (index) => { const dialog = guide(); h.click(dialog.querySelectorAll('[aria-label="Competition demo steps"] button')[index]); assert.equal(document.body.style.overflow, ""); };
    go(0); assert.equal(h.navigations.at(-1), "/#about");
    go(1); assert.equal(h.navigations.at(-1), "/dashboard/demands#demand-demo-cnc");
    go(2); assert.equal(h.navigations.at(-1), "/match/results");
    go(3); assert.equal(h.navigations.at(-1), "/capacity/precision-works?from=matches");
    assert.equal(demands.selectedRequest.matchContext.score, 94);
    go(4); assert.equal(h.navigations.at(-1), "/request/precision-works");
    let created;
    const seeded = requests.requests.find((item) => item.id === "REQ-2026-00124");
    h.act(() => { created = requests.create({ ...seeded, proposal: undefined, id: undefined, message: "Competition rehearsal" }); });
    assert.ok(created?.id);
    go(5); assert.equal(h.navigations.at(-1), `/requests/${created.id}`); assert.equal(requests.perspective, "provider");
    go(6); assert.equal(h.navigations.at(-1), `/requests/${created.id}`); assert.equal(requests.perspective, "buyer");
    assert.equal(requests.requests.find((item) => item.id === created.id).status, "pending_review");
    go(7); assert.equal(h.navigations.at(-1), "/#impact");
    const dialog = guide();
    for (const href of ["/dashboard/buyer", "/dashboard/provider", "/dashboard/capacity", "/dashboard/collaborations", "/how-it-works#architecture"]) assert.ok(dialog.querySelector(`a[href="${href}"]`));
    h.click(button(dialog, "Hide guide and explanations"));
    assert.equal(view.container.querySelector("aside"), null);
    assert.equal(view.container.querySelector("dialog"), null);
  } finally { view?.close(); h.close(); }
});

test("explicit competition entry from real mode selects only independent demo state", () => {
  let selectedMode;
  const mode = { useDataMode: () => ({ mode: "real", ready: true, user: null, business: null, chooseMode: (value) => { selectedMode = value; } }), DataModeProvider: ({ children }) => children };
  const h = createHarness("http://localhost:3000/how-it-works", { "@/lib/data/mode": mode, "./mode": mode, "@/lib/supabase/client": { getSupabaseBrowserClient: () => { throw new Error("Competition entry must not contact the real workspace"); } } });
  let view;
  try {
    view = h.mount(h.load("components/competition/start-demo.tsx").StartCompetitionDemo);
    h.click(button(view.container, "Start Competition Demo"));
    assert.equal(selectedMode, "demo");
    assert.equal(h.navigations.at(-1), "/dashboard/buyer");
    assert.equal(JSON.parse(sessionStorage.getItem("capacity-competition-presentation-v1")).active, true);
  } finally { view?.close(); h.close(); }
});

test("dismissals survive refresh and presentation never appears in real mode", () => {
  const h = createHarness("http://localhost:3000/how-it-works");
  let view;
  try {
    const presentation = h.load("lib/competition-presentation.ts");
    h.act(() => presentation.beginCompetitionPresentation());
    const { DemoExplanationCallout } = h.load("components/competition/explanation-callout.tsx");
    view = h.mount(DemoExplanationCallout, { id: "matching", children: "Why this match?" });
    h.click(view.container.querySelector('[aria-label="Dismiss demo explanation"]'));
    assert.equal(view.container.querySelector("aside"), null);
    assert.deepEqual(JSON.parse(sessionStorage.getItem("capacity-competition-presentation-v1")).dismissed, ["matching"]);
    view.close();
    // Reload the module in a fresh harness while preserving the browser-session payload.
    const stored = sessionStorage.getItem("capacity-competition-presentation-v1");
    const refresh = createHarness("http://localhost:3000/how-it-works");
    sessionStorage.setItem("capacity-competition-presentation-v1", stored);
    const refreshed = refresh.mount(refresh.load("components/competition/explanation-callout.tsx").DemoExplanationCallout, { id: "matching", children: "Why this match?" });
    assert.equal(refreshed.container.querySelector("aside"), null);
    refreshed.close(); refresh.close();
    const realMode = { useDataMode: () => ({ mode: "real", ready: true, user: null, business: null }), DataModeProvider: ({ children }) => children };
    const real = createHarness("http://localhost:3000/how-it-works", { "@/lib/data/mode": realMode, "./mode": realMode });
    real.load("lib/competition-presentation.ts").beginCompetitionPresentation();
    const realView = real.mount(real.load("components/competition/explanation-callout.tsx").DemoExplanationCallout, { id: "real", children: "Hidden in real mode" });
    assert.equal(realView.container.textContent, "");
    realView.close();
    const realGuide = real.mount(real.load("components/competition/demo-guide.tsx").CompetitionDemoGuide);
    assert.equal(realGuide.container.textContent, "");
    realGuide.close(); real.close(); view = null;
  } finally { view?.close(); h.close(); }
});
