import assert from 'node:assert';
import {
  applyLocalModelRequestOptions,
  buildCompanionSystemPrompt,
  getLocalLlmConfig,
  isSensitiveMemory,
  ollamaHasModel,
  parseMemoryCommand,
} from './companion';

assert.deepStrictEqual(
  parseMemoryCommand('Please remember that my interview is in September.'),
  { kind: 'remember', content: 'my interview is in September' },
);
assert.deepStrictEqual(
  parseMemoryCommand('Запомни, что я учу английский для работы.'),
  { kind: 'remember', content: 'я учу английский для работы' },
);
assert.deepStrictEqual(parseMemoryCommand('What do you remember about me?'), { kind: 'list' });
assert.deepStrictEqual(parseMemoryCommand('Забудь всё, что ты обо мне помнишь.'), { kind: 'forget-all' });
assert.strictEqual(parseMemoryCommand('Can you explain this grammar rule?'), null);

assert.strictEqual(isSensitiveMemory('my password is hunter2'), true);
assert.strictEqual(isSensitiveMemory('мой пин код 1234'), true);
assert.strictEqual(isSensitiveMemory('I prefer corrections after I finish speaking'), false);

assert.deepStrictEqual(
  getLocalLlmConfig({ LOCAL_LLM_URL: 'http://mila-llm:11434/', LOCAL_LLM_MODEL: 'qwen3:test' }),
  {
    url: 'http://mila-llm:11434',
    baseURL: 'http://mila-llm:11434/v1',
    model: 'qwen3:test',
  },
);

assert.strictEqual(
  ollamaHasModel({ models: [{ name: 'qwen3:4b-instruct-2507-q4_K_M' }] }, 'qwen3:4b-instruct-2507-q4_K_M'),
  true,
);
assert.strictEqual(ollamaHasModel({ models: [{ name: 'qwen3:1.7b' }] }, 'qwen3:4b'), false);

assert.deepStrictEqual(
  applyLocalModelRequestOptions('gpt-oss:20b', { messages: [] }, undefined),
  { messages: [], reasoning_effort: 'low' },
);
assert.deepStrictEqual(
  applyLocalModelRequestOptions('gpt-oss:20b', { messages: [] }, 'high'),
  { messages: [], reasoning_effort: 'high' },
);
assert.deepStrictEqual(
  applyLocalModelRequestOptions('qwen3:4b', { messages: [] }, 'high'),
  { messages: [], reasoning_effort: 'none' },
);
assert.deepStrictEqual(
  applyLocalModelRequestOptions('qwen3:4b-instruct-2507-q4_K_M', { messages: [] }, 'high'),
  { messages: [] },
);

const prompt = buildCompanionSystemPrompt({
  persona: 'You are Mila as the Friend.',
  pathname: '/chat',
  locale: 'en',
  surface: 'full tutor chat',
  learnerSummary: 'Learner: Anna; level: B1.',
  recentSummary: 'Travel English (complete, score 82).',
  memories: ['The learner is preparing for a September interview.'],
  learningContext: 'Current lesson: Interviews. Phrase: Tell me about yourself.',
});
assert.match(prompt, /answer ordinary questions/i);
assert.match(prompt, /private context/i);
assert.match(prompt, /September interview/);
assert.match(prompt, /Tell me about yourself/);
assert.match(prompt, /never claim to be human, conscious, sentient/i);

const voicePrompt = buildCompanionSystemPrompt({
  persona: 'You are Mila as the Teacher.',
  pathname: '/darshan',
  locale: 'en',
  surface: 'Darshan voice conversation',
  learnerSummary: 'Learner: Anna; level: B1.',
  recentSummary: 'No recorded lesson progress yet.',
  memories: [],
});
assert.match(voicePrompt, /reply will be read aloud/i);
assert.match(voicePrompt, /no Markdown, headings, bullets/i);
assert.match(voicePrompt, /Ask no more than one question/i);
assert.match(voicePrompt, /FINAL OUTPUT CONTRACT/);
assert.match(voicePrompt, /15 to 35 words/i);
assert.doesNotMatch(voicePrompt, /40 to 80 words/i);

const friendlyVoicePrompt = buildCompanionSystemPrompt({
  persona: 'Register: concise; playful; a little emoji is fine.',
  pathname: '/darshan',
  locale: 'en',
  surface: 'Darshan voice conversation',
  learnerSummary: 'Learner: Guest; level: pending.',
  recentSummary: 'No recorded lesson progress yet.',
  memories: [],
});
assert.doesNotMatch(friendlyVoicePrompt, /a little emoji is fine/i);

console.log('companion core: all assertions pass');
