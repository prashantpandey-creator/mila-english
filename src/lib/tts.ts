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
    const chooseVoice = (pool: SpeechSynthesisVoice[]) => {
      const isPreferred = (voice: SpeechSynthesisVoice) => {
        const name = voice.name.toLowerCase();
        return name.includes('female') || name.includes('samantha') || name.includes('zira');
      };
      return pool.find((voice) => voice.lang === lang && isPreferred(voice))
        || pool.find((voice) => voice.lang?.toLowerCase().startsWith(lang.slice(0, 5).toLowerCase()) && isPreferred(voice))
        || pool.find((voice) => voice.lang === lang)
        || pool.find((voice) => voice.lang?.toLowerCase().startsWith(lang.slice(0, 5).toLowerCase()))
        || pool.find((voice) => voice.lang?.toLowerCase().startsWith('en'));
    };
    // Installed voices are the provider-independent path. Only fall back to a
    // browser-managed voice when the device has no suitable local voice.
    const best = chooseVoice(voices.filter((voice) => voice.localService)) || chooseVoice(voices);
    if (best) u.voice = best;
    // Chrome bug: synthesis stalls if tab is in background; this nudges it
    const safetyTimer = setTimeout(() => { resolve(); }, 8000);
    u.onend = () => { clearTimeout(safetyTimer); resolve(); };
    u.onerror = () => { clearTimeout(safetyTimer); resolve(); };
    window.speechSynthesis.speak(u);
  });
}
