import assert from 'node:assert';
import { personaBlock } from './personas';

const friend = personaBlock('friend');
assert.match(friend, /visible in the supplied text/i);
assert.match(friend, /never invent progress or pronunciation evidence/i);
assert.doesNotMatch(friend, /\/θ\//u);

const conversationalFriend = personaBlock('friend', null, 'conversation');
assert.match(conversationalFriend, /do not correct, quiz, or assign practice unless they ask/i);
assert.doesNotMatch(conversationalFriend, /always correct/i);

console.log('companion personas: all assertions pass');
