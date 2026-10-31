import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EVENT_TYPES, MANUFACTURERS } from "@/lib/constants";
import { exportLogs } from "@/lib/exporters";
import { generateLogBatch } from "@/lib/generators";
import { generateSchema } from "@/lib/validators";

const input = generateSchema.parse({ vendor: MANUFACTURERS[0], eventType: EVENT_TYPES[0], count: 5 });

describe("generateLogBatch", () => {
  it("gera a quantidade pedida com raw preenchido", () => {
    const logs = generateLogBatch(input);
    assert.equal(logs.length, 5);
    for (const log of logs) {
      assert.ok(log.raw.length > 0);
      assert.ok(log.timestamp instanceof Date);
    }
  });
});

describe("exportLogs", () => {
  const logs = generateLogBatch(input).map((log, index) => ({ ...log, id: String(index), createdAt: new Date() }));

  it("exporta JSON válido com todos os registros", () => {
    const result = exportLogs(logs as never, "json");
    assert.equal(result.extension, "json");
    assert.equal(JSON.parse(result.content).length, 5);
  });

  it("exporta texto com uma linha por raw", () => {
    const result = exportLogs(logs as never, "txt");
    assert.equal(result.mimeType, "text/plain");
    assert.ok(result.content.includes(logs[0].raw));
  });
});
