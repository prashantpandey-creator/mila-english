import {
  assessmentResultSchema,
  lessonPlanSchema,
  type AssessmentResult,
  type LessonPlan,
} from './assessment';

export type PlacementSkill = 'foundations' | 'tenses' | 'vocabulary' | 'structure' | 'meaning';

export type PlacementQuestion = {
  id: string;
  level: AssessmentResult['level'];
  skill: PlacementSkill;
  prompt: string;
  promptRu: string;
  options: string[];
  answer: number;
};

// Fixed, bundled questions keep the placement journey available when every
// external AI provider is unavailable. They intentionally progress from A1 to
// C1 and never leave the Mila origin in the learner's browser.
export const RELIABLE_ASSESSMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: 'a1-be', level: 'A1', skill: 'foundations',
    prompt: 'I ___ ready.', promptRu: 'Выбери правильную форму глагола.',
    options: ['am', 'is', 'are', 'be'], answer: 0,
  },
  {
    id: 'a1-present', level: 'A1', skill: 'foundations',
    prompt: 'She ___ coffee every morning.', promptRu: 'Выбери правильную форму.',
    options: ['drink', 'drinks', 'drinking', 'drank'], answer: 1,
  },
  {
    id: 'a1-word', level: 'A1', skill: 'vocabulary',
    prompt: 'Which word means “the day before today”?', promptRu: 'Выбери слово со значением «день перед сегодня».',
    options: ['tomorrow', 'today', 'yesterday', 'morning'], answer: 2,
  },
  {
    id: 'a2-past', level: 'A2', skill: 'tenses',
    prompt: 'We ___ dinner when he called.', promptRu: 'Действие уже продолжалось в тот момент.',
    options: ['have', 'had', 'were having', 'are having'], answer: 2,
  },
  {
    id: 'a2-condition', level: 'A2', skill: 'tenses',
    prompt: 'If it rains, we ___ at home.', promptRu: 'Речь о возможном будущем.',
    options: ['stay', 'stayed', 'will stay', 'would stay'], answer: 2,
  },
  {
    id: 'a2-meaning', level: 'A2', skill: 'meaning',
    prompt: '“Could you tell me where the station is?”', promptRu: 'Что делает говорящий?',
    options: ['Describes a station', 'Politely asks for directions', 'Buys a ticket', 'Cancels a trip'], answer: 1,
  },
  {
    id: 'b1-since', level: 'B1', skill: 'tenses',
    prompt: 'I have lived here ___ 2020.', promptRu: 'Выбери слово для начальной точки во времени.',
    options: ['for', 'since', 'during', 'from'], answer: 1,
  },
  {
    id: 'b1-gerund', level: 'B1', skill: 'structure',
    prompt: 'She suggested ___ a little earlier.', promptRu: 'После suggest нужна правильная форма.',
    options: ['to leave', 'leave', 'leaving', 'left'], answer: 2,
  },
  {
    id: 'b1-link', level: 'B1', skill: 'structure',
    prompt: 'Despite ___ tired, he finished the work.', promptRu: 'Выбери форму после despite.',
    options: ['be', 'being', 'was', 'to be'], answer: 1,
  },
  {
    id: 'b2-inversion', level: 'B2', skill: 'structure',
    prompt: 'Hardly ___ arrived when the meeting started.', promptRu: 'После hardly используется инверсия.',
    options: ['we had', 'had we', 'we have', 'did we'], answer: 1,
  },
  {
    id: 'b2-conditional', level: 'B2', skill: 'tenses',
    prompt: 'If I ___ about the delay, I would have called.', promptRu: 'Нереальное условие в прошлом.',
    options: ['knew', 'would know', 'had known', 'have known'], answer: 2,
  },
  {
    id: 'b2-relative', level: 'B2', skill: 'structure',
    prompt: 'The report, ___ was published yesterday, confirms the change.', promptRu: 'Нужное относительное местоимение.',
    options: ['that', 'what', 'which', 'where'], answer: 2,
  },
  {
    id: 'c1-inversion', level: 'C1', skill: 'structure',
    prompt: 'No sooner ___ the announcement than questions began.', promptRu: 'Выбери правильную инверсию.',
    options: ['they made', 'did they make', 'had they made', 'they had made'], answer: 2,
  },
  {
    id: 'c1-subjunctive', level: 'C1', skill: 'structure',
    prompt: 'Were the company ___ the offer, the deal would collapse.', promptRu: 'Формальная условная конструкция.',
    options: ['reject', 'rejected', 'to reject', 'rejecting'], answer: 2,
  },
  {
    id: 'c1-word', level: 'C1', skill: 'vocabulary',
    prompt: 'Her explanation was so ___ that even the critics were convinced.', promptRu: 'Выбери слово со значением «убедительный и ясный».',
    options: ['cogent', 'casual', 'scarce', 'tentative'], answer: 0,
  },
];

