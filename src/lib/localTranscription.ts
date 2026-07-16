export type LocalTranscript = {
  text: string;
  durationSeconds: number;
  avgLogprob: number | null;
  noSpeechProbability: number;
  language: string;
};

export type TranscriptionSession = {
  stop: () => Promise<LocalTranscript>;
  cancel: () => void;
};

async function transcribeBlob(blob: Blob, language: 'en' | 'ru' | 'auto'): Promise<LocalTranscript> {
  const form = new FormData();
  const extension = blob.type.includes('mp4') ? 'm4a'
    : blob.type.includes('ogg') ? 'ogg'
    : blob.type.includes('wav') ? 'wav'
    : 'webm';
  form.append('audio', blob, `assessment.${extension}`);
  form.append('language', language);
  const response = await fetch('/api/assessment/transcribe', { method: 'POST', body: form });
  if (!response.ok) {
    if (response.status === 401) throw new Error('auth-required');
    if (response.status === 422) throw new Error('no-speech');
    throw new Error('transcribe-failed');
  }
  const body = await response.json();
  if (typeof body?.text !== 'string' || !body.text.trim()) throw new Error('transcribe-empty');
  return body as LocalTranscript;
}

export async function startLocalTranscription(args: {
  language?: 'en' | 'ru' | 'auto';
  onAutoStop?: (transcript: LocalTranscript) => void;
  onScoring?: () => void;
  onError?: (error: Error) => void;
} = {}): Promise<TranscriptionSession> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('unsupported');
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
  const stopped = new Promise<void>((resolve) => { recorder.onstop = () => resolve(); });
  recorder.start(250);

  const AudioContextClass: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContextClass();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  audioContext.createMediaStreamSource(stream).connect(analyser);
  const samples = new Float32Array(analyser.fftSize);

  const startedAt = performance.now();
  const MIN_MS = 800;
  const MAX_MS = 20_000;
  // A long end-of-turn delay makes every voice reply feel slow. This still
  // leaves room for a natural pause without adding 1.6 seconds after speech.
  const SILENCE_MS = 1_200;
  const THRESHOLD = 0.008;
  let spoke = false;
  let lastVoiceAt = startedAt;
  let frame = 0;
  let finalized = false;
  let cancelled = false;
  let resolveResult!: (value: LocalTranscript) => void;
  let rejectResult!: (error: Error) => void;
  const result = new Promise<LocalTranscript>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  const cleanup = () => {
    cancelAnimationFrame(frame);
    try { if (recorder.state !== 'inactive') recorder.stop(); } catch {}
    stream.getTracks().forEach((track) => track.stop());
    void audioContext.close().catch(() => {});
  };

  const finish = (): Promise<LocalTranscript> => {
    if (finalized) return result;
    finalized = true;
    cancelAnimationFrame(frame);
    try { if (recorder.state !== 'inactive') recorder.stop(); } catch {}
    stream.getTracks().forEach((track) => track.stop());
    void audioContext.close().catch(() => {});
    args.onScoring?.();
    void (async () => {
      try {
        await stopped;
        if (cancelled) return;
        if (!spoke || chunks.length === 0) throw new Error('no-speech');
        resolveResult(await transcribeBlob(
          new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }),
          args.language || 'en',
        ));
      } catch (error) {
        rejectResult(error instanceof Error ? error : new Error(String(error)));
      }
    })();
    return result;
  };

  const tick = () => {
    analyser.getFloatTimeDomainData(samples);
    let sum = 0;
    for (let index = 0; index < samples.length; index += 1) sum += samples[index] * samples[index];
    const rms = Math.sqrt(sum / samples.length);
    const now = performance.now();
    if (rms > THRESHOLD) { spoke = true; lastVoiceAt = now; }
    const elapsed = now - startedAt;
    if (elapsed >= MAX_MS || (spoke && elapsed >= MIN_MS && now - lastVoiceAt >= SILENCE_MS)) {
      void finish().then((value) => args.onAutoStop?.(value)).catch((error) => args.onError?.(error));
      return;
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return {
    stop: finish,
    cancel: () => {
      if (finalized) return;
      cancelled = true;
      finalized = true;
      cleanup();
      // Mark the internal promise handled so unmount cancellation is silent.
      result.catch(() => {});
      rejectResult(new Error('cancelled'));
    },
  };
}
