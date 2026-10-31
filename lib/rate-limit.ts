type Bucket = {
  count: number;
  resetAt: number;
};

const MAX_BUCKETS = 10_000;
const buckets = new Map<string, Bucket>();

function makeRoom(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
  if (buckets.size < MAX_BUCKETS) return;
  const oldest = buckets.keys().next().value;
  if (oldest !== undefined) buckets.delete(oldest);
}

export function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt < now) {
    if (!current && buckets.size >= MAX_BUCKETS) makeRoom(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  return { allowed: true, remaining: limit - current.count, resetAt: current.resetAt };
}

export function resetRateLimits() {
  buckets.clear();
}

// O cliente controla o início do X-Forwarded-For. Só a entrada escrita pelo proxy
// confiável serve de identidade; sem proxy configurado, todos dividem o mesmo limite.
export function getClientKey(request: Request) {
  const hops = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "0", 10);

  if (hops > 0) {
    const chain = (request.headers.get("x-forwarded-for") ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    const client = chain[chain.length - hops];
    if (client) return client;
  }

  return "shared-client";
}
