const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createHarness } = require("./helpers/dom-harness.cjs");

const button = (container, label) => Array.from(container.querySelectorAll("button")).find((node) => node.textContent.trim() === label);
const deferred = () => { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

test("mobile navigation exposes sign-in, closes on Escape, and restores toggle focus", () => {
  const h = createHarness("http://localhost:3000/");
  const view = h.mount(h.load("components/site/header.tsx").Header);
  try {
    const toggle = view.container.querySelector('[aria-label="Open menu"]');
    h.click(toggle);
    const menu = view.container.querySelector('[aria-label="Mobile navigation"]');
    assert.ok(menu.querySelector('a[href="/login"]'));
    assert.ok(menu.className.includes("overflow-y-auto"));
    h.act(() => window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape" })));
    assert.equal(view.container.querySelector('[aria-label="Mobile navigation"]'), null);
    assert.equal(document.activeElement, toggle);
  } finally { view.close(); h.close(); }
});

test("demand duplication waits for preparation and prevents simultaneous copies", async () => {
  const copy = deferred(); let calls = 0;
  let demands = [];
  const h = createHarness("http://localhost:3000/dashboard/demands", { "@/lib/data/demands": { useDemandState: () => ({ ready: true, demands, duplicateDemand: () => { calls++; return copy.promise; } }) } });
  demands = h.load("data/demands.ts").createDemoDemands();
  const view = h.mount(h.load("components/dashboard/demands-list.tsx").DemandsList);
  try {
    const duplicate = button(view.container, "Duplicate");
    h.act(() => { duplicate.click(); duplicate.click(); });
    assert.equal(calls, 1);
    assert.equal(h.navigations.length, 0);
    assert.equal(duplicate.disabled, true);
    // Real Mode prepares a new draft and intentionally resolves without an ID.
    await h.act(async () => { copy.resolve(); await copy.promise; });
    assert.equal(h.navigations.at(-1), "/match");
    assert.equal(duplicate.disabled, false);
  } finally { view.close(); h.close(); }
});

test("failed demand duplication stays on the page and gives safe feedback", async () => {
  const copy = deferred(); let demands = [];
  const h = createHarness("http://localhost:3000/dashboard/demands", { "@/lib/data/demands": { useDemandState: () => ({ ready: true, demands, duplicateDemand: () => copy.promise }) } });
  demands = h.load("data/demands.ts").createDemoDemands();
  let feedback;
  window.addEventListener(h.load("lib/toast.ts").toastEventName, (event) => { feedback = event.detail; });
  const view = h.mount(h.load("components/dashboard/demands-list.tsx").DemandsList);
  try {
    h.click(button(view.container, "Duplicate"));
    await h.act(async () => { copy.reject(new Error("private database diagnostics")); await copy.promise.catch(() => {}); });
    assert.equal(h.navigations.length, 0);
    assert.match(feedback, /Unable to duplicate/);
    assert.ok(!feedback.includes("database diagnostics"));
  } finally { view.close(); h.close(); }
});

test("closing demand is single-flight and dialog cleanup restores scrolling", async () => {
  const closing = deferred(); let calls = 0; let demands = [];
  const h = createHarness("http://localhost:3000/dashboard/demands", { "@/lib/data/demands": { useDemandState: () => ({ ready: true, demands, closeDemand: () => { calls++; return closing.promise; } }) } });
  demands = h.load("data/demands.ts").createDemoDemands();
  const view = h.mount(h.load("components/dashboard/demands-list.tsx").DemandsList);
  try {
    h.click(button(view.container, "Close Demand"));
    assert.equal(document.body.style.overflow, "hidden");
    const confirm = button(view.container.querySelector("dialog[open]"), "Close Demand");
    h.act(() => { confirm.click(); confirm.click(); });
    assert.equal(calls, 1);
    await h.act(async () => { closing.resolve(); await closing.promise; });
    assert.equal(document.body.style.overflow, "");
    assert.equal(view.container.querySelector("dialog[open]"), null);
  } finally { view.close(); h.close(); }
});

test("capacity pause prevents repeated writes and restores modal scrolling", async () => {
  const update = deferred(); let calls = 0; let managedListings = [];
  const h = createHarness("http://localhost:3000/dashboard/capacity", { "@/lib/data/capacities": { useCapacityCatalog: () => ({ ready: true, managedListings, setListingStatus: () => { calls++; return update.promise; } }) } });
  managedListings = h.load("lib/capacity-listing-rules.ts").createInitialListings();
  const view = h.mount(h.load("components/dashboard/capacity-management.tsx").CapacityManagement);
  try {
    h.click(button(view.container, "Pause"));
    const confirm = button(view.container.querySelector("dialog[open]"), "Pause Listing");
    h.act(() => { confirm.click(); confirm.click(); });
    assert.equal(calls, 1);
    assert.equal(confirm.disabled, true);
    await h.act(async () => { update.resolve(); await update.promise; });
    assert.equal(view.container.querySelector("dialog[open]"), null);
    assert.equal(document.body.style.overflow, "");
  } finally { view.close(); h.close(); }
});

test("provider saving reports success and async clicks are guarded", async () => {
  const saving = deferred(); let calls = 0;
  const h = createHarness("http://localhost:3000/discover", { "@/lib/data/saved-providers": { useSavedProviders: () => ({ ids: [], toggle: () => { calls++; return saving.promise; } }) } });
  let feedback;
  window.addEventListener(h.load("lib/toast.ts").toastEventName, (event) => { feedback = event.detail; });
  const view = h.mount(h.load("components/capacity/save-provider.tsx").SaveProvider, { id: "precision-works", name: "Precision Works" });
  try {
    const save = view.container.querySelector("button");
    h.act(() => { save.click(); save.click(); });
    assert.equal(calls, 1);
    assert.equal(save.disabled, true);
    await h.act(async () => { saving.resolve(); await saving.promise; });
    assert.equal(feedback, "Provider saved");
    assert.equal(save.disabled, false);
  } finally { view.close(); h.close(); }
});

test("proposal validation connects error descriptions, focuses invalid input and clears corrected errors", async () => {
  const h = createHarness();
  const request = h.load("data/requests.ts").demoRequests.find((item) => item.id === "REQ-2026-00124");
  const view = h.mount(h.load("components/requests/provider-proposal.tsx").ProviderProposalForm, { request, onClose() {} });
  try {
    const price = view.container.querySelector("#proposal-price");
    h.change(price, "0");
    h.click(view.container.querySelector('button[type="submit"]'));
    assert.equal(price.getAttribute("aria-invalid"), "true");
    assert.equal(price.getAttribute("aria-describedby"), "proposal-price-error");
    assert.ok(view.container.querySelector("#proposal-price-error"));
    await h.act(async () => { await new Promise((resolve) => window.requestAnimationFrame(resolve)); });
    assert.equal(document.activeElement, price);
    h.change(price, "21500");
    assert.equal(price.getAttribute("aria-invalid"), "false");
    assert.equal(view.container.querySelector("#proposal-price-error"), null);
  } finally { view.close(); h.close(); }
});

test("authentication is single-flight and return paths cannot navigate off-site", async () => {
  for (const [next, expected] of [["/dashboard/demands", "/dashboard/demands"], ["/\\outside.test", "/dashboard"], ["//outside.test", "/dashboard"]]) {
    const signingIn = deferred(); let calls = 0; let destination;
    const mode = { useDataMode: () => ({ mode: "demo", configured: true, ready: true, chooseMode() {}, refreshIdentity: async () => {} }), DataModeProvider: ({ children }) => children };
    const h = createHarness("http://localhost:3000/login", {
      "@/lib/data/mode": mode, "./mode": mode,
      "next/navigation": { usePathname: () => "/login", useSearchParams: () => new URLSearchParams({ next }), useRouter: () => ({ replace: (href) => { destination = href; }, push() {}, refresh() {} }) },
      "@/lib/supabase/client": { getSupabaseBrowserClient: () => ({ auth: { signInWithPassword: () => { calls++; return signingIn.promise; } } }) },
    });
    const view = h.mount(h.load("components/auth/auth-form.tsx").AuthForm, { variant: "login" });
    try {
      h.change(view.container.querySelector('input[type="email"]'), "buyer@example.test");
      h.change(view.container.querySelector('input[type="password"]'), "test-only-passphrase");
      const form = view.container.querySelector("form");
      h.act(() => { for (let click = 0; click < 2; click++) form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })); });
      assert.equal(calls, 1);
      await h.act(async () => { signingIn.resolve({ error: null }); await signingIn.promise; });
      assert.equal(destination, expected);
      assert.equal(view.container.querySelector('[role="alert"]'), null);
    } finally { view.close(); h.close(); }
  }
});

