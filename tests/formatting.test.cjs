const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

function load(relativePath) {
  const filename = path.resolve(__dirname, "..", relativePath);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }, fileName: filename,
  });
  const module = { exports: {} };
  new Function("module", "exports", outputText)(module, module.exports);
  return module.exports;
}

const { formatPrice, formatNumber, formatCurrencyInput } = load("lib/capacity-format.ts");
const { requestDate, requestDateLong, requestTime } = load("lib/request-format.ts");

test("IDR and quantity formatting use one interface convention", () => {
  assert.equal(formatPrice(21500), "Rp21.500");
  assert.equal(formatPrice(107500000), "Rp107.500.000");
  assert.equal(formatCurrencyInput(21500), "21.500");
  assert.equal(formatNumber(6500), "6,500");
});

test("business dates remain on their calendar day and time uses Jakarta", () => {
  assert.equal(requestDate("2026-10-13"), "13 Oct 2026");
  assert.equal(requestDateLong("2026-10-13"), "13 October 2026");
  assert.equal(requestDateLong("2026-09-27T18:00:00Z"), "28 September 2026");
  assert.equal(requestDate("2026-10-32"), "Not specified");
  assert.equal(requestTime("2026-09-28T03:24:00Z"), "10:24");
});
