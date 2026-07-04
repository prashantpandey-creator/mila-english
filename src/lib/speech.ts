// ── The speech seam ─────────────────────────────────────────────────────────
// One module, two jobs: speak a phrase in a chosen accent, and score the user
// saying it back. Today it runs in DEMO mode on the browser's Web Speech APIs
// (no keys, works offline-ish). When Azure Speech creds arrive, only the two
// marked bodies below change: speak() → Azure accented Neural TTS, assess() →
// Azure Pronunciation Assessment (phoneme-level accuracy). The page never changes.

export type Accent = {
  id: string;
  label: string;
  flag: string;
  locale: string;       // BCP-47 — drives browser voice pick + recognition bias
  azureVoice: string;   // used once Azure is wired
};

// Ship UK + US + Indian first (Indian = the highest-utility "Asian" accent).
export const ACCENTS: Accent[] = [
  { id: 'uk', label: 'UK', flag: '🇬🇧', locale: 'en-GB', azureVoice: 'en-GB-SoniaNeural' },
  { id: 'us', label: 'US', flag: '🇺🇸', locale: 'en-US', azureVoice: 'en-US-JennyNeural' },
  { id: 'in', label: 'IN', flag: '🇮🇳', locale: 'en-IN', azureVoice: 'en-IN-NeerjaNeural' },
];

export type Verdict = 'good' | 'close' | 'miss';
export type WordScore = { word: string; verdict: Verdict };
export type Assessment = { score: number; words: WordScore[]; tip: string; heard: string };

// True once Azure creds are configured (a NEXT_PUBLIC_SPEECH_REGION is present).
// Kept as a function so the swap is a one-liner and the page can show a mode badge.
export function isAzureReady(): boolean {
  return typeof process !== 'undefined' && !!process.env.NEXT_PUBLIC_SPEECH_REGION;
}

// ── speak() ──────────────────────────────────────────────────────────────────
// DEMO: browser SpeechSynthesis, best-matching voice for the accent's locale.
// AZURE (later): SpeechSDK.SpeakSsmlAsync with <voice name={accent.azureVoice}>.
export function speak(text: string, accent: Accent): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return resolve();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = accent.locale;
    u.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const exact = voices.find((v) => v.lang === accent.locale);
    const loose = voices.find((v) => v.lang?.toLowerCase().startsWith(accent.locale.slice(0, 2)) && v.lang.includes(accent.locale.slice(3)));
    const anyEn = voices.find((v) => v.lang?.toLowerCase().startsWith('en'));
    const picked = exact || loose || anyEn;
    if (picked) u.voice = picked;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

// ── assess() ─────────────────────────────────────────────────────────────────
// DEMO: Web Speech recognition transcript, scored by word-match against the
// reference. Honest but coarse — it hears *which words* you said, not *how*.
// AZURE (later): PronunciationAssessmentConfig → per-phoneme AccuracyScore,
// which replaces the word-match verdicts with true pronunciation accuracy.
export function assess(reference: string, accent: Accent): Promise<Assessment> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('no window'));
    const Rec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Rec) return reject(new Error('unsupported'));

    const rec = new Rec();
    rec.lang = accent.locale;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    let done = false;
    const finish = (heard: string) => {
      if (done) return;
      done = true;
      resolve(scoreAgainst(reference, heard));
    };

    rec.onresult = (e: any) => finish(e.results?.[0]?.[0]?.transcript ?? '');
    rec.onerror = (e: any) => { if (!done) { done = true; reject(new Error(e.error || 'recognition-failed')); } };
    rec.onend = () => finish('');
    try { rec.start(); } catch { reject(new Error('start-failed')); }
  });
}

// ── word-match scoring (demo) ────────────────────────────────────────────────
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
  const heardSet = norm(heard).split(/\s+/).filter(Boolean);
  const remaining = [...heardSet];

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