test("real profile credentials are self-reported rather than labelled sample data", () => {
  const h = createHarness();
  const capacity = h.load("data/capacities.ts").capacities[0];
  const view = h.mount(h.load("components/capacity/provider-info.tsx").ProviderCertifications, { capacity, illustrative: false });
  try {
    assert.match(view.container.textContent, /Self-reported by the provider/);
    assert.ok(!view.container.textContent.includes("sample provider"));
  } finally { view.close(); h.close(); }
});

test("real discovery does not describe live listings as sample profiles", () => {
  const mode = { useDataMode: () => ({ mode: "real", ready: true, user: null, business: null }), DataModeProvider: ({ children }) => children };
  const h = createHarness("http://localhost:3000/how-it-works", { "@/lib/data/mode": mode, "./mode": mode });
  const view = h.mount(h.load("components/capacity/discovery-explorer.tsx").DirectoryNotice, { detail: true });
  try {
    assert.match(view.container.textContent, /Provider-submitted/);
    assert.ok(!view.container.textContent.includes("Sample profiles"));
  } finally { view.close(); h.close(); }
});

test("missing, placeholder and malformed backend configuration keep the independent demo available", () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  try {
    for (const url of ["", "not-a-url", "https://your-project.supabase.co", "file:///tmp/database", "https://account:password@example.test"]) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = url;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-public-key";
      const h = createHarness();
      assert.equal(h.load("lib/supabase/config.ts").supabaseConfigured, false);
      h.close();
    }
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    const h = createHarness();
    assert.equal(h.load("lib/supabase/config.ts").supabaseConfigured, true);
    h.close();
  } finally {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousKey;
  }
});

test("capacity editor rejects invalid ranges and unknown IDs have recovery navigation", async () => {
  const h = createHarness("http://localhost:3000/dashboard/capacity/new");
  let view = h.mount(h.load("components/dashboard/capacity-editor.tsx").CapacityEditor);
  try {
    await h.act(async () => { await Promise.resolve(); });
    h.click(view.container.querySelector('button[type="submit"]'));
    assert.ok(view.container.querySelectorAll('[aria-invalid="true"]').length >= 6);
    assert.equal(h.navigations.length, 0);
    view.close();
    view = h.mount(h.load("components/dashboard/capacity-editor.tsx").CapacityEditor, { id: "unknown-listing" });
    assert.match(view.container.textContent, /Capacity listing not found/);
    assert.ok(view.container.querySelector('a[href="/dashboard/capacity"]'));
    view.close();
    view = h.mount(h.load("components/capacity/catalog-profile.tsx").CatalogProfile, { id: "unknown-listing" });
    assert.match(view.container.textContent, /Capacity listing not found/);
    assert.ok(view.container.querySelector('a[href="/discover"]'));
  } finally { view.close(); h.close(); }
});
