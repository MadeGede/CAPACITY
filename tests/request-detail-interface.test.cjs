const assert = require("node:assert/strict");
const { test, after } = require("node:test");
const { createHarness } = require("./helpers/dom-harness.cjs");

const h = createHarness("http://localhost:3000/requests/REQ-2026-00124");
const { RequestDetail } = h.load("components/requests/request-detail.tsx");
const reset = h.load("lib/demo-reset.ts");
after(() => h.close());
function button(container, name) { return Array.from(container.querySelectorAll("button")).find((element) => element.textContent.trim() === name); }

test("request detail guides buyer acceptance, production, and provider completion", () => {
  h.act(() => reset.resetDemoData());
  const view = h.mount(RequestDetail, { id: "REQ-2026-00124" });
  assert.match(view.container.textContent, /Rp107\.500\.000/);
  assert.match(view.container.textContent, /NusaTech Industries/);
  h.click(button(view.container, "Accept Proposal"));
  assert.ok(view.container.querySelector('dialog[open]'));
  h.click(button(view.container, "Confirm"));
  assert.match(view.container.textContent, /Accepted/);
  h.click(button(view.container, "Start Collaboration"));
  h.click(button(view.container, "Confirm"));
  assert.match(view.container.textContent, /35% demo milestone/);
  h.change(view.container.querySelector('select[aria-label="Demo perspective"]'), "provider");
  assert.ok(button(view.container, "Mark Complete"));
  h.click(button(view.container, "Mark Complete"));
  h.click(button(view.container, "Confirm"));
  assert.match(view.container.textContent, /Production collaboration completed/);
  view.close();
});

test("unknown request shows a safe recovery path", () => {
  const view = h.mount(RequestDetail, { id: "REQ-INVALID" });
  assert.match(view.container.textContent, /Request not found/);
  assert.equal(view.container.querySelector('a[href="/requests"]').textContent.trim(), "View Requests");
  view.close();
});
