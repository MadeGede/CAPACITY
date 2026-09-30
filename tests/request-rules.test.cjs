const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

function loadTypeScript(relativePath, imports = {}) {
  const filename = path.resolve(__dirname, "..", relativePath);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }, fileName: filename,
  });
  const loaded = { exports: {} };
  new Function("require", "module", "exports", outputText)((specifier) => {
    assert.ok(Object.hasOwn(imports, specifier), `Unexpected import: ${specifier}`);
    return imports[specifier];
  }, loaded, loaded.exports);
  return loaded.exports;
}

const data = loadTypeScript("data/capacities.ts");
const rules = loadTypeScript("lib/request-rules.ts", { "../data/capacities": data });
const identity = loadTypeScript("lib/demo-identity.ts");
const seed = loadTypeScript("data/requests.ts", { "./capacities": data, "../lib/request-rules": rules, "../lib/demo-identity": identity });
const { createRequest, validateRequestDraft, validateProposal, transitionRequest,
  addRequestMessage, setRequestProposal, statusLabels } = rules;
const now = new Date("2026-09-23T12:00:00");

function draft(overrides = {}) {
  return {
    providerId: "precision-works", buyerName: "Aruna Industrial Supply", capability: "CNC Milling", category: "CNC & Machining",
    quantity: 5000, unit: "units", location: "Jakarta", preferredStartDate: "2026-09-28", requiredCompletionDate: "2026-10-13",
    preferredLeadTimeDays: 15, urgency: "standard", budget: 115000000, budgetFlexibility: "slightly_flexible",
    materials: ["Aluminum"], description: "CNC-machined mounting components for industrial equipment.",
    technicalRequirements: "Tolerance ±0.05 mm", qualityRequirements: "First-article inspection", certifications: ["ISO 9001"],
    additionalNotes: "Delivery to Jakarta", attachments: [{ id: "spec-1", name: "components.pdf", type: "PDF" }],
    message: "Please review our production schedule.", demandType: "one-time", durationMonths: null,
    ...overrides,
  };
}

function proposal(overrides = {}) {
  return { quantity: 5000, unitPrice: 21500, startDate: "2026-09-28", completionDate: "2026-10-13", leadTimeDays: 15, notes: "Includes inspection.", ...overrides };
}

function pending(overrides = {}) {
  return createRequest(draft(overrides), "REQ-2026-TEST", now);
}

function negotiating() {
  return transitionRequest(pending(), "start_negotiation", "provider", "", now);
}

function proposed() {
  return setRequestProposal(negotiating(), proposal(), "provider", now);
}

function accepted() {
  return transitionRequest(proposed(), "accept_proposal", "buyer", "", now);
}

function deepFreeze(value) {
  Object.values(value).forEach((item) => { if (item && typeof item === "object") deepFreeze(item); });
  return Object.freeze(value);
}

test("request creation preserves all requirements with pending status, a submission event, and optional opening message", () => {
  const input = draft();
  assert.deepEqual(validateRequestDraft(input, "2026-09-23"), {});
  const request = createRequest(input, "REQ-2026-00199", now);
  assert.equal(request.id, "REQ-2026-00199");
  assert.equal(request.status, "pending_review");
  assert.equal(request.quantity, 5000);
  assert.equal(request.createdAt, now.toISOString());
  assert.equal(request.updatedAt, request.createdAt);
  assert.equal(request.timeline[0].title, "Request Submitted");
  assert.equal(request.timeline[0].actor, "buyer");
  assert.equal(request.messages[0].body, input.message);
  assert.equal(request.messages[0].author, "buyer");
  assert.equal(request.proposal, null);
  assert.deepEqual(request.attachments, input.attachments);
  assert.notEqual(request.attachments, input.attachments);
  assert.deepEqual(pending({ message: "  " }).messages, []);
  assert.throws(() => createRequest(input, "", now), /identifier/);
});

