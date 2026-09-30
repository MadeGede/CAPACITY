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
const formatting = loadTypeScript("lib/capacity-format.ts");
const matching = loadTypeScript("lib/matching.ts", { "../data/capacities": data, "./capacity-format": formatting });
const options = loadTypeScript("lib/demand-options.ts", { "../data/capacities": data });
const { MATCH_WEIGHTS, calculateMatchScore, rankProviders, calculateCapabilityScore,
  calculateCapacityScore, calculateLocationScore, calculateAvailabilityScore,
  calculateLeadTimeScore, calculateCostScore } = matching;
const precision = data.getCapacity("precision-works");
const plastics = data.getCapacity("nusantara-plastics");
const food = data.getCapacity("pangan-prima");
const warehouse = data.getCapacity("central-fulfillment");
const now = new Date("2026-09-23T12:00:00");

function demand(overrides = {}) {
  return {
    category: "CNC & Machining", capability: "CNC Milling", description: "Precision aluminum enclosure production",
    quantity: 5000, unit: "units", demandType: "one-time", monthlyQuantity: null, durationMonths: null,
    location: "Bekasi", maxDistanceKm: null, completionDate: "2026-10-23", maxLeadTimeDays: 14,
    urgency: "standard", budgetMin: 100000000, budgetMax: 150000000, budgetFlexible: false,
    materials: ["Aluminum"], certifications: ["Quality Control Process"], qualityRequirements: "", technicalNotes: "",
    ...overrides,
  };
}

function result(provider = precision, overrides = {}) {
  return calculateMatchScore(provider, demand(overrides), now);
}

test("the six transparent weights sum to one and capability has the largest influence", () => {
  assert.deepEqual(MATCH_WEIGHTS, { capability: 0.3, capacity: 0.2, location: 0.15, availability: 0.15, leadTime: 0.1, cost: 0.1 });
  assert.equal(Object.values(MATCH_WEIGHTS).reduce((sum, value) => sum + value, 0), 1);
  const exact = result();
  assert.equal(exact.score, 100);
  assert.equal(exact.classification, "Strong Match");
  assert.ok(exact.reasons.some((reason) => reason.includes("requested capability")));
  assert.equal(exact.score, exact.breakdown.total);
});

test("exact primary or secondary capabilities score 100, explicit related processes 80, category alone 50, unrelated 0", () => {
  assert.equal(calculateCapabilityScore(precision, demand({ capability: "CNC Machining" })), 100);
  assert.equal(calculateCapabilityScore(precision, demand({ capability: "  cNc  miLLing " })), 100);
  assert.equal(calculateCapabilityScore(precision, demand({ capability: "Metal Cutting" })), 80);
  assert.equal(calculateCapabilityScore(precision, demand({ capability: "Gear Hobbing" })), 50);
  assert.equal(calculateCapabilityScore(precision, demand({ category: "Food Production", capability: "Cookie Production" })), 0);
  assert.equal(result(precision, { capability: "Metal Cutting" }).score, 94);
  assert.ok(result(precision, { capability: "Gear Hobbing" }).warnings.some((warning) => warning.includes("Category match only")));
});

test("an unrelated provider receives no capacity or cost credit and cannot become a high match", () => {
  const unrelated = result(precision, { category: "Food Production", capability: "Cookie Production" });
  assert.equal(unrelated.breakdown.capability, 0);
  assert.equal(unrelated.breakdown.capacity, 0);
  assert.equal(unrelated.breakdown.cost, 0);
  assert.equal(unrelated.estimatedCost, null);
  assert.ok(unrelated.score <= 40);
  assert.equal(unrelated.classification, "Limited Match");
  assert.equal(unrelated.reasons.some((reason) => /covers your|fits your|capability is listed/.test(reason)), false);
  assert.match(unrelated.explanations.capacity, /unrelated/);
});

test("capacity distinguishes sufficient, slightly insufficient, and severely insufficient quantities", () => {
  assert.equal(calculateCapacityScore(precision, demand({ quantity: 6500 }), now), 100);
  assert.equal(calculateCapacityScore(precision, demand({ quantity: 7500 }), now), 80);
  assert.equal(calculateCapacityScore(precision, demand({ quantity: 10000 }), now), 60);
  assert.equal(calculateCapacityScore(precision, demand({ quantity: 13000 }), now), 50);
  assert.ok(calculateCapacityScore(precision, demand({ quantity: 100000 }), now) <= 40);
  assert.ok(result(precision, { quantity: 100000 }).warnings.some((warning) => warning.includes("below")));
});

