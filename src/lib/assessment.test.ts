import assert from 'node:assert';
import {
  assessmentResultSchema,
  buildRealtimeSession,
  extractResponseText,
  lessonPlanSchema,
} from './assessment';

const session = buildRealtimeSession('assessment');
assert.strictEqual(session.type, 'realtime');
assert.ok(session.model.startsWith('gpt-realtime'));
assert.strictEqual(session.audio.input.transcription.model, 'gpt-4o-mini-transcribe');
assert.strictEqual(session.tools?.[0].name, 'finalize_assessment');

assert.strictEqual(buildRealtimeSession('tutor').tools, undefined);

// Cost mapping (locks the efficiency pass): the one-time assessment uses the
// flagship model and no output cap; unlimited chat uses mini + a token ceiling.
assert.strictEqual(buildRealtimeSession('assessment').model, 'gpt-realtime-2.1', 'assessment → flagship');
assert.strictEqual(buildRealtimeSession('assessment').max_output_tokens, undefined, 'assessment → uncapped');
assert.strictEqual(buildRealtimeSession('tutor').model, 'gpt-realtime-2.1-mini', 'tutor → mini');
assert.strictEqual(buildRealtimeSession('companion').model, 'gpt-realtime-2.1-mini', 'companion → mini');
assert.strictEqual(buildRealtimeSession('gia').model, 'gpt-realtime-2.1-mini', 'Gia → mini');
assert.strictEqual(buildRealtimeSession('tutor').max_output_tokens, 2048, 'chat → output cap');
assert.strictEqual(buildRealtimeSession('gia').max_output_tokens, 2048, 'Gia → output cap');

// The examiner asks one question per turn and understands a Russian fallback,
// while the coach stays pinned to English. (Owner's original ask, re-landed.)
const examiner = buildRealtimeSession('assessment');
assert.ok(!('language' in examiner.audio.input.transcription), 'examiner auto-detects (understands Russian)');
assert.match(examiner.instructions, /one question at a time/i);
assert.match(examiner.instructions, /never stack/i);
assert.match(examiner.instructions, /understand Russian/i);
assert.match(examiner.instructions, /priority/i);
assert.strictEqual(buildRealtimeSession('tutor').audio.input.transcription.language, 'en', 'coach still pins English');
assert.ok(!('language' in buildRealtimeSession('companion').audio.input.transcription), 'free companion auto-detects');
assert.ok(!('language' in buildRealtimeSession('gia').audio.input.transcription), 'Gia auto-detects');
assert.ok(!('language' in buildRealtimeSession('pia').audio.input.transcription), 'Pia auto-detects');
const companion = buildRealtimeSession('companion');
const gia = buildRealtimeSession('gia');
assert.match(companion.instructions, /girl-next-door warmth/i);
assert.match(companion.instructions, /full attention and care/i);
assert.match(companion.instructions, /do not encourage dependency/i);
assert.match(companion.instructions, /chemistry between the lines/i);
assert.match(companion.instructions, /do not initiate flirting/i);
assert.match(companion.instructions, /light swearing is fine/i);
assert.match(companion.instructions, /never become explicit, graphic, crude, or sexual role-play/i);
assert.doesNotMatch(companion.instructions, /clearly a bit into them/i);
assert.match(gia.instructions, /You are Gia/);
assert.match(gia.instructions, /inside the Gia companion app/);

assert.deepStrictEqual(assessmentResultSchema.parse({
  level: 'B1',
  weaknesses: 'Past-tense control needs practice.',
  strengths: 'Communicates ideas clearly.',
  custom_plan_focus: 'Narrating past experiences.',
}).level, 'B1');

assert.strictEqual(extractResponseText({
  output: [{ type: 'message', content: [{ type: 'output_text', text: '{"lessons":[]}' }] }],
}), '{"lessons":[]}');

assert.throws(() => lessonPlanSchema.parse({ lessons: [] }));

console.log('assessment engine: all assertions pass');
