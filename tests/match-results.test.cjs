const assert = require("node:assert/strict");
const { test, after } = require("node:test");
const { createHarness } = require("./helpers/dom-harness.cjs");
const harness = createHarness("http://localhost:3000/match/results");
const { MatchResults } = harness.load("components/matching/match-results.tsx");
const { useDemandState } = harness.load("lib/demand-store.ts");
const { createEmptyDemand, localDateString } = harness.load("lib/demand-options.ts");
const { rankProviders } = harness.load("lib/matching.ts");
const { capacities } = harness.load("data/capacities.ts");
let store;
function StoreObserver() { store = useDemandState(); return null; }
const observer = harness.mount(StoreObserver);
const { act, click, change } = harness;
after(() => { observer.close(); harness.close(); });

function demand(overrides = {}) {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return { ...createEmptyDemand(), category: "CNC & Machining", capability: "CNC Milling", description: "Precision aluminum housings for an industrial customer.", quantity: 5000, unit: "units", completionDate: localDateString(date), maxLeadTimeDays: 21, budgetFlexible: true, ...overrides };
}
function start(value = demand()) { act(() => store.submitDemand(value)); return harness.mount(MatchResults); }
function button(container, text) { return Array.from(container.querySelectorAll("button")).find((node) => node.textContent.trim() === text); }
function checkbox(container, text) { return Array.from(container.querySelectorAll("label")).find((node) => node.textContent.trim() === text)?.querySelector("input"); }

test("unsubmitted demand presents a working start link", () => {
  act(() => store.newDemand());
  const view = harness.mount(MatchResults);
  assert.match(view.container.textContent, /Start with your production requirements/);
  assert.equal(view.container.querySelector('a[href="/match"]').textContent.trim(), "Create Requirements");
  view.close();
});

test("results preserve ranked order, show six initial providers, and expose weighted analyses", () => {
  const value = demand();
  const ranked = rankProviders(value);
  const view = start(value);
  assert.equal(view.container.querySelectorAll("article").length, 6);
  assert.equal(view.container.querySelector("article h2").textContent, ranked[0].provider.name);
  assert.match(view.container.querySelector("article").textContent, /Best Match/);
  assert.equal(view.container.querySelector("article h2 a").getAttribute("href"), `/capacity/${ranked[0].provider.id}?from=matches`);
  const analysis = view.container.querySelector("article details");
  assert.match(analysis.textContent, /30% weight/);
  assert.equal(analysis.querySelectorAll('[role="meter"]').length, 6);
  click(button(view.container, "Show more providers"));
  assert.equal(view.container.querySelectorAll("article").length, 12);
  view.close();
});

test("result filters combine, show an empty state, and clear without changing the demand", () => {
  const view = start();
  click(checkbox(view.container, "Verified Only"));
  click(checkbox(view.container, "Available Now"));
  change(view.container.querySelector('[aria-label="Filter matches by location"]'), "Bekasi");
  for (const article of view.container.querySelectorAll("article")) {
    assert.match(article.textContent, /Bekasi, Indonesia/);
    assert.match(article.textContent, /Verified/);
    assert.match(article.textContent, /Available Now/);
  }
  change(view.container.querySelector('[aria-label="Filter matches by lead time"]'), "7");
  change(view.container.querySelector('[aria-label="Filter matches by location"]'), "Tangerang");
  assert.equal(view.container.querySelectorAll("article").length, 0);
  assert.match(view.container.textContent, /No providers match these filters/);
  click(button(view.container, "Clear Filters"));
  assert.equal(view.container.querySelectorAll("article").length, 6);
  assert.equal(store.submittedDemand.capability, "CNC Milling");
  view.close();
});

test("sorting changes result order and retains the original best-match identity", () => {
  const view = start();
  change(view.container.querySelector('[aria-label="Sort matched providers"]'), "capacity");
  const largest = [...capacities].sort((a, b) => b.availableCapacity - a.availableCapacity)[0];
  assert.equal(view.container.querySelector("article h2").textContent, largest.name);
  change(view.container.querySelector('[aria-label="Sort matched providers"]'), "lead");
  assert.match(view.container.querySelector("article").textContent, /Immediate/);
  change(view.container.querySelector('[aria-label="Sort matched providers"]'), "cost");
  const comparable = rankProviders(store.submittedDemand).filter((result) => result.estimatedCost).sort((a, b) => a.estimatedCost.min - b.estimatedCost.min || b.score - a.score);
  assert.equal(view.container.querySelector("article h2").textContent, comparable[0].provider.name);
  view.close();
});

test("edit restores the submitted requirement and request actions keep provider and demand together", () => {
  const submitted = demand();
  const view = start(submitted);
  act(() => store.saveDraft({ ...submitted, quantity: 9000 }));
  const edit = Array.from(view.container.querySelectorAll("a")).find((node) => node.textContent.trim() === "Edit Requirements");
  edit.addEventListener("click", (event) => event.preventDefault());
  click(edit);
  assert.equal(store.draft.quantity, 5000);
  const first = view.container.querySelector("article");
  const providerId = first.getAttribute("aria-labelledby").replace("match-", "");
  click(button(first, "Request Capacity"));
  assert.equal(store.selectedRequest.providerId, providerId);
  assert.deepEqual(store.selectedRequest.demand, submitted);
  assert.equal(harness.navigations.at(-1), `/request/${providerId}`);
  view.close();
});

test("low-fit demands keep partial results and surface unsupported requirements", () => {
  const view = start(demand({ quantity: 1_000_000_000, unit: "production hours", maxLeadTimeDays: 7, budgetFlexible: false, budgetMax: 1, certifications: ["HACCP"], materials: ["unlisted alloy"] }));
  assert.match(view.container.textContent, /No strong matches yet/);
  assert.equal(view.container.querySelectorAll("article").length, 6);
  assert.match(view.container.querySelector("article").textContent, /HACCP/);
  assert.match(view.container.querySelector("article").textContent, /unlisted alloy/);
  view.close();
});
