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

/** Speak text with the given BCP-47 locale. Returns a Promise that resolves when done. */
export async function ttsSpeak(text: string, lang = 'en-US', rate = 0.85): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (!text.trim()) return;
  // Cancel any ongoing speech first (prevents queue build-up / hangs)
  window.speechSynthesis.cancel();
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

/** Queue short phrases as an append-only model response streams in. */
export async function createStreamingTtsSession(
  fallbackLang = 'en-US',
  rate = 0.9,
  onStart?: () => void,
): Promise<StreamingTtsSession> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { push: () => {}, finish: async () => {}, cancel: () => {} };
  }

  const synthesis = window.speechSynthesis;
  synthesis.cancel();
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