test("request validation rejects invalid provider, dates, quantities, budgets, units, and recurring duration", () => {
  for (const [change, field] of [
    [{ providerId: "missing" }, "providerId"], [{ buyerName: " " }, "buyerName"],
    [{ capability: " " }, "capability"], [{ quantity: 0 }, "quantity"], [{ quantity: NaN }, "quantity"],
    [{ quantity: -5 }, "quantity"], [{ quantity: 0.5 }, "quantity"], [{ unit: " " }, "unit"],
    [{ preferredStartDate: "2026-09-22" }, "preferredStartDate"],
    [{ preferredStartDate: "2026-02-30" }, "preferredStartDate"],
    [{ requiredCompletionDate: "2026-09-27" }, "requiredCompletionDate"],
    [{ requiredCompletionDate: "2026-13-30" }, "requiredCompletionDate"],
    [{ budget: null, budgetFlexibility: "fixed" }, "budget"],
    [{ budget: Infinity }, "budget"], [{ description: "brief" }, "description"],
    [{ demandType: "recurring", durationMonths: null }, "durationMonths"],
    [{ demandType: "recurring", durationMonths: 61 }, "durationMonths"],
  ]) assert.ok(validateRequestDraft(draft(change), "2026-09-23")[field], `${field}: ${JSON.stringify(change)}`);
  assert.deepEqual(validateRequestDraft(draft({ quantity: 0.5, unit: "tons", budget: null, budgetFlexibility: "flexible" }), "2026-09-23"), {});
  assert.deepEqual(validateRequestDraft(draft({ demandType: "recurring", durationMonths: 6 }), "2026-09-23"), {});
  assert.throws(() => createRequest(draft({ quantity: null }), "invalid", now), /quantity/);
});

test("attachment metadata requires unique IDs, nonempty names, and a supported visual file type", () => {
  assert.ok(validateRequestDraft(draft({ attachments: [{ id: "x", name: " ", type: "PDF" }] }), "2026-09-23").attachments);
  assert.ok(validateRequestDraft(draft({ attachments: [{ id: "x", name: "a.exe", type: "Program" }] }), "2026-09-23").attachments);
  assert.ok(validateRequestDraft(draft({ attachments: [{ id: "x", name: "a.pdf", type: "PDF" }, { id: "x", name: "b.pdf", type: "PDF" }] }), "2026-09-23").attachments);
});

test("provider review, negotiation, proposal, buyer acceptance, production, and completion form a complete valid flow", () => {
  let request = pending();
  request = transitionRequest(request, "start_review", "provider", "", now);
  assert.equal(request.status, "provider_reviewing");
  request = transitionRequest(request, "start_negotiation", "provider", "", now);
  assert.equal(request.status, "negotiation");
  request = setRequestProposal(request, proposal(), "provider", now);
  assert.equal(request.proposal.total, 107500000);
  request = transitionRequest(request, "accept_proposal", "buyer", "", now);
  assert.equal(request.status, "accepted");
  assert.equal(request.proposal.status, "accepted");
  request = transitionRequest(request, "start_collaboration", "buyer", "", now);
  assert.equal(request.status, "in_progress");
  request = transitionRequest(request, "complete", "provider", "", now);
  assert.equal(request.status, "completed");
  assert.deepEqual(request.timeline.map((item) => item.title), [
    "Request Submitted", "Provider Reviewing", "Negotiation Started", "Production Proposal Sent",
    "Proposal Accepted", "Production Started", "Production Completed",
  ]);
  assert.equal(new Set(request.timeline.map((item) => item.id)).size, request.timeline.length);
});

test("provider actions cannot be performed by a buyer and buyer agreement actions cannot be performed by a provider", () => {
  for (const action of ["start_review", "start_negotiation", "accept_request", "reject_request"]) {
    assert.throws(() => transitionRequest(pending(), action, "buyer", "Reason", now), /Only the provider/);
  }
  for (const action of ["accept_proposal", "request_revision", "cancel"]) {
    assert.throws(() => transitionRequest(proposed(), action, "provider", "Reason", now), /Only the buyer/);
  }
  assert.throws(() => setRequestProposal(negotiating(), proposal(), "buyer", now), /Only the provider/);
  assert.throws(() => addRequestMessage(pending(), "Hello", "admin", now), /buyer or provider/);
});

test("provider direct acceptance confirms original terms and cannot bypass an outstanding proposal", () => {
  const request = transitionRequest(pending(), "accept_request", "provider", "", now);
  assert.equal(request.status, "accepted");
  assert.equal(request.proposal, null);
  assert.match(request.timeline.at(-1).description, /original request terms/);
  assert.throws(() => transitionRequest(proposed(), "accept_request", "provider", "", now), /buyer must accept/);
  assert.throws(() => transitionRequest(request, "reject_request", "provider", "Capacity", now), /not available/);
  assert.throws(() => setRequestProposal(request, proposal(), "provider", now), /Start negotiation/);
});

