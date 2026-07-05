// ── The speech seam ─────────────────────────────────────────────────────────
// Listen side: real native ElevenLabs audio (pre-baked) with a browser-TTS fallback.
// Speak side: record the clip and score it on the WARM phoneme endpoint — true
// per-phoneme GOP from a resident wav2vec2-espeak model on our own metal.
//   playPhrase()     — hear the phrase (baked accent audio, else browser TTS).
//   startListening() — record with VAD auto-stop OR manual stop, score server-side.

export type Accent = { id: string; label: string; flag: string; locale: string; azureVoice: string };

export const ACCENTS: Accent[] = [
  { id: 'uk', label: 'UK', flag: '🇬🇧', locale: 'en-GB', azureVoice: 'en-GB-SoniaNeural' },
  { id: 'us', label: 'US', flag: '🇺🇸', locale: 'en-US', azureVoice: 'en-US-JennyNeural' },
  { id: 'in', label: 'IN', flag: '🇮🇳', locale: 'en-IN', azureVoice: 'en-IN-NeerjaNeural' },
];

const BAKED_ACCENTS = new Set(['us', 'uk', 'in']);
export function hasRealVoice(accent: Accent): boolean { return BAKED_ACCENTS.has(accent.id); }

export function playPhrase(idx: number, accent: Accent, text: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (BAKED_ACCENTS.has(accent.id)) {
    return new Promise<void>((resolve) => {
      const a = new Audio(`/audio/${accent.id}/${idx}.mp3`);
      a.onended = () => resolve();
      a.onerror = () => { speak(text, accent).then(resolve); };
      a.play().catch(() => { speak(text, accent).then(resolve); });
    });
  }
  return speak(text, accent);
}

export type Verdict = 'good' | 'close' | 'miss';
export type Phoneme = { ph: string; acc: number; verdict: Verdict };
export type WordScore = { word: string; score?: number; verdict: Verdict; phonemes?: Phoneme[] };
export type Assessment = { score: number; words: WordScore[]; tip: string };
export type Session = { stop: () => Promise<Assessment> };

// ── speak() — browser TTS (fallback voice for not-yet-baked accents) ──────────
export function speak(text: string, accent: Accent): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return resolve();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = accent.locale;
    u.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const picked = voices.find((v) => v.lang === accent.locale) || voices.find((v) => v.lang?.toLowerCase().startsWith('en'));
    if (picked) u.voice = picked;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

// Given a phrase and a scored result, return the drilled sound to tally as a
// stumble — or null when the phrase's carrier word was nailed. Pure + tested.
export function missedSound(
  phrase: { hard: string; sound: string },
  r: { words?: { word: string; verdict: Verdict }[] },
): string | null {
  if (!r?.words) return null;
  const h = phrase.hard.toLowerCase().replace(/[^a-z']/g, '');
  const w = r.words.find((x) => x.word.toLowerCase().replace(/[^a-z']/g, '') === h);
  return w && w.verdict !== 'good' ? phrase.sound : null;
}

// POST the recorded clip to the warm phoneme endpoint for true GOP scoring.
async function scoreBlob(blob: Blob, reference: string): Promise<Assessment> {
  const fd = new FormData();
  fd.append('audio', blob, 'a.webm');
  fd.append('reference', reference);
  const r = await fetch('/api/pronounce', { method: 'POST', body: fd });
  if (!r.ok) throw new Error('score-failed');
  const j = await r.json();
  if (!j || typeof j.score !== 'number' || !Array.isArray(j.words)) throw new Error('score-empty');
  return j as Assessment;
}

// ── startListening() — VAD auto-stop OR manual stop; score on the server ──────
export async function startListening(
  reference: string,
  _accent: Accent,
  onAutoStop?: (a: Assessment) => void,
): Promise<Session> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const recStopped = new Promise<void>((res) => { rec.onstop = () => res(); });
  rec.start();

  const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
  const actx = new AC();
  const analyser = actx.createAnalyser();
  analyser.fftSize = 512;
  actx.createMediaStreamSource(stream).connect(analyser);
  const buf = new Float32Array(analyser.fftSize);

  const THRESH = 0.015, SILENCE_MS = 900, MIN_MS = 700, MAX_MS = 7000;
  const t0 = performance.now();
  let spoke = false, lastVoice = t0, raf = 0;

  let finalized = false;
  let resolveResult!: (a: Assessment) => void;
  let rejectResult!: (e: Error) => void;
  const resultP = new Promise<Assessment>((res, rej) => { resolveResult = res; rejectResult = rej; });

  const finalize = (): Promise<Assessment> => {
    if (finalized) return resultP;
    finalized = true;
    cancelAnimationFrame(raf);
    try { rec.stop(); } catch { /* no-op */ }
    stream.getTracks().forEach((t) => t.stop());
    actx.close().catch(() => {});
    (async () => {
      try {
        await recStopped;
        resolveResult(await scoreBlob(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }), reference));
      } catch (e: any) { rejectResult(e instanceof Error ? e : new Error(String(e))); }
    })();
    return resultP;
  };

  const tick = () => {
    analyser.getFloatTimeDomainData(buf);
    let sum = 0; for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    const now = performance.now();
    if (rms > THRESH) { spoke = true; lastVoice = now; }
    const elapsed = now - t0;
    if (elapsed > MAX_MS || (spoke && elapsed > MIN_MS && now - lastVoice > SILENCE_MS)) {
      finalize().then((a) => onAutoStop?.(a)).catch(() => {});
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return { stop: () => finalize() };
}
