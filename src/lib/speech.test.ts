// Runnable proof of the weak-sound recap's core decision. Run: npx tsx src/lib/speech.test.ts
import assert from 'node:assert';
import { missedSound } from './speech';

// carrier word missed → tally the drilled sound
assert.strictEqual(missedSound({ hard: 'passport', sound: 'æ' }, { words: [{ word: 'passport', verdict: 'miss' }] }), 'æ');
// carrier word close (not clean) → still tally
assert.strictEqual(missedSound({ hard: 'think', sound: 'θ' }, { words: [{ word: 'think', verdict: 'close' }] }), 'θ');
// carrier word nailed → no tally
assert.strictEqual(missedSound({ hard: 'well', sound: 'w' }, { words: [{ word: 'well', verdict: 'good' }] }), null);
// carrier word not in the heard set → no tally
assert.strictEqual(missedSound({ hard: 'gate', sound: 'ɡ' }, { words: [{ word: 'other', verdict: 'miss' }] }), null);
// empty / errored result → no tally (a mic hearing nothing is not a mispronunciation)
assert.strictEqual(missedSound({ hard: 'x', sound: 'y' }, {}), null);
// case + punctuation on the carrier word are normalised
assert.strictEqual(missedSound({ hard: 'Can', sound: 'æ' }, { words: [{ word: 'can', verdict: 'miss' }] }), 'æ');

console.log('missedSound: 6/6 pass');
