import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const authReq = new Request(req.url, { headers: req.headers }) as any;
    const user = await authenticate(authReq);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { level, weaknesses, strengths, custom_plan_focus } = await req.json();

    // 1. Update the user profile with the new level and learner profile
    const learnerProfileData = JSON.stringify({
      strengths: [strengths],
      weak_summary: weaknesses,
      learner_arc: custom_plan_focus,
      focus: []
    });

    await prisma.user.update({
      where: { id: Number(user.sub) },
      data: {
        level: level.toLowerCase(),
        learnerCategory: 'adult_learner', // Default to adult learner now that pending is gone
        learnerProfile: learnerProfileData,
        learnerProfileAt: new Date()
      }
    });

    // 2. Generate 3 custom lessons tailored to this plan
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are an expert language curriculum designer. Generate 3 short, highly engaging English lessons for a Russian speaker based on their assessment profile.',
      prompt: `User Level: ${level}\nWeaknesses: ${weaknesses}\nSuggested Focus: ${custom_plan_focus}\n\nGenerate exactly 3 lessons that target these weaknesses and align with the suggested focus.`,
      schema: z.object({
        lessons: z.array(z.object({
          title: z.string().describe('The title of the lesson'),
          category: z.enum(['Speaking', 'Vocabulary', 'Grammar', 'Phonetics']),
          content: z.string().describe('The main text or dialogue for the lesson'),
          difficulty: z.number().min(1).max(5),
          exercises: z.array(z.object({
            question: z.string(),
            correctAnswer: z.string(),
            options: z.array(z.string()).length(4),
            hintText: z.string().optional()
          })).min(2).max(3)
        })).length(3)
      })
    });

    // 3. Save the custom lessons to the database
    for (const l of object.lessons) {
      await prisma.lesson.create({
        data: {
          title: l.title,
          category: l.category,
          learnerLevel: level.toLowerCase(),
          durationMinutes: 5,
          content: l.content,
          difficulty: l.difficulty,
          Exercises: {
            create: l.exercises.map((ex: any) => ({
              type: 'multiple-choice',
              question: ex.question,
              correctAnswer: ex.correctAnswer,
              options: JSON.stringify(ex.options),
              points: 10,
              hintText: ex.hintText || ''
            }))
          }
        }
      });
    }

    return NextResponse.json({ success: true, level });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to finalize assessment' }, { status: 500 });
  }
}
