// Client-side wrapper around the OpenAI Realtime WebRTC loop that already
// powers the voice assessment. The voice room uses this for the flagship
// speech-to-speech voice; when connecting fails (region, network, missing key)
// the caller falls back to the fully local STT→LLM→TTS cascade, so the local
// pipeline remains the safety net beneath the realtime voice.

import { requestMicrophoneStream } from './microphone';

const VOICE_DEVICE_ID_KEY = 'mila-voice-device-id';
let ephemeralVoiceDeviceId = '';

function voiceDeviceId(): string {
  try {
    const existing = window.localStorage.getItem(VOICE_DEVICE_ID_KEY);
    if (existing && /^[a-zA-Z0-9-]{16,80}$/.test(existing)) return existing;
  } catch { /* private storage can be unavailable */ }

  const created = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `voice-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
  ephemeralVoiceDeviceId = ephemeralVoiceDeviceId || created;
  try { window.localStorage.setItem(VOICE_DEVICE_ID_KEY, ephemeralVoiceDeviceId); } catch { /* ephemeral is enough */ }
  return ephemeralVoiceDeviceId;
}

export type RealtimeVoiceEvents = {
  /** The session is idle and hearing the user (initial state and after each reply). */
  onListening?: () => void;
  /** The user's finished utterance, transcribed server-side (captions + history). */
  onUserTranscript?: (text: string) => void;
  /** Mila started preparing a reply. */
  onThinking?: () => void;
  /** Mila's audio started playing. */
  onSpeaking?: () => void;
  /** Growing transcript of what Mila is saying in the current reply. */
  onAssistantDelta?: (fullText: string) => void;
  /** A completed exchange, ready to persist to companion history. */
  onTurnComplete?: (turn: { user: string; assistant: string }) => void;
  /** The realtime service reported an error event (session may still be alive). */
  onServiceError?: (error: Error) => void;
  /** The peer connection died mid-session (fires at most once). */
  onDisconnect?: () => void;
};

export type RealtimeVoiceSession = {
  /** Stop Mila mid-sentence and return to listening (tap-to-interrupt). */
  interrupt: () => void;
  close: () => void;
  isOpen: () => boolean;
};

export async function connectRealtimeVoice(options: {
  lang: 'en' | 'ru';
  events: RealtimeVoiceEvents;
  /** Caller may set this literal only after its OpenAI audio disclosure flow. */
  openAIAudioConsent: true;
  /** Which persona to run: the lesson coach (default), the free English
   * companion, or Pia — the free Hindi/Hinglish companion. */
  mode?: 'tutor' | 'companion' | 'miachat' | 'pia' | 'kids';
  /** Overall budget for the SDP exchange before falling back. */
  timeoutMs?: number;
  /** Cancels a connection that is still negotiating and releases its mic. */
  signal?: AbortSignal;
}): Promise<RealtimeVoiceSession> {
  const { events } = options;
  const pc = new RTCPeerConnection();
  const audio = new Audio();
  audio.autoplay = true;
  audio.setAttribute('playsinline', '');
  let media: MediaStream | null = null;
  let open = true;
  let disconnectFired = false;
  let disconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let readinessTimer: ReturnType<typeof setTimeout> | null = null;
  let requestTimer: ReturnType<typeof setTimeout> | null = null;
  let rejectReadiness: ((error: Error) => void) | null = null;
  const requestController = new AbortController();
  let abortConnection: (() => void) | null = null;

  const cleanup = () => {
    open = false;
    if (disconnectTimer !== null) clearTimeout(disconnectTimer);
    if (readinessTimer !== null) clearTimeout(readinessTimer);
    if (requestTimer !== null) clearTimeout(requestTimer);
    disconnectTimer = null;
    readinessTimer = null;
    requestTimer = null;
    requestController.abort();
    if (abortConnection) options.signal?.removeEventListener('abort', abortConnection);
    abortConnection = null;
    try { pc.close(); } catch { /* already closed */ }
    media?.getTracks().forEach((track) => track.stop());
    media = null;
    audio.srcObject = null;
  };

  abortConnection = () => {
    rejectReadiness?.(new Error('voice-connect-cancelled'));
    cleanup();
  };
  if (options.signal?.aborted) {
    cleanup();
    throw new Error('voice-connect-cancelled');
  }
  options.signal?.addEventListener('abort', abortConnection, { once: true });

  try {
    pc.ontrack = (event) => {
      audio.srcObject = event.streams[0];
      void audio.play().catch(() => {
        // Capturing pages are normally allowed to play remote audio. If a
        // vendor still blocks it, the next orb tap remains a user gesture.
      });
    };
    media = await requestMicrophoneStream();
    if (!open) throw new Error('voice-connect-cancelled');
    const microphoneTrack = media.getAudioTracks()[0];
    if (!microphoneTrack) throw new Error('no-microphone');
    pc.addTrack(microphoneTrack, media);

    const dc = pc.createDataChannel('oai-events');

    const ready = new Promise<void>((resolve, reject) => {
      rejectReadiness = reject;
      readinessTimer = setTimeout(() => {
        rejectReadiness = null;
        reject(new Error('realtime-connection-timeout'));
      }, options.timeoutMs ?? 12_000);
      dc.addEventListener('open', () => {
        if (readinessTimer !== null) clearTimeout(readinessTimer);
        readinessTimer = null;
        rejectReadiness = null;
        // Nudge Mila to greet the learner immediately.
        try { dc.send(JSON.stringify({ type: 'response.create' })); } catch { /* channel raced closed */ }
        resolve();
      }, { once: true });
      dc.addEventListener('error', () => {
        rejectReadiness = null;
        reject(new Error('realtime-data-channel-failed'));
      }, { once: true });
    });
    // A connection can fail while the SDP request is still in flight. Attach a
    // handler now so that early mobile ICE failures never become an unhandled
    // rejection before the readiness promise is awaited below.
    void ready.catch(() => {});

    let pendingUser = '';
    let assistantText = '';

    dc.addEventListener('message', (event) => {
      let ev: any;
      try { ev = JSON.parse(event.data); } catch { return; }
      switch (ev.type) {
        case 'input_audio_buffer.speech_started':
          events.onListening?.();
          break;
        case 'conversation.item.input_audio_transcription.completed': {
          const text = (ev.transcript || '').trim();
          if (text) {
            pendingUser = text;
            events.onUserTranscript?.(text);
          }
          break;
        }
        case 'response.created':
          assistantText = '';
          events.onThinking?.();
          break;
        case 'response.output_audio.delta':
          events.onSpeaking?.();
          break;
        case 'response.output_audio_transcript.delta':
          assistantText += ev.delta || '';
          if (assistantText) events.onAssistantDelta?.(assistantText);
          break;
        case 'response.done': {
          const assistant = assistantText.trim();
          if (assistant && pendingUser) {
            events.onTurnComplete?.({ user: pendingUser, assistant });
            pendingUser = '';
          }
          events.onListening?.();
          break;
        }
        case 'error':
          console.error('Realtime voice error event', ev);
          events.onServiceError?.(new Error(ev?.error?.message || 'realtime-error'));
          break;
      }
    });

    pc.addEventListener('connectionstatechange', () => {
      if (!open || disconnectFired) return;
      if (pc.connectionState === 'connected' && disconnectTimer !== null) {
        clearTimeout(disconnectTimer);
        disconnectTimer = null;
        return;
      }
      if (pc.connectionState === 'disconnected') {
        if (disconnectTimer !== null) return;
        // Mobile radios move through `disconnected` during brief network
        // changes. Give WebRTC a chance to recover before reopening the mic.
        disconnectTimer = setTimeout(() => {
          disconnectTimer = null;
          if (!open || pc.connectionState !== 'disconnected') return;
          disconnectFired = true;
          rejectReadiness?.(new Error('realtime-disconnected'));
          cleanup();
          events.onDisconnect?.();
        }, 3_000);
        return;
      }
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        disconnectFired = true;
        rejectReadiness?.(new Error('realtime-connection-failed'));
        cleanup();
        events.onDisconnect?.();
      }
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    requestTimer = setTimeout(() => requestController.abort(), options.timeoutMs ?? 12_000);
    let response: Response;
    try {
      response = await fetch(`/api/session?mode=${options.mode ?? 'tutor'}&lang=${options.lang}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Content-Type': 'application/sdp',
          // Random per-browser identity: avoids grouping all reduced Android
          // Chrome user agents into the same anonymous rate-limit bucket.
          'X-Device-Id': voiceDeviceId(),
          'X-Mila-OpenAI-Audio-Consent': options.openAIAudioConsent ? 'v1' : '',
        },
        signal: requestController.signal,
      });
    } finally {
      if (requestTimer !== null) clearTimeout(requestTimer);
      requestTimer = null;
    }
    if (!response.ok) {
      const problem = await response.json().catch(() => null);
      throw new Error(problem?.code || 'OPENAI_SESSION_FAILED');
    }
    await pc.setRemoteDescription({ type: 'answer', sdp: await response.text() });
    // SDP success only means signalling worked. Do not tell the learner Mila is
    // hearing them until the mobile WebRTC data channel is actually usable.
    await ready;
    if (!open) throw new Error('voice-connect-cancelled');

    return {
      interrupt: () => {
        if (!open || dc.readyState !== 'open') return;
        try {
          dc.send(JSON.stringify({ type: 'response.cancel' }));
          // WebRTC-specific: flush audio already buffered for playback.
          dc.send(JSON.stringify({ type: 'output_audio_buffer.clear' }));
        } catch { /* channel raced closed */ }
      },
      close: cleanup,
      isOpen: () => open,
    };
  } catch (error) {
    cleanup();
    throw error;
  }
}
