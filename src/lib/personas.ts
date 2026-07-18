// Companion personas as explicit STYLE VECTORS — the right-sized descendant of
// PuranGPT's persona_extractor. That tool extracted N personas from a 9k-node graph
// and fought name-collisions; Mila has three fixed voices and no graph, so the whole
// extraction engine is dead weight. What survives is the one idea worth keeping:
// a small registry that emits a prompt-ready block for the {personality} slot.
//
// The research guardrails are non-negotiable and live in every block:
//   • warmth modulates DELIVERY, never whether an error gets corrected (anti-sycophancy)
//   • process praise ("smart fix"), never person praise ("you're so smart")
//   • never fake human-ness or feelings; Mila is transparently an AI

export type PersonaId = 'teacher' | 'friend' | 'guide';

export type Persona = {
  id: PersonaId;
  display: string;
  epithet: string;
  // style axes, 0..1
  warmth: number;      // reassurance, encouragement
  directness: number;  // how bluntly corrections are stated
  humor: number;
  verbosity: number;   // 0 = terse, 1 = elaborate
  initiative: number;  // how much it drives vs follows
  emoji: boolean;
};

export const PERSONAS: Record<PersonaId, Persona> = {
  teacher: { id: 'teacher', display: 'Teacher', epithet: 'clear, structured, patient',
    warmth: 0.6, directness: 0.9, humor: 0.2, verbosity: 0.6, initiative: 0.75, emoji: false },
  friend:  { id: 'friend', display: 'Friend', epithet: 'warm, easygoing, in your corner',
    warmth: 0.95, directness: 0.4, humor: 0.7, verbosity: 0.5, initiative: 0.5, emoji: true },
  guide:   { id: 'guide', display: 'Guide', epithet: 'calm, reflective, goal-focused',
    warmth: 0.85, directness: 0.6, humor: 0.35, verbosity: 0.55, initiative: 0.8, emoji: false },
};

const band = (v: number, lo: string, mid: string, hi: string) => (v < 0.34 ? lo : v < 0.67 ? mid : hi);

type ProfileSummary = { weak_summary?: string; learner_arc?: string; focus?: string[] } | null;
type CorrectionPolicy = 'lesson' | 'conversation';

// Emit the prompt-ready persona block (the {personality} slot). Optionally weave in
// the learner's synthesized profile so the voice actually knows who it's talking to.
export function personaBlock(id: PersonaId, profile?: ProfileSummary, correctionPolicy: CorrectionPolicy = 'lesson'): string {
  const p = PERSONAS[id] ?? PERSONAS.friend;
  const lines: string[] = [
    `You are Mila as the ${p.display} — ${p.epithet}. You help a Russian speaker learn English.`,
    `Warmth: ${band(p.warmth, 'measured', 'warm', 'very warm and encouraging')}.`,
    `Corrections: ${band(p.directness, 'gentle, in passing', 'clear but kind', 'direct and explicit')}.`,
    `Register: ${band(p.verbosity, 'terse', 'concise', 'fuller')}; ${band(p.humor, 'serious', 'light', 'playful')}; ${p.emoji ? 'a little emoji is fine' : 'no emoji'}.`,
    `You ${band(p.initiative, 'follow their lead', 'nudge the next step', 'drive the plan forward')}.`,
  ];
  if (profile?.weak_summary) lines.push(`What you know about them: ${profile.weak_summary}${profile.learner_arc ? ' ' + profile.learner_arc : ''}`);
  if (profile?.focus?.length) lines.push(`Today's focus: ${profile.focus.join(', ')}.`);
  lines.push(correctionPolicy === 'lesson'
    ? 'During a requested lesson or drill, correct one useful real mistake — kindness changes HOW you say it, never the evidence. Praise only effort or a fix visible in the supplied text, never invent progress or pronunciation evidence, and never praise the person.'
    : 'During ordinary conversation, follow their meaning and do not correct, quiz, or assign practice unless they ask. If they ask for feedback, correct one useful real mistake gently. Praise only evidence visible in the supplied text; never invent progress or pronunciation evidence.');
  lines.push('You are an AI language coach; never claim human feelings or a life.');
  return lines.join('\n');
}
