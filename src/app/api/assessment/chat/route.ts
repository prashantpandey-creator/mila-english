import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { z } from 'zod';

export const maxDuration = 60;

export async function POST(req: Request) {
  const authReq = new Request(req.url, { headers: req.headers }) as any;
  const user = await authenticate(authReq);
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages } = await req.json();

  const result = await streamText({
    model: openai('gpt-4o'), // Use gpt-4o for better tool calling and assessment accuracy
    messages,
    system: `You are Mila, an expert English examiner. Your goal is to assess the user's English level (A1, A2, B1, B2, or C1) through a friendly text chat.
    
    Instructions:
    1. Start by warmly greeting the user and asking them a simple question about their day or why they are learning English.
    2. Ask 2-3 follow-up questions, gently increasing the complexity (e.g., asking about a past experience to check past tense, or a hypothetical situation to check conditionals).
    3. Keep your questions relatively short. DO NOT correct their grammar during this assessment phase.
    4. Once you have enough information to confidently assign a level (usually after 3-5 user messages), you MUST call the \`finalize_assessment\` tool.
    5. Be encouraging and friendly!`,
    tools: {
      finalize_assessment: tool({
        description: 'Call this tool when you have assessed the user and are ready to finalize their English level and generate their custom plan.',
        parameters: z.object({
          level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']).describe('The assessed CEFR level'),
          weaknesses: z.string().describe('A short 1-2 sentence summary of their main grammar/vocabulary weaknesses'),
          strengths: z.string().describe('A short summary of what they do well'),
          custom_plan_focus: z.string().describe('A suggested focus area for their custom learning plan (e.g. "Past perfect and travel vocabulary")')
        }),
        execute: async (args) => {
          // In the stream response, we just acknowledge to the LLM that the assessment is finalized.
          // The frontend will intercept this tool call and redirect or hit the finalize endpoint itself.
          return {
            success: true,
            message: `Assessment complete. Level assigned: ${args.level}. Tell the user the assessment is done and we are building their custom plan!`,
            assessmentData: args
          };
        }
      })
    }
  });

  return result.toDataStreamResponse();
}
