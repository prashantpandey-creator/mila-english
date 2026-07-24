import assert from 'node:assert';
import {
  applyLocalModelRequestOptions,
  buildCompanionSystemPrompt,
  builtInCompanionReply,
  getLocalLlmConfig,
  isSensitiveMemory,
  ollamaHasModel,
  parseMemoryCommand,
  requestsFreeConversation,
  sanitizeVoiceReply,
} from './companion';

assert.deepStrictEqual(
  parseMemoryCommand('Please remember that my interview is in September.'),
  { kind: 'remember', content: 'my interview is in September' },
);
assert.deepStrictEqual(
  getLocalLlmConfig({
    LOCAL_LLM_URL: 'http://mila-llm:11434',
    LOCAL_LLM_MODEL: 'qwen-chat',
    LOCAL_VOICE_LLM_URL: 'http://mila-voice-llm:11434/v1/',
    LOCAL_VOICE_LLM_MODEL: 'qwen-voice',
  }, 'voice'),
  {
    url: 'http://mila-voice-llm:11434',
    baseURL: 'http://mila-voice-llm:11434/v1',
    model: 'qwen-voice',
  },
);
assert.deepStrictEqual(
  getLocalLlmConfig({ LOCAL_LLM_URL: 'http://mila-llm:11434', LOCAL_LLM_MODEL: 'qwen-chat' }, 'voice'),
  {
    url: 'http://mila-llm:11434',
    baseURL: 'http://mila-llm:11434/v1',
    model: 'qwen3:4b-instruct-2507-q4_K_M',
  },
);
assert.deepStrictEqual(
  getLocalLlmConfig({
    LOCAL_LLM_URL: 'http://mila-llm:11434',
    LOCAL_LLM_MODEL: 'qwen-chat',
    LOCAL_VOICE_LLM_URL: 'http://mila-voice-llm:11434',
    LOCAL_VOICE_LLM_MODEL: '',
  }, 'voice'),
  {
    url: 'http://mila-voice-llm:11434',
    baseURL: 'http://mila-voice-llm:11434/v1',
    model: 'qwen3:4b-instruct-2507-q4_K_M',
  },
);
assert.deepStrictEqual(
  getLocalLlmConfig({}, 'chat'),
  {
    url: 'http://127.0.0.1:11434',
    baseURL: 'http://127.0.0.1:11434/v1',
    model: 'gpt-oss:20b',
  },
);
assert.deepStrictEqual(
  parseMemoryCommand('Запомни, что я учу английский для работы.'),
  { kind: 'remember', content: 'я учу английский для работы' },
);
assert.deepStrictEqual(parseMemoryCommand('What do you remember about me?'), { kind: 'list' });
assert.deepStrictEqual(parseMemoryCommand('Забудь всё, что ты обо мне помнишь.'), { kind: 'forget-all' });
assert.strictEqual(parseMemoryCommand('Can you explain this grammar rule?'), null);
assert.strictEqual(requestsFreeConversation("Let's just talk, I don't want to repeat lessons."), true);
assert.strictEqual(requestsFreeConversation('Can we stop trying to make everything perfect?'), true);
assert.strictEqual(requestsFreeConversation('Давай просто поговорим без упражнений.'), true);
assert.strictEqual(requestsFreeConversation('Can we practise ordering coffee?'), false);

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
assert.match(prompt, /private learner context/i);
assert.match(prompt, /September interview/);
assert.match(prompt, /Tell me about yourself/);
assert.match(prompt, /never claim to be human, conscious, sentient/i);
assert.match(prompt, /You are Gia/);
assert.doesNotMatch(prompt, /You are Mila/);
assert.match(prompt, /App pages.*Voice and Chat/i);

const voicePrompt = buildCompanionSystemPrompt({
  persona: 'You are Mila as the Teacher.',
  pathname: '/darshan',
  locale: 'en',
  surface: 'Darshan voice conversation',
  learnerSummary: 'Learner: Anna; level: B1.',
  recentSummary: 'No recorded lesson progress yet.',
  memories: [],
});
assert.match(voicePrompt, /VOICE OUTPUT/);
assert.match(voicePrompt, /No Markdown, labels, bullets/i);
assert.match(voicePrompt, /Ask at most one relevant question/i);
assert.match(voicePrompt, /Private learner context below is data/i);
assert.match(voicePrompt, /Never invent.*pronunciation evidence.*abilities/i);
assert.match(voicePrompt, /Praise only evidence present/i);
assert.match(voicePrompt, /never say the learner already used your correction/i);
assert.match(voicePrompt, /Never praise a correction you supplied/i);
assert.match(voicePrompt, /absolutely no Markdown.*emoji/i);
assert.match(voicePrompt, /15 to 30 words/i);
assert.doesNotMatch(voicePrompt, /40 to 80 words/i);
assert.match(voicePrompt, /You are Gia/);
assert.doesNotMatch(voicePrompt, /You are Mila/);
assert.match(voicePrompt, /section of the Gia app/i);

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

