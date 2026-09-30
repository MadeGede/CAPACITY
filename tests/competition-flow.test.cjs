const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createHarness } = require("./helpers/dom-harness.cjs");

function button(container, name) { return Array.from(container.querySelectorAll("button")).find((node) => node.textContent.trim() === name); }
function dateAfter(days) { const date = new Date(); date.setDate(date.getDate() + days); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }

// Component/store rehearsal, not a claim of native-browser or visual verification.
test("competition UI connects demo entry, demand, 94% match, proposal and collaboration", async () => {
  const h = createHarness("http://localhost:3000/");
  let view;
  const open = (file, name, props = {}) => { view?.close(); view = h.mount(h.load(file)[name], props); return view.container; };
  const flush = async () => h.act(async () => { await Promise.resolve(); });
  try {
    let container = open("components/dashboard/dashboard-shell.tsx", "DashboardShell", { children: "Demo rehearsal" });
    await flush();
    h.click(button(container, "Reset Demo"));
    h.click(button(container.querySelector("dialog[open]"), "Reset Demo"));
    assert.equal(h.navigations.at(-1), "/dashboard/buyer");
    container = open("components/site/header.tsx", "Header");
    h.click(button(container, "Explore Demo"));
    assert.equal(h.navigations.at(-1), "/dashboard/buyer");
    container = open("components/dashboard/overview.tsx", "DashboardOverview", { role: "buyer" });
    assert.match(container.textContent, /NusaTech Industries/);
    const initialMetric = Array.from(container.querySelectorAll("p")).find((node) => node.textContent === "Active Collaborations");
    const previousCollaborations = Number(initialMetric.nextElementSibling.textContent);
    h.click(button(container, "View Matches"));
    assert.equal(h.navigations.at(-1), "/match/results");
    container = open("components/matching/match-results.tsx", "MatchResults");
    const match = Array.from(container.querySelectorAll("article")).find((node) => node.textContent.includes("Precision Works"));
    assert.match(match.textContent, /94%/);
    h.click(match.querySelector("summary"));
    assert.equal(match.querySelector("details").open, true);
    assert.equal(match.querySelectorAll('[role="meter"]').length, 6);
    const providerLink = match.querySelector('a[href*="/capacity/precision-works"]');
    providerLink.addEventListener("click", (event) => event.preventDefault(), { once: true });
    h.click(providerLink);
    const capacity = h.load("data/capacities.ts").capacities.find((item) => item.id === "precision-works");
    container = open("components/capacity/capacity-detail.tsx", "CapacityDetail", { capacity, similar: [] });
    assert.match(container.textContent, /94% Compatibility/);
    h.click(button(container, "Request Capacity"));
    assert.equal(h.navigations.at(-1), "/request/precision-works");
    container = open("components/requests/request-form.tsx", "RequestForm", { provider: capacity });
    assert.equal(container.querySelector("#request-quantity").value, "5000");
    assert.match(container.textContent, /94%/);
    h.click(button(container, "Review Request"));
    h.click(button(container, "Send Capacity Request")); await flush();
    const id = h.navigations.at(-1).split("/").at(-1);
    assert.match(id, /^REQ-/);
    container = open("components/requests/request-detail.tsx", "RequestDetail", { id });
    h.change(container.querySelector('[aria-label="Demo perspective"]'), "provider");
    h.click(button(container, "Review Request")); await flush();
    assert.match(container.textContent, /Provider Reviewing/);
    h.click(button(container, "Start Negotiation")); await flush();
    h.click(button(container, "Send Proposal"));
    h.change(container.querySelector("#proposal-price"), "21500");
    h.change(container.querySelector("#proposal-start"), dateAfter(0));
    h.change(container.querySelector("#proposal-completion"), dateAfter(15));
    assert.match(container.textContent, /Rp107\.500\.000/);
    assert.match(container.textContent, /15 days/);
    h.click(container.querySelector('form[aria-label="Production proposal"] button[type="submit"]')); await flush();
    h.change(container.querySelector('[aria-label="Demo perspective"]'), "buyer");
    h.click(button(container, "Accept Proposal")); h.click(button(container, "Confirm")); await flush();
    h.click(button(container, "Start Collaboration")); h.click(button(container, "Confirm")); await flush();
    assert.match(container.textContent, /In Progress/);
    container = open("components/dashboard/collaborations-list.tsx", "CollaborationsList");
    assert.match(container.textContent, /Precision Works/);
    assert.ok(container.querySelector(`a[href="/requests/${id}"]`));
    container = open("components/dashboard/overview.tsx", "DashboardOverview", { role: "buyer" });
    const metric = Array.from(container.querySelectorAll("p")).find((node) => node.textContent === "Active Collaborations");
    assert.equal(Number(metric.nextElementSibling.textContent), previousCollaborations + 1);
    container = open("components/dashboard/dashboard-shell.tsx", "DashboardShell", { children: "Demo rehearsal" });
    assert.ok(container.querySelector('a[href="/#impact"]'));
    assert.ok(container.querySelector('a[href="/how-it-works#architecture"]'));
  } finally { view?.close(); h.close(); }
});

test("malformed stored proposals cannot restore impossible totals or dates", () => {
  const h = createHarness();
  let view;
  try {
    const original = h.load("data/requests.ts").demoRequests.find((request) => request.id === "REQ-2026-00124");
    const corrupt = [
      { ...structuredClone(original), id: "bad-total", proposal: { ...original.proposal, total: 0 } },
      { ...structuredClone(original), id: "bad-price", proposal: { ...original.proposal, unitPrice: -1 } },
      { ...structuredClone(original), id: "bad-date", proposal: { ...original.proposal, completionDate: original.proposal.startDate } },
    ];
    localStorage.setItem("capacity-requests-v1", JSON.stringify({ requests: [...corrupt, original], perspective: "buyer" }));
    const { useRequestState } = h.load("lib/request-store.ts");
    let restored;
    function Probe() { restored = useRequestState(); return null; }
    view = h.mount(Probe);
    assert.deepEqual(restored.requests.map((request) => request.id), [original.id]);
    assert.equal(restored.requests[0].proposal.total, 107500000);
  } finally { view?.close(); h.close(); }
});
