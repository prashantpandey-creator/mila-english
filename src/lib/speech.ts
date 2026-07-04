// ── The speech seam ─────────────────────────────────────────────────────────
// Reinvented: no server, no vendor, no cold start. The pronunciation model runs
// ON THE DEVICE via transformers.js (WebGPU, WASM fallback) inside a web worker.
// Audio never leaves the phone — private, and it works offline (on a plane).
//   speak()  — hear the phrase. Browser TTS today; ElevenLabs pre-baked accent
//              audio (static files) is the drop-in upgrade — still zero runtime cost.
//   assess() — record, resample to 16kHz, transcribe on-device, score.
//              wav2vec2 CTC is acoustic — it surfaces mispronunciations. A converted
//              espeak-IPA model swaps in here for true per-phoneme GOP, same rails.

export type Accent = {
  id: string;
  label: string;
  flag: string;
  locale: string;
  azureVoice: string; // legacy field name; used as the ElevenLabs/voice hint later
};

export const ACCENTS: Accent[] = [
  { id: 'uk', label: 'UK', flag: '🇬🇧', locale: 'en-GB', azureVoice: 'en-GB-SoniaNeural' },
  { id: 'us', label: 'US', flag: '🇺🇸', locale: 'en-US', azureVoice: 'en-US-JennyNeural' },
  { id: 'in', label: 'IN', flag: '🇮🇳', locale: 'en-IN', azureVoice: 'en-IN-NeerjaNeural' },
];

export type Verdict = 'good' | 'close' | 'miss';
export type WordScore = { word: string; verdict: Verdict };
export type Assessment = { score: number; words: WordScore[]; tip: string; heard: string };

// ── speak() ──────────────────────────────────────────────────────────────────
export function speak(text: string, accent: Accent): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return resolve();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = accent.locale;
    u.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const exact = voices.find((v) => v.lang === accent.locale);
    const anyEn = voices.find((v) => v.lang?.toLowerCase().startsWith('en'));
    const picked = exact || anyEn;
    if (picked) u.voice = picked;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

// ── on-device worker singleton ───────────────────────────────────────────────
let _worker: Worker | null = null;
let _reqId = 0;
let _warmed = false;
const _pending = new Map<number, { resolve: (t: string) => void; reject: (e: Error) => void }>();

function worker(): Worker {
  if (_worker) return _worker;
  _worker = new Worker('/asr.worker.js', { type: 'module' });
  _worker.onmessage = (e: MessageEvent) => {
    const { type, id, text, error } = (e.data || {}) as any;
    if (type === 'result') { _pending.get(id)?.resolve(text); _pending.delete(id); }
    else if (type === 'error') { _pending.get(id)?.reject(new Error(error)); _pending.delete(id); }
    else if (type === 'warmed') { _warmed = true; }
  };
  return _worker;
}

// Kick off the one-time model download in the background (call on page mount).
export function warmModel(): void {
  if (typeof window === 'undefined') return;
  try { worker().postMessage({ type: 'warm' }); } catch { /* no-op */ }
}
export function isModelWarm(): boolean { return _warmed; }

function transcribe(audio: Float32Array): Promise<string> {
  const w = worker();
  const id = ++_reqId;
  return new Promise((resolve, reject) => {
    _pending.set(id, { resolve, reject });
    w.postMessage({ type: 'transcribe', id, audio }, [audio.buffer]);
  });
}

// ── assess() — record → 16kHz mono → on-device transcribe → score ────────────
export async function assess(reference: string, _accent: Accent): Promise<Assessment> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('unsupported');
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const stopped = new Promise<void>((res) => { rec.onstop = () => res(); });
  rec.start();
  await new Promise((r) => setTimeout(r, 4000)); // fixed 4s window (VAD is a later refinement)
  rec.stop();
  stream.getTracks().forEach((t) => t.stop());
  await stopped;

  const audio = await blobTo16kMono(new Blob(chunks));
  const heard = await transcribe(audio);
  return scoreAgainst(reference, heard);
}

async function blobTo16kMono(blob: Blob): Promise<Float32Array> {
  const bytes = await blob.arrayBuffer();
  const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
  const ctx = new AC();
  const decoded = await ctx.decodeAudioData(bytes);
  const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(decoded.duration * 16000)), 16000);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start();
  const rendered = await off.startRendering();
  ctx.close();
  return rendered.getChannelData(0);
}

// ── scoring ──────────────────────────────────────────────────────────────────
const norm = (s: string) => s.toLowerCase().replace(/[^a-z' ]/g, '').trim();

function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

function scoreAgainst(reference: string, heard: string): Assessment {
  const refWords = norm(reference).split(/\s+/).filter(Boolean);
  const remaining = norm(heard).split(/\s+/).filter(Boolean);

  const words: WordScore[] = refWords.map((w) => {
    const exactIdx = remaining.indexOf(w);
    if (exactIdx >= 0) { remaining.splice(exactIdx, 1); return { word: w, verdict: 'good' }; }
    const closeIdx = remaining.findIndex((h) => lev(h, w) <= Math.max(1, Math.floor(w.length / 4)));
    if (closeIdx >= 0) { remaining.splice(closeIdx, 1); return { word: w, verdict: 'close' }; }
    return { word: w, verdict: 'miss' };
  });

  const good = words.filter((x) => x.verdict === 'good').length;
  const close = words.filter((x) => x.verdict === 'close').length;
  const score = refWords.length ? Math.round((100 * (good + close * 0.5)) / refWords.length) : 0;

  const weak = words.find((x) => x.verdict !== 'good');
  const tip = !heard
    ? "Didn't catch that — tap the mic and say it again."
    : weak
      ? `Focus on “${weak.word}” — hear it once more, then repeat.`
      : 'Clean run. Try the next one.';

  return { score, words, tip, heard };
}
