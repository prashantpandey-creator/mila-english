import assert from 'node:assert/strict';
import { checkCloudBrains, cloudTarget } from './check-cloud-brains.mjs';

assert.equal(cloudTarget('chat', {
  OPENROUTER_API_KEY: 'or-key',
  OPENAI_API_KEY: 'oa-key',
})?.provider, 'OpenAI', 'Chat must not invent an OpenRouter model when none is configured');

assert.deepEqual(
  cloudTarget('voice', {
    OPENROUTER_API_KEY: 'or-key',
    OPENAI_API_KEY: 'oa-key',
  }) && {
    provider: cloudTarget('voice', { OPENROUTER_API_KEY: 'or-key', OPENAI_API_KEY: 'oa-key' }).provider,
    model: cloudTarget('voice', { OPENROUTER_API_KEY: 'or-key', OPENAI_API_KEY: 'oa-key' }).model,
  },
  { provider: 'OpenRouter', model: 'openai/gpt-4o-mini' },
);

const calls = [];
let active = 0;
let maxActive = 0;
const fakeFetch = async (_url, init) => {
  active += 1;
  maxActive = Math.max(maxActive, active);
  const body = JSON.parse(init.body);
  calls.push(body.model);
  await new Promise((resolve) => setTimeout(resolve, 5));
  active -= 1;
  return { ok: true, status: 200 };
};

const env = {
  OPENROUTER_API_KEY: 'or-key',
  OPENROUTER_CHAT_MODEL: 'provider/chat-model',
  OPENROUTER_VOICE_MODEL: 'provider/voice-model',
};
const results = await checkCloudBrains(env, fakeFetch, { log() {} });
assert.deepEqual(calls, ['provider/chat-model', 'provider/voice-model']);
assert.equal(maxActive, 1, 'Chat and Voice checks must never overlap');
assert.deepEqual(results.map(({ surface }) => surface), ['chat', 'voice']);

console.log('cloud brain checks: all assertions pass');
