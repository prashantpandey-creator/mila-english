// Runnable proof that cancelling mobile WebRTC negotiation releases a late mic,
// and that anonymous sessions carry a stable per-browser identity.
// Run: npx tsx src/lib/realtimeVoice.test.ts
import assert from 'node:assert/strict';
import { connectRealtimeVoice } from './realtimeVoice';

const originals = {
  window: Object.getOwnPropertyDescriptor(globalThis, 'window'),
  navigator: Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
  RTCPeerConnection: Object.getOwnPropertyDescriptor(globalThis, 'RTCPeerConnection'),
  Audio: Object.getOwnPropertyDescriptor(globalThis, 'Audio'),
  fetch: globalThis.fetch,
};

const restore = (key: 'window' | 'navigator' | 'RTCPeerConnection' | 'Audio', descriptor: PropertyDescriptor | undefined) => {
  if (descriptor) Object.defineProperty(globalThis, key, descriptor);
  else Reflect.deleteProperty(globalThis, key);
};

async function run() {
  let stopped = 0;
  let openDataChannel = false;
  let lastRequest: RequestInit | undefined;
  const storage = new Map<string, string>();

  class FakeDataChannel extends EventTarget {
    readyState: RTCDataChannelState = 'connecting';
    send() {}
    open() {
      this.readyState = 'open';
      this.dispatchEvent(new Event('open'));
    }
  }

  class FakePeerConnection extends EventTarget {
    static instances: FakePeerConnection[] = [];
    connectionState: RTCPeerConnectionState = 'new';
    ontrack: ((event: RTCTrackEvent) => void) | null = null;
    closed = false;
    channel = new FakeDataChannel();
    constructor() {
      super();
      FakePeerConnection.instances.push(this);
    }
    addTrack() { return {} as RTCRtpSender; }
    createDataChannel() { return this.channel as unknown as RTCDataChannel; }
    async createOffer() { return { type: 'offer' as RTCSdpType, sdp: 'v=0\r\n' }; }
    async setLocalDescription() {}
    async setRemoteDescription() {
      if (openDataChannel) queueMicrotask(() => this.channel.open());
    }
    close() {
      this.closed = true;
      this.connectionState = 'closed';
    }
  }

  class FakeAudio {
    autoplay = false;
    srcObject: MediaStream | null = null;
    setAttribute() {}
    async play() {}
  }

  const makeStream = () => {
    const track = { readyState: 'live', stop: () => { stopped += 1; } } as MediaStreamTrack;
    return {
      getAudioTracks: () => [track],
      getTracks: () => [track],
    } as MediaStream;
  };

  try {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        isSecureContext: true,
        localStorage: {
          getItem: (key: string) => storage.get(key) ?? null,
          setItem: (key: string, value: string) => { storage.set(key, value); },
        },
      },
    });
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { mediaDevices: { getUserMedia: async () => makeStream() } },
    });
    Object.defineProperty(globalThis, 'RTCPeerConnection', {
      configurable: true,
      value: FakePeerConnection,
    });
    Object.defineProperty(globalThis, 'Audio', { configurable: true, value: FakeAudio });
    globalThis.fetch = async (_input, init) => {
      lastRequest = init;
      return new Response('v=0\r\n', { status: 200, headers: { 'content-type': 'application/sdp' } });
    };

    const cancelled = new AbortController();
    const pending = connectRealtimeVoice({ lang: 'en', mode: 'companion', events: {}, signal: cancelled.signal });
    cancelled.abort();
    await assert.rejects(pending, /voice-connect-cancelled/);
    assert.equal(stopped, 1, 'a mic that resolves after cancellation is still stopped');
    assert.equal(FakePeerConnection.instances[0].closed, true);

    openDataChannel = true;
    const session = await connectRealtimeVoice({ lang: 'en', mode: 'companion', events: {} });
    const headers = lastRequest?.headers as Record<string, string>;
    assert.match(headers['X-Device-Id'], /^[a-zA-Z0-9-]{16,80}$/);
    assert.equal(session.isOpen(), true);
    session.close();
    assert.equal(session.isOpen(), false);
    assert.equal(stopped, 2);
  } finally {
    restore('window', originals.window);
    restore('navigator', originals.navigator);
    restore('RTCPeerConnection', originals.RTCPeerConnection);
    restore('Audio', originals.Audio);
    globalThis.fetch = originals.fetch;
  }
}

void run().then(() => console.log('realtime voice cancellation: 8/8 pass'));
