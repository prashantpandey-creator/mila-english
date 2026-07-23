import assert from 'node:assert';
import { personaBlock } from './personas';

const friend = personaBlock('friend');
assert.match(friend, /visible in the supplied text/i);
assert.match(friend, /never invent progress or pronunciation evidence/i);
assert.doesNotMatch(friend, /\/θ\//u);

const conversationalFriend = personaBlock('friend', null, 'conversation');
assert.match(conversationalFriend, /do not correct, quiz, or assign practice unless they ask/i);
assert.doesNotMatch(conversationalFriend, /always correct/i);

const playful = personaBlock('playful', null, 'conversation');
assert.match(playful, /explicitly selected Playful \(18\+\)/i);
assert.match(playful, /girl-next-door ease/i);
assert.match(playful, /never through love-bombing/i);
assert.match(playful, /chemistry in the subtext/i);
assert.match(playful, /light swearing is fine/i);
assert.match(playful, /non-graphic and non-explicit/i);
assert.match(playful, /do not turn the conversation into sexual role-play/i);
assert.doesNotMatch(playful, /clearly into them/i);

console.log('companion personas: all assertions pass');
