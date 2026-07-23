import assert from 'node:assert/strict';
import test from 'node:test';
import {
  releaseVoicePreview,
  reserveVoicePreview,
  type VoicePreviewReservation,
} from './realtimePreview';

test('a live preview is atomically consumed once and can be released after provider failure', async () => {
  let stored: Date | null = null;
  const store = {
    async updateMany(args: {
      where: { id: number; voicePreviewUsedAt: Date | null };
      data: { voicePreviewUsedAt: Date | null };
    }) {
      const expected = args.where.voicePreviewUsedAt;
      const matches = expected === null
        ? stored === null
        : stored?.getTime() === expected.getTime();
      if (!matches || args.where.id !== 42) return { count: 0 };
      stored = args.data.voicePreviewUsedAt;
      return { count: 1 };
    },
  };

  const firstAt = new Date('2026-07-23T00:00:00.000Z');
  const secondAt = new Date('2026-07-23T00:00:01.000Z');
  const [first, second] = await Promise.all([
    reserveVoicePreview(store, 42, firstAt),
    reserveVoicePreview(store, 42, secondAt),
  ]);

  const reservation = (first ?? second) as VoicePreviewReservation | null;
  assert.ok(reservation);
  assert.equal(Number(first !== null) + Number(second !== null), 1);
  assert.equal(await reserveVoicePreview(store, 42), null);
  assert.equal(await releaseVoicePreview(store, reservation), true);
  assert.ok(await reserveVoicePreview(store, 42));
  assert.equal(await reserveVoicePreview(store, 0), null);
});
