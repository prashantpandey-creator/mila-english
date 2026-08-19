/**
 * Asks OpenAI, once, whether it will still issue us a realtime session — and
 * prints one JSON envelope saying so.
 *
 * Runs INSIDE the `mila` container, because that is the only place the
 * production OPENAI_API_KEY exists. The key is deliberately kept out of GitHub
 * (see .github/workflows/deploy.yml: forwarding it through the SSH action would
 * expose it on the remote command line), so the watcher comes to the key rather
 * than the key going to the watcher.
 *
 *   docker exec mila node --import tsx scripts/voice-credit-probe.mjs
 *
 * Minting an ephemeral token costs nothing — no audio is exchanged and the
 * token is discarded unused — so hourly is free. It is also the ONLY check that
 * proves the thing people actually press: on 2026-08-16 the app was healthy,
 * the key was valid, the model was current, and voice was still dead, because
 * the account had no credit. Nothing short of asking for a session finds that.
 *
 * Output: exactly one line, `VOICE_PROBE_ENVELOPE {json}`, on stdout. Anything
 * else goes to stderr so the envelope survives interleaved SSH noise.
 * Exit 0 healthy, 1 degraded or undecidable.
 */
import { buildProbeEnvelope, exitCodeFor, PROBE_SENTINEL } from '../src/lib/voiceCreditProbe.ts';
import { buildRealtimeSession } from '../src/lib/assessment.ts';

const TIMEOUT_MS = 20_000;

// Probe exactly what Gia asks for. Hard-coding a model here would let the app
// move to a model the watcher never tests, and the watcher would stay green
// through an outage of the only model anyone uses.
const model = buildRealtimeSession('gia').model;
const checkedAt = new Date().toISOString();
const apiKey = process.env.OPENAI_API_KEY?.trim();

function emit(envelope) {
  process.stdout.write(`${PROBE_SENTINEL} ${JSON.stringify(envelope)}\n`);
  process.exit(exitCodeFor(envelope));
}

if (!apiKey) {
  emit(buildProbeEnvelope({ missingApiKey: true, model, checkedAt }));
}

const startedAt = Date.now();
try {
  const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ session: { type: 'realtime', model } }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = await response.text();
  emit(buildProbeEnvelope({
    httpStatus: response.status,
    body,
    latencyMs: Date.now() - startedAt,
    model,
    checkedAt,
  }));
} catch (error) {
  emit(buildProbeEnvelope({
    transportError: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    latencyMs: Date.now() - startedAt,
    model,
    checkedAt,
  }));
}
