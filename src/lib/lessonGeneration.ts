import { z } from 'zod';

export const LESSON_GENERATION_MAX_REQUEST_BYTES = 2_048;
export const LESSON_GENERATION_DAILY_USER_LIMIT = 20;

const topicSchema = z.string()
  .trim()
  .min(3)
  .max(120)
  .refine((value) => !/[\u0000-\u001f\u007f]/u.test(value), 'Control characters are not allowed')
  .refine((value) => /[\p{L}\p{N}]/u.test(value), 'A topic must contain a letter or number')
  .transform((value) => value.replace(/ {2,}/g, ' '));

const requestSchema = z.object({ topic: topicSchema }).strict();

export type LessonGenerationRequestResult =
  | { success: true; topic: string }
  | { success: false; code: 'INVALID_INPUT' | 'PAYLOAD_TOO_LARGE' };

/** Read and validate a tiny JSON request without ever buffering an unbounded body. */
export async function readLessonGenerationRequest(
  request: Request,
  maxBytes = LESSON_GENERATION_MAX_REQUEST_BYTES,
): Promise<LessonGenerationRequestResult> {
  const contentType = request.headers.get('content-type') || '';
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return { success: false, code: 'INVALID_INPUT' };
  }

  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { success: false, code: 'PAYLOAD_TOO_LARGE' };
  }
  if (!request.body) return { success: false, code: 'INVALID_INPUT' };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { success: false, code: 'PAYLOAD_TOO_LARGE' };
      }
      chunks.push(value);
    }
  } catch {
    return { success: false, code: 'INVALID_INPUT' };
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    const parsed = requestSchema.safeParse(body);
    return parsed.success
      ? { success: true, topic: parsed.data.topic }
      : { success: false, code: 'INVALID_INPUT' };
  } catch {
    return { success: false, code: 'INVALID_INPUT' };
  }
}

type QuotaBucket = { hits: number[]; windowMs: number };
const quotaBuckets = new Map<string, QuotaBucket>();
const LESSON_GENERATION_MAX_BUCKETS = 10_000;

const QUOTA_RULES = [
  { scope: 'user-burst', limit: 4, windowMs: 15 * 60_000 },
  { scope: 'user-day', limit: LESSON_GENERATION_DAILY_USER_LIMIT, windowMs: 24 * 60 * 60_000 },
  { scope: 'ip-burst', limit: 12, windowMs: 15 * 60_000 },
  { scope: 'ip-day', limit: 60, windowMs: 24 * 60 * 60_000 },
] as const;

export type LessonGenerationQuota =
  | { allowed: true; retryAfterSeconds: 0 }
  | { allowed: false; retryAfterSeconds: number };

/**
 * Apply learner and network ceilings atomically. A denied request consumes no
 * additional quota, and each bucket retains its own window during cleanup.
 */
export function consumeLessonGenerationQuota(
  userId: number,
  networkIdentity: string,
  now = Date.now(),
): LessonGenerationQuota {
  const identity = networkIdentity.trim().slice(0, 200) || 'unknown';
  const candidates = QUOTA_RULES.map((rule) => {
    const subject = rule.scope.startsWith('user-') ? String(userId) : identity;
    const key = `lesson-generation:${rule.scope}:${subject}`;
    const recent = (quotaBuckets.get(key)?.hits || []).filter((hit) => now - hit < rule.windowMs);
    return { ...rule, key, recent };
  });

  const blocked = candidates.filter((candidate) => candidate.recent.length >= candidate.limit);
  if (blocked.length) {
    for (const candidate of candidates) {
      if (quotaBuckets.has(candidate.key)) {
        quotaBuckets.set(candidate.key, { hits: candidate.recent, windowMs: candidate.windowMs });
      }
    }
    const retryAfterSeconds = Math.max(...blocked.map((candidate) => {
      const retryAfterMs = Math.max(1_000, candidate.windowMs - (now - candidate.recent[0]));
      return Math.ceil(retryAfterMs / 1_000);
    }));
    return { allowed: false, retryAfterSeconds };
  }

  const requiredNewBuckets = candidates.filter((candidate) => !quotaBuckets.has(candidate.key)).length;
  if (quotaBuckets.size + requiredNewBuckets > LESSON_GENERATION_MAX_BUCKETS) {
    for (const [key, bucket] of quotaBuckets) {
      const active = bucket.hits.filter((hit) => now - hit < bucket.windowMs);
      if (active.length) quotaBuckets.set(key, { ...bucket, hits: active });
      else quotaBuckets.delete(key);
    }
    const stillRequired = candidates.filter((candidate) => !quotaBuckets.has(candidate.key)).length;
    if (quotaBuckets.size + stillRequired > LESSON_GENERATION_MAX_BUCKETS) {
      let soonest = now + 15 * 60_000;
      for (const bucket of quotaBuckets.values()) {
        if (bucket.hits.length) soonest = Math.min(soonest, bucket.hits[0] + bucket.windowMs);
      }
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(Math.max(1_000, soonest - now) / 1_000),
      };
    }
  }

  for (const candidate of candidates) {
    quotaBuckets.set(candidate.key, { hits: [...candidate.recent, now], windowMs: candidate.windowMs });
  }
  return { allowed: true, retryAfterSeconds: 0 };
}
