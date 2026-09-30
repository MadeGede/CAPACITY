const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createHarness } = require("./helpers/dom-harness.cjs");

function dateAfter(days) {
  const date = new Date(); date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

test("demand wizard validates, preserves all seven steps, edits review, and submits to matching", async () => {
  const h = createHarness("http://localhost:3000/match");
  const { MatchForm } = h.load("components/matching/match-form.tsx");
  const mounted = h.mount(MatchForm);
  const field = (name) => mounted.container.querySelector(`#demand-${name}`);
  const submit = () => h.click(mounted.container.querySelector('button[type="submit"]'));
  try {
    submit();
    assert.ok(mounted.container.querySelector('[role="alert"]'));
    assert.equal(field("category").getAttribute("aria-invalid"), "true");
    h.change(field("category"), "CNC & Machining");
    assert.ok(Array.from(field("capability").options).some((option) => option.value === "CNC Milling"));
    h.change(field("capability"), "CNC Milling");
    h.change(field("description"), "Aluminum housings for an industrial production fixture.");
    submit();
    h.change(field("quantity"), "5000");
    submit();
    h.change(field("location"), "Jakarta");
    h.change(field("maxDistanceKm"), "50");
    submit();
    h.change(field("completionDate"), dateAfter(30));
    h.change(field("maxLeadTimeDays"), "21");
    submit();
    h.change(field("budgetMin"), "90000000");
    h.change(field("budgetMax"), "125000000");
    assert.equal(field("budgetMax").value, "125.000.000");
    submit();
    const aluminum = Array.from(mounted.container.querySelectorAll("label")).find((label) => label.textContent.includes("Aluminum"));
    h.click(aluminum.querySelector("input"));
    h.change(field("qualityRequirements"), "First article dimensional inspection.");
    submit();
    assert.match(mounted.container.textContent, /Review your requirement/);
    assert.match(mounted.container.textContent, /5,000 units/);
    h.click(mounted.container.querySelector('[aria-label="Edit Quantity"]'));
    h.change(field("quantity"), "4500");
    submit();
    assert.match(mounted.container.textContent, /4,500 units/);
    submit();
    assert.match(mounted.container.textContent, /Analyzing production requirement/);
    await h.act(async () => { await new Promise((resolve) => setTimeout(resolve, 800)); });
    assert.deepEqual(h.navigations, ["/match/results"]);
    const stored = JSON.parse(localStorage.getItem("capacity-demand-v1"));
    assert.equal(stored.submittedDemand.quantity, 4500);
    assert.deepEqual(stored.submittedDemand.materials, ["Aluminum"]);
    assert.equal(stored.submittedDemand.qualityRequirements, "First article dimensional inspection.");
  } finally { mounted.close(); h.close(); }
});

test("changing category resets incompatible capability, material selection and unit", () => {
  const h = createHarness("http://localhost:3000/match");
  const options = h.load("lib/demand-options.ts");
  const demand = { ...options.createEmptyDemand(), category: "CNC & Machining", capability: "CNC Milling", description: "Aluminum housings for a manufacturing fixture.", quantity: 5000, completionDate: dateAfter(30), materials: ["Aluminum"], budgetFlexible: true };
  localStorage.setItem("capacity-demand-v1", JSON.stringify({ draft: demand }));
  const mounted = h.mount(h.load("components/matching/match-form.tsx").MatchForm);
  try {
    h.click(mounted.container.querySelector('[aria-label="Edit Production Requirement"]'));
    h.change(mounted.container.querySelector("#demand-category"), "Packaging");
    assert.equal(mounted.container.querySelector("#demand-capability").value, "");
    const stored = JSON.parse(localStorage.getItem("capacity-demand-v1"));
    assert.equal(stored.draft.unit, "packages");
    assert.deepEqual(stored.draft.materials, []);
  } finally { mounted.close(); h.close(); }
});

test("direct request starts empty, validates, previews attachments, and persists only after send", () => {
  const h = createHarness("http://localhost:3000/request/precision-works");
  const provider = h.load("data/capacities.ts").getCapacity("precision-works");
  const mounted = h.mount(h.load("components/requests/request-form.tsx").RequestForm, { provider });
  const field = (name) => mounted.container.querySelector(`#request-${name}`);
  const submit = () => h.click(mounted.container.querySelector('button[type="submit"]'));
  try {
    assert.equal(field("capability").value, "");
    assert.equal(field("quantity").value, "");
    const initialCount = JSON.parse(localStorage.getItem("capacity-requests-v1")).requests.length;
    submit();
    assert.equal(field("capability").getAttribute("aria-invalid"), "true");
    h.change(field("capability"), "CNC Milling");
    h.change(field("quantity"), "5000");
    h.change(field("requiredCompletionDate"), dateAfter(30));
    h.change(field("budget"), "110000000");
    h.change(field("description"), "Machined aluminum housings with first-article inspection.");
    h.change(field("attachmentName"), "component-specification.pdf");
    h.click(Array.from(mounted.container.querySelectorAll("button")).find((button) => button.textContent === "Add Attachment"));
    h.change(field("message"), "Please review the production specification and schedule.");
    submit();
    assert.match(mounted.container.textContent, /Request Summary/);
    assert.match(mounted.container.textContent, /component-specification.pdf/);
    assert.equal(JSON.parse(localStorage.getItem("capacity-requests-v1")).requests.length, initialCount);
    submit();
    assert.equal(h.navigations.length, 1);
    assert.match(h.navigations[0], /^\/requests\/REQ-/);
    const stored = JSON.parse(localStorage.getItem("capacity-requests-v1")).requests[0];
    assert.equal(stored.status, "pending_review");
    assert.equal(stored.providerId, provider.id);
    assert.equal(stored.quantity, 5000);
    assert.equal(stored.attachments[0].name, "component-specification.pdf");
    assert.equal(stored.messages[0].body, "Please review the production specification and schedule.");
  } finally { mounted.close(); h.close(); }
});

test("matched request carries selected demand and original match context without rescoring", () => {
  const h = createHarness("http://localhost:3000/request/precision-works");
  const provider = h.load("data/capacities.ts").getCapacity("precision-works");
  const options = h.load("lib/demand-options.ts");
  const demand = { ...options.createEmptyDemand(), category: provider.category, capability: "CNC Milling", description: "Aluminum components for a production fixture.", quantity: 5000, completionDate: dateAfter(25), budgetFlexible: true, materials: ["Aluminum"], technicalNotes: "Tolerance ±0.05 mm." };
  const result = h.load("lib/matching.ts").rankProviders(demand).find((result) => result.provider.id === provider.id);
  const matchContext = { score: result.score, classification: result.classification, breakdown: result.breakdown, explanations: result.explanations };
  localStorage.setItem("capacity-demand-v1", JSON.stringify({ draft: demand, submittedDemand: demand, selectedRequest: { providerId: provider.id, demand, createdAt: new Date().toISOString(), matchContext } }));
  const mounted = h.mount(h.load("components/requests/request-form.tsx").RequestForm, { provider });
  try {
    assert.equal(mounted.container.querySelector("#request-capability").value, "CNC Milling");
    assert.equal(mounted.container.querySelector("#request-quantity").value, "5000");
    assert.equal(mounted.container.querySelector("#request-technicalRequirements").value, "Tolerance ±0.05 mm.");
    assert.match(mounted.container.textContent, /Matched through CAPACITY/);
    assert.match(mounted.container.textContent, new RegExp(`${matchContext.score}%`));
    h.change(mounted.container.querySelector("#request-quantity"), "9000");
    assert.match(mounted.container.textContent, new RegExp(`${matchContext.score}%`));
  } finally { mounted.close(); h.close(); }
});
