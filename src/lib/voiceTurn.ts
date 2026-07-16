// ── voiceTurn.ts — pure decision logic for low-latency Darshan voice turns ───
// Everything here is deterministic and unit-tested (voiceTurn.test.ts):
//   endpointSilenceMs   — adaptive end-of-turn silence window from partial ASR text
//   pickBackchannel     — rotating spoken acknowledgment while the reply generates
//   draftMatches        — may a speculative draft be committed as the real answer?
//   splitCompleteSentences — sentence boundaries for the server-side voice guard

export type VoiceLocale = 'ru' | 'en';

const BACKCHANNELS: Record<VoiceLocale, string[]> = {
  en: ['Mm-hm.', 'Hmm, let me think.', 'Okay.', 'Right.', 'Good question.'],
  ru: ['Мм, сейчас подумаю.', 'Ага.', 'Хорошо.', 'Так.', 'Хороший вопрос.'],
};

export type BackchannelPick = { text: string; index: number };

/** The fixed filler pool for a locale — exported so TTS can pre-cache clips. */
export function backchannelTexts(locale: VoiceLocale): string[] {
  return [...BACKCHANNELS[locale]];
}

/** Deterministic per-seed pick that never repeats the previous index. */
export function pickBackchannel(
  locale: VoiceLocale,
  seed: number,
  lastIndex: number | null,
): BackchannelPick {
  const pool = BACKCHANNELS[locale];
  let index = Math.abs(seed) % pool.length;
  if (index === lastIndex) index = (index + 1) % pool.length;
  return { text: pool[index], index };
}

// Words that signal an unfinished thought when they end a partial transcript.
const TRAILING_CONNECTORS = new Set([
  'and', 'but', 'or', 'so', 'because', 'if', 'when', 'then', 'to', 'the', 'a', 'an',
  'my', 'your', 'with', 'for', 'in', 'on', 'at', 'is', 'are', 'am', 'i',
  'и', 'а', 'но', 'или', 'потому', 'что', 'чтобы', 'если', 'когда', 'то', 'это',
  'я', 'ты', 'мой', 'моя', 'моё', 'в', 'на', 'с', 'у', 'к', 'по',
  'хочу', 'хотел', 'хотела',
]);

/**
 * Adaptive end-of-turn silence window. Terminal punctuation → the learner
 * sounds finished (900ms). Trailing comma/connector → mid-thought (1600ms).
 * Unknown → 1150ms. No partial yet → the legacy 1200ms.
 */
export function endpointSilenceMs(latestPartial: string | null): number {
  const text = latestPartial?.trim();
  if (!text) return 1200;
  if (/[.!?…]["”»')\]]*$/u.test(text)) return 900;
  if (/[,;:—–-]$/u.test(text)) return 1600;
  const lastWord = text.split(/\s+/u).pop()?.toLowerCase().replace(/[^a-zа-яё]/gu, '');
  if (lastWord && TRAILING_CONNECTORS.has(lastWord)) return 1600;
  return 1150;
}

/** Case-, punctuation- and ё/е-insensitive form for draft↔final comparison. */
export function normalizeTranscriptForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/gu, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

/** A speculative draft may be committed only when it answered the final transcript. */
export function draftMatches(draftTranscript: string, finalTranscript: string): boolean {
  const draft = normalizeTranscriptForMatch(draftTranscript);
  return draft.length > 0 && draft === normalizeTranscriptForMatch(finalTranscript);
}

export type SentenceSplit = { complete: string[]; rest: string };

/**
 * Split streamed text into complete sentences plus an unfinished remainder.
 * Segments concatenate back to the exact input, so callers lose nothing.
 */
export function splitCompleteSentences(buffer: string): SentenceSplit {
  const complete: string[] = [];
  let cursor = 0;
  for (const match of buffer.matchAll(/[.!?…]+["”»')\]]*/gu)) {
    const end = (match.index ?? 0) + match[0].length;
    complete.push(buffer.slice(cursor, end));
    cursor = end;
  }
  return { complete, rest: buffer.slice(cursor) };
}
