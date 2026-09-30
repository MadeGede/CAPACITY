const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

// Exercise the actual TypeScript modules without adding a test runner or changing
// the app's module configuration. Imports are limited to the supplied fixtures.
function loadTypeScript(relativePath, imports = {}) {
  const filename = path.resolve(__dirname, "..", relativePath);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  });
  const loaded = { exports: {} };
  const evaluate = new Function("require", "module", "exports", outputText);
  evaluate((specifier) => {
    assert.ok(Object.hasOwn(imports, specifier), `Unexpected import: ${specifier}`);
    return imports[specifier];
  }, loaded, loaded.exports);
  return loaded.exports;
}

const data = loadTypeScript("data/capacities.ts");
const discovery = loadTypeScript("lib/capacity-discovery.ts", {
  "../data/capacities": data,
});
const { capacities, categories, locations, getCapacity, getSimilarCapacities } = data;
const { defaultFilters, parseDiscoveryFilters, discoveryUrl, filterCapacities, activeFilterCount } = discovery;

function filters(overrides = {}) {
  return { ...defaultFilters, locations: [], sizes: [], ...overrides };
}

function results(overrides = {}, savedIds = []) {
  return filterCapacities(capacities, filters(overrides), savedIds);
}

function ids(providers) {
  return providers.map((provider) => provider.id);
}

function deepFreeze(value) {
  Object.values(value).forEach((child) => {
    if (child && typeof child === "object") deepFreeze(child);
  });
  return Object.freeze(value);
}

const originalData = JSON.stringify(capacities);
deepFreeze(capacities);
deepFreeze(defaultFilters);

