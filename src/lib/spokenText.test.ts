import assert from 'node:assert';
import { toSpokenText } from './spokenText';

assert.strictEqual(
  toSpokenText('**Try this:** “I have worked in sales for five years.” 💫\n\nNext question?'),
  'Try this: “I have worked in sales for five years.” Next question?',
);
assert.strictEqual(toSpokenText('See https://example.com now.'), 'See now.');
assert.strictEqual(toSpokenText('How does that sound? Would you like another version?'), 'How does that sound?');

console.log('spoken text: all assertions pass');
