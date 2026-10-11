const WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_WINDOW = 5;

// Best-effort fallback when no KV binding is configured: state only survives
// as long as this isolate stays warm, so it's a deterrent against rapid
// bot retries, not a real distributed limiter. Binding a free Cloudflare KV
// namespace (see README) upgrades this to a proper cross-request limit.
const memoryHits = new Map<string, number[]>();

function pruneAndCount(hits: number[], now: number): number[] {
  return hits.filter((t) => now - t < WINDOW_SECONDS * 1000);
}

async function checkKvRateLimit(kv: KVNamespace, ip: string): Promise<boolean> {
  const key = `ratelimit:${ip}`;
  const raw = await kv.get(key);
  const count = raw ? Number(raw) : 0;
  if (count >= MAX_REQUESTS_PER_WINDOW) return false;
  await kv.put(key, String(count + 1), { expirationTtl: WINDOW_SECONDS });
  return true;
}

function checkMemoryRateLimit(ip: string): boolean {
  const now = Date.now();
  const hits = pruneAndCount(memoryHits.get(ip) ?? [], now);
  if (hits.length >= MAX_REQUESTS_PER_WINDOW) {
    memoryHits.set(ip, hits);
    return false;
  }
  hits.push(now);
  memoryHits.set(ip, hits);
  return true;
}

/** True if this IP is still within its rate limit for the current window. */
export async function isWithinRateLimit(ip: string, kv?: KVNamespace): Promise<boolean> {
  if (!ip) return true;
  if (kv) return checkKvRateLimit(kv, ip);
  return checkMemoryRateLimit(ip);
}
