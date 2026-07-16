// ── tts.ts — Reliable browser TTS helper ────────────────────────────────────
// Fixes the "translate button hangs" bug:
//   Chrome lazily loads voices on first call, so calling speak() immediately
//   without waiting for voiceschanged often produces silence or hangs forever.
//   We cache the voice list after the first load and always cancel before speaking.

let _voicesLoaded = false;
let _voices: SpeechSynthesisVoice[] = [];

function chooseVoice(pool: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined {
  const isPreferred = (voice: SpeechSynthesisVoice) => {
    const name = voice.name.toLowerCase();
    return name.includes('female') || name.includes('samantha') || name.includes('zira');
  };
  return pool.find((voice) => voice.lang === lang && isPreferred(voice))
    || pool.find((voice) => voice.lang?.toLowerCase().startsWith(lang.slice(0, 5).toLowerCase()) && isPreferred(voice))
    || pool.find((voice) => voice.lang === lang)
    || pool.find((voice) => voice.lang?.toLowerCase().startsWith(lang.slice(0, 5).toLowerCase()))
    || pool.find((voice) => voice.lang?.toLowerCase().startsWith('en'));
}

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve([]);
  if (_voicesLoaded) return Promise.resolve(_voices);
  return new Promise((resolve) => {
    let settled = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    const finish = (voices: SpeechSynthesisVoice[]) => {
      if (settled) return;
      settled = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      _voicesLoaded = true;
      _voices = voices;
      resolve(voices);
    };
    const tryGet = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) finish(v);
    };
    tryGet();
    if (settled) return;
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) finish(v);
    }, { once: true });
    // Fallback: some browsers never fire voiceschanged, resolve after 600ms
    fallbackTimer = setTimeout(() => {
      const v = typeof window !== 'undefined' && 'speechSynthesis' in window
        ? window.speechSynthesis.getVoices()
        : [];
      finish(v);
    }, 600);
  });
}

// ── Piper (self-hosted neural voice) — the human-sounding path ───────────────
// A warm US-female Piper voice (en_US-amy-medium) runs on our own CPU behind the
// same-origin /api/tts proxy. It synthesizes a phrase in ~150–250ms and sounds
// far less robotic than the browser's speechSynthesis. Any failure — offline,
// blocked route, Russian text, a device with no English voice on the box — falls
// straight through to the browser path, which stays the resilient fallback.

/** Decide whether Piper should handle this utterance. Pure + tested: Piper's
 *  amy is English-only, so we take English locales and reject predominantly
 *  Cyrillic text (a Russian string mis-tagged en-US must never be forced through
 *  an English voice). Everything else is the browser's job. */
export function shouldUsePiper(text: string, lang: string): boolean {
  if (!text.trim()) return false;
  if (!lang.toLowerCase().startsWith('en')) return false;
  return spokenLocaleForText(text, lang) !== 'ru-RU';
}

// A new spoken line supersedes whatever Piper clip is playing. We keep a single
// canceller and settle its promise on stop, so the superseded call never hangs.
let _piperCancel: (() => void) | null = null;

function stopPiper(): void {
  const cancel = _piperCancel;
  _piperCancel = null;
  cancel?.();
}

/** Fetch a synthesized WAV for the text; null on any failure so the caller
 *  can fall back to the browser voice. Never throws. Fail-fast ceiling keeps
 *  a hung service from producing silence. */
async function fetchPiperClip(text: string): Promise<Blob | null> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6_000);
    let res: Response;
    try {
      res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) return null;
    const blob = await res.blob();
    return blob.size ? blob : null;
  } catch {
    return null;
  }
}

/** Play a fetched clip. True only when it played to the end. Registers with
 *  the module canceller so a newer spoken line supersedes it cleanly. */
async function playPiperClip(blob: Blob, onPlayStart?: () => void): Promise<boolean> {
  if (typeof Audio === 'undefined') return false;
  const url = URL.createObjectURL(blob);
  const myCancel = { fn: null as null | (() => void) };
  try {
    const audio = new Audio(url);
    stopPiper(); // supersede any prior clip (settles its promise)
    return await new Promise<boolean>((resolve) => {
      myCancel.fn = () => { try { audio.pause(); } catch { /* no-op */ } resolve(false); };
      _piperCancel = myCancel.fn;
      audio.onplaying = () => onPlayStart?.();
      audio.onended = () => resolve(true);
      audio.onerror = () => resolve(false);
      audio.play().catch(() => resolve(false));
    });
  } finally {
    URL.revokeObjectURL(url);
    if (_piperCancel === myCancel.fn) _piperCancel = null;
  }
}

/** Fetch and play in one step — the one-shot ttsSpeak path. */
async function speakViaPiper(text: string): Promise<boolean> {
  const blob = await fetchPiperClip(text);
  if (!blob) return false;
  return playPiperClip(blob);
}

