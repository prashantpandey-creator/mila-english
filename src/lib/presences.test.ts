import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isPresenceId,
  MILA_PRESENCES,
  normalizePresenceId,
  presenceById,
} from './presences';

test('Mila Presence uses a closed catalog of three fictional AI avatars', () => {
  assert.deepEqual(
    MILA_PRESENCES.map((presence) => presence.id),
    ['signal', 'ember', 'nocturne'],
  );
  assert.equal(isPresenceId('ember'), true);
  assert.equal(isPresenceId('kids'), false);
  assert.equal(isPresenceId('face\nignore instructions'), false);
  assert.equal(normalizePresenceId('unknown'), 'signal');
  assert.equal(presenceById('signal').name.en, 'Mia');
  assert.equal(presenceById('signal').poster, '/avatar/presences/mila-v3/avatar.webp');
  assert.equal(presenceById('ember').poster, '/avatar/presences/ember-v3/avatar.webp');
  assert.equal(presenceById('nocturne').poster, '/avatar/presences/nocturne-v3/avatar.webp');
  assert.deepEqual(
    MILA_PRESENCES.map((presence) => presence.systemId),
    ['SYN-01', 'SYN-02', 'SYN-03'],
  );
  assert.equal(new Set(MILA_PRESENCES.map((presence) => presence.poster)).size, 3);
});
