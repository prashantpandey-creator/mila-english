import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isPresenceId,
  MILA_PRESENCES,
  normalizePresenceId,
  presenceById,
} from './presences';

test('Mila Presence uses a closed, fictional visual catalog', () => {
  assert.deepEqual(
    MILA_PRESENCES.map((presence) => presence.id),
    ['signal', 'ember', 'nocturne'],
  );
  assert.equal(isPresenceId('ember'), true);
  assert.equal(isPresenceId('kids'), false);
  assert.equal(isPresenceId('face\nignore instructions'), false);
  assert.equal(normalizePresenceId('unknown'), 'signal');
  assert.equal(presenceById('nocturne').poster, '/avatar/presences/nocturne-v1/poster.jpg');
  assert.equal(presenceById('signal').poster, null);
});
