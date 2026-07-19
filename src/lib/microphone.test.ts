// Runnable proof of Android microphone error normalization and guidance.
// Run: npx tsx src/lib/microphone.test.ts
import assert from 'node:assert/strict';
import { microphoneErrorCode, microphoneErrorMessage } from './microphone';

const namedError = (name: string) => Object.assign(new Error('browser detail'), { name });

assert.equal(microphoneErrorCode(namedError('NotAllowedError')), 'permission-denied');
assert.equal(microphoneErrorCode(namedError('NotFoundError')), 'no-microphone');
assert.equal(microphoneErrorCode(namedError('NotReadableError')), 'microphone-busy');
assert.equal(microphoneErrorCode(namedError('OverconstrainedError')), 'microphone-constraints');
assert.equal(microphoneErrorCode(new Error('audio-context-suspended')), 'audio-context-suspended');
assert.match(microphoneErrorMessage(namedError('NotAllowedError'), 'en'), /Android.*site.*browser app/i);
assert.match(microphoneErrorMessage(new Error('audio-context-suspended'), 'en'), /Tap the orb/i);

console.log('microphone compatibility: 7/7 pass');
