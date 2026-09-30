// Run manually after `npm run build` and starting the production server.
// HTTP/content checks only: this script does not perform browser or live RLS QA.
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const { createHarness } = require("./dom-harness.cjs");
const origin = process.argv[2] || "http://127.0.0.1:3008";
// DOM parsing can outlive the server's idle timeout; use fresh HTTP connections.
const auditFetch = (url, options = {}) => fetch(url, { signal: AbortSignal.timeout(20000), ...options, headers: { ...options.headers, connection: "close" } });
const routes = ["/", "/how-it-works", "/discover", "/discover?category=CNC%20%26%20Machining", "/match", "/match/results", "/capacity/precision-works", "/request/precision-works", "/requests", "/requests/REQ-2026-00124", "/dashboard", "/dashboard/buyer", "/dashboard/provider", "/dashboard/demands", "/dashboard/capacity", "/dashboard/capacity/new", "/dashboard/capacity/precision-works/edit", "/dashboard/saved", "/dashboard/collaborations", "/login", "/register"];

async function verify() {
  const fixtures = createHarness(origin);
  const providers = fixtures.load("data/capacities.ts").capacities;
  const requests = fixtures.load("data/requests.ts").demoRequests;
  const allRoutes = Array.from(new Set([...routes, "/icon.svg", ...providers.flatMap(({ id }) => [`/capacity/${id}`, `/request/${id}`]), ...requests.map(({ id }) => `/requests/${id}`)]));
  fixtures.close();
  const pages = new Map();
  for (let offset = 0; offset < allRoutes.length; offset += 6) await Promise.all(allRoutes.slice(offset, offset + 6).map(async (route) => {
    const response = await auditFetch(`${origin}${route}`);
    assert.equal(response.status, 200, route);
    if (response.headers.get("content-type")?.includes("text/html")) pages.set(route, await response.text());
    console.log(`${response.status} ${route}`);
  }));
  const home = await (await auditFetch(origin)).text();
  for (const phrase of ["Smart Compatibility Analysis", "NusaTech Industries", "Start Competition Demo", "Illustrative Demo Metrics", "Value for Both Sides", "See the provider workflow"]) assert.ok(home.includes(phrase), phrase);
  const response = await auditFetch(`${origin}/how-it-works`, { headers: { cookie: "capacity-data-mode=real" }, redirect: "manual" });
  assert.equal(response.status, 200, "Public explanation must not require sign-in.");
  const story = await response.text();
  for (const phrase of ["93.5", "94%", "4,550", "Supabase Auth", "Current MVP", "Potential Monetization Model", "not active", "Complete CAPACITY workflow"]) assert.ok(story.includes(phrase), phrase);
  assert.ok(story.includes('href="/how-it-works"'));
  const checkedLinks = new Set();
  for (const [path, html] of pages) {
    const page = new JSDOM(html, { url: `${origin}${path}` });
    for (const anchor of page.window.document.querySelectorAll("a[href]")) {
      const href = anchor.getAttribute("href");
      assert.notEqual(href, "#", `Dead anchor on ${path}`);
      const target = new URL(href, `${origin}${path}`);
      if (target.origin !== new URL(origin).origin) continue;
      const route = target.pathname + target.search;
      if (!pages.has(route) && !checkedLinks.has(route)) {
        const linked = await auditFetch(`${origin}${route}`, { redirect: "manual" });
        assert.ok(linked.status >= 200 && linked.status < 400, `Broken link ${path} → ${href}: ${linked.status}`);
      }
      checkedLinks.add(route);
      if (target.hash && ["/", "/how-it-works"].includes(target.pathname)) {
        const destination = new JSDOM(pages.get(target.pathname));
        assert.ok(destination.window.document.getElementById(decodeURIComponent(target.hash.slice(1))), `Missing section ${href}`);
        destination.window.close();
      }
    }
    page.window.close();
  }
  const confirmation = await auditFetch(`${origin}/auth/confirm`, { redirect: "manual" });
  assert.equal(confirmation.status, 307);
  assert.equal(new URL(confirmation.headers.get("location")).pathname, "/login");
  assert.equal(new URL(confirmation.headers.get("location")).searchParams.get("error"), "confirmation");
  assert.equal((await auditFetch(`${origin}/unknown-route`)).status, 404);
  console.log(`PASS: ${allRoutes.length} routes, ${checkedLinks.size} internal link destinations, public anchors, callback fallback, scoring content, and unknown-route 404.`);
}
verify().catch((error) => { console.error(error); process.exitCode = 1; });