test("one-time monthly output is prorated after availability and never assumes several months of capacity", () => {
  const shortWindow = result(precision, { completionDate: "2026-10-08" });
  assert.equal(shortWindow.breakdown.capacity, 60); // 15/30 * 6,500 = 3,250; 65% of demand.
  assert.match(shortWindow.explanations.capacity, /3,250/);
  assert.match(shortWindow.explanations.capacity, /30-day month/);
  const futureWindow = result(precision, { completionDate: "2027-01-23", quantity: 7000 });
  assert.equal(futureWindow.breakdown.capacity, 90); // A long deadline does not multiply capacity.
  const delayed = result({ ...precision, availabilityDays: 14 }, { completionDate: "2026-10-07" });
  assert.equal(delayed.breakdown.capacity, 0);
  assert.ok(delayed.warnings.some((warning) => warning.includes("after your")));
});

test("recurring demand compares monthly quantity and monthly budget, never total quantity or commitment length", () => {
  const recurring = result(precision, {
    demandType: "recurring", quantity: 90000, monthlyQuantity: 5000, durationMonths: 6,
  });
  assert.equal(recurring.breakdown.capacity, 100);
  assert.equal(recurring.estimatedCost.min, 90000000);
  assert.equal(recurring.estimatedCost.max, 125000000);
  assert.match(recurring.estimatedCost.basis, /per month/);
  assert.equal(recurring.breakdown.cost, 100);
  assert.ok(recurring.warnings.some((warning) => warning.includes("6-month") && warning.includes("confirmation")));
  const recurringLarge = result(precision, {
    demandType: "recurring", quantity: 500, monthlyQuantity: 10000, durationMonths: 1,
  });
  assert.equal(recurringLarge.breakdown.capacity, 60);
  assert.equal(recurringLarge.estimatedCost.max, 250000000);
});

test("compatible count units are normalized while packages, weights, and hours remain distinct", () => {
  const printed = result(data.getCapacity("protolab"), {
    category: "3D Printing", capability: "FDM Printing", unit: "units", quantity: 100,
  });
  assert.equal(printed.breakdown.capacity, 100);
  assert.equal(printed.estimatedCost.min, 4500000);
  assert.equal(printed.estimatedCost.max, 18000000);
  for (const unit of ["packages", "kg", "tons", "pallet spaces", "production hours"]) {
    const incompatible = result(precision, { unit });
    assert.equal(incompatible.breakdown.capacity, 0, unit);
    assert.equal(incompatible.breakdown.cost, 0, unit);
    assert.equal(incompatible.estimatedCost, null, unit);
    assert.ok(incompatible.warnings.some((warning) => warning.includes("units are incompatible")), unit);
    assert.ok(incompatible.score < 90, unit);
  }
});

test("tons convert to kilograms for capacity, minimum orders, and order estimates", () => {
  const weight = result(food, {
    category: "Food Production", capability: "Dry Ingredient Blending", unit: "tons", quantity: 1,
    completionDate: "2026-11-23", budgetMax: 15000000,
  });
  assert.equal(weight.breakdown.capacity, 100);
  assert.equal(weight.estimatedCost.min, 6000000);
  assert.equal(weight.estimatedCost.max, 12000000);
  assert.match(weight.explanations.capacity, /1,000 kg/);
  const tooSmall = result(food, {
    category: "Food Production", capability: "Dry Ingredient Blending", unit: "tons", quantity: 0.1,
  });
  assert.equal(tooSmall.estimatedCost.min, 3000000); // 500 kg minimum, not 100 kg.
  assert.ok(tooSmall.warnings.some((warning) => warning.includes("minimum order of 500 kg")));
});

test("warehouse spaces are concurrent storage capacity and their costs retain the monthly basis", () => {
  const storage = result(warehouse, {
    category: "Warehousing", capability: "Pallet Storage", unit: "pallet spaces", quantity: 20,
    completionDate: "2026-09-24", budgetMin: null, budgetMax: 3000000,
  });
  assert.equal(storage.breakdown.capacity, 100); // No 1/30 reduction of static storage spaces.
  assert.equal(storage.estimatedCost.min, 1700000);
  assert.equal(storage.estimatedCost.max, 2500000);
  assert.match(storage.estimatedCost.basis, /one month of storage/);
  assert.ok(storage.warnings.some((warning) => warning.includes("storage duration")));
});

