import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();

    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are an expert language curriculum designer. Generate a short, highly engaging English lesson for a Russian speaker on the requested topic. Ensure the content is accurate and encouraging.',
      prompt: `Generate an English lesson about: ${topic}`,
      schema: z.object({
        title: z.string().describe('The title of the lesson'),
        category: z.string().describe('e.g., speaking, grammar, vocabulary'),
        content: z.string().describe('The main text of the lesson'),
        difficulty: z.number().min(1).max(5),
        exercises: z.array(z.object({
          question: z.string(),
          correctAnswer: z.string(),
          options: z.array(z.string()).describe('Provide 3 or 4 multiple choice options'),
          hintText: z.string().optional()
        }))
      })
    });

    const lesson = await prisma.lesson.create({
      data: {
        title: object.title,
        category: object.category,
        learnerLevel: 'intermediate',
        durationMinutes: 5,
        content: object.content,
        difficulty: object.difficulty,
        Exercises: {
          create: object.exercises.map((ex: any) => ({
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

    return NextResponse.json({ success: true, lessonId: lesson.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate lesson' }, { status: 500 });
  }
}
