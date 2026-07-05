// The learner-profile synthesizer — TypeScript port of PuranGPT's
// generate_keepsake_profile pattern (backend/session_manager.py:336). The Python
// code (psycopg2 + Postgres JSONB over chat_sessions) doesn't port; the SHAPE does:
//   gather the person's history → LLM synthesizes a structured profile
//   → persist as JSON, recompute on demand, fall back to empty gracefully.
// Improvement over the original: OpenAI Structured Outputs (generateObject) instead
// of parse-JSON-from-text — the model can't emit a shape we can't read.
import { prisma } from '@/lib/prisma';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export type LearnerProfile = {
  strengths: string[];
  weak_summary: string;
  learner_arc: string;
  focus: string[];
};

const EMPTY: LearnerProfile = { strengths: [], weak_summary: '', learner_arc: '', focus: [] };

const SCHEMA = z.object({
  strengths: z.array(z.string()).describe('up to 4 sounds/skills the learner has clearly nailed'),
  weak_summary: z.string().describe('ONE sentence naming the sounds they keep missing and the pattern (e.g. th and w)'),
  learner_arc: z.string().describe('ONE sentence on how they have progressed over time, or "" if too little history'),
  focus: z.array(z.string()).describe('up to 3 concrete next focuses for them'),
});

// Synthesize + persist the profile for a learner. Reads the quantified per-phoneme
// state (the math layer) plus a little session history. Returns EMPTY (and writes
// nothing) when there's not enough signal yet — same contract as the keepsake code.
export async function generateLearnerProfile(userId: number): Promise<LearnerProfile> {
  const [stats, sessions, user] = await Promise.all([
    prisma.phonemeStat.findMany({ where: { userId }, orderBy: { mastery: 'asc' } }),
    prisma.studySession.findMany({ where: { userId }, orderBy: { startTime: 'desc' }, take: 10 }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  if (stats.length === 0 && sessions.length === 0) return EMPTY;

  const weak = stats.filter((s) => s.mastery < 0.7)
    .map((s) => `${s.phoneme} (mastery ${Math.round(s.mastery * 100)}%${s.topSubstitution ? `, says "${s.topSubstitution}" instead` : ''})`);
  const strong = stats.filter((s) => s.mastery >= 0.85).map((s) => s.phoneme);

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: SCHEMA,
      system: 'You profile an English learner who is a Russian speaker, from their pronunciation data. Be clinical and precise. Do not fabricate progress the data does not support.',
      prompt:
        `Level: ${user?.level ?? 'unknown'}. Goal: ${user?.goal ?? 'unstated'}. Sessions logged: ${sessions.length}.\n` +
        `Weak sounds: ${weak.length ? weak.join('; ') : 'none recorded yet'}.\n` +
        `Strong sounds: ${strong.length ? strong.join(', ') : 'none recorded yet'}.`,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { learnerProfile: JSON.stringify(object), learnerProfileAt: new Date() },
    });
    return object;
  } catch {
    return EMPTY;
  }
}

// Cheap read of the last-synthesized profile without re-calling the LLM.
export async function readLearnerProfile(userId: number): Promise<LearnerProfile | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { learnerProfile: true } });
  if (!user?.learnerProfile) return null;
  try { return JSON.parse(user.learnerProfile) as LearnerProfile; } catch { return null; }
}
