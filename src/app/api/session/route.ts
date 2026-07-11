import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// The spoken examiner. This is a SPEAKING app — the level test must hear the
// learner talk, not read what they type. In assessment mode the realtime voice
// model runs a short conversational interview, then calls finalize_assessment by
// voice; the browser catches that tool call and POSTs it to /api/assessment/finalize.
const EXAMINER = `You are Mila, a warm but sharp English examiner speaking with a Russian speaker.
Your job: assess their spoken English level (CEFR A1-C1) through a short, natural VOICE conversation.

Rules:
1. Greet them warmly, then ask them to tell you a little about themselves - out loud, in English.
2. Ask 3-5 follow-up questions, gently raising difficulty: a past experience (checks past tense), a hypothetical ("what would you do if..."), an opinion (checks fluency + connectors).
3. Listen to HOW they speak - fluency, grammar, vocabulary range, pronunciation confidence - not just what they say. Do NOT correct them during the test; keep them talking.
4. Keep your own turns short and encouraging so they do most of the speaking.
5. Once you can confidently place their level (usually after 4-5 of their answers), call the finalize_assessment function with your judgement, then tell them warmly that the assessment is done and their plan is being built.
Speak naturally and at a calm pace. You may use an occasional Russian word for warmth.`;

const TUTOR = "You are a warm, highly empathetic, and encouraging English language tutor for a Russian speaker. You are providing a 'Darshan' (a personal, guided experience). Keep responses brief, conversational, and deeply personal. Correct grammar gently, and feel free to use occasional Russian words if it helps clarify a deep concept. Start by warmly greeting the user.";

const ASSESSMENT_TOOLS = [{
  type: "function",
  name: "finalize_assessment",
  description: "Call when you have heard enough to place the learner's English level and build their plan.",
  parameters: {
    type: "object",
    properties: {
      level: { type: "string", enum: ["A1", "A2", "B1", "B2", "C1"], description: "The assessed CEFR level" },
      weaknesses: { type: "string", description: "1-2 sentence summary of their main grammar/vocabulary/pronunciation weaknesses" },
      strengths: { type: "string", description: "Short summary of what they do well" },
      custom_plan_focus: { type: "string", description: 'Suggested focus for their plan, e.g. "Past perfect and travel vocabulary"' },
    },
    required: ["level", "weaknesses", "strengths", "custom_plan_focus"],
  },
}];

export async function GET(req: Request) {
  try {
    // SECURITY FIX: Gate unauthenticated LLM endpoints (Ported from PuranGPT Issue #8)
    const authReq = new Request(req.url, { headers: req.headers }) as any;
    const user = await authenticate(authReq);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. You must be logged in to access this." },
        { status: 401 }
      );
    }

    const isAssessment = new URL(req.url).searchParams.get('mode') === 'assessment';

    // OpenAI Realtime API (2025 shape): model = "gpt-realtime", and `voice` now
    // lives under session.audio.output.voice — NOT top-level (the old
    // session.voice shape now 400s). Verified against the live API.
    const session: any = {
      type: "realtime",
      model: "gpt-realtime",
      instructions: isAssessment ? EXAMINER : TUTOR,
      audio: { output: { voice: "shimmer" } },
    };
    if (isAssessment) {
      session.tools = ASSESSMENT_TOOLS;
      session.tool_choice = "auto";
    }

    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI Session Error:", errorText);
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({
      client_secret: {
        value: data.value
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
