// Client-side wrapper around the OpenAI Realtime WebRTC loop that already
// powers the voice assessment. The voice room uses this for the flagship
// speech-to-speech voice; when connecting fails (region, network, missing key)
// the caller falls back to the fully local STT→LLM→TTS cascade, so the local
// pipeline remains the safety net beneath the realtime voice.

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
  /** Overall budget for the SDP exchange before falling back. */
  timeoutMs?: number;
}): Promise<RealtimeVoiceSession> {
  const { events } = options;
  const pc = new RTCPeerConnection();
  const audio = new Audio();
  audio.autoplay = true;
  let media: MediaStream | null = null;
  let open = true;
  let disconnectFired = false;

  const cleanup = () => {
    open = false;
    try { pc.close(); } catch { /* already closed */ }
    media?.getTracks().forEach((track) => track.stop());
    media = null;
    audio.srcObject = null;
  };

  try {
    pc.ontrack = (event) => { audio.srcObject = event.streams[0]; };
    media = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    pc.addTrack(media.getTracks()[0]);

    const dc = pc.createDataChannel('oai-events');

    let pendingUser = '';
    let assistantText = '';

    dc.addEventListener('open', () => {
      // Nudge Mila to greet the learner immediately.
      try { dc.send(JSON.stringify({ type: 'response.create' })); } catch { /* channel raced closed */ }
    });

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
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
        disconnectFired = true;
        cleanup();
        events.onDisconnect?.();
      }
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const response = await fetch(`/api/session?mode=tutor&lang=${options.lang}`, {
      method: 'POST',
      body: offer.sdp,
      headers: { 'Content-Type': 'application/sdp' },
      signal: AbortSignal.timeout(options.timeoutMs ?? 12_000),
    });
    if (!response.ok) {
      const problem = await response.json().catch(() => null);
      throw new Error(problem?.code || 'OPENAI_SESSION_FAILED');
    }
    await pc.setRemoteDescription({ type: 'answer', sdp: await response.text() });

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
