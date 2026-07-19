type Bucket = { hits: number[]; windowMs: number };

const MAX_BUCKETS_PER_NAMESPACE = 2_000;
const stores = new Map<string, Map<string, Bucket>>();

function namespaceFor(key: string) {
  const separator = key.indexOf(':');
  return (separator > 0 ? key.slice(0, separator) : key).slice(0, 80) || 'default';
}

function retryAfterForCapacity(store: Map<string, Bucket>, now: number, fallbackWindowMs: number) {
  let soonest = now + fallbackWindowMs;
  for (const bucket of store.values()) {
    if (!bucket.hits.length) continue;
    soonest = Math.min(soonest, bucket.hits[0] + bucket.windowMs);
  }
  return Math.ceil(Math.max(1_000, soonest - now) / 1_000);
}

export function requestIdentity(request: Request): string {
  // Mila is reached through one trusted reverse proxy. Use the last forwarded
  // hop so a client-supplied first value cannot manufacture new buckets.
  const forwarded = request.headers.get('x-forwarded-for')
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .at(-1);
  return forwarded || request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export function consumeAuthAttempt(key: string, options: { limit: number; windowMs: number }, now = Date.now()) {
  const namespace = namespaceFor(key);
  const store = stores.get(namespace) || new Map<string, Bucket>();
  stores.set(namespace, store);

  const existing = store.get(key);
  // If code accidentally reuses a key with a shorter window, preserve the
  // stricter existing TTL rather than silently clearing security history.
  const windowMs = Math.max(options.windowMs, existing?.windowMs || 0);
  const recent = (existing?.hits || []).filter((hit) => now - hit < windowMs);
  if (recent.length >= options.limit) {
    const retryAfterMs = Math.max(1_000, windowMs - (now - recent[0]));
    store.set(key, { hits: recent, windowMs });
    return { allowed: false as const, retryAfterSeconds: Math.ceil(retryAfterMs / 1_000) };
  }

  if (!existing && store.size >= MAX_BUCKETS_PER_NAMESPACE) {
    // Reclaim only genuinely expired identities using each bucket's own TTL.
    // If the namespace is still full, fail closed: active brute-force or cost
    // ceilings must never be evicted into a clean state.
    for (const [bucketKey, bucket] of store) {
      const active = bucket.hits.filter((hit) => now - hit < bucket.windowMs);
      if (active.length) store.set(bucketKey, { ...bucket, hits: active });
      else store.delete(bucketKey);
    }
    if (store.size >= MAX_BUCKETS_PER_NAMESPACE) {
      return {
        allowed: false as const,
        retryAfterSeconds: retryAfterForCapacity(store, now, options.windowMs),
      };
    }
  }

  recent.push(now);
  store.set(key, { hits: recent, windowMs });
  return { allowed: true as const, retryAfterSeconds: 0 };
}
