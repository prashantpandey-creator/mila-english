import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { buildProbeEnvelope, PROBE_SENTINEL } from './voiceCreditProbe';

const CREDIT_EXHAUSTED_429 = readFileSync(
  new URL('./__fixtures__/openai-credit-exhausted-429.json', import.meta.url),
  'utf8',
);

const MODEL = 'gpt-realtime-2.1-mini';

// ── Healthy: a minted token is the only proof that voice actually works ─────
{
  const envelope = buildProbeEnvelope({
    httpStatus: 200,
    body: JSON.stringify({ value: 'ek_abc123', session: { model: MODEL } }),
    latencyMs: 1107,
    model: MODEL,
    checkedAt: '2026-08-19T22:30:00.000Z',
  });
  assert.strictEqual(envelope.success, true, 'the probe decided');
  assert.strictEqual(envelope.data.status, 'ok');
  assert.strictEqual(envelope.data.code, 'OK');
  assert.strictEqual(envelope.data.latencyMs, 1107);
  assert.deepStrictEqual(envelope.errors, []);
}

// A 200 that carries no token is NOT healthy. Voice needs the token, not the
// status line — this is the "measuring the wrong thing" trap.
{
  const envelope = buildProbeEnvelope({
    httpStatus: 200,
    body: JSON.stringify({ session: { model: MODEL } }),
    latencyMs: 90,
    model: MODEL,
    checkedAt: '2026-08-19T22:30:00.000Z',
  });
  assert.strictEqual(envelope.data.status, 'degraded', '200 without a token is degraded');
  assert.strictEqual(envelope.data.code, 'NO_TOKEN_ISSUED');
  assert.strictEqual(envelope.errors.length, 1);
}

// ── The incident this exists to catch ───────────────────────────────────────
{
  const envelope = buildProbeEnvelope({
    httpStatus: 429,
    body: CREDIT_EXHAUSTED_429,
    latencyMs: 210,
    model: MODEL,
    checkedAt: '2026-08-19T22:30:00.000Z',
  });
  assert.strictEqual(envelope.success, true, 'detecting an outage IS a successful decision');
  assert.strictEqual(envelope.data.status, 'degraded');
  assert.strictEqual(envelope.data.code, 'OPENAI_QUOTA_EXHAUSTED');
  assert.strictEqual(envelope.errors[0].code, 'OPENAI_QUOTA_EXHAUSTED');
  assert.ok(/credit/i.test(envelope.errors[0].message), 'upstream reason survives to the alert');
}

// Throttling is degraded too, but must stay a DIFFERENT code — waking someone
// at 3am for a transient 429 is how alerts get muted forever.
{
  const envelope = buildProbeEnvelope({
    httpStatus: 429,
    body: JSON.stringify({ error: { code: 'rate_limit_exceeded', type: 'requests', message: 'slow down' } }),
    latencyMs: 150,
    model: MODEL,
    checkedAt: '2026-08-19T22:30:00.000Z',
  });
  assert.strictEqual(envelope.data.code, 'OPENAI_RATE_LIMITED');
  assert.strictEqual(envelope.data.status, 'degraded');
}

// ── The probe could not decide ──────────────────────────────────────────────
{
  const noKey = buildProbeEnvelope({ missingApiKey: true, model: MODEL, checkedAt: '2026-08-19T22:30:00.000Z' });
  assert.strictEqual(noKey.success, false, 'no key = the probe cannot judge voice health');
  assert.strictEqual(noKey.errors[0].code, 'NO_API_KEY');
  assert.strictEqual(noKey.data.status, 'unknown', 'never claim "ok" from an unrun check');
}

// A thrown fetch is a real outage from the seat, but must not masquerade as a
// billing verdict.
{
  const envelope = buildProbeEnvelope({
    transportError: 'fetch failed: ETIMEDOUT',
    model: MODEL,
    checkedAt: '2026-08-19T22:30:00.000Z',
  });
  assert.strictEqual(envelope.success, true);
  assert.strictEqual(envelope.data.status, 'degraded');
  assert.strictEqual(envelope.data.code, 'OPENAI_UNREACHABLE');
  assert.ok(/ETIMEDOUT/.test(envelope.errors[0].message));
}

// ── The envelope must survive a hostile transport ───────────────────────────
// It is read back out of interleaved SSH output, so it must be exactly one
// line, sentinel-prefixed, and JSON-parseable after the sentinel is stripped.
{
  const envelope = buildProbeEnvelope({
    httpStatus: 429,
    body: CREDIT_EXHAUSTED_429,
    latencyMs: 210,
    model: MODEL,
    checkedAt: '2026-08-19T22:30:00.000Z',
  });
  const line = `${PROBE_SENTINEL} ${JSON.stringify(envelope)}`;
  assert.ok(!line.slice(PROBE_SENTINEL.length).includes('\n'), 'envelope is a single line');
  const parsed = JSON.parse(line.slice(PROBE_SENTINEL.length).trim());
  assert.strictEqual(parsed.data.code, 'OPENAI_QUOTA_EXHAUSTED', 'survives the round-trip');
}

// Bounded: an HTML error page must not become a multi-kilobyte alert body.
{
  const envelope = buildProbeEnvelope({
    httpStatus: 502,
    body: `<html>${'x'.repeat(9_000)}</html>`,
    latencyMs: 5,
    model: MODEL,
    checkedAt: '2026-08-19T22:30:00.000Z',
  });
  assert.ok(JSON.stringify(envelope).length < 1_200, 'envelope stays small enough to alert with');
  assert.strictEqual(envelope.data.code, 'OPENAI_SESSION_FAILED');
}

console.log('voiceCreditProbe: all assertions passed');