test("proposal validation keeps quantity, price, total, start, completion, and lead time consistent", () => {
  assert.deepEqual(validateProposal(proposal(), "2026-09-23"), {});
  for (const [change, field] of [
    [{ quantity: 0 }, "quantity"], [{ unitPrice: -1 }, "unitPrice"],
    [{ unitPrice: Infinity }, "unitPrice"], [{ quantity: 1e12, unitPrice: 1e12 }, "unitPrice"],
    [{ startDate: "2026-09-22" }, "startDate"], [{ completionDate: "2026-09-27" }, "completionDate"],
    [{ completionDate: "2026-02-30" }, "completionDate"], [{ leadTimeDays: 12 }, "leadTimeDays"],
    [{ leadTimeDays: NaN }, "leadTimeDays"],
  ]) assert.ok(validateProposal(proposal(change), "2026-09-23")[field], field);
  assert.throws(() => setRequestProposal(pending(), proposal(), "provider", now), /Start negotiation/);
  assert.throws(() => setRequestProposal(negotiating(), proposal({ quantity: 5000.5 }), "provider", now), /whole-number/);
  const consistent = setRequestProposal(negotiating(), { ...proposal(), total: 1 }, "provider", now);
  assert.equal(consistent.proposal.total, 107500000); // Ignore any caller-supplied total.
});

test("a buyer revision requires a proposal and notes, blocks stale acceptance, and permits a replacement proposal", () => {
  assert.throws(() => transitionRequest(negotiating(), "request_revision", "buyer", "Earlier date", now), /current production proposal/);
  assert.throws(() => transitionRequest(proposed(), "request_revision", "buyer", " ", now), /Describe the changes/);
  const original = proposed();
  const revised = transitionRequest(original, "request_revision", "buyer", "Could the order finish in 12 days?", now);
  assert.equal(revised.status, "negotiation");
  assert.equal(revised.proposal.status, "revision_requested");
  assert.equal(revised.revisionNotes, "Could the order finish in 12 days?");
  assert.equal(revised.messages.at(-1).body, revised.revisionNotes);
  assert.throws(() => transitionRequest(revised, "accept_proposal", "buyer", "", now), /current production proposal/);
  const replacement = setRequestProposal(revised, proposal({ completionDate: "2026-10-10", leadTimeDays: 12 }), "provider", now);
  assert.notEqual(replacement.proposal.id, original.proposal.id);
  assert.equal(replacement.proposal.status, "proposed");
  assert.equal(replacement.revisionNotes, undefined);
  assert.equal(replacement.timeline.at(-1).title, "Revised Proposal Sent");
  assert.equal(transitionRequest(replacement, "accept_proposal", "buyer", "", now).status, "accepted");
});

test("rejection requires a reason and records it in the request and timeline", () => {
  assert.throws(() => transitionRequest(pending(), "reject_request", "provider", " ", now), /reason/);
  const rejected = transitionRequest(pending(), "reject_request", "provider", "Timeline Cannot Be Met", now);
  assert.equal(rejected.status, "rejected");
  assert.equal(rejected.rejectionReason, "Timeline Cannot Be Met");
  assert.equal(rejected.timeline.at(-1).description, "Timeline Cannot Be Met");
});

test("only a buyer can cancel before production, and only a provider can complete production", () => {
  for (const request of [pending(), negotiating(), accepted()]) {
    assert.equal(transitionRequest(request, "cancel", "buyer", "", now).status, "cancelled");
  }
  for (const actor of ["buyer", "provider"]) {
    const inProgress = transitionRequest(accepted(), "start_collaboration", actor, "", now);
    assert.equal(inProgress.status, "in_progress");
    assert.throws(() => transitionRequest(inProgress, "cancel", "buyer", "", now), /not available/);
    assert.throws(() => transitionRequest(inProgress, "complete", "buyer", "", now), /Only the provider/);
    assert.equal(transitionRequest(inProgress, "complete", "provider", "", now).status, "completed");
  }
  assert.throws(() => transitionRequest(pending(), "start_collaboration", "provider", "", now), /Accept the request/);
  assert.throws(() => transitionRequest(accepted(), "complete", "provider", "", now), /not available/);
});

test("discussion accepts trimmed local messages with stable status and timestamps", () => {
  const request = pending();
  const sent = addRequestMessage(request, "  Please confirm the alloy.  ", "provider", now);
  assert.equal(sent.messages.at(-1).body, "Please confirm the alloy.");
  assert.equal(sent.messages.at(-1).createdAt, now.toISOString());
  assert.equal(sent.messages.at(-1).author, "provider");
  assert.equal(sent.status, request.status);
  assert.equal(sent.timeline.length, request.timeline.length);
  assert.throws(() => addRequestMessage(request, "  ", "buyer", now), /Enter a message/);
  assert.throws(() => addRequestMessage(request, "a".repeat(10001), "buyer", now), /10,000/);
  assert.ok(addRequestMessage(accepted(), "Confirmed.", "buyer", now).messages.length > 0);
});

