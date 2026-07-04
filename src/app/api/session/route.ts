import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // SECURITY FIX: Gate unauthenticated LLM endpoints (Ported from PuranGPT Issue #8)
    const authReq = new Request(req.url, { headers: req.headers }) as any;
    const user = await authenticate(authReq);
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. You must be logged in to access Voice Darshan." }, 
        { status: 401 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "verse",
        instructions: "You are a warm, highly empathetic, and encouraging English language tutor for a Russian speaker. You are providing a 'Darshan' (a personal, guided experience). Keep responses brief, conversational, and deeply personal. Correct grammar gently, and feel free to use occasional Russian words if it helps clarify a deep concept. Start by warmly greeting the user.",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI Session Error:", errorText);
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
