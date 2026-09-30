const assert = require("node:assert/strict");
const { test, after } = require("node:test");
const { createHarness } = require("./helpers/dom-harness.cjs");
const harness = createHarness();
const { DiscoveryExplorer } = harness.load("components/capacity/discovery-explorer.tsx");
const { capacities } = harness.load("data/capacities.ts");
const { click, change, act } = harness;
after(() => harness.close());

function start(url = "/discover") {
  act(() => window.history.replaceState(null, "", url));
  return harness.mount(DiscoveryExplorer);
}
function button(container, text) { return Array.from(container.querySelectorAll("button")).find((element) => element.textContent.trim() === text); }
function checkboxByLabel(container, text) { return Array.from(container.querySelectorAll("label")).find((element) => element.textContent.trim() === text)?.querySelector("input"); }

test("discovery search, combined filters, empty state, reset, and URL persistence work together", () => {
  const view = start();
  const { container } = view;
  assert.equal(container.querySelectorAll("article").length, 24);
  change(container.querySelector("#capacity-search"), "Injection Molding");
  assert.equal(container.querySelectorAll("article").length, 2);
  assert.match(window.location.search, /q=Injection\+Molding/);
  click(container.querySelector('[aria-label="Clear search"]'));
  const sidebar = container.querySelector("aside");
  click(sidebar.querySelector('input[value="Packaging"]'));
  assert.equal(container.querySelectorAll("article").length, 3);
  click(checkboxByLabel(sidebar, "Jakarta"));
  assert.equal(container.querySelectorAll("article").length, 1);
  assert.match(container.querySelector("article").textContent, /PackPro Indonesia/);
  click(checkboxByLabel(sidebar, "≤ 7 Days"));
  assert.equal(container.querySelectorAll("article").length, 0);
  assert.match(container.textContent, /No capacity found/);
  click(button(container.querySelector('[aria-label="Capacity results"]'), "Clear Filters"));
  assert.equal(container.querySelectorAll("article").length, 24);
  assert.equal(window.location.search, "");
  assert.equal(sessionStorage.getItem("capacity-discovery-url"), "/discover");
  view.close();
});

test("discovery sorting changes the displayed card order", () => {
  const view = start();
  change(view.container.querySelector("#capacity-sort"), "capacity");
  const expected = [...capacities].sort((a, b) => b.availableCapacity - a.availableCapacity)[0];
  assert.equal(view.container.querySelector("article h3").textContent, expected.name);
  assert.match(window.location.search, /sort=capacity/);
  change(view.container.querySelector("#capacity-sort"), "lead");
  assert.match(view.container.querySelector("article").textContent, /Immediate/);
  view.close();
});

test("saved providers are reflected in cards, saved results, local storage, and unsave", () => {
  const view = start();
  click(view.container.querySelector('[aria-label="Unsave Precision Works"]'));
  click(view.container.querySelector('[aria-label="Save Precision Works"]'));
  assert.equal(view.container.querySelector('[aria-label="Unsave Precision Works"]').getAttribute("aria-pressed"), "true");
  assert.deepEqual(JSON.parse(localStorage.getItem("capacity-saved-providers")), ["packpro-indonesia", "precision-works"]);
  const savedTab = Array.from(view.container.querySelectorAll("button")).find((element) => /^Saved\s+2$/.test(element.textContent.trim()));
  click(savedTab);
  assert.equal(view.container.querySelectorAll("article").length, 2);
  click(view.container.querySelector('[aria-label="Unsave Precision Works"]'));
  click(view.container.querySelector('[aria-label="Unsave PackPro Indonesia"]'));
  assert.equal(view.container.querySelectorAll("article").length, 0);
  assert.match(view.container.textContent, /No saved providers yet/);
  click(button(view.container, "Explore capacities"));
  assert.equal(view.container.querySelectorAll("article").length, 24);
  view.close();
});

test("a prefiltered URL restores results and detail links preserve the correct provider", () => {
  const view = start("/discover?category=CNC+%26+Machining&location=Bekasi");
  assert.equal(view.container.querySelectorAll("article").length, 1);
  assert.equal(view.container.querySelector("article h3 a").getAttribute("href"), "/capacity/precision-works");
  assert.match(sessionStorage.getItem("capacity-discovery-url"), /category=CNC/);
  view.close();
});

test("filter drawer opens, applies controls, and restores scrolling when closed", () => {
  const view = start();
  click(view.container.querySelector('button[aria-haspopup="dialog"]'));
  const dialog = view.container.querySelector("dialog");
  assert.ok(dialog.hasAttribute("open"));
  assert.equal(document.body.style.overflow, "hidden");
  click(dialog.querySelector('input[value="Warehousing"]'));
  assert.equal(view.container.querySelectorAll("article").length, 3);
  assert.ok(button(dialog, "Show 3 capacities"));
  click(dialog.querySelector('[aria-label="Close filters"]'));
  assert.equal(dialog.hasAttribute("open"), false);
  assert.equal(document.body.style.overflow, "");
  view.close();
});