test("rejected, completed, and cancelled requests are terminal for transitions, proposals, and messaging", () => {
  const rejected = transitionRequest(pending(), "reject_request", "provider", "Capacity unavailable", now);
  const cancelled = transitionRequest(pending(), "cancel", "buyer", "", now);
  const completed = transitionRequest(transitionRequest(accepted(), "start_collaboration", "provider", "", now), "complete", "provider", "", now);
  for (const request of [rejected, cancelled, completed]) {
    for (const actor of ["buyer", "provider"]) {
      assert.throws(() => addRequestMessage(request, "Hello", actor, now), /cannot be changed/);
      assert.throws(() => setRequestProposal(request, proposal(), actor, now), /cannot be changed/);
      for (const action of ["start_review", "start_negotiation", "accept_request", "reject_request", "accept_proposal", "request_revision", "start_collaboration", "complete", "cancel"]) {
        assert.throws(() => transitionRequest(request, action, actor, "Reason", now), /cannot be changed/);
      }
    }
  }
});

test("events remain chronological if a caller supplies an older clock", () => {
  const later = new Date(now.getTime() + 3600000);
  const request = transitionRequest(pending(), "start_review", "provider", "", later);
  const negotiation = transitionRequest(request, "start_negotiation", "provider", "", now);
  assert.equal(negotiation.updatedAt, later.toISOString());
  const message = addRequestMessage(negotiation, "Updated timeline", "buyer", now);
  assert.equal(message.messages.at(-1).createdAt, later.toISOString());
  for (let index = 1; index < negotiation.timeline.length; index++) {
    assert.ok(negotiation.timeline[index].createdAt >= negotiation.timeline[index - 1].createdAt);
  }
});

test("operations do not mutate requests, proposal drafts, attachment arrays, or match context", () => {
  const initialDraft = draft({ matchContext: { score: 94, classification: "Strong Match", breakdown: { capability: 100, capacity: 100, location: 80, availability: 100, leadTime: 100, cost: 70, total: 94 }, explanations: { capability: "Exact", capacity: "Enough", location: "Nearby", availability: "Now", leadTime: "Fits", cost: "Partial" } } });
  const originalDraft = JSON.stringify(initialDraft);
  const request = createRequest(deepFreeze(initialDraft), "REQ-2026-IMMUTABLE", now);
  const originalRequest = JSON.stringify(request);
  deepFreeze(request);
  transitionRequest(request, "start_review", "provider", "", now);
  addRequestMessage(request, "Confirming dimensions", "buyer", now);
  assert.equal(JSON.stringify(request), originalRequest);
  assert.equal(JSON.stringify(initialDraft), originalDraft);
  const productionProposal = deepFreeze(proposal());
  const beforeProposal = JSON.stringify(productionProposal);
  setRequestProposal(deepFreeze(negotiating()), productionProposal, "provider", now);
  assert.equal(JSON.stringify(productionProposal), beforeProposal);
  assert.notEqual(request.matchContext, initialDraft.matchContext);
});

test("demo seeds use the required IDs and providers, credible states, valid totals, and ordered history", () => {
  const requests = seed.demoRequests;
  assert.equal(new Set(requests.map((request) => request.id)).size, requests.length);
  for (const [id, providerId, status] of [
    ["REQ-2026-00124", "precision-works", "negotiation"],
    ["REQ-2026-00118", "packpro-indonesia", "accepted"],
    ["REQ-2026-00105", "protolab", "completed"],
    ["REQ-2026-00131", "nusantara-plastics", "pending_review"],
  ]) {
    const request = requests.find((item) => item.id === id);
    assert.equal(request.providerId, providerId);
    assert.equal(request.status, status);
  }
  assert.ok(requests.some((request) => request.status === "in_progress"));
  assert.ok(requests.some((request) => request.status === "provider_reviewing"));
  assert.ok(requests.some((request) => request.status === "rejected"));
  assert.equal(Object.keys(statusLabels).length, 8);
  for (const request of requests) {
    assert.ok(data.getCapacity(request.providerId));
    assert.equal(request.timeline[0].title, "Request Submitted");
    for (let index = 1; index < request.timeline.length; index++) assert.ok(request.timeline[index].createdAt >= request.timeline[index - 1].createdAt);
    if (request.proposal) assert.equal(request.proposal.total, Math.round(request.proposal.quantity * request.proposal.unitPrice));
    assert.ok(request.updatedAt >= request.timeline.at(-1).createdAt);
    assert.ok(request.messages.every((message) => message.createdAt <= request.updatedAt));
  }
});
