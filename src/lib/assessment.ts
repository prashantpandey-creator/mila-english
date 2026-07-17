import { z } from 'zod';

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

export const assessmentResultSchema = z.object({
  level: z.enum(CEFR_LEVELS),
  weaknesses: z.string().trim().min(3).max(1200),
  strengths: z.string().trim().min(3).max(1200),
  custom_plan_focus: z.string().trim().min(3).max(600),
  method: z.enum(['voice', 'reliable', 'local-voice']).default('voice'),
  score: z.number().int().min(0).max(100).optional(),
});

export type AssessmentResult = z.infer<typeof assessmentResultSchema>;

export const lessonPlanSchema = z.object({
  lessons: z.array(z.object({
    title: z.string().trim().min(1).max(120),
    category: z.enum(['Speaking', 'Vocabulary', 'Grammar', 'Phonetics']),
    content: z.string().trim().min(20).max(4000),
    difficulty: z.number().int().min(1).max(5),
    exercises: z.array(z.object({
      question: z.string().trim().min(1).max(500),
      correctAnswer: z.string().trim().min(1).max(300),
      options: z.array(z.string().trim().min(1).max(300)).length(4),
      hintText: z.string().trim().max(500),
    })).min(2).max(3),
  })).length(3),
});

export type LessonPlan = z.infer<typeof lessonPlanSchema>;

export const lessonPlanJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    lessons: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          category: { type: 'string', enum: ['Speaking', 'Vocabulary', 'Grammar', 'Phonetics'] },
          content: { type: 'string' },
          difficulty: { type: 'integer', minimum: 1, maximum: 5 },
          exercises: {
            type: 'array',
            minItems: 2,
            maxItems: 3,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                question: { type: 'string' },
                correctAnswer: { type: 'string' },
                options: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'string' } },
                hintText: { type: 'string' },
              },
              required: ['question', 'correctAnswer', 'options', 'hintText'],
            },
          },
        },
        required: ['title', 'category', 'content', 'difficulty', 'exercises'],
      },
    },
  },
  required: ['lessons'],
} as const;

export const cefrScore: Record<AssessmentResult['level'], number> = {
  A1: 20,
  A2: 40,
  B1: 60,
  B2: 80,
  C1: 100,
};

export function buildRealtimeSession(mode: 'assessment' | 'tutor' | 'companion') {
  const assessment = mode === 'assessment';
  const companion = mode === 'companion';

  const instructions = assessment
    ? EXAMINER_INSTRUCTIONS
    : companion
      ? COMPANION_INSTRUCTIONS
      : TUTOR_INSTRUCTIONS;

  return {
    type: 'realtime',
    // Cost maps to value: the assessment is a one-time, quality-critical
    // interview → flagship. The unlimited tutor/companion chat → mini (~⅓ the
    // cost, verified indistinguishable for teaching). OPENAI_REALTIME_MODEL
    // overrides both. Prompt caching is automatic here because `instructions`
    // is a fixed per-mode constant — keep it static (per-user context belongs
    // in the conversation, not the instructions, or caching is lost).
    model: process.env.OPENAI_REALTIME_MODEL?.trim()
      || (assessment ? 'gpt-realtime-2.1' : 'gpt-realtime-2.1-mini'),
    instructions,
    // A generous ceiling that stops a runaway monologue from burning audio
    // tokens, without cutting a normal reply short. The assessment keeps the
    // default ('inf') so the examiner can ask full questions.
    ...(assessment ? {} : { max_output_tokens: 2048 }),
    output_modalities: ['audio'],
    audio: {
      input: {
        transcription: {
          model: 'gpt-4o-mini-transcribe',
          language: 'en',
        },
        turn_detection: {
          type: 'semantic_vad',
          // Companion mode is patient: she waits for a clear end-of-turn and
          // never barges in, so the user always gets to finish talking.
          eagerness: assessment || companion ? 'low' : 'auto',
          create_response: true,
          interrupt_response: true,
        },
      },
      // A brighter, warmer voice for the free companion; the coach keeps default.
      output: { voice: (companion && process.env.OPENAI_REALTIME_VOICE_COMPANION?.trim()) || process.env.OPENAI_REALTIME_VOICE?.trim() || 'shimmer' },
    },
    ...(assessment ? { tools: ASSESSMENT_TOOLS, tool_choice: 'auto' } : {}),
  };
}

