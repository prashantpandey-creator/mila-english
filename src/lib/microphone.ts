export type MicrophoneErrorCode =
  | 'unsupported'
  | 'insecure-context'
  | 'permission-denied'
  | 'no-microphone'
  | 'microphone-busy'
  | 'microphone-constraints'
  | 'audio-context-suspended'
  | 'recorder-unsupported'
  | 'microphone-start-failed';

const MICROPHONE_ERROR_CODES = new Set<MicrophoneErrorCode>([
  'unsupported',
  'insecure-context',
  'permission-denied',
  'no-microphone',
  'microphone-busy',
  'microphone-constraints',
  'audio-context-suspended',
  'recorder-unsupported',
  'microphone-start-failed',
]);

export const MICROPHONE_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  // `ideal` asks Android for processing when the device supports it without
  // making any one vendor-specific feature a condition of opening the mic.
  echoCancellation: { ideal: true },
  noiseSuppression: { ideal: true },
  autoGainControl: { ideal: true },
  channelCount: { ideal: 1 },
};

let sharedAudioContext: AudioContext | null = null;

function stableError(code: MicrophoneErrorCode): Error {
  return new Error(code);
}

export function microphoneErrorCode(problem: unknown): MicrophoneErrorCode {
  const error = problem instanceof Error ? problem : null;
  const message = error?.message as MicrophoneErrorCode | undefined;
  if (message && MICROPHONE_ERROR_CODES.has(message)) return message;

  switch (error?.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'permission-denied';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'no-microphone';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'microphone-busy';
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return 'microphone-constraints';
    case 'NotSupportedError':
      return 'recorder-unsupported';
    default:
      return 'microphone-start-failed';
  }
}

export function normalizeMicrophoneError(problem: unknown): Error {
  return stableError(microphoneErrorCode(problem));
}

export function microphoneErrorMessage(problem: unknown, lang: 'en' | 'ru'): string {
  const code = microphoneErrorCode(problem);
  const ru = lang === 'ru';
  switch (code) {
    case 'permission-denied':
      return ru
        ? 'Микрофон заблокирован. На Android разреши его и для сайта Mila, и для приложения браузера, затем попробуй снова.'
        : 'The microphone is blocked. On Android, allow it both for the Mila site and for your browser app, then try again.';
    case 'no-microphone':
      return ru
        ? 'Android не видит доступный микрофон. Проверь микрофон устройства и попробуй снова.'
        : 'Android cannot find an available microphone. Check the device microphone and try again.';
    case 'microphone-busy':
      return ru
        ? 'Микрофон занят другим приложением. Закрой звонок, камеру или диктофон и попробуй снова.'
        : 'Another app is using the microphone. Close any call, camera, or recorder and try again.';
    case 'microphone-constraints':
      return ru
        ? 'Браузер не смог открыть микрофон с настройками устройства. Попробуй ещё раз.'
        : 'The browser could not open the microphone with this device setup. Please try again.';
    case 'audio-context-suspended':
      return ru
        ? 'Android приостановил аудиовход Mila. Коснись сферы ещё раз, чтобы запустить его.'
        : "Android paused Mila's audio input. Tap the orb once more to start it.";
    case 'recorder-unsupported':
      return ru
        ? 'Этот браузер не умеет записывать голос для Mila. Обнови Chrome или открой Mila в другом современном браузере.'
        : 'This browser cannot record voice for Mila. Update Chrome or open Mila in another current browser.';
    case 'insecure-context':
      return ru
        ? 'Микрофон работает только на защищённом HTTPS‑сайте Mila.'
        : 'Microphone recording requires Mila to be opened over secure HTTPS.';
    case 'unsupported':
      return ru
        ? 'Этот браузер не предоставляет Mila доступ к микрофону. Обнови браузер и попробуй снова.'
        : 'This browser does not provide microphone access to Mila. Update the browser and try again.';
    default:
      return ru
        ? 'Не удалось запустить микрофон. Перезапусти вкладку Mila и попробуй снова.'
        : 'The microphone could not start. Reload the Mila tab and try again.';
  }
}

function getAudioContext(): AudioContext {
  if (sharedAudioContext && sharedAudioContext.state !== 'closed') return sharedAudioContext;
  if (typeof window === 'undefined') throw stableError('unsupported');
  const AudioContextClass = (window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  }).AudioContext || (window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  }).webkitAudioContext;
  if (!AudioContextClass) throw stableError('unsupported');
  sharedAudioContext = new AudioContextClass();
  return sharedAudioContext;
}

/**
 * Call this synchronously from the tap that opens voice mode. Chrome on
 * Android may otherwise create a suspended AudioContext after an awaited
 * permission or network operation, even though microphone permission itself
 * was granted.
 */
