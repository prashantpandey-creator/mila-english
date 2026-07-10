// The adaptive math core — three small, well-known models, no dependencies:
//
//   BKT   (Bayesian Knowledge Tracing)  → mastery: P(learner knows phoneme)
//   ELO   (online IRT, Rasch form)      → ability θ per user, difficulty b per item
//   FSRS-lite (spaced repetition)       → stability/difficulty/due for review timing
//
// All pure functions: state in → state out. The attempt loop (attempt.ts) owns I/O.

// ── BKT ───────────────────────────────────────────────────────────────────────
// Standard 4-parameter model, per-attempt posterior update then learning transit.
export const BKT_DEFAULTS = {
  pT: 0.15,     // P(learn on an attempt)
  pSlip: 0.15,  // P(wrong | known)
  pGuess: 0.20, // P(right | unknown) — GOP partial credit makes "guess" plausible
};

export function bktUpdate(pKnown: number, correct: boolean, p = BKT_DEFAULTS): number {
  const { pT, pSlip, pGuess } = p;
  const pk = Math.min(Math.max(pKnown, 0), 1);
  const evidence = correct
    ? (pk * (1 - pSlip)) / (pk * (1 - pSlip) + (1 - pk) * pGuess || 1e-9)
    : (pk * pSlip) / (pk * pSlip + (1 - pk) * (1 - pGuess) || 1e-9);
  const next = evidence + (1 - evidence) * pT; // learning can happen either way
  return Math.min(Math.max(next, 0), 1);
}

// ── ELO / online IRT (Rasch) ─────────────────────────────────────────────────
// P(success) = 1 / (1 + e^-(θ - b)). Graded outcome acc∈[0,1] replaces win/loss.
export function eloExpected(theta: number, b: number): number {
  return 1 / (1 + Math.exp(-(theta - b)));
}

const K_THETA = 0.25; // learner moves slower — many items vote on one ability
const K_B = 0.15;     // item difficulty drifts even slower

export function eloUpdate(theta: number, b: number, acc: number): { theta: number; b: number } {
  const a = Math.min(Math.max(acc, 0), 1);
  const p = eloExpected(theta, b);
  const surprise = a - p;
  return {
    theta: theta + K_THETA * surprise,
    b: b - K_B * surprise, // learner beat expectation → item was easier than believed
  };
}

// ── FSRS-lite ────────────────────────────────────────────────────────────────
// Small faithful core of the FSRS idea: Difficulty (1-10) and Stability (days).
// Success compounds stability (harder items compound slower); failure shrinks it.
export type Grade = 'again' | 'hard' | 'good' | 'easy';

const GRADE_EFFECT: Record<Grade, { dDelta: number; sGrow: number }> = {
  again: { dDelta: +0.8, sGrow: 0 },     // reset path below
  hard:  { dDelta: +0.3, sGrow: 1.2 },
  good:  { dDelta: -0.1, sGrow: 2.0 },
  easy:  { dDelta: -0.4, sGrow: 3.0 },
};

export function fsrsUpdate(
  st: { stability: number; difficulty: number },
  grade: Grade,
  now: Date,
): { stability: number; difficulty: number; due: Date } {
  const eff = GRADE_EFFECT[grade];
  const difficulty = Math.min(10, Math.max(1, (st.difficulty || 5) + eff.dDelta));

  let stability: number;
  if (grade === 'again') {
    // forgot: stability collapses (kept fraction shrinks with difficulty)
    stability = Math.max(0.1, st.stability * (0.3 - 0.02 * difficulty));
  } else if (st.stability <= 0.1) {
    // first exposure: seed by grade, damped by difficulty
    stability = ({ hard: 0.5, good: 1.0, easy: 2.5 } as any)[grade] * (1.3 - difficulty / 12);
  } else {
    // compounding growth, damped by difficulty (hard items consolidate slower)
    stability = st.stability * (1 + eff.sGrow * (1.15 - difficulty / 10));
  }

  const due = new Date(now.getTime() + stability * 24 * 60 * 60 * 1000);
  return { stability, difficulty, due };
}

// GOP accuracy % → review grade, aligned with pron-service verdict bands
// (good ≥68, close ≥40, miss <40; 80 marks the "nearly native" tier in the UI).
export function accToGrade(acc: number): Grade {
  if (acc >= 80) return 'easy';
  if (acc >= 68) return 'good';
  if (acc >= 40) return 'hard';
  return 'again';
}
