// Personal drill generator — the learner model made actionable.
// Reads the user's weakest phonemes (lowest BKT mastery, attempted, due or never
// scheduled), asks the LLM for minimal-pair drills targeting exactly those sounds,
// and returns phrases ready for the Listen loop. Falls back to a static bank if
// the LLM is unavailable, so the endpoint always serves something usable.
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

// General English minimal-pair fallbacks. Personal targets come from the
// learner's measured phoneme history, not a presumed native-language accent.
const STATIC_DRILLS: Record<string, { text: string; contrast: string }[]> = {
  'θ': [{ text: 'I think this thing is thin.', contrast: 'think–sink' },
        { text: 'Both paths go through the theatre.', contrast: 'path–pass' }],
  'ð': [{ text: 'They gather together with their mother.', contrast: 'they–day' },
        { text: 'The weather is better than the other day.', contrast: 'though–dough' }],
  'w': [{ text: 'We were wondering where the water went.', contrast: 'west–vest' },
        { text: 'The wind will wake the whole world.', contrast: 'wine–vine' }],
  'r': [{ text: 'The river runs around the rocky road.', contrast: 'right–light' }],
  'æ': [{ text: 'The black cat sat on a flat mat.', contrast: 'cat–cut' }],
  'ɪ': [{ text: 'This little ship brings six big fish.', contrast: 'ship–sheep' }],
  'h': [{ text: 'He has a happy heart at home.', contrast: 'heart–art' }],
  'ŋ': [{ text: 'The king is singing a long song.', contrast: 'sing–sin' }],
};

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = Number(user.sub);

  // Weakest first: attempted, lowest mastery. (due filtering can come later —
  // for drills we always want the weakest sounds regardless of schedule.)
  const [weak, profile] = await Promise.all([
    prisma.phonemeStat.findMany({
      where: { userId, attempts: { gt: 0 } },
      orderBy: { mastery: 'asc' },
      take: 3,
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { nativeLanguage: true } }),
  ]);

  if (weak.length === 0) {
    return NextResponse.json({ drills: [], reason: 'no-data' });
  }

  const targets = weak.map(w => ({
    phoneme: w.phoneme,
    mastery: Math.round(w.mastery * 100) / 100,
    substitution: w.topSubstitution || null,
  }));

  // Try the LLM for personalized drills; fall back to the static bank.
  try {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system:
        'You are an English pronunciation coach. Base every drill on the measured target phonemes supplied, not on stereotypes about a native language. ' +
        'Generate short minimal-pair drill sentences (6-10 words) that are dense in the target phoneme. ' +
        'Natural, everyday English. If a substitution is given (what the learner says instead), ' +
        'pick words that contrast the target sound against that substitution.',
      prompt:
        `Learner native language (context only): ${JSON.stringify(profile?.nativeLanguage || 'not set')}\n` +
        `Target phonemes (IPA, weakest first): ${JSON.stringify(targets)}\n` +
        'Generate exactly 2 drill sentences per phoneme.',
      schema: z.object({
        drills: z.array(z.object({
          phoneme: z.string().describe('the IPA target, echoed back'),
          text: z.string().describe('the drill sentence'),
          contrast: z.string().describe('minimal pair like "think–sink"'),
          tip: z.string().describe('one short articulation tip'),
        })),
      }),
    });
    if (object.drills?.length) {
      return NextResponse.json({ drills: object.drills, targets, source: 'ai' });
    }
  } catch { /* fall through to static */ }

  const drills = weak.flatMap(w =>
    (STATIC_DRILLS[w.phoneme] || []).map(d => ({
      phoneme: w.phoneme, text: d.text, contrast: d.contrast,
      tip: '',
    })),
  );
  return NextResponse.json({ drills, targets, source: 'static' });
}
