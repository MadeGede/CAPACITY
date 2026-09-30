const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test, after } = require("node:test");
const ts = require("typescript");
const { JSDOM } = require("jsdom");

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost:3000/match" });
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;
Object.defineProperty(global, "navigator", { configurable: true, value: dom.window.navigator });
global.IS_REACT_ACT_ENVIRONMENT = true;
const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = React;
after(() => dom.window.close());

function createLoader() {
  const cache = new Map();
  const root = path.resolve(__dirname, "..");
  function load(relative) {
    let filename = path.resolve(root, relative);
    if (!path.extname(filename)) filename += ".ts";
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), { fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } });
    new Function("require", "module", "exports", outputText)((specifier) => {
      if (specifier.startsWith("@/")) return load(specifier.slice(2));
      if (specifier.startsWith(".")) return load(path.resolve(path.dirname(filename), specifier));
      return require(specifier);
    }, module, module.exports);
    return module.exports;
  }
  return load;
}

function validDemand(options) {
  const date = new Date();
  date.setDate(date.getDate() + 21);
  return { ...options.createEmptyDemand(), category: "CNC & Machining", capability: "CNC Milling", description: "Aluminum housings for a production fixture.", quantity: 5000, completionDate: options.localDateString(date), budgetFlexible: true };
}

test("wizard validation rejects missing fields and invalid category/capability combinations", () => {
  const options = createLoader()("lib/demand-options.ts");
  const blank = options.createEmptyDemand();
  const errors = options.validateDemand(blank);
  for (const field of ["category", "capability", "description", "quantity", "completionDate", "budgetMax"]) assert.ok(errors[field], field);
  const valid = validDemand(options);
  assert.deepEqual(options.validateDemand(valid), {});
  assert.ok(options.validateDemandStep({ ...valid, capability: "Injection Molding" }, 0).capability);
  assert.ok(options.validateDemandStep({ ...valid, description: "short" }, 0).description);
});

test("quantity validation handles recurring production, count units, mass, and safe numeric bounds", () => {
  const options = createLoader()("lib/demand-options.ts");
  const demand = validDemand(options);
  for (const quantity of [0, -1, NaN, Infinity, 1e20, 0.5]) assert.ok(options.validateDemandStep({ ...demand, quantity }, 1).quantity);
  assert.deepEqual(options.validateDemandStep({ ...demand, quantity: 0.5, unit: "tons" }, 1), {});
  const recurring = { ...demand, demandType: "recurring", monthlyQuantity: 2000, durationMonths: 6 };
  assert.deepEqual(options.validateDemandStep(recurring, 1), {});
  assert.ok(options.validateDemandStep({ ...recurring, monthlyQuantity: 0 }, 1).monthlyQuantity);
  assert.ok(options.validateDemandStep({ ...recurring, durationMonths: 61 }, 1).durationMonths);
});

test("date validation rejects missing, past, today, and nonexistent calendar dates", () => {
  const options = createLoader()("lib/demand-options.ts");
  const demand = validDemand(options);
  for (const completionDate of ["", "2026-02-30", "2026-08-01", "2026-09-23", "not-a-date"]) assert.ok(options.validateDemandStep({ ...demand, completionDate }, 3, "2026-09-23").completionDate);
  assert.deepEqual(options.validateDemandStep({ ...demand, completionDate: "2026-09-24" }, 3, "2026-09-23"), {});
});

test("budget validation enforces a finite range but accepts flexible budgets", () => {
  const options = createLoader()("lib/demand-options.ts");
  const demand = { ...validDemand(options), budgetFlexible: false };
  assert.ok(options.validateDemandStep(demand, 4).budgetMax);
  assert.ok(options.validateDemandStep({ ...demand, budgetMin: 300, budgetMax: 200 }, 4).budgetMin);
  assert.ok(options.validateDemandStep({ ...demand, budgetMax: Infinity }, 4).budgetMax);
  assert.deepEqual(options.validateDemandStep({ ...demand, budgetMin: 0, budgetMax: 200 }, 4), {});
  assert.deepEqual(options.validateDemandStep({ ...demand, budgetFlexible: true }, 4), {});
});

