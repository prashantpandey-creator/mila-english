/**
 * Why this file exists.
 *
 * On 2026-08-16 Gia Live voice went dead for a whole day. The cause was banal:
 * the OpenAI account ran out of credit, and every `POST /v1/realtime/calls`
 * came back `429 insufficient_quota / credit_balance_exhausted`. But the route
 * collapsed EVERY non-OK upstream response into one 502 `OPENAI_SESSION_FAILED`,
 * which the voice room rendered as "Live voice could not connect. Check your
 * network, then try again."
 *
 * So the person was told to check a network that was fine, about a product that
 * was working, because of a bill that was not paid. The only place the truth
 * existed was `docker logs mila`. A billing outage and a code bug looked
 * identical from the seat.
 *
 * This classifier splits the one bucket into three, so the room can say
 * something true. It is deliberately pure and total: it never throws, never
 * fetches, and always returns a code — a classifier that crashes on a weird
 * body would hide exactly the outage it exists to reveal.
 */

export type RealtimeFailureCode =
  /** Our account cannot pay for the call. Nothing the person does will help. */
  | 'OPENAI_QUOTA_EXHAUSTED'
  /** Upstream is throttling us. Transient — trying again later genuinely works. */
  | 'OPENAI_RATE_LIMITED'
  /** Anything else. Unchanged from the pre-2026-08-19 contract. */
  | 'OPENAI_SESSION_FAILED';

export interface RealtimeFailure {
  code: RealtimeFailureCode;
  /** The status WE return to the browser (not the upstream status). */
  status: number;
  /** Short operator-facing text for the JSON body. Never rendered verbatim. */
  message: string;
  /** Upstream reason, for the server log line only. Bounded; never sent out. */
  operatorDetail: string;
}

const DETAIL_MAX = 500;

/**
 * `type: 'insufficient_quota'` is the stable marker across OpenAI's billing
 * errors; the narrower `code` has been renamed more than once, so accept the
 * known aliases too rather than pinning to whichever one shipped today.
 */
const QUOTA_TYPES = new Set(['insufficient_quota']);
const QUOTA_CODES = new Set([
  'credit_balance_exhausted',
  'billing_hard_limit_reached',
  'insufficient_quota',
  'quota_exceeded',
]);

function readUpstreamError(body: string): { type: string; code: string; message: string } {
  try {
    const parsed: unknown = JSON.parse(body);
    if (!parsed || typeof parsed !== 'object') return { type: '', code: '', message: '' };
    const error = (parsed as { error?: unknown }).error;
    if (!error || typeof error !== 'object') return { type: '', code: '', message: '' };
    const shape = error as { type?: unknown; code?: unknown; message?: unknown };
    return {
      type: typeof shape.type === 'string' ? shape.type : '',
      code: typeof shape.code === 'string' ? shape.code : '',
      message: typeof shape.message === 'string' ? shape.message : '',
    };
  } catch {
    // Non-JSON bodies are ordinary here: a proxy 502 page, an empty body on a
    // hard upstream cut. Falling through to the generic branch is correct.
    return { type: '', code: '', message: '' };
  }
}

export function classifyRealtimeFailure(upstreamStatus: number, body: string): RealtimeFailure {
  const raw = typeof body === 'string' ? body : '';
  const { type, code, message } = readUpstreamError(raw);
  const operatorDetail = (message || raw).slice(0, DETAIL_MAX);

  const isQuota = QUOTA_TYPES.has(type) || QUOTA_CODES.has(code);

  // 402 is unambiguous payment, whatever the body looks like.
  if (upstreamStatus === 402 || (upstreamStatus === 429 && isQuota)) {
    return {
      code: 'OPENAI_QUOTA_EXHAUSTED',
      // 503, not 502: the service is genuinely unavailable and it is our
      // ledger, not a bad gateway between us and OpenAI.
      status: 503,
      message: 'Live voice is out of service credit.',
      operatorDetail: operatorDetail || 'upstream reported a billing failure with no body',
    };
  }

  if (upstreamStatus === 429) {
    // An unattributed 429 is treated as throttling, NOT as billing. Telling a
    // person we are out of credit when we have not seen the quota markers
    // would just be a different confident lie.
    return {
      code: 'OPENAI_RATE_LIMITED',
      status: 429,
      message: 'The voice service is busy right now.',
      operatorDetail: operatorDetail || 'upstream 429 with no parseable reason',
    };
  }

  return {
    code: 'OPENAI_SESSION_FAILED',
    status: 502,
    message: 'OpenAI could not start the voice session.',
    operatorDetail: operatorDetail || `upstream ${upstreamStatus} with no body`,
  };
}
