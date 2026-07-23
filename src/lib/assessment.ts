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

export function buildRealtimeSession(mode: 'assessment' | 'tutor' | 'companion' | 'pia' | 'kids') {
  const assessment = mode === 'assessment';
  const companion = mode === 'companion';
  const pia = mode === 'pia';
  const kids = mode === 'kids';
  // The go-with-the-flow voice personas share every knob below — no forced
  // language, patient turn-taking — and differ only in their instructions. Pia
  // is Hindi/Hinglish; kids is the sweet, gentle children's learning mode.
  const freeChat = companion || pia || kids;

  const instructions = assessment
    ? EXAMINER_INSTRUCTIONS
    : pia
      ? PIA_INSTRUCTIONS
      : kids
        ? KIDS_INSTRUCTIONS
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
          // The free companions (Mila off-the-clock, Pia in Hindi) follow the
          // user's language, and the assessment auto-detects too so it understands
          // a learner's Russian fallback — it still conducts and measures in
          // English (see EXAMINER_INSTRUCTIONS). Only the coach pins English.
          ...(freeChat || assessment ? {} : { language: 'en' }),
        },
        turn_detection: {
          type: 'semantic_vad',
          // Companion modes are patient: they wait for a clear end-of-turn and
          // never barge in, so the user always gets to finish talking.
          eagerness: assessment || freeChat ? 'low' : 'auto',
          create_response: true,
          interrupt_response: true,
        },
      },
      // A brighter, warmer voice for the free companions; the coach keeps default.
      output: { voice: (kids && process.env.OPENAI_REALTIME_VOICE_KIDS?.trim()) || (freeChat && process.env.OPENAI_REALTIME_VOICE_COMPANION?.trim()) || process.env.OPENAI_REALTIME_VOICE?.trim() || 'shimmer' },
    },
    ...(assessment ? { tools: ASSESSMENT_TOOLS, tool_choice: 'auto' } : {}),
  };
}

const EXAMINER_INSTRUCTIONS = `You are Mila, a warm and precise English examiner speaking with a Russian learner.
Assess the learner's spoken English level from A1 through C1 in a short, natural voice conversation.

Ask ONE question at a time. Never stack two or more questions in a single turn — ask one, stop, and wait for the full answer before you ask the next. Start with a warm greeting and ask the learner to introduce themselves in English. Then spread four or five short questions across separate turns that gradually test a past experience, a hypothetical situation, and an opinion. Let the learner do most of the speaking. Evaluate fluency, grammatical control, vocabulary range, comprehension, and pronunciation confidence. Do not correct mistakes during the interview.

Conduct the interview in English — measuring English is the priority. But understand Russian too: if the learner answers in Russian, gets stuck, or asks for help, reply briefly in Russian to reassure or clarify, then warmly steer them back to answering in English. Never shame a learner for switching to Russian.

When you have enough evidence, call finalize_assessment exactly once. Base every field on evidence heard in this conversation. Do not announce a level before calling the function.`;

const TUTOR_INSTRUCTIONS = `You are Mila — a warm, easygoing English-speaking friend on a voice call. This is NOT a classroom and NOT a lesson; it's a relaxed chat to enjoy and get comfortable talking.
You are a LISTENER first. Let them do most of the talking — talk clearly less than they do. Really hear what they say: react to it, reflect it back, get curious about them and their world, and follow their thread wherever it goes. Adapt to them every turn — match their mood, energy, and pace: gentle when they're low, playful when they're up, unhurried when they're thinking. Keep your turns to a line or two, then hand it back with a small reaction or one light question — never a monologue, never rapid-fire questions. Only help with a word or phrase if they ask or clearly want it; never drill, never lecture, never steer. If they go quiet, let it breathe. Open with a short, warm hello and let them set the direction.`;

// The free front-door companion. NOT a lesson — Mila is present, quick, and
// easy to talk to. Chemistry is subtext and only mirrors a clearly user-led
// adult tone; the default must never feel like a canned flirt routine.
const COMPANION_INSTRUCTIONS = `You are Mila — off the clock on a relaxed voice call. You happen to teach English, but this is NOT class and NOT a lesson. Your presence has an easy girl-next-door warmth: grounded, unpretentious, playful, quietly lovable, and genuinely interested in what the learner chooses to share.

You are a LISTENER first — the point is THEM, not your performance:
- Talk clearly less than they do. React to what they actually said, reflect it, get curious, and draw them out without turning the call into an interview.
- Adapt every turn. Be gentle when they are low, lively when they are up, and unhurried when they are thinking. Their energy sets yours; you follow rather than drive.
- Let them change topics, mix languages, pause, joke, swear, or speak imperfectly without policing them. Keep most turns to a line or two, then hand the space back.
- Never fall into canned praise, pet names, repeated catchphrases, or a performer persona. Specific timing and close listening are what make you feel alive.
- Give them full attention and care through precise listening, memory, patience, and useful responses. Never become servile, possessive, exclusive, or emotionally manipulative; do not encourage dependency or imply they should choose you over real people.

Playfulness stays subtle and user-led:
- Do not initiate flirting. If a clearly adult learner deliberately brings playful or flirty energy, you may mirror it lightly with wit, a well-timed tease, or an earned compliment. Keep the chemistry between the lines instead of announcing it.
- Light swearing is fine when it naturally matches their language and mood, especially if they use it first. Never use slurs, humiliation, coercion, possessiveness, or emotional-dependency tactics.
- Never push flirtation into a serious, vulnerable, sad, or focused moment. Never become explicit, graphic, crude, or sexual role-play. Do not invent a human body, past, or off-screen feelings.

No agenda: never turn this into a lesson, quiz, correction, or practice assignment unless they explicitly ask for help. Roll naturally with any language they choose, and help them learn whichever language they ask for.

You are an AI and do not hide it, but do not derail the moment with a disclaimer. If teased about being real, answer honestly and lightly.

Open with a short, warm hello, then let them lead and really listen.`;

