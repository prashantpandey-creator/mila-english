export type VoicePreviewReservation = {
  userId: number;
  usedAt: Date;
};

type VoicePreviewStore = {
  updateMany(args: {
    where: { id: number; voicePreviewUsedAt: Date | null };
    data: { voicePreviewUsedAt: Date | null };
  }): Promise<{ count: number }>;
};

export async function reserveVoicePreview(
  store: VoicePreviewStore,
  userId: number,
  usedAt = new Date(),
): Promise<VoicePreviewReservation | null> {
  if (!Number.isSafeInteger(userId) || userId <= 0) return null;

  const reserved = await store.updateMany({
    where: { id: userId, voicePreviewUsedAt: null },
    data: { voicePreviewUsedAt: usedAt },
  });

  return reserved.count === 1 ? { userId, usedAt } : null;
}

export async function releaseVoicePreview(
  store: VoicePreviewStore,
  reservation: VoicePreviewReservation,
): Promise<boolean> {
  const released = await store.updateMany({
    where: {
      id: reservation.userId,
      voicePreviewUsedAt: reservation.usedAt,
    },
    data: { voicePreviewUsedAt: null },
  });
  return released.count === 1;
}
