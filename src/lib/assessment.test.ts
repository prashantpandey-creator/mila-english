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
assert.strictEqual(buildRealtimeSession('tutor').max_output_tokens, 2048, 'chat → output cap');

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
