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

/** Fetch a WAV from /api/tts and play it. Resolves true only when a clip
 *  actually played to the end; any failure resolves false so the caller can
 *  fall back to the browser voice. Never throws. */
async function speakViaPiper(text: string): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined' || typeof Audio === 'undefined') {
    return false;
  }
  let url: string | null = null;
  const myCancel = { fn: null as null | (() => void) };
  try {
    // Fail fast into the browser fallback if the service hangs — a synthesis is
    // ~250ms, so 6s is a generous ceiling that still guarantees the user hears
    // *something* rather than silence.
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
    if (!res.ok) return false;
    const blob = await res.blob();
    if (!blob.size) return false;
    url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    stopPiper(); // supersede any prior clip (settles its promise)
    return await new Promise<boolean>((resolve) => {
      myCancel.fn = () => { try { audio.pause(); } catch { /* no-op */ } resolve(false); };
      _piperCancel = myCancel.fn;
      audio.onended = () => resolve(true);
      audio.onerror = () => resolve(false);
      audio.play().catch(() => resolve(false));
    });
  } catch {
    return false;
  } finally {
    if (url) URL.revokeObjectURL(url);
    if (_piperCancel === myCancel.fn) _piperCancel = null;
  }
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

/** Speak strictly via the browser engine, never Piper. Callers that must share
 *  speechSynthesis's own queue with other utterances (e.g. a Darshan filler
 *  followed by streamed answer chunks) use this so both sounds go through one
 *  serialized engine — a Piper clip plays on a separate Audio element and
 *  would overlap them. */
export async function ttsSpeakBrowser(text: string, lang = 'en-US', rate = 0.85): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (!text.trim()) return;
  const voices = await loadVoices();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
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
  const queue: string[] = [];
  let resolveFinished!: () => void;
  const finished = new Promise<void>((resolve) => { resolveFinished = resolve; });

  const resolveIfDone = () => {
    if (!resolved && finishing && !speaking && queue.length === 0) {
      resolved = true;
      resolveFinished();
    }
  };

  const speakNext = () => {
    if (speaking || cancelled) return;
    const text = queue.shift();
    if (!text) {
      resolveIfDone();
      return;
    }
    const lang = spokenLocaleForText(text, fallbackLang);
    const voice = chooseVoice(voices.filter((candidate) => candidate.localService), lang) || chooseVoice(voices, lang);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    if (voice) utterance.voice = voice;
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
    currentTimer = setTimeout(() => {
      synthesis.cancel();
      settle();
    }, 12_000);
    utterance.onstart = () => {
      if (started || cancelled) return;
      started = true;
      onStart?.();
    };
    utterance.onend = settle;
    utterance.onerror = settle;
    synthesis.speak(utterance);
  };

  const enqueue = (text: string) => {
    if (!text || cancelled) return;
    queue.push(text);
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
      if (currentTimer) clearTimeout(currentTimer);
      currentTimer = null;
      speaking = false;
      resolveIfDone();
    },
  };
}
