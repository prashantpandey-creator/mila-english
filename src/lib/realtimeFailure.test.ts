import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { classifyRealtimeFailure } from './realtimeFailure';

// REAL captured upstream output, not a hand-written approximation. This is the
// verbatim body OpenAI returned to `mila` in production on 2026-08-16T16:04:36Z
// when Gia Live voice went dead — recovered from `docker logs mila`. The whole
// point of this classifier is that this exact payload must never again reach a
// person as "check your network".
const CREDIT_EXHAUSTED_429 = readFileSync(
  new URL('./__fixtures__/openai-credit-exhausted-429.json', import.meta.url),
  'utf8',
);

// ── The incident itself ─────────────────────────────────────────────────────
{
  const failure = classifyRealtimeFailure(429, CREDIT_EXHAUSTED_429);
  assert.strictEqual(failure.code, 'OPENAI_QUOTA_EXHAUSTED', 'real prod 429 → quota code');
  assert.strictEqual(failure.status, 503, 'our billing outage is a 503, not a 502 guess');
  assert.ok(/credit/i.test(failure.operatorDetail), 'operator detail keeps the upstream reason');
}

// `insufficient_quota` is the stable signal; the sub-code has changed names
// before (`billing_hard_limit_reached`, `quota_exceeded`), so match on either.
{
  const byType = classifyRealtimeFailure(429, JSON.stringify({
    error: { message: 'You exceeded your current quota.', type: 'insufficient_quota', code: null },
  }));
  assert.strictEqual(byType.code, 'OPENAI_QUOTA_EXHAUSTED', 'type alone is enough');

  for (const code of ['billing_hard_limit_reached', 'quota_exceeded', 'insufficient_quota']) {
    const byCode = classifyRealtimeFailure(429, JSON.stringify({
      error: { message: 'nope', type: 'some_future_type', code },
    }));
    assert.strictEqual(byCode.code, 'OPENAI_QUOTA_EXHAUSTED', `sub-code ${code} → quota`);
  }
}

// ── A transient upstream rate limit is NOT a billing outage ─────────────────
{
  const failure = classifyRealtimeFailure(429, JSON.stringify({
    error: { message: 'Rate limit reached for gpt-realtime-2.1-mini', type: 'requests', code: 'rate_limit_exceeded' },
  }));
  assert.strictEqual(failure.code, 'OPENAI_RATE_LIMITED', '429 without quota markers → rate limited');
  assert.strictEqual(failure.status, 429, 'transient: tell the browser to back off, not that we are down');
}

// A bare 429 with no parseable reason is treated as transient, not as billing.
// Claiming "we are out of credit" without evidence would be its own lie.
{
  const failure = classifyRealtimeFailure(429, '');
  assert.strictEqual(failure.code, 'OPENAI_RATE_LIMITED', 'unattributed 429 → transient');
}

// ── Everything else keeps the existing generic contract ─────────────────────
{
  const badModel = classifyRealtimeFailure(400, JSON.stringify({
    error: { message: "The model 'gpt-realtime-9' does not exist", type: 'invalid_request_error', code: 'model_not_found' },
  }));
  assert.strictEqual(badModel.code, 'OPENAI_SESSION_FAILED', 'non-429 → unchanged generic code');
  assert.strictEqual(badModel.status, 502, 'non-429 → unchanged 502');

  const upstream500 = classifyRealtimeFailure(500, JSON.stringify({ error: { message: 'server error' } }));
  assert.strictEqual(upstream500.code, 'OPENAI_SESSION_FAILED');
}

// A 402 is unambiguous billing regardless of body shape.
{
  const failure = classifyRealtimeFailure(402, '');
  assert.strictEqual(failure.code, 'OPENAI_QUOTA_EXHAUSTED', '402 → quota');
  assert.strictEqual(failure.status, 503);
}

// ── Never throw on garbage: a classifier that crashes hides the outage ──────
{
  for (const body of ['', '<html>502 Bad Gateway</html>', '{', 'null', '[]', '{"error":"a string"}']) {
    const failure = classifyRealtimeFailure(500, body);
    assert.strictEqual(failure.code, 'OPENAI_SESSION_FAILED', `garbage body ${JSON.stringify(body)} survives`);
    assert.ok(typeof failure.operatorDetail === 'string', 'operatorDetail is always a string');
  }
}

// The operator detail is for logs, never for the browser: it must stay bounded
// so an HTML error page cannot flood the log line.
{
  const failure = classifyRealtimeFailure(500, 'x'.repeat(5_000));
  assert.ok(failure.operatorDetail.length <= 500, 'operator detail is truncated');
}

// ── Contract: every code the server can emit must be handled in every room ──
// This is the seam the original bug lived in. If the server grows a new code
// and a room does not learn it, that room silently falls back to its generic
// "check your network" default — which is exactly the lie this work removes.
// Source-level on purpose: the mappers live inside client components, and
// importing those here would drag React in for no added truth.
{
  const ROOMS = [
    'src/app/darshan/page.tsx', // Gia + Mila live voice
    'src/app/mia/talk/page.tsx', // Mia
    'src/app/pia/page.tsx', // Pia
  ];
  // OPENAI_SESSION_FAILED is the generic bucket; the default branch IS its
  // handler, so it is the one code a room may legitimately not name.
  const MUST_HANDLE = ['OPENAI_QUOTA_EXHAUSTED', 'OPENAI_RATE_LIMITED'];

  for (const room of ROOMS) {
    const source = readFileSync(new URL(`../../${room}`, import.meta.url), 'utf8');
    for (const code of MUST_HANDLE) {
      assert.ok(
        source.includes(code),
        `${room} does not handle ${code} — it would show the generic network message instead`,
      );
    }
  }
}

console.log('realtimeFailure: all assertions passed');
