// ── The speech seam ─────────────────────────────────────────────────────────
// Reinvented: no server, no vendor, no cold start. The pronunciation model runs
// ON THE DEVICE via transformers.js (WebGPU, WASM fallback) inside a web worker.
// Audio never leaves the phone — private, and it works offline.
//   speak()          — hear the phrase (browser TTS today; ElevenLabs pre-baked next).
//   warmModel()      — background one-time model download, with progress.
//   startListening() — record with VAD auto-stop OR manual stop, score on-device.

export type Accent = {
  id: string; label: string; flag: string; locale: string; azureVoice: string;
};

export const ACCENTS: Accent[] = [
  { id: 'uk', label: 'UK', flag: '🇬🇧', locale: 'en-GB', azureVoice: 'en-GB-SoniaNeural' },
  { id: 'us', label: 'US', flag: '🇺🇸', locale: 'en-US', azureVoice: 'en-US-JennyNeural' },
  { id: 'in', label: 'IN', flag: '🇮🇳', locale: 'en-IN', azureVoice: 'en-IN-NeerjaNeural' },
];

// Accents with real pre-baked ElevenLabs audio (public/audio/<id>/<phraseIdx>.mp3).
// Others fall back to browser TTS until they're baked too.
const BAKED_ACCENTS = new Set(['us', 'uk', 'in']);
export function hasRealVoice(accent: Accent): boolean { return BAKED_ACCENTS.has(accent.id); }

// Play a phrase: real native audio when baked, browser TTS otherwise.
export function playPhrase(idx: number, accent: Accent, text: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (BAKED_ACCENTS.has(accent.id)) {
    return new Promise<void>((resolve) => {
      const a = new Audio(`/audio/${accent.id}/${idx}.mp3`);
      a.onended = () => resolve();
      a.onerror = () => { speak(text, accent).then(resolve); }; // missing file → fallback
      a.play().catch(() => { speak(text, accent).then(resolve); });
    });
  }
  return speak(text, accent);
}

export type Verdict = 'good' | 'close' | 'miss';
export type WordScore = { word: string; verdict: Verdict };
export type Assessment = { score: number; words: WordScore[]; tip: string; heard: string };
export type Session = { stop: () => Promise<Assessment> };

// ── speak() ──────────────────────────────────────────────────────────────────
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

// ── on-device worker singleton + progress plumbing ───────────────────────────
let _worker: Worker | null = null;
let _reqId = 0;
let _warmed = false;
const _pending = new Map<number, { resolve: (t: string) => void; reject: (e: Error) => void }>();

export type ModelProgress = { ready: boolean; percent: number };
const _files = new Map<string, { loaded: number; total: number }>();
const _progressListeners = new Set<(p: ModelProgress) => void>();

export function onModelProgress(cb: (p: ModelProgress) => void): () => void {
  _progressListeners.add(cb);
  cb(currentProgress());
  return () => _progressListeners.delete(cb);
}
function currentProgress(): ModelProgress {
  if (_warmed) return { ready: true, percent: 100 };
  let loaded = 0, total = 0;
  _files.forEach((f) => { loaded += f.loaded || 0; total += f.total || 0; });
  return { ready: false, percent: total > 0 ? Math.min(99, Math.round((loaded / total) * 100)) : 0 };
}
function emitProgress() { const p = currentProgress(); _progressListeners.forEach((cb) => cb(p)); }

function worker(): Worker {
  if (_worker) return _worker;
  _worker = new Worker('/asr.worker.js', { type: 'module' });
  _worker.onmessage = (e: MessageEvent) => {
    const { type, id, text, error, data } = (e.data || {}) as any;
    if (type === 'result') { _pending.get(id)?.resolve(text); _pending.delete(id); }
    else if (type === 'error') { _pending.get(id)?.reject(new Error(error)); _pending.delete(id); }
    else if (type === 'warmed') { _warmed = true; emitProgress(); }
    else if (type === 'progress' && data?.file) {
      if (data.status === 'progress' || data.total) _files.set(data.file, { loaded: data.loaded || 0, total: data.total || 0 });
      emitProgress();
    }
  };
  return _worker;
}

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

// ── startListening() — VAD auto-stop OR manual stop, whichever fires first ────
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

  // Voice-activity detection over the live mic.
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
        const audio = await blobTo16kMono(new Blob(chunks));
        resolveResult(scoreAgainst(reference, await transcribe(audio)));
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
    : weak ? `Focus on “${weak.word}” — hear it once more, then repeat.` : 'Clean run. Try the next one.';

  return { score, words, tip, heard };
}
