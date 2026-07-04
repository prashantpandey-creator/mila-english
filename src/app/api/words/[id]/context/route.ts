import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const wordId = parseInt(params.id)

  const word = await prisma.word.findUnique({
    where: { id: wordId }
  })
  
  const userProfile = await prisma.user.findUnique({
    where: { id: parseInt(user.sub) }
  })

  if (!word || !userProfile) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are an English teacher generating a memorable example sentence for a Russian-speaking student.',
      prompt: `Generate an interesting, memorable example sentence using the English word "${word.english}" (meaning: ${word.translationNative}). The student's name is ${userProfile.name} and they are at a ${userProfile.level} level. Make it relatable.`,
      schema: z.object({
        englishSentence: z.string().describe('The example sentence in English using the target word'),
        russianTranslation: z.string().describe('The Russian translation of the sentence'),
        explanation: z.string().describe('Brief explanation of how the word is used in this context (in Russian)')
      })
    })

    return NextResponse.json(object)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to generate context' }, { status: 500 })
  }
}
