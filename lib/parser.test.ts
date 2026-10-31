import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseManyRawLogs, parseRawLog } from "@/lib/parser";

describe("parseRawLog", () => {
  it("reconhece JSON e normaliza os campos", () => {
    const parsed = parseRawLog(JSON.stringify({ src_ip: "10.0.0.5", dst_ip: "10.0.0.9", severity: "high" }));
    assert.equal(parsed.format, "json");
    assert.equal(parsed.normalized.sourceIp, "10.0.0.5");
    assert.equal(parsed.normalized.destinationIp, "10.0.0.9");
    assert.equal(parsed.normalized.severity, "high");
  });

  it("reconhece chave=valor", () => {
    const parsed = parseRawLog('date=2026-01-01 srcip=10.0.0.5 dstip=10.0.0.9 action="deny"');
    assert.equal(parsed.format, "key_value");
    assert.equal(parsed.normalized.sourceIp, "10.0.0.5");
    assert.equal(parsed.normalized.action, "deny");
  });

  it("não falha com texto livre ou JSON quebrado", () => {
    assert.equal(parseRawLog("evento sem estrutura").format, "plain_text");
    assert.notEqual(parseRawLog("{quebrado").format, "json");
  });

  it("processa vários logs", () => {
    assert.equal(parseManyRawLogs([{ raw: "a" }, { raw: "b" }]).length, 2);
  });
});
