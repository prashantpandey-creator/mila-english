import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

export const maxDuration = 30;

export async function POST(req: Request) {
  // SECURITY FIX: Gate unauthenticated LLM endpoints (Ported from PuranGPT Issue #8)
  const authReq = new Request(req.url, { headers: req.headers }) as any;
  const user = await authenticate(authReq);
  
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized. You must be logged in to chat." }, 
      { status: 401 }
    );
  }

  const { messages } = await req.json();

  const result = await streamText({
    model: openai('gpt-4o-mini'),
    messages,
    system: "You are a helpful English language tutor. You are conversing with a beginner to intermediate student. Keep your answers relatively short, conversational, and encouraging. If the user makes a grammar mistake, gently correct them while continuing the conversation. If they speak in Russian, respond in English but you may add a brief Russian translation or explanation if it helps.",
  });

  return result.toDataStreamResponse();
}
