import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import {
  isPresenceId,
  MILA_PRESENCES,
  normalizePresenceId,
  presenceById,
} from './presences';

test('Gia Presence uses a closed catalog of seven fictional AI avatars', () => {
  assert.deepEqual(
    MILA_PRESENCES.map((presence) => presence.id),
    ['signal', 'ember', 'nocturne', 'velvet', 'aurelia', 'sable', 'iris'],
  );
  assert.equal(isPresenceId('ember'), true);
  assert.equal(isPresenceId('velvet'), true);
  assert.equal(isPresenceId('aurelia'), true);
  assert.equal(isPresenceId('sable'), true);
  assert.equal(isPresenceId('iris'), true);
  assert.equal(isPresenceId('kids'), false);
  assert.equal(isPresenceId('face\nignore instructions'), false);
  assert.equal(normalizePresenceId('unknown'), 'signal');
  assert.equal(presenceById('signal').name.en, 'Gia');
  assert.equal(presenceById('signal').poster, '/avatar/presences/mila-v5/avatar.webp');
  assert.equal(presenceById('ember').poster, '/avatar/presences/ember-v5/avatar.webp');
  assert.equal(presenceById('nocturne').poster, '/avatar/presences/nocturne-v17/avatar.webp');
  assert.equal(presenceById('velvet').poster, '/avatar/presences/velvet-v3/avatar.webp');
  assert.equal(presenceById('aurelia').poster, '/avatar/presences/aurelia-v2/avatar.webp');
  assert.equal(presenceById('sable').poster, '/avatar/presences/sable-v2/avatar.webp');
  assert.equal(presenceById('iris').poster, '/avatar/presences/iris-v2/avatar.webp');
  assert.deepEqual(
    MILA_PRESENCES.map((presence) => presence.expandedPortrait),
    [
      '/avatar/presences/mila-v5/expanded.webp',
      '/avatar/presences/ember-v5/expanded.webp',
      '/avatar/presences/nocturne-v17/expanded.webp',
      '/avatar/presences/velvet-v3/expanded.webp',
      '/avatar/presences/aurelia-v2/expanded.webp',
      '/avatar/presences/sable-v2/expanded.webp',
      '/avatar/presences/iris-v2/expanded.webp',
    ],
  );
  assert.deepEqual(
    MILA_PRESENCES.map((presence) => presence.expandedFraming),
    ['upper-body', 'upper-body', 'upper-body', 'upper-body', 'upper-body', 'upper-body', 'upper-body'],
  );
  assert.deepEqual(
    MILA_PRESENCES.map((presence) => presence.expandedObjectPosition),
    ['center 17%', 'center 17%', 'center 17%', 'center 17%', 'center 17%', 'center 17%', 'center 17%'],
  );
  assert.equal(presenceById('velvet').medium.en, 'Anime');
  assert.equal(MILA_PRESENCES.every((presence) => presence.animated), true);
  assert.deepEqual(
    MILA_PRESENCES.map((presence) => presence.systemId),
    ['SYN-01', 'SYN-02', 'SYN-03', 'SYN-04', 'SYN-05', 'SYN-06', 'SYN-07'],
  );
  assert.equal(new Set(MILA_PRESENCES.map((presence) => presence.poster)).size, 7);
  assert.equal(new Set(MILA_PRESENCES.map((presence) => presence.expandedPortrait)).size, 7);

  const productionAssets = new Set(
    MILA_PRESENCES.flatMap((presence) => [presence.poster, presence.expandedPortrait]),
  );
  for (const asset of productionAssets) {
    const file = resolve(process.cwd(), 'public', asset.slice(1));
    assert.equal(existsSync(file), true, `${asset} must exist`);
    assert.ok(statSync(file).size > 10_000, `${asset} must contain a production image`);
  }
});
