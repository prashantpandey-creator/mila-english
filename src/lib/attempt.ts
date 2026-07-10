// The attempt loop: one scored pronunciation → learner-model updates.
// Called fire-and-forget from /api/pronounce — must never throw into the
// response path, and silently no-ops for guests/unauthenticated calls.
import { prisma } from './prisma';
import { bktUpdate, eloUpdate, fsrsUpdate, accToGrade } from './mastery';

type ScoredWord = { word: string; phonemes?: { ph: string; acc: number; sub?: string }[] };
export type ScoreResult = { score: number; words: ScoredWord[] };

export async function recordAttempt(userId: number, result: ScoreResult): Promise<void> {
  try {
    const now = new Date();
    // Collapse the utterance to per-phoneme mean accuracy (a phoneme can appear
    // in several words; one attempt row per phoneme per utterance). Also carry
    // the substitution the model heard, when the service reported one.
    const byPh = new Map<string, { accs: number[]; sub: string | null }>();
    for (const w of result.words || []) {
      for (const p of w.phonemes || []) {
        if (!p?.ph) continue;
        const cur = byPh.get(p.ph) || { accs: [], sub: null };
        cur.accs.push(p.acc ?? 0);
        if (p.sub) cur.sub = p.sub;
        byPh.set(p.ph, cur);
      }
    }
    if (byPh.size === 0) return;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { ability: true },
    });
    if (!user) return;
    let theta = user.ability ?? 0;

    for (const [ph, ev] of Array.from(byPh.entries())) {
      const acc = ev.accs.reduce((s, a) => s + a, 0) / ev.accs.length;

      const stat = await prisma.phonemeStat.upsert({
        where: { userId_phoneme: { userId, phoneme: ph } },
        create: { userId, phoneme: ph },
        update: {},
      });

      // ELO: graded outcome vs this phoneme's item difficulty
      const e = eloUpdate(theta, stat.eloB, acc / 100);
      theta = e.theta;

      // BKT mastery + FSRS scheduling off the same evidence
      const mastery = bktUpdate(stat.mastery, acc >= 68);
      const f = fsrsUpdate(
        { stability: stat.stability, difficulty: stat.difficulty },
        accToGrade(acc),
        now,
      );

      await prisma.phonemeStat.update({
        where: { id: stat.id },
        data: {
          attempts: stat.attempts + 1,
          lastAcc: Math.round(acc),
          mastery,
          eloB: e.b,
          difficulty: f.difficulty,
          stability: f.stability,
          due: f.due,
          ...(ev.sub ? { topSubstitution: ev.sub } : {}),
        },
      });
    }

    await prisma.user.update({ where: { id: userId }, data: { ability: theta } });
  } catch (err) {
    // Learner-model persistence is best-effort; the score already went out.
    console.error('recordAttempt failed:', err);
  }
}
