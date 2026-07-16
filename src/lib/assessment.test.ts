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