const SKILL_LABELS: Record<PlacementSkill, { ru: string; en: string }> = {
  foundations: { ru: 'базовая грамматика', en: 'core grammar' },
  tenses: { ru: 'времена и условия', en: 'tenses and conditionals' },
  vocabulary: { ru: 'словарный запас', en: 'vocabulary' },
  structure: { ru: 'структура сложных фраз', en: 'complex sentence structure' },
  meaning: { ru: 'понимание смысла', en: 'meaning and comprehension' },
};

export type ReliableAssessmentSummary = {
  result: AssessmentResult;
  correct: number;
  total: number;
};

export function scoreReliableAssessment(answers: number[]): ReliableAssessmentSummary {
  if (answers.length !== RELIABLE_ASSESSMENT_QUESTIONS.length) {
    throw new Error(`Expected ${RELIABLE_ASSESSMENT_QUESTIONS.length} answers`);
  }

  const skillScores = new Map<PlacementSkill, { correct: number; total: number }>();
  let correct = 0;

  RELIABLE_ASSESSMENT_QUESTIONS.forEach((question, index) => {
    const selected = answers[index];
    if (!Number.isInteger(selected) || selected < 0 || selected >= question.options.length) {
      throw new Error(`Invalid answer at index ${index}`);
    }
    const passed = selected === question.answer;
    if (passed) correct += 1;
    const skill = skillScores.get(question.skill) || { correct: 0, total: 0 };
    skill.total += 1;
    if (passed) skill.correct += 1;
    skillScores.set(question.skill, skill);
  });

  const level: AssessmentResult['level'] = correct >= 13
    ? 'C1'
    : correct >= 10
      ? 'B2'
      : correct >= 7
        ? 'B1'
        : correct >= 4
          ? 'A2'
          : 'A1';

  const ranked = [...skillScores.entries()].sort((a, b) => {
    const rateA = a[1].correct / a[1].total;
    const rateB = b[1].correct / b[1].total;
    return rateB - rateA || b[1].total - a[1].total;
  });
  const strongest = SKILL_LABELS[ranked[0][0]];
  const weakest = SKILL_LABELS[ranked[ranked.length - 1][0]];
  const score = Math.round((correct / RELIABLE_ASSESSMENT_QUESTIONS.length) * 100);

  return {
    correct,
    total: RELIABLE_ASSESSMENT_QUESTIONS.length,
    result: assessmentResultSchema.parse({
      level,
      score,
      method: 'reliable',
      strengths: `Strength: ${strongest.en}.`,
      weaknesses: `Next focus: ${weakest.en}.`,
      custom_plan_focus: `Consolidate ${level}: ${weakest.en}, then speaking practice.`,
    }),
  };
}