test("the demo has 24 unique complete providers across all specified categories and cities", () => {
  assert.equal(capacities.length, 24);
  assert.equal(new Set(ids(capacities)).size, 24);
  assert.equal(categories.length, 9);
  assert.equal(locations.length, 7);
  for (const category of categories) assert.ok(capacities.some((p) => p.category === category));
  for (const location of locations) assert.ok(capacities.some((p) => p.location === location));
  for (const provider of capacities) {
    assert.match(provider.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(provider.availableCapacity <= provider.maximumCapacity);
    assert.ok(provider.minimumOrder <= provider.availableCapacity);
    assert.ok(provider.priceFrom > 0 && provider.priceTo >= provider.priceFrom);
    assert.ok([0, 7, 14, 30].includes(provider.availabilityDays));
    assert.ok(["Small", "Medium", "Large"].includes(provider.size));
    for (const field of ["capabilities", "facilities", "materials", "certifications"]) {
      assert.ok(provider[field].length > 0, `${provider.name} needs ${field}`);
    }
    const similar = getSimilarCapacities(provider);
    assert.equal(similar.length, 3);
    assert.ok(similar.every((item) => item.id !== provider.id));
    assert.equal(similar[0].category, provider.category);
  }
  assert.equal(getCapacity("missing-provider"), undefined);
});

test("the six requested fixtures retain their required metrics", () => {
  const expected = [
    ["precision-works", "Bekasi", 6500, 500, 14],
    ["nusantara-plastics", "Tangerang", 25000, 2000, 21],
    ["packpro-indonesia", "Jakarta", 50000, 1000, 10],
    ["garmentworks-bandung", "Bandung", 8000, 300, 18],
    ["protolab", "Jakarta", 1500, 10, 5],
    ["central-fulfillment", "Bekasi", 1800, 10, 0],
  ];
  for (const [id, location, availableCapacity, minimumOrder, leadTimeDays] of expected) {
    const provider = getCapacity(id);
    assert.deepEqual(
      [provider.location, provider.availableCapacity, provider.minimumOrder, provider.leadTimeDays, provider.verified],
      [location, availableCapacity, minimumOrder, leadTimeDays, true],
    );
  }
  assert.equal(getCapacity("precision-works").priceFrom, 18000);
  assert.equal(getCapacity("precision-works").priceTo, 25000);
  assert.equal(getCapacity("central-fulfillment").capacityPeriod, "");
});

test("default discovery shows every capacity ordered by static editorial rank", () => {
  assert.equal(results().length, 24);
  assert.deepEqual(ids(results().slice(0, 6)), [
    "precision-works", "nusantara-plastics", "packpro-indonesia",
    "garmentworks-bandung", "protolab", "central-fulfillment",
  ]);
  assert.deepEqual(ids(results({ query: "injection molding" })), ["nusantara-plastics", "jaya-polymer"]);
});

test("search covers provider, capability, category, location, and description", () => {
  assert.deepEqual(ids(results({ query: "Precision Works" })), ["precision-works", "surya-metalworks"]);
  assert.deepEqual(ids(results({ query: "Injection Molding" })), ["nusantara-plastics", "jaya-polymer"]);
  assert.deepEqual(ids(results({ query: "CNC & Machining" })), ["precision-works", "surya-metalworks", "prima-tooling"]);
  assert.deepEqual(ids(results({ query: "Semarang" })), ["serat-industri", "ruang-simpan", "meridian-plastik"]);
  assert.deepEqual(ids(results({ query: "transit packaging" })), ["karton-kreasi"]);
  assert.deepEqual(ids(results({ query: "hospitality suppliers" })), ["dapur-nusantara"]);
});

test("search trims whitespace, ignores case, and allows words across fields", () => {
  assert.deepEqual(ids(results({ query: "  cnC \t BekASi\n " })), ["precision-works"]);
  assert.deepEqual(ids(results({ query: "BEKASI precision" })), ["precision-works"]);
  assert.equal(results({ query: " \t\n " }).length, 24);
  assert.deepEqual(ids(results({ query: "warehouse bekasi" })), ["central-fulfillment"]);
});

test("selected locations use OR while separate filter groups use AND", () => {
  assert.deepEqual(ids(results({ locations: ["Jakarta", "Bekasi"] })), [
    "precision-works", "packpro-indonesia", "protolab", "central-fulfillment",
    "rakit-manufaktur", "cetak-prima", "jaya-polymer",
  ]);
  assert.deepEqual(ids(results({
    category: "Assembly", locations: ["Bekasi", "Tangerang"],
    availability: 7, sizes: ["Medium"], verified: true, leadTime: 14,
  })), ["rakit-manufaktur"]);
  assert.deepEqual(ids(results({
    category: "Assembly", locations: ["Bekasi", "Tangerang"],
    availability: 14, sizes: ["Medium"], verified: true, leadTime: 14,
  })), ["rakit-manufaktur", "sambung-elektronik"]);
});

test("availability thresholds include boundary dates and available-now providers", () => {
  assert.deepEqual(ids(results({ query: "injection molding", availability: 0 })), []);
  assert.deepEqual(ids(results({ query: "injection molding", availability: 7 })), ["nusantara-plastics"]);
  assert.deepEqual(ids(results({ query: "injection molding", availability: 14 })), ["nusantara-plastics", "jaya-polymer"]);
  assert.equal(results({ availability: 30 }).length, 24);
  assert.ok(results({ availability: 0 }).length > 0);
  assert.ok(results({ availability: 0 }).every((provider) => provider.availabilityDays === 0));
  assert.ok(results({ availability: 7 }).some((provider) => provider.availabilityDays === 0));
  assert.ok(results({ availability: 7 }).some((provider) => provider.availabilityDays === 7));
});

test("lead-time thresholds include the boundary and immediate warehouse access", () => {
  assert.deepEqual(ids(results({ category: "CNC & Machining", leadTime: 7 })), ["prima-tooling"]);
  assert.deepEqual(ids(results({ category: "CNC & Machining", leadTime: 14 })), ["precision-works", "surya-metalworks", "prima-tooling"]);
  assert.deepEqual(ids(results({ category: "Warehousing", leadTime: 7 })), ["central-fulfillment", "lintas-logistik-hub", "ruang-simpan"]);
  assert.equal(results({ leadTime: 30 }).length, 24);
});

test("verification and capacity-size filters reflect provider attributes", () => {
  assert.equal(results({ verified: true }).length, 18);
  assert.ok(results({ verified: true }).every((provider) => provider.verified));
  assert.equal(results({ verified: false }).length, 24);
  assert.deepEqual(ids(results({ category: "CNC & Machining", sizes: ["Small"] })), ["prima-tooling"]);
  assert.deepEqual(ids(results({ category: "CNC & Machining", sizes: ["Small", "Medium"] })), ["precision-works", "surya-metalworks", "prima-tooling"]);
  assert.deepEqual(ids(results({ category: "CNC & Machining", sizes: ["Small"], verified: true })), []);
});

test("saved-only results respect both saved IDs and active filters", () => {
  const saved = ["precision-works", "protolab", "unknown-id"];
  assert.deepEqual(ids(results({ savedOnly: true }, saved)), ["precision-works", "protolab"]);
  assert.deepEqual(ids(results({ savedOnly: true, locations: ["Jakarta"] }, saved)), ["protolab"]);
  assert.deepEqual(results({ savedOnly: true }), []);
  assert.equal(results({ savedOnly: false }, saved).length, 24);
});

test("empty results and a full reset have the expected outcomes", () => {
  assert.deepEqual(results({ query: "aerospace titanium submarine" }), []);
  assert.deepEqual(results({ category: "Food Production", locations: ["Surabaya"] }), []);
  assert.equal(filterCapacities(capacities, defaultFilters).length, 24);
  assert.equal(discoveryUrl(defaultFilters), "/discover");
  assert.equal(activeFilterCount(defaultFilters), 0);
  assert.equal(activeFilterCount(filters({ category: "Printing", locations: ["Jakarta", "Bandung"], availability: 0, sizes: ["Small"], verified: true, leadTime: 7 })), 7);
});

test("each sort uses the requested numeric metric and stable editorial tie breaks", () => {
  assert.deepEqual(ids(results({ sort: "capacity" }).slice(0, 3)), ["cetak-prima", "packpro-indonesia", "jaya-polymer"]);
  assert.deepEqual(ids(results({ sort: "lead" }).slice(0, 3)), ["central-fulfillment", "ruang-simpan", "lintas-logistik-hub"]);
  assert.deepEqual(ids(results({ sort: "minimum" }).slice(0, 5)), ["lapis-3d", "bentuk-additive", "ruang-simpan", "protolab", "central-fulfillment"]);
  for (const [sort, field, direction] of [
    ["best", "ranking", -1], ["capacity", "availableCapacity", -1],
    ["lead", "leadTimeDays", 1], ["minimum", "minimumOrder", 1],
  ]) {
    const sorted = results({ sort });
    assert.equal(sorted.length, 24);
    for (let index = 1; index < sorted.length; index++) {
      assert.ok(direction * (sorted[index][field] - sorted[index - 1][field]) >= 0);
      if (sorted[index][field] === sorted[index - 1][field]) {
        assert.ok(sorted[index - 1].ranking >= sorted[index].ranking);
      }
    }
  }
});

test("Best Match remains static rank even when lower-ranked names match more directly", () => {
  const precision = getCapacity("precision-works");
  const lowRankExactName = { ...precision, id: "literal-name", name: "CNC", ranking: 1 };
  const highRankDescription = { ...precision, id: "editorial-first", name: "Workshop", ranking: 200 };
  assert.deepEqual(ids(filterCapacities([lowRankExactName, highRankDescription], filters({ query: "CNC" }))), [
    "editorial-first", "literal-name",
  ]);
});

test("URL round trips preserve search, zero availability, booleans, and multi-select values", () => {
  const selected = filters({
    query: "CNC & machining / Bekasi?", category: "CNC & Machining",
    locations: ["Jakarta", "Bekasi"], availability: 0,
    sizes: ["Small", "Medium"], verified: true,
    leadTime: 14, savedOnly: true, sort: "capacity",
  });
  const url = new URL(discoveryUrl(selected), "https://capacity.example");
  assert.equal(url.pathname, "/discover");
  assert.deepEqual(url.searchParams.getAll("location"), ["Jakarta", "Bekasi"]);
  assert.deepEqual(parseDiscoveryFilters(url.searchParams), selected);
  assert.deepEqual(parseDiscoveryFilters(new URLSearchParams(discoveryUrl(defaultFilters).split("?")[1])), filters());
  assert.deepEqual(parseDiscoveryFilters(new URLSearchParams("availability=0&verified=0&saved=0")), filters({ availability: 0 }));
});

test("URL parsing rejects unknown options, invalid thresholds, and duplicate multi-select values", () => {
  const parsed = parseDiscoveryFilters(new URLSearchParams(
    "category=__proto__&sort=constructor&location=Jakarta&location=Jakarta&location=Atlantis" +
    "&size=Small&size=Small&size=Giant&availability=-1&lead=Infinity&verified=true&saved=yes",
  ));
  assert.deepEqual(parsed, filters({ locations: ["Jakarta"], sizes: ["Small"] }));
  for (const value of ["", " ", "null", "undefined", "NaN", "Infinity", "-7", "8", "<script>"]) {
    const params = new URLSearchParams({ availability: value, lead: value });
    assert.equal(parseDiscoveryFilters(params).availability, null, `availability=${value}`);
    assert.equal(parseDiscoveryFilters(params).leadTime, null, `lead=${value}`);
  }
  assert.equal(parseDiscoveryFilters(new URLSearchParams("lead=0")).leadTime, null);
  assert.equal(parseDiscoveryFilters(new URLSearchParams("category=Packaging&category=__proto__")).category, "Packaging");
});

test("hostile-looking query text stays inert and encoded during URL serialization", () => {
  const query = '<script>alert("x")</script> & location=Atlantis #';
  const url = new URL(discoveryUrl(filters({ query })), "https://capacity.example");
  assert.equal(url.searchParams.get("q"), query);
  assert.equal(url.searchParams.get("location"), null);
  assert.equal(url.hash, "");
  assert.equal(url.href.includes("<script>"), false);
  assert.deepEqual(results(parseDiscoveryFilters(url.searchParams)), []);
});

test("filtering, sorting, related results, and serialization never mutate source data or caller state", () => {
  const originalFilters = filters({ locations: ["Bekasi", "Jakarta"], sizes: ["Medium", "Small"], sort: "minimum" });
  const frozenFilters = deepFreeze(structuredClone(originalFilters));
  const savedIds = Object.freeze(["precision-works", "protolab"]);
  for (const sort of ["best", "capacity", "lead", "minimum"]) {
    filterCapacities(capacities, { ...frozenFilters, sort }, savedIds);
  }
  discoveryUrl(frozenFilters);
  getSimilarCapacities(getCapacity("precision-works"));
  assert.equal(JSON.stringify(capacities), originalData);
  assert.deepEqual(frozenFilters, originalFilters);
  assert.deepEqual(savedIds, ["precision-works", "protolab"]);
});
