import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sanitizeStringArray, sanitizeText } from "@/lib/security";

describe("sanitizeText", () => {
  it("remove tags, caracteres de controle e espaços nas pontas", () => {
    assert.equal(sanitizeText("  <b>log</b>\u0000\u001b ok "), "log ok");
  });

  it("corta no tamanho máximo e aceita valores vazios", () => {
    assert.equal(sanitizeText("abcdef", 3), "abc");
    assert.equal(sanitizeText(null), "");
    assert.equal(sanitizeText(undefined), "");
  });
});

describe("sanitizeStringArray", () => {
  it("limpa os itens, descarta vazios e limita a quantidade", () => {
    assert.deepEqual(sanitizeStringArray(["<i>a</i>", "", "b", "c"], 2), ["a", "b"]);
  });

  it("recusa o que não é lista", () => {
    assert.deepEqual(sanitizeStringArray("texto"), []);
  });
});
