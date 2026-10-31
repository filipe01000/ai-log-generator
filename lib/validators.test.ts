import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EVENT_TYPES, MANUFACTURERS } from "@/lib/constants";
import { aiScenarioSchema, exportSchema, generateSchema } from "@/lib/validators";

const base = { vendor: MANUFACTURERS[0], eventType: EVENT_TYPES[0] };

describe("generateSchema", () => {
  it("aplica padrões e converte números enviados como texto", () => {
    const parsed = generateSchema.parse({ ...base, count: "10" });
    assert.equal(parsed.count, 10);
    assert.equal(parsed.severity, "medium");
    assert.equal(parsed.useAI, false);
  });

  it("recusa volumes fora do limite e fabricantes desconhecidos", () => {
    assert.equal(generateSchema.safeParse({ ...base, count: 5001 }).success, false);
    assert.equal(generateSchema.safeParse({ ...base, count: 0 }).success, false);
    assert.equal(generateSchema.safeParse({ ...base, vendor: "Outro" }).success, false);
  });
});

describe("aiScenarioSchema", () => {
  it("exige ao menos um fabricante", () => {
    const result = aiScenarioSchema.safeParse({ vendors: [] });
    assert.equal(result.success, false);
    assert.ok(result.error?.flatten().fieldErrors.vendors);
  });
});

describe("exportSchema", () => {
  it("limita a quantidade exportada", () => {
    assert.equal(exportSchema.safeParse({ format: "json", limit: 10_001 }).success, false);
    assert.equal(exportSchema.parse({ format: "json" }).limit, 1000);
  });
});
