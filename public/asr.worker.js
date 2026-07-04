// On-device speech recognition — no server, no vendor, no cold start.
// Loads a wav2vec2 CTC model once (transformers.js caches it in the browser's
// Cache Storage), then transcribes locally. wav2vec2's raw output is acoustic:
// it writes what was actually said, so mispronunciations surface instead of
// being auto-corrected the way Whisper would. WebGPU when available, WASM fallback.
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.2';
env.allowLocalModels = false;

const MODEL = 'Xenova/wav2vec2-base-960h';
let asr = null;
let loading = null;

async function getASR() {
  if (asr) return asr;
  if (!loading) {
    loading = pipeline('automatic-speech-recognition', MODEL, { device: 'webgpu' })
      .catch(() => pipeline('automatic-speech-recognition', MODEL)); // WASM fallback
  }
  asr = await loading;
  return asr;
}

self.onmessage = async (e) => {
  const { type, id, audio } = e.data || {};
  try {
    if (type === 'warm') {
      await getASR();
      self.postMessage({ type: 'warmed' });
      return;
    }
    if (type === 'transcribe') {
      const p = await getASR();
      const out = await p(audio);
      self.postMessage({ type: 'result', id, text: (out && out.text) || '' });
    }
  } catch (err) {
    self.postMessage({ type: 'error', id, error: String((err && err.message) || err) });
  }
};
