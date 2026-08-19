/**
 * The watcher's decision layer.
 *
 * Gia Live voice died on 2026-08-16 and nobody found out for three days — the
 * owner found it by pressing the orb himself. Nothing watched the one thing
 * that could fail silently: whether OpenAI will still issue us a realtime
 * session. This module turns a single mint attempt into a verdict.
 *
 * It is pure on purpose. The network call lives in scripts/voice-credit-probe.mjs;
 * everything that decides lives here, where it can be tested against the
 * verbatim body production actually returned.
 *
 * Two rules it must never break:
 *   1. Never report "ok" from a check that did not truly succeed. A green
 *      dashboard over an unrun probe is worse than no dashboard.
 *   2. Never report "out of credit" without the quota markers. A false billing
 *      alarm teaches the owner to ignore the real one.
 */
import { classifyRealtimeFailure } from './realtimeFailure';

/** Prefix so the envelope can be recovered from interleaved SSH output. */
export const PROBE_SENTINEL = 'VOICE_PROBE_ENVELOPE';

export type ProbeStatus = 'ok' | 'degraded' | 'unknown';

export interface ProbeEnvelope {
  /** Did the probe reach a verdict? Detecting an outage counts as success. */
  success: boolean;
  data: {
    status: ProbeStatus;
    code: string;
    model: string;
    latencyMs: number | null;
    checkedAt: string;
  };
  metadata: { tool: 'voice-credit-probe'; version: 1 };
  errors: Array<{ code: string; message: string }>;
}

export interface ProbeInput {
  /** Set when OPENAI_API_KEY is absent — the probe cannot judge anything. */
  missingApiKey?: boolean;
  /** Set when fetch() itself threw (DNS, TLS, timeout). */
  transportError?: string;
  httpStatus?: number;
  body?: string;
  latencyMs?: number;
  model: string;
  checkedAt: string;
}

const MESSAGE_MAX = 300;

function envelope(
  success: boolean,
  status: ProbeStatus,
  code: string,
  input: ProbeInput,
  errors: Array<{ code: string; message: string }>,
): ProbeEnvelope {
  return {
    success,
    data: {
      status,
      code,
      model: input.model,
      latencyMs: typeof input.latencyMs === 'number' ? input.latencyMs : null,
      checkedAt: input.checkedAt,
    },
    metadata: { tool: 'voice-credit-probe', version: 1 },
    errors: errors.map((e) => ({ code: e.code, message: e.message.slice(0, MESSAGE_MAX) })),
  };
}

export function buildProbeEnvelope(input: ProbeInput): ProbeEnvelope {
  if (input.missingApiKey) {
    // `unknown`, never `degraded`: an unconfigured probe says nothing about
    // whether voice works, and must not fire a billing alarm.
    return envelope(false, 'unknown', 'NO_API_KEY', input, [
      { code: 'NO_API_KEY', message: 'OPENAI_API_KEY is not set in the container environment' },
    ]);
  }

  if (input.transportError) {
    return envelope(true, 'degraded', 'OPENAI_UNREACHABLE', input, [
      { code: 'OPENAI_UNREACHABLE', message: input.transportError },
    ]);
  }

  const httpStatus = input.httpStatus ?? 0;
  const body = input.body ?? '';

  if (httpStatus === 200) {
    // The status line is not the product. A session token is. Checking only
    // for 200 would be a probe that measures the wrong thing and stays green
    // through the outage it exists to catch.
    let token = '';
    try {
      const parsed: unknown = JSON.parse(body);
      const value = (parsed as { value?: unknown } | null)?.value;
      if (typeof value === 'string') token = value;
    } catch {
      token = '';
    }
    if (!token) {
      return envelope(true, 'degraded', 'NO_TOKEN_ISSUED', input, [
        { code: 'NO_TOKEN_ISSUED', message: 'OpenAI returned 200 but issued no ephemeral token' },
      ]);
    }
    return envelope(true, 'ok', 'OK', input, []);
  }

  // One classifier for the room and the watcher. If these ever disagree, the
  // alert would describe a different outage than the one people are seeing.
  const failure = classifyRealtimeFailure(httpStatus, body);
  return envelope(true, 'degraded', failure.code, input, [
    { code: failure.code, message: failure.operatorDetail },
  ]);
}

/** Exit code for humans: 0 healthy, 1 anything else. */
export function exitCodeFor(result: ProbeEnvelope): number {
  return result.data.status === 'ok' ? 0 : 1;
}
