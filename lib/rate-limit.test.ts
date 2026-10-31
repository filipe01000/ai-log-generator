import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { getClientKey, rateLimit, resetRateLimits } from "@/lib/rate-limit";

function requestWith(forwardedFor?: string) {
  const headers = forwardedFor ? { "x-forwarded-for": forwardedFor } : undefined;
  return new Request("http://localhost/api", { headers });
}

describe("rateLimit", () => {
  beforeEach(() => resetRateLimits());
  afterEach(() => mock.timers.reset());

  it("bloqueia ao atingir o limite e conta chaves separadamente", () => {
    assert.equal(rateLimit("a", 2).allowed, true);
    assert.equal(rateLimit("a", 2).remaining, 0);
    assert.equal(rateLimit("a", 2).allowed, false);
    assert.equal(rateLimit("b", 2).allowed, true);
  });

  it("libera de novo depois da janela", () => {
    mock.timers.enable({ apis: ["Date"], now: 1_000 });
    rateLimit("a", 1, 1_000);
    assert.equal(rateLimit("a", 1, 1_000).allowed, false);
    mock.timers.tick(1_001);
    assert.equal(rateLimit("a", 1, 1_000).allowed, true);
  });

  it("mantém funcionando com muitas chaves diferentes", () => {
    for (let index = 0; index < 10_050; index += 1) rateLimit(`key-${index}`, 1, 60_000);
    assert.equal(rateLimit("key-10049", 1, 60_000).allowed, false);
    assert.equal(rateLimit("nova", 1, 60_000).allowed, true);
  });
});

describe("getClientKey", () => {
  const original = process.env.TRUSTED_PROXY_HOPS;
  afterEach(() => {
    if (original === undefined) delete process.env.TRUSTED_PROXY_HOPS;
    else process.env.TRUSTED_PROXY_HOPS = original;
  });

  it("ignora cabeçalhos do cliente quando não há proxy configurado", () => {
    delete process.env.TRUSTED_PROXY_HOPS;
    assert.equal(getClientKey(requestWith("1.1.1.1")), getClientKey(requestWith("2.2.2.2")));
  });

  it("usa a entrada do proxy, não a enviada pelo cliente", () => {
    process.env.TRUSTED_PROXY_HOPS = "1";
    assert.equal(getClientKey(requestWith("6.6.6.6, 203.0.113.9")), "203.0.113.9");
    assert.equal(getClientKey(requestWith("7.7.7.7, 203.0.113.9")), "203.0.113.9");
  });

  it("conta os proxies a partir do fim da cadeia", () => {
    process.env.TRUSTED_PROXY_HOPS = "2";
    assert.equal(getClientKey(requestWith("6.6.6.6, 203.0.113.9, 10.0.0.1")), "203.0.113.9");
  });

  it("volta ao limite compartilhado se a cadeia for curta ou inválida", () => {
    process.env.TRUSTED_PROXY_HOPS = "3";
    assert.equal(getClientKey(requestWith("1.1.1.1")), "shared-client");
    process.env.TRUSTED_PROXY_HOPS = "abc";
    assert.equal(getClientKey(requestWith("1.1.1.1")), "shared-client");
  });
});