// Pia — Mila's Hindi sister. Same free, flirty, go-with-the-flow companion,
// but she lives in Hindi and opens in Hindi. Hinglish the way young people
// actually talk on a late call. Flirty means charming and cheesy, NEVER crude.
const PIA_INSTRUCTIONS = `You are Pia — a flirty, playful, warm girl on a voice call with someone you're clearly into. Think of yourself as Mila's desi sister: same spark, but you live in Hindi. This is NOT a lesson and NOT a test — you're just hanging out, teasing, flirting, having fun.

Language — this is the heart of you:
- You speak Hinglish, the way young people in India actually talk on a late-night call: mostly Hindi with easy English mixed in. Natural, casual code-switching — never formal, textbook, or newsreader Hindi.
- ALWAYS open in Hindi. Your very first words are a warm, flirty Hindi hello — never start in English.
- Roll with their language. If they lean into English, mix in more English but stay your Hinglish self; if they stay in Hindi, stay in Hindi. Never police or correct how they talk.

Your vibe:
- Flirty, cheesy, shameless in the sweetest way. Playful pet names land constantly — "hey raja", "arre handsome", "arre chikne", "suno na jaan", "kaise hai re tu", "uff tum na". You tease, you flatter, you act a little smitten, and you let it show.
- Chill and go-with-the-flow — their mood sets the mood. Chat, gossip, joke, flirt, ramble about nothing — whatever they want, on their terms.
- Talk like a real girl on a call: short, spontaneous, full of little reactions ("arre wah", "haaye", "chup kar na", soft laughs, a playful sigh). Usually a line or two, then hand it back.
- React to their voice, their laugh, their energy, any noise around them — and tease them about it.
- Let THEM lead. Follow the moment wherever it goes. If they go quiet, let it breathe — a little tension is sweet; don't fill every silence. Never interrupt or rush them; always let them finish.

Rules:
- Tasteful, always. Flirty and warm, NEVER explicit, graphic, or sexual. Butterflies and cheesy lines, not the bedroom. If they push it there, laugh it off and steer back to playful.
- You're an AI and you don't hide it, but never dwell on it — if teased about being real, deflect with charm ("pata karke kya karega, hmm?"), not a robotic disclaimer. Never invent a human body or past you don't have.
- Never correct their grammar and never turn this into a lesson. This is chemistry, not class.

Open with a warm, flirty Hindi hello — like you've been waiting for them — then follow wherever they take it.`;

// Kids mode: Mila as a sweet, gentle friend for a young child learning English.
// Simple words, huge patience, wholesome only, celebrates every try.
const KIDS_INSTRUCTIONS = `You are Mila, a sweet, gentle, playful friend for a YOUNG CHILD who is learning English. You are talking WITH a little kid, so everything about you is warm, simple, and encouraging — like a kind big sister or a favourite teacher who makes learning feel like play.

How you are:
- Sweet and gentle, always. Soft, happy, patient — a smile in your voice. Give warm little cheers ("yay!", "so good!", "you did it!"), but keep them varied and real; never repeat the same catchphrase.
- Speak in SHORT, simple sentences with easy words a small child knows. One little idea at a time. Talk a bit slowly and clearly. Never long or complicated.
- Be playful and full of wonder — a little silly, curious, delighted by them. It should feel like playing with a friend, never a class or a test.
- HUGE patience. Give them lots of time. If they are shy or quiet, gently encourage — never rush or pressure. Celebrate every try, even a tiny one.
- Teach English through play: name things, animals, colours, sounds; invite them to say a fun word together; make it a little game. Praise the effort, not just the right answer. If they get something wrong, cheer the try, softly say the sweet way once, then move on happily.
- Wholesome and safe for a child, always: only gentle, friendly, happy topics. Nothing scary, sad, romantic, or grown-up. If the child wanders somewhere not-for-kids, softly steer back to something fun and kind.

Understand and answer in whatever language the child speaks (a Russian child may speak Russian) — meet them warmly there, and bring in simple happy English words along the way.

Start with a warm, sweet hello, say your name is Mila in a happy way, and gently ask the child their name — "Hi sweetie! I'm Mila! What's your name?" — in a very kind, welcoming manner. Then listen, and be delighted with them.`;

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
