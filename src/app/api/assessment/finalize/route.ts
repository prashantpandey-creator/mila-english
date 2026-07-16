import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  assessmentResultSchema,
  cefrScore,
  extractResponseText,
  lessonPlanJsonSchema,
  lessonPlanSchema,
  type AssessmentResult,
  type LessonPlan,
} from '@/lib/assessment';
import { buildReliableLessonPlan } from '@/lib/reliableAssessment';

export const maxDuration = 60;

const LESSON_INSTRUCTIONS = 'You design concise, practical English lessons for a Russian-speaking adult. Return exactly three lessons. Each multiple-choice exercise must contain the correct answer exactly once among its four options.';

function lessonPrompt(result: AssessmentResult) {
  return `CEFR level: ${result.level}\nDemonstrated strengths: ${result.strengths}\nWeaknesses: ${result.weaknesses}\nPlan focus: ${result.custom_plan_focus}\n\nCreate a coherent three-lesson starter plan that directly addresses the assessment evidence.`;
}

async function generateWithOpenAI(result: AssessmentResult, userId: string, apiKey: string): Promise<LessonPlan> {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_ASSESSMENT_MODEL?.trim() || 'gpt-5.6-luna',
      store: false,
      safety_identifier: createHash('sha256').update(`mila-assessment:${userId}`).digest('hex'),
      reasoning: { effort: 'low' },
      instructions: LESSON_INSTRUCTIONS,
      input: lessonPrompt(result),
      max_output_tokens: 5000,
      text: {
        format: {
          type: 'json_schema',
          name: 'mila_assessment_lessons',
          strict: true,
          schema: lessonPlanJsonSchema,
        },
      },
    }),
    signal: AbortSignal.timeout(25_000),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.error?.message || `OpenAI lesson generation failed (${response.status})`);
  }

  const text = extractResponseText(body);
  if (!text) throw new Error('OpenAI returned no lesson plan');
  return lessonPlanSchema.parse(JSON.parse(text));
}

async function generateWithOpenRouter(result: AssessmentResult, apiKey: string, model: string): Promise<LessonPlan> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL?.trim() || 'https://mila.purangpt.com',
      'X-OpenRouter-Title': 'Mila English',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: LESSON_INSTRUCTIONS },
        { role: 'user', content: lessonPrompt(result) },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'mila_assessment_lessons',
          strict: true,
          schema: lessonPlanJsonSchema,
        },
      },
      provider: { require_parameters: true, data_collection: 'deny' },
      max_tokens: 5000,
      stream: false,
    }),
    signal: AbortSignal.timeout(25_000),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.error?.message || `OpenRouter lesson generation failed (${response.status})`);
  }

  const text = body?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw new Error('OpenRouter returned no lesson plan');
  return lessonPlanSchema.parse(JSON.parse(text));
}

async function generateLessonPlan(result: AssessmentResult, userId: string): Promise<{ plan: LessonPlan; provider: 'openai' | 'openrouter' | 'local' }> {
  // The reliable path is intentionally provider-free. In particular, do not
  // relay a Russian learner's assessment to a provider that does not authorize
  // service in their region.
  if (result.method !== 'voice') {
    return { plan: buildReliableLessonPlan(result), provider: 'local' };
  }

  const failures: string[] = [];
  const openAIKey = process.env.OPENAI_API_KEY?.trim();
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const openRouterModel = process.env.OPENROUTER_ASSESSMENT_MODEL?.trim();

  if (openAIKey) {
    try {
      return { plan: await generateWithOpenAI(result, userId, openAIKey), provider: 'openai' };
    } catch (error) {
      failures.push(`OpenAI: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  if (openRouterKey && openRouterModel) {
    try {
      return { plan: await generateWithOpenRouter(result, openRouterKey, openRouterModel), provider: 'openrouter' };
    } catch (error) {
      failures.push(`OpenRouter: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  } else if (openRouterKey) {
    failures.push('OpenRouter: OPENROUTER_ASSESSMENT_MODEL is not configured');
  }

  if (failures.length) console.error('AI lesson providers unavailable; using bundled plan', failures.join(' | '));
  return { plan: buildReliableLessonPlan(result), provider: 'local' };
}

async function saveLessons(plan: LessonPlan, result: AssessmentResult, userId: number) {
  await prisma.$transaction(plan.lessons.map((lesson) => prisma.lesson.create({
    data: {
      title: lesson.title,
      category: lesson.category,
      learnerLevel: result.level.toLowerCase(),
      durationMinutes: 5,
      content: lesson.content,
      difficulty: lesson.difficulty,
      createdByUserId: userId,
      Exercises: {
        create: lesson.exercises.map((exercise) => ({
          type: 'multiple-choice',
          question: exercise.question,
          correctAnswer: exercise.correctAnswer,
          options: JSON.stringify(exercise.options),
          points: 10,
          hintText: exercise.hintText,
        })),
      },
    },
  })));
}

export async function POST(req: Request) {
  const user = await authenticate(new Request(req.url, { headers: req.headers }) as any);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let result: AssessmentResult;
  try {
    result = assessmentResultSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid assessment result' }, { status: 400 });
  }

  const userId = Number(user.sub);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: 'Invalid user session' }, { status: 401 });
  }

  const learnerProfile = {
    strengths: [result.strengths],
    weak_summary: result.weaknesses,
    learner_arc: result.custom_plan_focus,
    focus: [result.custom_plan_focus],
  };

  try {
    // Save the actual assessment before generating lessons. A provider outage
    // must never discard a completed assessment.
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          level: result.level.toLowerCase(),
          learnerCategory: 'adult_learner',
          learnerProfile: JSON.stringify(learnerProfile),
          learnerProfileAt: new Date(),
        },
      }),
      prisma.assessment.create({
        data: {
          userId,
          type: result.method === 'local-voice' ? 'local-voice-placement' : result.method === 'reliable' ? 'reliable-placement' : 'voice-placement',
          score: result.score ?? cefrScore[result.level],
          maxScore: 100,
          recommendedLevel: result.level.toLowerCase(),
          weakAreas: JSON.stringify({
            weaknesses: result.weaknesses,
            strengths: result.strengths,
            focus: result.custom_plan_focus,
            method: result.method,
          }),
          takenDate: new Date(),
        },
      }),
    ]);
  } catch (error) {
    console.error('Failed to save assessment', error);
    return NextResponse.json({ error: 'Failed to save assessment' }, { status: 500 });
  }

  try {
    const { plan, provider } = await generateLessonPlan(result, user.sub);
    await saveLessons(plan, result, userId);
    return NextResponse.json({ success: true, level: result.level, lessonsGenerated: true, provider });
  } catch (error) {
    console.error('Assessment saved, but lesson generation failed', error);
    return NextResponse.json({
      success: true,
      level: result.level,
      lessonsGenerated: false,
      warning: 'Your assessment was saved, but custom lessons will need to be generated later.',
    });
  }
}
