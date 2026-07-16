export type LocalTranscript = {
  text: string;
  durationSeconds: number;
  avgLogprob: number | null;
  noSpeechProbability: number;
  language: string;
};

export type LocalPartial = {
  text: string;
  /** performance.now() when the audio prefix for this partial was snapshotted. */
  snapshotAt: number;
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
  /** Fired when a mid-speech pause produced a partial transcript of everything spoken so far. */
  onPartial?: (partial: LocalPartial) => void;
  /** Fired when speech resumes after a pause that already triggered a partial. */
  onVoiceResume?: () => void;
  /** Adaptive end-of-turn silence window in ms; polled each frame. Default 1200. */
  getSilenceMs?: () => number;
  /** Pause length that triggers a mid-speech partial transcription. 0/undefined disables partials. */
  partialAfterMs?: number;
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
  // A long end-of-turn delay makes every voice reply feel slow. The default
  // still leaves room for a natural pause; callers can adapt it per partial
  // transcript (complete sentence → shorter, trailing connector → longer).
  const SILENCE_MS = 1_200;
  const THRESHOLD = 0.008;
  const PARTIAL_MS = args.partialAfterMs && args.partialAfterMs > 0
    ? Math.max(300, args.partialAfterMs)
    : 0;
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

  // ── Mid-speech partials ────────────────────────────────────────────────────
  // At each pause of PARTIAL_MS we transcribe the audio prefix so far. Because
  // the pause tail is silence, the last partial usually covers every spoken
  // word — making the end-of-turn transcription free (reuse, not re-run).
  type PartialRecord = { transcript: LocalTranscript; voiceAtSnapshot: number };
  let pauseArmed = false;
  let lastPartial: PartialRecord | null = null;
  let inFlight: { voiceAtSnapshot: number; promise: Promise<PartialRecord | null> } | null = null;

  const firePartial = () => {
    if (inFlight || chunks.length === 0) return;
    const voiceAtSnapshot = lastVoiceAt;
    const snapshotAt = performance.now();
    const blob = new Blob(chunks.slice(), { type: recorder.mimeType || 'audio/webm' });
    const promise = transcribeBlob(blob, args.language || 'en')
      .then((transcript): PartialRecord | null => {
        const record = { transcript, voiceAtSnapshot };
        lastPartial = record;
        if (!cancelled && !finalized) args.onPartial?.({ text: transcript.text, snapshotAt });
        return record;
      })
      .catch(() => null)
      .finally(() => { if (inFlight?.voiceAtSnapshot === voiceAtSnapshot) inFlight = null; });
    inFlight = { voiceAtSnapshot, promise };
  };

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
        // Zero-cost final: a partial that already covers every spoken word IS
        // the final transcript — the audio after its snapshot was silence.
        if (lastPartial && lastVoiceAt <= lastPartial.voiceAtSnapshot) {
          resolveResult(lastPartial.transcript);
          return;
        }
        if (inFlight && lastVoiceAt <= inFlight.voiceAtSnapshot) {
          const settled = await inFlight.promise;
          if (settled) {
            resolveResult(settled.transcript);
            return;
          }
        }
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
    if (rms > THRESHOLD) {
      if (pauseArmed) {
        pauseArmed = false;
        if (!cancelled && !finalized) args.onVoiceResume?.();
      }
      spoke = true;
      lastVoiceAt = now;
    }
    const elapsed = now - startedAt;
    if (
      PARTIAL_MS > 0 && spoke && !pauseArmed
      && elapsed >= MIN_MS && now - lastVoiceAt >= PARTIAL_MS
    ) {
      pauseArmed = true;
      firePartial();
    }
    const silenceMs = Math.min(5_000, Math.max(500, args.getSilenceMs?.() ?? SILENCE_MS));
    if (elapsed >= MAX_MS || (spoke && elapsed >= MIN_MS && now - lastVoiceAt >= silenceMs)) {
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