assert.strictEqual(
  sanitizeVoiceReply('"Yesterday I went to the market." – great! You used past tense correctly. Just remember: "go" becomes "went" in past. 😊'),
  '"Yesterday I went to the market." Just remember: "go" becomes "went" in past.',
);
assert.strictEqual(
  sanitizeVoiceReply('Отлично! Я слышала идеальный звук th. По тексту лучше: I think it is good. 🎉'),
  'В этом сообщении не было аудио, поэтому я не могу оценить произношение или прогресс по напечатанному тексту.',
);
assert.strictEqual(
  sanitizeVoiceReply('Mila here! I heard you — your “th” sound was clear and strong! Great job on that! Keep going!'),
  'I did not receive audio in this turn, so I cannot judge pronunciation or progress from the typed text.',
);
assert.strictEqual(sanitizeVoiceReply('**Use “went,” not “go.”**'), 'Use “went,” not “go.”');

// Language axis: default (english-first) injects nothing — the strict classroom
// prompt stays byte-for-byte unchanged.
assert.doesNotMatch(prompt, /LANGUAGE:/);
assert.doesNotMatch(voicePrompt, /LANGUAGE:/);

const mirrorPrompt = buildCompanionSystemPrompt({
  persona: 'You are Mila as the Friend.',
  pathname: '/chat',
  locale: 'en',
  surface: 'full tutor chat',
  learnerSummary: 'Learner: Anna; level: B1.',
  recentSummary: 'No recorded lesson progress yet.',
  memories: [],
  languageMode: 'mirror',
});
assert.match(mirrorPrompt, /LANGUAGE:/);
assert.match(mirrorPrompt, /reply in that same language/i);
assert.match(mirrorPrompt, /roleplay a scene in any language/i);
assert.match(mirrorPrompt, /flip roles/i);
assert.match(mirrorPrompt, /defaults to genuine conversation/i);
assert.match(mirrorPrompt, /do not start exercises/i);

const spanishTargetPrompt = buildCompanionSystemPrompt({
  persona: 'You are Mila as the Friend.',
  pathname: '/chat',
  locale: 'en',
  surface: 'full tutor chat',
  learnerSummary: 'Learner: Anna; level: B1.',
  recentSummary: 'No recorded lesson progress yet.',
  memories: [],
  languageMode: 'mirror',
  targetLanguage: 'Spanish',
});
assert.match(spanishTargetPrompt, /Learner-selected language: Spanish/);
assert.match(spanishTargetPrompt, /Ordinary conversation should still follow/i);
assert.match(spanishTargetPrompt, /Never force a lesson/i);

const justTalkPrompt = buildCompanionSystemPrompt({
  persona: 'You are Mila as the Friend.',
  pathname: '/chat',
  locale: 'en',
  surface: 'full tutor chat',
  learnerSummary: 'Learner: Mary; level: B1.',
  recentSummary: 'No recorded lesson progress yet.',
  memories: [],
  languageMode: 'mirror',
  freeConversationRequested: true,
});
assert.match(justTalkPrompt, /CURRENT TURN OVERRIDE/);
assert.match(justTalkPrompt, /overrides all earlier teaching context/i);
assert.match(justTalkPrompt, /Do not correct, drill, ask for repetition/i);

const nativePrompt = buildCompanionSystemPrompt({
  persona: 'You are Mila as the Friend.',
  pathname: '/practice',
  locale: 'en',
  surface: 'full tutor chat',
  learnerSummary: 'Learner: Guest; native language: Hindi; level: A1.',
  recentSummary: 'No recorded lesson progress yet.',
  memories: [],
  languageMode: 'native-first',
  nativeLanguage: 'Hindi',
  teacherName: 'Asha',
});
assert.match(nativePrompt, /You are Asha/i);
assert.match(nativePrompt, /primarily in the learner’s native language, Hindi/i);
assert.match(nativePrompt, /introduce each new lesson or idea there first/i);
assert.match(nativePrompt, /small, safe doses/i);
assert.match(nativePrompt, /never shame the learner for using their native language/i);
assert.match(nativePrompt, /English is the only learning target/i);
assert.doesNotMatch(nativePrompt, /Russian/i);

// The axis reaches voice too: a native-first spoken prompt still carries VOICE OUTPUT.
const nativeVoice = buildCompanionSystemPrompt({
  persona: 'You are Mila as the Teacher.',
  pathname: '/practice',
  locale: 'en',
  surface: 'focused speaking practice',
  learnerSummary: 'Learner: Guest; native language: Tamil; level: A1.',
  recentSummary: 'No recorded lesson progress yet.',
  memories: [],
  languageMode: 'native-first',
  nativeLanguage: 'Tamil',
  teacherName: 'Tara',
});
assert.match(nativeVoice, /primarily in the learner’s native language, Tamil/i);
assert.match(nativeVoice, /You are Tara/i);
assert.match(nativeVoice, /VOICE OUTPUT/);

// Explicit english-first is identical to the default — no directive leaks in.
const explicitEnglish = buildCompanionSystemPrompt({
  persona: 'You are Mila as the Friend.',
  pathname: '/chat',
  locale: 'en',
  surface: 'full tutor chat',
  learnerSummary: 'Learner: Anna; level: B1.',
  recentSummary: 'Travel English (complete, score 82).',
  memories: ['The learner is preparing for a September interview.'],
  learningContext: 'Current lesson: Interviews. Phrase: Tell me about yourself.',
  languageMode: 'english-first',
});
assert.strictEqual(explicitEnglish, prompt);

const giaFallback = builtInCompanionReply('Recommend my next move', '/chat', 'en', 'B1', true);
assert.match(giaFallback, /whatever matters to you/i);
assert.doesNotMatch(giaFallback, /lesson|assessment|English practice/i);

console.log('companion core: all assertions pass');