test("minimum-order pricing uses the larger quantity and makes the limitation explicit", () => {
  const belowMinimum = result(precision, { quantity: 10 });
  assert.equal(belowMinimum.estimatedCost.min, 9000000);
  assert.equal(belowMinimum.estimatedCost.max, 12500000);
  assert.match(belowMinimum.estimatedCost.basis, /minimum order/);
  assert.ok(belowMinimum.warnings.some((warning) => warning.includes("minimum order of 500 units")));
});

test("location uses symmetric fixed regional relationships and Any Location gets 100", () => {
  assert.equal(calculateLocationScore(precision, demand({ location: "Bekasi" })), 100);
  assert.equal(calculateLocationScore(precision, demand({ location: "Jakarta" })), 80);
  assert.equal(calculateLocationScore(precision, demand({ location: "Bandung" })), 65);
  assert.equal(calculateLocationScore(precision, demand({ location: "Surabaya" })), 40);
  assert.equal(calculateLocationScore(precision, demand({ location: "any" })), 100);
  for (const left of data.locations) for (const right of data.locations) {
    assert.equal(
      calculateLocationScore({ ...precision, location: left }, demand({ location: right })),
      calculateLocationScore({ ...precision, location: right }, demand({ location: left })),
    );
  }
});

test("availability follows the specified 100, 90, 75, 55, 20 schedule", () => {
  for (const [availabilityDays, expected] of [[0, 100], [7, 90], [14, 75], [30, 55], [45, 20]]) {
    assert.equal(calculateAvailabilityScore({ ...precision, availabilityDays }), expected);
  }
});

test("lead-time preference and completion date both matter, including availability delay", () => {
  assert.equal(calculateLeadTimeScore(precision, demand(), now), 100);
  assert.equal(calculateLeadTimeScore(precision, demand({ maxLeadTimeDays: 10 }), now), 70);
  assert.equal(calculateLeadTimeScore(precision, demand({ maxLeadTimeDays: 7 }), now), 50);
  assert.equal(calculateLeadTimeScore(precision, demand({ maxLeadTimeDays: 3 }), now), 30);
  const delayed = result({ ...precision, availabilityDays: 14 }, { completionDate: "2026-10-14" });
  assert.equal(delayed.breakdown.leadTime, 40); // 28 days total, 21-day deadline.
  assert.match(delayed.explanations.leadTime, /14-day availability delay/);
  assert.ok(delayed.warnings.some((warning) => warning.includes("28 days") && warning.includes("21-day deadline")));
  assert.equal(delayed.reasons.some((reason) => reason.includes("fit your requested timeline")), false);
  assert.equal(calculateLeadTimeScore(precision, demand({ completionDate: "2026-09-22" }), now), 0);
  assert.equal(calculateLeadTimeScore(warehouse, demand({ completionDate: "2026-09-23" }), now), 100);
});

test("budget compares a whole order's upper estimate; flexibility receives neutral 80", () => {
  assert.equal(calculateCostScore(precision, demand({ budgetMax: 125000000 })), 100);
  assert.equal(calculateCostScore(precision, demand({ budgetMax: 115000000 })), 85);
  assert.equal(calculateCostScore(precision, demand({ budgetMax: 100000000 })), 70);
  assert.equal(calculateCostScore(precision, demand({ budgetMax: 80000000 })), 50);
  assert.equal(calculateCostScore(precision, demand({ budgetMax: 1000000 })), 30);
  assert.equal(calculateCostScore(precision, demand({ budgetMax: 1, budgetFlexible: true })), 80);
  assert.equal(calculateCostScore(precision, demand({ budgetMax: null })), 80);
  const crossing = result(precision, { budgetMax: 100000000 });
  assert.ok(crossing.warnings.some((warning) => warning.includes("range crosses")));
  assert.equal(crossing.reasons.some((reason) => reason.includes("cost range fits")), false);
});