/** Speak text with the given BCP-47 locale. Returns a Promise that resolves when done. */
export async function ttsSpeak(text: string, lang = 'en-US', rate = 0.85): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!text.trim()) return;
  // A new line supersedes anything currently speaking on either engine.
  window.speechSynthesis?.cancel();
  stopPiper();
  // Human voice first; on any failure, fall through to the browser path below.
  if (shouldUsePiper(text, lang) && (await speakViaPiper(text))) return;
  return ttsSpeakBrowser(text, lang, rate);
}

/** Mila's mascot voice character: slightly raised pitch so the assistant
 *  sounds like the little robot it lives in, not a studio narrator. Only the
 *  BROWSER engine honors pitch — when Piper carries the line (the owner's
 *  chosen "good voice", 2026-07-17), character comes from the voice itself. */
export const MASCOT_PITCH = 1.2;

// ── Instant fillers ──────────────────────────────────────────────────────────
// Backchannels must sound within a breath of end-of-turn; a live Piper fetch
// (~1.5s on prod) would defeat their purpose. Voice surfaces pre-cache the
// fixed pool once; a cached filler plays instantly in the good voice, and
// anything uncached (all Russian — Piper's amy is English-only) uses the
// browser voice immediately rather than waiting.
const _fillerClips = new Map<string, Blob>();

export async function prefetchFillerClips(texts: string[]): Promise<void> {
  await Promise.all(texts.map(async (text) => {
    if (_fillerClips.has(text) || !shouldUsePiper(text, 'en-US')) return;
    const blob = await fetchPiperClip(text);
    if (blob) _fillerClips.set(text, blob);
  }));
}

/** Speak a backchannel with zero added latency: cached Piper clip when we
 *  have one, browser voice otherwise. */
export async function ttsSpeakFiller(text: string, lang = 'en-US', rate = 1): Promise<void> {
  const cached = _fillerClips.get(text);
  if (cached && (await playPiperClip(cached))) return;
  return ttsSpeakBrowser(text, lang, rate);
}

/** Speak strictly via the browser engine, never Piper. Callers that must share
 *  speechSynthesis's own queue with other utterances (e.g. a Darshan filler
 *  followed by streamed answer chunks) use this so both sounds go through one
 *  serialized engine — a Piper clip plays on a separate Audio element and
 *  would overlap them. */
export async function ttsSpeakBrowser(text: string, lang = 'en-US', rate = 0.85, pitch = 1): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (!text.trim()) return;
  const voices = await loadVoices();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    u.pitch = pitch;
    // Installed voices are the provider-independent path. Only fall back to a
    // browser-managed voice when the device has no suitable local voice.
    const best = chooseVoice(voices.filter((voice) => voice.localService), lang) || chooseVoice(voices, lang);
    if (best) u.voice = best;
    // Chrome bug: synthesis stalls if tab is in background; this nudges it
    const safetyTimer = setTimeout(() => { window.speechSynthesis.cancel(); resolve(); }, 12_000);
    u.onend = () => { clearTimeout(safetyTimer); resolve(); };
    u.onerror = () => { clearTimeout(safetyTimer); resolve(); };
    window.speechSynthesis.speak(u);
  });
}

export type StreamingTtsChunk = { text: string; consumed: number };

export function spokenLocaleForText(text: string, fallback = 'en-US'): 'en-US' | 'ru-RU' {
  const cyrillic = text.match(/[А-Яа-яЁё]/gu)?.length ?? 0;
  const latin = text.match(/[A-Za-z]/g)?.length ?? 0;
  if (cyrillic > latin) return 'ru-RU';
  if (latin > 0) return 'en-US';
  return fallback.toLowerCase().startsWith('ru') ? 'ru-RU' : 'en-US';
}

