import assert from 'node:assert';

type MockUtterance = {
  text: string;
  lang: string;
  rate: number;
  voice: unknown;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

const spoken: MockUtterance[] = [];
let current: MockUtterance | null = null;

class SpeechSynthesisUtteranceMock implements MockUtterance {
  lang = '';
  rate = 1;
  voice: unknown = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(public text: string) {}
}

const synthesis = {
  getVoices: () => [
    { name: 'Local English', lang: 'en-US', localService: true },
    { name: 'Local Russian', lang: 'ru-RU', localService: true },
  ],
  addEventListener: () => {},
  speak: (utterance: MockUtterance) => {
    assert.strictEqual(current, null, 'only one utterance may be in the browser queue');
    current = utterance;
    spoken.push(utterance);
    utterance.onstart?.();
  },
  cancel: () => {
    const cancelled = current;
    current = null;
    cancelled?.onerror?.();
  },
};

(globalThis as any).window = { speechSynthesis: synthesis };
(globalThis as any).SpeechSynthesisUtterance = SpeechSynthesisUtteranceMock;

const finishCurrent = () => {
  const completed = current;
  assert.ok(completed, 'an utterance should be active');
  current = null;
  completed.onend?.();
};

async function main() {
  const { createStreamingTtsSession } = await import('./tts');
  // Chunks now pre-fetch a Piper clip before speaking (browser voice is the
  // per-chunk fallback), so speech starts a tick after push, not synchronously.
  const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 25));

  const session = await createStreamingTtsSession('en-US');
  const answer = 'You corrected that sentence. Теперь попробуем ещё один вопрос.';
  session.push(answer);
  await tick();
  assert.strictEqual(spoken.length, 1);
  assert.strictEqual(spoken[0].lang, 'en-US');
  const finished = session.finish(answer);
  finishCurrent();
  await tick();
  assert.strictEqual(spoken.length, 2, 'the second phrase starts only after the first ends');
  assert.strictEqual(spoken[1].lang, 'ru-RU');
  finishCurrent();
  await finished;

  const cancelledSession = await createStreamingTtsSession('en-US');
  cancelledSession.push('This is the first phrase. This is the second phrase.');
  await tick();
  assert.strictEqual(spoken.length, 3);
  const stale = current;
  cancelledSession.cancel();
  stale?.onend?.();
  await tick();
  assert.strictEqual(spoken.length, 3, 'a stale completion cannot start queued speech after cancellation');

  delete (globalThis as any).window;
  delete (globalThis as any).SpeechSynthesisUtterance;

  console.log('streaming TTS queue: all assertions pass');
}

void main();
