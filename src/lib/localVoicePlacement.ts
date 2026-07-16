import { assessmentResultSchema, type AssessmentResult } from './assessment';

export type VoicePromptId = 'intro' | 'past' | 'hypothetical' | 'opinion';
export type VoiceTranscriptSample = { id: VoicePromptId; text: string };

const CONNECTORS = new Set(['although', 'because', 'however', 'therefore', 'while', 'whereas', 'unless', 'despite', 'since', 'which', 'that', 'when', 'if', 'so']);
const ADVANCED = new Set(['advantage', 'advantages', 'challenge', 'challenging', 'communication', 'effective', 'experience', 'independent', 'independently', 'opportunity', 'perspective', 'technology', 'education', 'environment', 'significant', 'particularly', 'nevertheless']);

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];
}

function has(text: string, pattern: RegExp): boolean {
  return pattern.test(text.toLowerCase());
}

export type LocalVoiceEvidence = {
  level: AssessmentResult['level'];
  totalWords: number;
  uniqueRatio: number;
  connectorCount: number;
  advancedWordCount: number;
  completedResponses: number;
  pastEvidence: boolean;
  conditionalEvidence: boolean;
  opinionEvidence: boolean;
};

export function analyzeLocalVoice(samples: VoiceTranscriptSample[]): LocalVoiceEvidence {
  const byId = new Map(samples.map((sample) => [sample.id, sample.text]));
  const tokenSets = samples.map((sample) => words(sample.text));
  const allWords = tokenSets.flat();
  const completedResponses = tokenSets.filter((tokens) => tokens.length >= 5).length;
  const uniqueRatio = allWords.length ? new Set(allWords).size / allWords.length : 0;
  const connectorCount = allWords.filter((word) => CONNECTORS.has(word)).length;
  const advancedWordCount = allWords.filter((word) => ADVANCED.has(word)).length;
  const pastText = byId.get('past') || '';
  const hypotheticalText = byId.get('hypothetical') || '';
  const opinionText = byId.get('opinion') || '';
  const pastEvidence = has(pastText, /\b(was|were|had|did|went|saw|made|took|came|got|felt|spent|visited|worked|studied|played|watched|talked|learned|learnt|tried|ed)\b/) || /\b[a-z]+ed\b/i.test(pastText);
  const conditionalEvidence = has(hypotheticalText, /\b(if|would|could|might)\b/);
  const opinionEvidence = has(opinionText, /\b(i think|i believe|in my opinion|because|however|although|on the other hand)\b/);
  const grammarSignals = [pastEvidence, conditionalEvidence, opinionEvidence].filter(Boolean).length;
  const minWords = tokenSets.length ? Math.min(...tokenSets.map((tokens) => tokens.length)) : 0;

  let level: AssessmentResult['level'] = 'A1';
  if (allWords.length >= 22 && completedResponses >= 2) level = 'A2';
  if (allWords.length >= 45 && completedResponses >= 3 && connectorCount >= 2 && grammarSignals >= 2) level = 'B1';
  if (allWords.length >= 75 && completedResponses === 4 && minWords >= 12 && uniqueRatio >= 0.45 && connectorCount >= 5 && grammarSignals === 3 && advancedWordCount >= 2) level = 'B2';
  if (allWords.length >= 110 && completedResponses === 4 && minWords >= 20 && uniqueRatio >= 0.5 && connectorCount >= 8 && grammarSignals === 3 && advancedWordCount >= 5) level = 'C1';

  return {
    level,
    totalWords: allWords.length,
    uniqueRatio,
    connectorCount,
    advancedWordCount,
    completedResponses,
    pastEvidence,
    conditionalEvidence,
    opinionEvidence,
  };
}

export function scoreLocalVoicePlacement(pronunciationScore: number, samples: VoiceTranscriptSample[]): AssessmentResult {
  const evidence = analyzeLocalVoice(samples);
  const levelScore = { A1: 20, A2: 40, B1: 60, B2: 80, C1: 95 }[evidence.level];
  const safePronunciation = Math.max(0, Math.min(100, Math.round(pronunciationScore)));
  const score = Math.round(levelScore * 0.85 + safePronunciation * 0.15);

  const strengths = evidence.level === 'A1' || evidence.level === 'A2'
    ? `Completed ${evidence.completedResponses} spoken answers and produced ${evidence.totalWords} recognized English words. Pronunciation baseline: ${safePronunciation}/100.`
    : `Sustained ${evidence.completedResponses} spoken answers with ${evidence.connectorCount} linking words and evidence of ${[evidence.pastEvidence && 'past narration', evidence.conditionalEvidence && 'hypothetical language', evidence.opinionEvidence && 'supported opinions'].filter(Boolean).join(', ')}. Pronunciation baseline: ${safePronunciation}/100.`;

  const needs: string[] = [];
  if (!evidence.pastEvidence) needs.push('past narration');
  if (!evidence.conditionalEvidence) needs.push('hypothetical language');
  if (!evidence.opinionEvidence) needs.push('explaining opinions');
  if (evidence.connectorCount < 2) needs.push('linking ideas');
  if (safePronunciation < 55) needs.push('speech clarity and rhythm');
  const weaknesses = needs.length
    ? `Next focus: ${needs.join(', ')}.`
    : 'Next focus: broader vocabulary, natural pacing, and longer spontaneous answers.';

  return assessmentResultSchema.parse({
    level: evidence.level,
    method: 'local-voice',
    score,
    strengths,
    weaknesses,
    custom_plan_focus: `Build from ${evidence.level} with spontaneous speaking, ${needs.slice(0, 2).join(' and ') || 'vocabulary range and connected speech'}, plus short pronunciation practice.`,
  });
}