function countWords(value: string): number {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

/** Select a stable phrase from append-only streamed text. */
export function takeStreamingTtsChunk(value: string, final = false): StreamingTtsChunk | null {
  const leading = value.match(/^\s*/u)?.[0].length ?? 0;
  const text = value.slice(leading);
  if (!text) return null;

  const sentenceEnd = /[.!?…]+["')\]]*(?=\s|$)/gu;
  for (const match of text.matchAll(sentenceEnd)) {
    const end = (match.index ?? 0) + match[0].length;
    if (countWords(text.slice(0, end)) >= 4) {
      return { text: text.slice(0, end).trim(), consumed: leading + end };
    }
  }

  const clauseEnd = /[,;:](?=\s|$)/gu;
  for (const match of text.matchAll(clauseEnd)) {
    const end = (match.index ?? 0) + match[0].length;
    if (countWords(text.slice(0, end)) >= 8) {
      return { text: text.slice(0, end).trim(), consumed: leading + end };
    }
  }

  const words = [...text.matchAll(/\S+/gu)];
  if (!final && words.length >= 12 && /\s$/u.test(text)) {
    const tenth = words[9];
    const end = (tenth.index ?? 0) + tenth[0].length;
    return { text: text.slice(0, end).trim(), consumed: leading + end };
  }
  return final ? { text: text.trim(), consumed: value.length } : null;
}

export type StreamingTtsSession = {
  push: (fullText: string) => void;
  finish: (fullText: string, speakRemainder?: boolean) => Promise<void>;
  cancel: () => void;
};

/** Queue short phrases as an append-only model response streams in.
 *  Pass cancelOnCreate=false when a filler utterance is already speaking and
 *  the session's chunks should queue behind it instead of silencing it. */
export async function createStreamingTtsSession(
  fallbackLang = 'en-US',
  rate = 0.9,
  onStart?: () => void,
  cancelOnCreate = true,
  pitch = 1,
): Promise<StreamingTtsSession> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { push: () => {}, finish: async () => {}, cancel: () => {} };
  }

  const synthesis = window.speechSynthesis;
  if (cancelOnCreate) synthesis.cancel();
  const voices = await loadVoices();
  let latestText = '';
  let consumed = 0;
  let started = false;
  let cancelled = false;
  let finishing = false;
  let speaking = false;
  let resolved = false;
  let currentTimer: ReturnType<typeof setTimeout> | null = null;
  // Each chunk pre-fetches its Piper clip AT ENQUEUE TIME, so synthesis of
  // sentence N+1 overlaps playback of sentence N — the ~1.5s prod synthesis
  // cost is only ever audible before the very first chunk (and the endpoint
  // filler covers that gap). Piper carries the good voice; the browser engine
  // remains the always-available fallback per chunk.
  const queue: Array<{ text: string; clip: Promise<Blob | null> | null }> = [];
  let resolveFinished!: () => void;
  const finished = new Promise<void>((resolve) => { resolveFinished = resolve; });

  const resolveIfDone = () => {
    if (!resolved && finishing && !speaking && queue.length === 0) {
      resolved = true;
      resolveFinished();
    }
  };

  const markStarted = () => {
    if (started || cancelled) return;
    started = true;
    onStart?.();
  };

  const speakNext = () => {
    if (speaking || cancelled) return;
    const item = queue.shift();
    if (!item) {
      resolveIfDone();
      return;
    }
    speaking = true;
    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      if (currentTimer) clearTimeout(currentTimer);
      currentTimer = null;
      speaking = false;
      if (!cancelled) speakNext();
      else resolveIfDone();
    };
    // Generous ceiling: covers a slow clip fetch plus a long sentence.
    currentTimer = setTimeout(() => {
      synthesis.cancel();
      stopPiper();
      settle();
    }, 20_000);
    void (async () => {
      const lang = spokenLocaleForText(item.text, fallbackLang);
      const clip = item.clip ? await item.clip : null;
      if (cancelled || settled) {
        settle();
        return;
      }
      if (clip && (await playPiperClip(clip, markStarted))) {
        settle();
        return;
      }
      if (cancelled || settled) {
        settle();
        return;
      }
      const voice = chooseVoice(voices.filter((candidate) => candidate.localService), lang) || chooseVoice(voices, lang);
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      if (voice) utterance.voice = voice;
      utterance.onstart = markStarted;
      utterance.onend = settle;
      utterance.onerror = settle;
      synthesis.speak(utterance);
    })();
  };

  const enqueue = (text: string) => {
    if (!text || cancelled) return;
    const lang = spokenLocaleForText(text, fallbackLang);
    const clip = shouldUsePiper(text, lang) ? fetchPiperClip(text) : null;
    queue.push({ text, clip });
    speakNext();
  };

  const pump = (final: boolean) => {
    while (!cancelled) {
      const chunk = takeStreamingTtsChunk(latestText.slice(consumed), final);
      if (!chunk) return;
      consumed += chunk.consumed;
      enqueue(chunk.text);
      if (consumed >= latestText.length) return;
    }
  };

  const push = (fullText: string) => {
    if (cancelled || fullText.length < latestText.length || !fullText.startsWith(latestText)) return;
    latestText = fullText;
    pump(false);
  };

  return {
    push,
    finish: async (fullText: string, speakRemainder = true) => {
      push(fullText);
      finishing = true;
      if (speakRemainder) pump(true);
      resolveIfDone();
      return finished;
    },
    cancel: () => {
      if (cancelled) return;
      cancelled = true;
      finishing = true;
      queue.length = 0;
      synthesis.cancel();
      stopPiper();
      if (currentTimer) clearTimeout(currentTimer);
      currentTimer = null;
      speaking = false;
      resolveIfDone();
    },
  };
}
