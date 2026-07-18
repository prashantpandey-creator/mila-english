import assert from 'node:assert';
import { parseVoiceCommand } from './voiceCommands';

// Back — EN and RU, with polite/filler variants and trailing punctuation.
for (const phrase of ['go back', 'Go back.', 'take me back', 'назад', 'Вернись назад', 'вернись']) {
  const cmd = parseVoiceCommand(phrase);
  assert.deepStrictEqual(cmd, { kind: 'back' }, `"${phrase}" must be back`);
}

// Navigation — verb + target. The helper narrows the union and fails loudly
// when a phrase parses as anything but a goto.
function gotoRoute(phrase: string): string {
  const cmd = parseVoiceCommand(phrase);
  assert.ok(cmd && cmd.kind === 'goto', `"${phrase}" must parse as goto`);
  return cmd.route;
}
assert.strictEqual(gotoRoute('take me to the lessons menu'), '/lessons');
assert.strictEqual(gotoRoute('Open vocabulary.'), '/vocabulary');
assert.strictEqual(gotoRoute('go to grammar'), '/grammar');
assert.strictEqual(gotoRoute('show me my progress'), '/progress');
assert.strictEqual(gotoRoute('open the dashboard'), '/dashboard');
assert.strictEqual(gotoRoute('take me home'), '/dashboard');
assert.strictEqual(gotoRoute('open pronunciation'), '/phonetics');
assert.strictEqual(gotoRoute('open listening'), '/listen');

// The practice room is hidden at /voice-lab (internal): spoken "practice"
// must no longer resolve to a navigation command at all.
for (const phrase of ['open speaking practice', 'открой практику']) {
  const cmd = parseVoiceCommand(phrase);
  assert.ok(!cmd || cmd.kind !== 'goto', `"${phrase}" must NOT navigate anywhere`);
}

// Navigation — RU.
assert.strictEqual(gotoRoute('открой уроки'), '/lessons');
assert.strictEqual(gotoRoute('Покажи словарь'), '/vocabulary');
assert.strictEqual(gotoRoute('перейди в грамматику'), '/grammar');
assert.strictEqual(gotoRoute('отведи меня на главную'), '/dashboard');
assert.strictEqual(gotoRoute('покажи мой прогресс'), '/progress');
assert.strictEqual(gotoRoute('открой произношение'), '/phonetics');

// A matched command carries bilingual confirmation labels.
{
  const cmd = parseVoiceCommand('open lessons');
  assert.ok(cmd && cmd.kind === 'goto');
  assert.ok(cmd.labelEn.length > 0 && cmd.labelRu.length > 0);
}

// Plain conversation must NEVER be hijacked as a command.
for (const phrase of [
  'I like grammar',
  'What is a lesson?',
  'мне нравится грамматика',
  'tell me about the lessons of history',
  'Yesterday I went back to school',
  'я вчера ходил в школу',
  'what does vocabulary mean',
]) {
  assert.strictEqual(parseVoiceCommand(phrase), null, `"${phrase}" must NOT be a command`);
}

console.log('voiceCommands: all assertions pass');