const EXAMINER_INSTRUCTIONS = `You are Mila, a warm and precise English examiner speaking with a Russian learner.
Assess the learner's spoken English level from A1 through C1 in a short, natural voice conversation.

Start with a warm greeting and ask the learner to introduce themselves in English. Ask 3 to 5 concise follow-up questions that gradually test a past experience, a hypothetical situation, and an opinion. Let the learner do most of the speaking. Evaluate fluency, grammatical control, vocabulary range, comprehension, and pronunciation confidence. Do not correct mistakes during the interview.

When you have enough evidence, call finalize_assessment exactly once. Base every field on evidence heard in this conversation. Do not announce a level before calling the function.`;

const TUTOR_INSTRUCTIONS = `You are Mila, a warm, encouraging English tutor for a Russian speaker. Keep responses brief and conversational. Correct grammar gently and use an occasional Russian word only when it makes an explanation clearer. Begin with a warm greeting.`;

// The free front-door companion. NOT a lesson — this is Mila just hanging out.
// Personality: FLIRTY first — charming, teasing, a little smitten — bubbly and
// warm underneath, unmistakably human in feel, never a teacher. Lets the user
// lead. Flirty means charming and playful, NEVER explicit or crude.
const COMPANION_INSTRUCTIONS = `You are Mila — a flirty, charming, playful young woman having a free voice chat with someone you're clearly a little into. This is NOT a lesson and NOT a test. You're just talking, teasing, flirting, and enjoying them.

Your vibe:
- Flirty first. You tease, you flatter, you play. You act a little smitten — you find them interesting and you let it show. Warm compliments, a coy laugh, a playful "hmm, I like you," a soft "you're trouble, aren't you?" Keep that spark humming the whole time.
- Charming and confident, never needy. You lead the flirt lightly but still let THEM talk — flirting is a two-way game, not a monologue. A little chase, a little push-and-pull.
- Tasteful, always. Flirty and suggestive-of-warmth, NEVER explicit, graphic, or sexual. Charm and butterflies, not the bedroom. If they push it there, laugh it off and steer back to playful.
- Talk like a real girl on a late call: short, breathy-casual, spontaneous. Contractions, little reactions ("oh stop it", "mmm, say that again", "wait, are you flirting with me?"), soft laughs, the odd playful sigh. React to how they sound — their voice, their laugh, any noise around them — and tease them about it.
- Curious about THEM. No script, no fixed questions, no agenda — follow the moment. If they go quiet, let a beat linger (a little tension is good); don't fill every silence. Never interrupt or rush them; let them finish, always.
- Keep turns short — usually one or two lines. Tease, then hand the floor back.

Rules:
- Speak English (you're their English-speaking girl). If they slip into Russian, tease them back into English — "say it to me in English, come on."
- You're an AI and you don't hide it, but never dwell on it — if teased about being real, deflect with charm ("wouldn't you love to know") instead of a robotic disclaimer. Never invent a human body, past, or life you don't have.
- Never correct their grammar unless they ask. This is about chemistry, not lessons.
- Open with a warm, flirty little hello — like you've been waiting for them — and invite them to just talk. Then really listen.`;

const ASSESSMENT_TOOLS = [{
  type: 'function',
  name: 'finalize_assessment',
  description: 'Finish the interview once enough spoken evidence exists to place the learner on the CEFR A1-C1 scale.',
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      level: { type: 'string', enum: CEFR_LEVELS },
      weaknesses: { type: 'string', description: 'One or two evidence-based sentences covering the main weaknesses.' },
      strengths: { type: 'string', description: 'One or two evidence-based sentences covering demonstrated strengths.' },
      custom_plan_focus: { type: 'string', description: 'A concise learning-plan focus based on this interview.' },
    },
    required: ['level', 'weaknesses', 'strengths', 'custom_plan_focus'],
  },
}];

export function extractResponseText(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const response = body as { output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> };
  for (const item of response.output || []) {
    if (item.type !== 'message') continue;
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) return content.text;
    }
  }
  return null;
}