test("stored values are normalized without trusting types, extra keys, or non-finite quantities", () => {
  const options = createLoader()("lib/demand-options.ts");
  const value = options.normalizeDemand({ category: "__proto__", quantity: Infinity, materials: ["Steel", null, 3], location: "Atlantis", certifications: "ISO", unit: "widgets", description: "Safe text", injected: true });
  assert.equal(value.category, "");
  assert.equal(value.quantity, null);
  assert.deepEqual(value.materials, ["Steel"]);
  assert.deepEqual(value.certifications, []);
  assert.equal(value.location, "any");
  assert.equal(value.unit, "units");
  assert.equal(value.description, "Safe text");
  assert.equal(value.injected, undefined);
});

function mountStore(load) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const store = load("lib/demand-store.ts");
  let current;
  function Probe() { current = store.useDemandState(); return React.createElement("span", null, current.ready ? current.draft.capability : "loading"); }
  act(() => root.render(React.createElement(Probe)));
  return { get state() { return current; }, close() { act(() => root.unmount()); container.remove(); } };
}

test("draft, submitted demand and selected provider survive navigation and a fresh store load", () => {
  localStorage.clear();
  const load = createLoader();
  const demand = validDemand(load("lib/demand-options.ts"));
  const first = mountStore(load);
  assert.equal(first.state.ready, true);
  act(() => first.state.saveDraft(demand));
  act(() => first.state.submitDemand(demand));
  act(() => first.state.selectRequest("precision-works", demand));
  first.close();
  const navigated = mountStore(load);
  assert.equal(navigated.state.submittedDemand.quantity, 5000);
  assert.equal(navigated.state.selectedRequest.providerId, "precision-works");
  navigated.close();
  const refreshed = mountStore(createLoader());
  assert.equal(refreshed.state.draft.capability, "CNC Milling");
  assert.equal(refreshed.state.submittedDemand.quantity, 5000);
  assert.equal(refreshed.state.selectedRequest.demand.quantity, 5000);
  act(() => refreshed.state.submitDemand({ ...demand, quantity: 3000 }));
  assert.equal(refreshed.state.selectedRequest, null);
  refreshed.close();
});

test("malformed saved data recovers to a usable fresh draft", () => {
  for (const raw of ["{broken", "null", '[]', '{"draft":{"quantity":"bad"},"submittedDemand":{"capability":"bad"}}']) {
    localStorage.setItem("capacity-demand-v1", raw);
    const mounted = mountStore(createLoader());
    assert.equal(mounted.state.ready, true);
    assert.equal(mounted.state.draft.quantity, null);
    assert.ok(mounted.state.submittedDemand === null || mounted.state.submittedDemand.capability === "CNC Milling");
    mounted.close();
  }
});

test("a refreshed new-demand draft does not adopt or overwrite a seeded demand", () => {
  localStorage.clear();
  const load = createLoader();
  const first = mountStore(load);
  const seededId = first.state.demands[0].id;
  act(() => first.state.newDemand());
  first.close();
  const refreshed = mountStore(createLoader());
  assert.equal(refreshed.state.activeDemandId, null);
  assert.equal(refreshed.state.submittedDemand, null);
  act(() => refreshed.state.saveDraft(validDemand(load("lib/demand-options.ts"))));
  assert.notEqual(refreshed.state.activeDemandId, seededId);
  assert.equal(refreshed.state.demands.length, 3);
  refreshed.close();
});

test("storage restrictions still allow draft-to-results navigation in memory", () => {
  const originalStorage = global.localStorage;
  Object.defineProperty(global, "localStorage", { configurable: true, get() { throw new Error("Storage blocked"); } });
  try {
    const load = createLoader();
    const demand = validDemand(load("lib/demand-options.ts"));
    const mounted = mountStore(load);
    act(() => mounted.state.saveDraft(demand));
    act(() => mounted.state.submitDemand(demand));
    mounted.close();
    const navigated = mountStore(load);
    assert.equal(navigated.state.submittedDemand.capability, "CNC Milling");
    navigated.close();
  } finally {
    Object.defineProperty(global, "localStorage", { configurable: true, writable: true, value: originalStorage });
  }
});