test("unsupported materials and certificates are disclosed without invented credentials or hidden weights", () => {
  const base = result();
  const constrained = result(precision, {
    materials: ["Titanium", "Aluminum"], certifications: ["HACCP", "ISO 9001"],
    maxDistanceKm: 25, urgency: "urgent", qualityRequirements: "Tolerance ±0.01 mm", technicalNotes: "Finish sample required",
  });
  assert.equal(constrained.score, base.score);
  assert.ok(constrained.warnings.some((warning) => warning.includes("Titanium")));
  assert.ok(constrained.warnings.some((warning) => warning.includes("HACCP")));
  assert.equal(constrained.warnings.some((warning) => warning.includes("not listed: ISO 9001")), false);
  assert.ok(constrained.warnings.some((warning) => warning.includes("25 km") && warning.includes("not scored")));
  assert.ok(constrained.warnings.some((warning) => warning.includes("Urgency")));
  assert.ok(constrained.warnings.some((warning) => warning.includes("technical notes") && warning.includes("not scored")));
});

test("all classifications follow exact integer boundaries", () => {
  const possibleResults = [];
  for (const quantity of [100, 5000, 7500, 10000, 13000, 100000]) {
    for (const location of ["Bekasi", "Jakarta", "Bandung", "Semarang", "Surabaya"]) {
      for (const budgetMax of [150000000, 110000000, 100000000, 80000000, 1000]) {
        for (const capability of ["CNC Milling", "Metal Cutting", "Gear Hobbing"]) {
          for (const maxLeadTimeDays of [3, 7, 14]) {
            possibleResults.push(result(precision, { quantity, location, budgetMax, capability, maxLeadTimeDays }));
          }
        }
      }
    }
  }
  for (const matched of possibleResults) {
    const expected = matched.score >= 90 ? "Strong Match" : matched.score >= 75 ? "Good Match" : matched.score >= 60 ? "Potential Match" : "Limited Match";
    assert.equal(matched.classification, expected);
  }
  for (const boundary of [59, 60, 74, 75, 89, 90]) {
    assert.ok(possibleResults.some((matched) => matched.score === boundary), `Exercise boundary ${boundary}`);
  }
});

test("rankings are descending weighted scores, deterministic on ties, and preserve all providers", () => {
  const ranked = rankProviders(demand(), data.capacities, now);
  assert.equal(ranked.length, 24);
  assert.equal(ranked[0].provider.id, "precision-works");
  for (let index = 0; index < ranked.length; index++) {
    const match = ranked[index];
    const expected = Math.round(Object.entries(MATCH_WEIGHTS).reduce((total, [key, weight]) => total + match.breakdown[key] * weight, 0));
    assert.equal(match.score, expected);
    if (index) assert.ok(ranked[index - 1].score >= match.score);
  }
  const tie = { ...precision, id: "other-precision", ranking: precision.ranking - 1 };
  assert.deepEqual(rankProviders(demand(), [tie, precision], now).map((match) => match.provider.id), ["precision-works", "other-precision"]);
});

test("every form capability, unit, and provider combination returns finite bounded scores with full explanations", () => {
  for (const [category, { capabilities }] of Object.entries(options.categoryOptions)) {
    for (const capability of capabilities) for (const unit of options.demandUnits) {
      const ranked = rankProviders(demand({ category, capability, unit }), data.capacities, now);
      assert.equal(ranked.length, 24);
      for (const match of ranked) {
        for (const value of Object.values(match.breakdown)) assert.ok(Number.isFinite(value) && value >= 0 && value <= 100);
        for (const criterion of Object.keys(MATCH_WEIGHTS)) assert.ok(match.explanations[criterion].length > 0);
        if (match.estimatedCost) assert.ok(Number.isFinite(match.estimatedCost.min) && match.estimatedCost.min <= match.estimatedCost.max);
      }
    }
  }
});

test("invalid numeric quantities do not produce NaN, Infinity, false capacity claims, or order estimates", () => {
  for (const quantity of [0, -1, null, NaN, Infinity]) {
    const match = result(precision, { quantity });
    assert.equal(match.breakdown.capacity, 0);
    assert.equal(match.estimatedCost, null);
    assert.ok(Number.isFinite(match.score));
  }
});

test("ranking does not mutate the shared provider dataset or demand", () => {
  const beforeData = JSON.stringify(data.capacities);
  const requirement = demand();
  const beforeDemand = JSON.stringify(requirement);
  const ranked = rankProviders(requirement, Object.freeze([...data.capacities]), now);
  assert.equal(JSON.stringify(data.capacities), beforeData);
  assert.equal(JSON.stringify(requirement), beforeDemand);
  assert.notEqual(ranked, data.capacities);
});
