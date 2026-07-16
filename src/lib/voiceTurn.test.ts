import assert from 'node:assert';
import {
  draftMatches,
  endpointSilenceMs,
  normalizeTranscriptForMatch,
  pickBackchannel,
  splitCompleteSentences,
} from './voiceTurn';

// ── endpointSilenceMs ────────────────────────────────────────────────────────
// No transcript yet → today's default window.
assert.strictEqual(endpointSilenceMs(null), 1200);
assert.strictEqual(endpointSilenceMs(''), 1200);
assert.strictEqual(endpointSilenceMs('   '), 1200);

// Terminal punctuation → the learner sounds finished, shorten the wait.
assert.strictEqual(endpointSilenceMs('Привет.'), 900);
assert.strictEqual(endpointSilenceMs('What is a verb?'), 900);
assert.strictEqual(endpointSilenceMs('I went to school yesterday!'), 900);
assert.strictEqual(endpointSilenceMs('Не знаю…'), 900);

// Trailing connector or comma → mid-thought, extend the wait.
assert.strictEqual(endpointSilenceMs('I want to'), 1600);
assert.strictEqual(endpointSilenceMs('Я хочу'), 1600);
assert.strictEqual(endpointSilenceMs('I like cats and'), 1600);
assert.strictEqual(endpointSilenceMs('Это значит,'), 1600);
assert.strictEqual(endpointSilenceMs('because'), 1600);

// No punctuation, no connector → near-default.
assert.strictEqual(endpointSilenceMs('What is a verb'), 1150);
assert.strictEqual(endpointSilenceMs('Расскажи про глаголы'), 1150);

// ── pickBackchannel ──────────────────────────────────────────────────────────
const first = pickBackchannel('ru', 7, null);
assert.ok(first.text.length > 0);
// Deterministic for the same seed.
assert.deepStrictEqual(pickBackchannel('ru', 7, null), first);
// Never repeats the previous index.
for (let seed = 0; seed < 12; seed += 1) {
  const again = pickBackchannel('ru', seed, first.index);
  assert.notStrictEqual(again.index, first.index, `seed ${seed} repeated backchannel`);
}
const english = pickBackchannel('en', 3, null);
assert.ok(!/[А-Яа-яЁё]/u.test(english.text), 'en pool must be English');
const russian = pickBackchannel('ru', 3, null);
assert.ok(/[А-Яа-яЁё]/u.test(russian.text), 'ru pool must be Russian');

// ── normalizeTranscriptForMatch / draftMatches ───────────────────────────────
assert.strictEqual(
  normalizeTranscriptForMatch('  Привет, Мила!  '),
  normalizeTranscriptForMatch('привет мила'),
);
// Whisper ё/е variance must not break a match.
assert.ok(draftMatches('Её зовут Мила.', 'ее зовут мила'));
assert.ok(draftMatches('I want to learn English.', 'i want to learn english'));
// Real content differences must break the match.
assert.ok(!draftMatches('I want to learn', 'I want to learn English'));
assert.ok(!draftMatches('Привет', 'Привет Мила'));
assert.ok(!draftMatches('', 'Привет'));

// ── splitCompleteSentences ───────────────────────────────────────────────────
assert.deepStrictEqual(splitCompleteSentences('Hello there. How are'), {
  complete: ['Hello there.'],
  rest: ' How are',
});
assert.deepStrictEqual(splitCompleteSentences('One. Two! Three?'), {
  complete: ['One.', ' Two!', ' Three?'],
  rest: '',
});
assert.deepStrictEqual(splitCompleteSentences('No boundary yet'), {
  complete: [],
  rest: 'No boundary yet',
});
assert.deepStrictEqual(splitCompleteSentences('Она сказала: «Привет!» И ушла'), {
  complete: ['Она сказала: «Привет!»'],
  rest: ' И ушла',
});
assert.deepStrictEqual(splitCompleteSentences('Wait… okay.'), {
  complete: ['Wait…', ' okay.'],
  rest: '',
});
// Reassembling segments must reproduce the input exactly.
{
  const input = 'A b c. D e! F g? tail';
  const { complete, rest } = splitCompleteSentences(input);
  assert.strictEqual(complete.join('') + rest, input);
}

console.log('voiceTurn: all assertions pass');