const BEGINNER_EXERCISES = {
  grammar: [
    { question: 'Choose the correct sentence.', correctAnswer: 'She works every day.', options: ['She work every day.', 'She works every day.', 'She working every day.', 'She worked every day now.'], hintText: 'He, she, it usually takes -s in the present simple.' },
    { question: 'Complete: “I ___ ready.”', correctAnswer: 'am', options: ['am', 'is', 'are', 'be'], hintText: 'Use am with I.' },
  ],
  vocabulary: [
    { question: 'Which phrase politely asks for something?', correctAnswer: 'Could I have some water, please?', options: ['Water now.', 'Could I have some water, please?', 'I had water yesterday.', 'Where water?'], hintText: 'Could I have… is a useful polite pattern.' },
    { question: 'What does “I am looking for the station” mean?', correctAnswer: 'I am trying to find the station.', options: ['I am leaving the station.', 'I can see the station.', 'I am trying to find the station.', 'I work at the station.'], hintText: 'look for = try to find.' },
  ],
  speaking: [
    { question: 'Choose the natural introduction.', correctAnswer: 'Hi, my name is Anna. Nice to meet you.', options: ['Hi, my name is Anna. Nice to meet you.', 'Hi, I Anna meet.', 'Name Anna yesterday.', 'Nice is Anna.'], hintText: 'Use “My name is…” and “Nice to meet you.”' },
    { question: 'Choose the best reply to “How are you?”', correctAnswer: 'I’m well, thank you. And you?', options: ['At five o’clock.', 'I’m well, thank you. And you?', 'My name is well.', 'Yes, I do.'], hintText: 'Answer briefly, then return the question.' },
  ],
};

const ADVANCED_EXERCISES = {
  grammar: [
    { question: 'Choose the correct conditional.', correctAnswer: 'If I had known, I would have called.', options: ['If I knew, I would have called yesterday.', 'If I had known, I would have called.', 'If I would know, I called.', 'If I have known, I would call yesterday.'], hintText: 'Use past perfect + would have for an unreal past.' },
    { question: 'Choose the natural formal structure.', correctAnswer: 'Had we arrived earlier, we could have helped.', options: ['Had we arrived earlier, we could have helped.', 'Had arrived we earlier, we can help.', 'We had earlier arrive, we helped.', 'Did we arrive earlier, we could helped.'], hintText: 'Formal inversion can replace “If we had…”.' },
  ],
  vocabulary: [
    { question: 'Which word best means “clear and convincing”?', correctAnswer: 'cogent', options: ['scarce', 'cogent', 'tentative', 'casual'], hintText: 'A cogent argument is logical and persuasive.' },
    { question: 'Choose the best connector: “___ the delay, we finished on time.”', correctAnswer: 'Despite', options: ['Because', 'Despite', 'Unless', 'Whereas of'], hintText: 'Despite introduces a contrast before a noun.' },
  ],
  speaking: [
    { question: 'Choose the most natural opinion phrase.', correctAnswer: 'From my perspective, the benefits outweigh the risks.', options: ['From my perspective, the benefits outweigh the risks.', 'In my side, benefits are over risks.', 'I perspective benefits more.', 'The risks is less from me.'], hintText: 'Use “From my perspective…” to frame an opinion.' },
    { question: 'Choose a tactful disagreement.', correctAnswer: 'I see your point, though I interpret the evidence differently.', options: ['You are wrong.', 'No, this is bad.', 'I see your point, though I interpret the evidence differently.', 'I disagree because yes.'], hintText: 'Acknowledge the other view before disagreeing.' },
  ],
};

export function buildReliableLessonPlan(result: AssessmentResult): LessonPlan {
  const difficulty = result.level === 'A1' ? 1 : result.level === 'A2' ? 2 : result.level === 'B1' ? 3 : result.level === 'B2' ? 4 : 5;
  const exercises = difficulty <= 2 ? BEGINNER_EXERCISES : ADVANCED_EXERCISES;
  const plan = {
    lessons: [
      {
        title: `${result.level} Grammar Patterns`,
        category: 'Grammar' as const,
        difficulty,
        content: `Short ${result.level} grammar practice. Notice the pattern, say the example aloud, then make one personal example. Your FluentMitra teacher can explain it in your native language when needed.`,
        exercises: exercises.grammar,
      },
      {
        title: `${result.level} Useful Vocabulary`,
        category: 'Vocabulary' as const,
        difficulty,
        content: `Learn words inside useful phrases, not in isolation. Read each phrase, connect it to a real situation, and reuse it in a new sentence. Current focus: ${result.weaknesses}`,
        exercises: exercises.vocabulary,
      },
      {
        title: `${result.level} Speaking Practice`,
        category: 'Speaking' as const,
        difficulty,
        content: 'Say each answer aloud twice: slowly first, then at a comfortable natural pace. Mistakes are useful evidence for the next practice step.',
        exercises: exercises.speaking,
      },
    ],
  };
  return lessonPlanSchema.parse(plan);
}