export function primeMicrophoneAudioContext(): void {
  try {
    const audioContext = getAudioContext();
    if (audioContext.state === 'suspended') void audioContext.resume().catch(() => {});
  } catch {
    // The normal capture path returns the actionable error to the UI.
  }
}

export async function requestMicrophoneStream(): Promise<MediaStream> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') throw stableError('unsupported');
  if (window.isSecureContext === false) throw stableError('insecure-context');
  if (!navigator.mediaDevices?.getUserMedia) throw stableError('unsupported');

  const open = async (): Promise<MediaStream> => {
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: MICROPHONE_AUDIO_CONSTRAINTS });
    } catch (problem) {
      const code = microphoneErrorCode(problem);
      // A few older Android WebViews reject constraint dictionaries even when
      // plain audio capture works. Retry only that compatibility class.
      if (code !== 'microphone-constraints' && !(problem instanceof TypeError)) {
        throw normalizeMicrophoneError(problem);
      }
      try {
        return await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (fallbackProblem) {
        throw normalizeMicrophoneError(fallbackProblem);
      }
    }
  };

  let stream: MediaStream;
  try {
    stream = await open();
  } catch (problem) {
    // Android may still be releasing the WebRTC capture device when Mila
    // hands a failed Realtime call to the local recorder. One short retry
    // avoids reporting that transient hand-off as a permanent mic failure.
    if (microphoneErrorCode(problem) !== 'microphone-busy') throw problem;
    await new Promise((resolve) => window.setTimeout(resolve, 400));
    stream = await open();
  }

  const track = stream.getAudioTracks()[0];
  if (!track || track.readyState !== 'live') {
    stream.getTracks().forEach((candidate) => candidate.stop());
    throw stableError('no-microphone');
  }
  return stream;
}

export type MicrophoneCapture = {
  stream: MediaStream;
  recorder: MediaRecorder;
  analyser: AnalyserNode;
  onFailure: (listener: (error: Error) => void) => () => void;
  release: () => void;
};

export async function createMicrophoneCapture(): Promise<MicrophoneCapture> {
  if (typeof MediaRecorder === 'undefined') throw stableError('recorder-unsupported');

  const audioContext = getAudioContext();
  // Start resume while this function is still inside the user's tap handler;
  // awaiting getUserMedia first can consume Android's transient activation.
  if (audioContext.state === 'suspended') void audioContext.resume().catch(() => {});

  const stream = await requestMicrophoneStream();
  if (audioContext.state === 'suspended') {
    try {
      await Promise.race([
        audioContext.resume(),
        new Promise<void>((resolve) => window.setTimeout(resolve, 500)),
      ]);
    } catch { /* checked below */ }
  }
  if (audioContext.state !== 'running') {
    stream.getTracks().forEach((track) => track.stop());
    throw stableError('audio-context-suspended');
  }

  let recorder: MediaRecorder;
  let source: MediaStreamAudioSourceNode | null = null;
  let analyser: AnalyserNode | null = null;
  try {
    recorder = new MediaRecorder(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
  } catch (problem) {
    source?.disconnect();
    analyser?.disconnect();
    stream.getTracks().forEach((track) => track.stop());
    throw normalizeMicrophoneError(problem);
  }

  let released = false;
  const failureListeners = new Set<(error: Error) => void>();
  const microphoneTrack = stream.getAudioTracks()[0];
  const recorderFailed = (event: Event) => {
    if (released) return;
    const problem = (event as Event & { error?: unknown }).error;
    const error = normalizeMicrophoneError(problem);
    failureListeners.forEach((listener) => listener(error));
  };
  const trackEnded = () => {
    if (released) return;
    const error = stableError('microphone-start-failed');
    failureListeners.forEach((listener) => listener(error));
  };
  recorder.addEventListener('error', recorderFailed);
  microphoneTrack?.addEventListener('ended', trackEnded);

  return {
    stream,
    recorder,
    analyser,
    onFailure: (listener) => {
      if (released) return () => {};
      failureListeners.add(listener);
      return () => failureListeners.delete(listener);
    },
    release: () => {
      if (released) return;
      released = true;
      recorder.removeEventListener('error', recorderFailed);
      microphoneTrack?.removeEventListener('ended', trackEnded);
      failureListeners.clear();
      source?.disconnect();
      analyser?.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      // Keep the context alive: Mila's next listening turn starts
      // automatically and no longer has a fresh Android tap to unlock it.
    },
  };
}

export function startMicrophoneRecorder(capture: MicrophoneCapture, timeslice?: number): void {
  try {
    if (timeslice === undefined) capture.recorder.start();
    else capture.recorder.start(timeslice);
  } catch (problem) {
    capture.release();
    throw normalizeMicrophoneError(problem);
  }
}
