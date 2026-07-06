// ── tts.ts — Reliable browser TTS helper ────────────────────────────────────
// Fixes the "translate button hangs" bug:
//   Chrome lazily loads voices on first call, so calling speak() immediately
//   without waiting for voiceschanged often produces silence or hangs forever.
//   We cache the voice list after the first load and always cancel before speaking.

let _voicesLoaded = false;
let _voices: SpeechSynthesisVoice[] = [];

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve([]);
  if (_voicesLoaded) return Promise.resolve(_voices);
  return new Promise((resolve) => {
    const tryGet = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) {
        _voicesLoaded = true;
        _voices = v;
        resolve(v);
      }
    };
    tryGet();
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) { _voicesLoaded = true; _voices = v; resolve(v); }
    }, { once: true });
    // Fallback: some browsers never fire voiceschanged, resolve after 600ms
    setTimeout(() => {
      const v = window.speechSynthesis.getVoices();
      _voicesLoaded = true;
      _voices = v;
      resolve(v);
    }, 600);
  });
}

/** Speak text with the given BCP-47 locale. Returns a Promise that resolves when done. */
export async function ttsSpeak(text: string, lang = 'en-US', rate = 0.85): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  // Cancel any ongoing speech first (prevents queue build-up / hangs)
  window.speechSynthesis.cancel();
  const voices = await loadVoices();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    // Try to find a female voice first
    let best = voices.find(v => v.lang === lang && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('zira')));
    if (!best) {
      best = voices.find(v => v.lang?.toLowerCase().startsWith(lang.slice(0, 5)) && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('zira')));
    }
    if (!best) {
      best = voices.find((v) => v.lang === lang) ||
             voices.find((v) => v.lang?.toLowerCase().startsWith(lang.slice(0, 5))) ||
             voices.find((v) => v.lang?.toLowerCase().startsWith('en'));
    }
    if (best) u.voice = best;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    // Chrome bug: synthesis stalls if tab is in background; this nudges it
    const safetyTimer = setTimeout(() => resolve(), 8000);
    u.onend = () => { clearTimeout(safetyTimer); resolve(); };
    window.speechSynthesis.speak(u);
  });
}
