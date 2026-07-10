// Runnable proof of the adaptive math core. Run: npx tsx src/lib/mastery.test.ts
import assert from 'node:assert';
import {
  bktUpdate, eloExpected, eloUpdate, fsrsUpdate, accToGrade,
  BKT_DEFAULTS,
} from './mastery';

// ── BKT: mastery moves toward evidence ────────────────────────────────────────
{
  // correct answer raises P(known)
  const up = bktUpdate(0.3, true);
  assert.ok(up > 0.3, `correct should raise mastery, got ${up}`);
  // wrong answer lowers it
  const down = bktUpdate(0.3, false);
  assert.ok(down < 0.3, `incorrect should lower mastery, got ${down}`);
  // stays a probability
  assert.ok(bktUpdate(0.999, true) <= 1 && bktUpdate(0.001, false) >= 0);
  // repeated success converges high
  let p = 0.1;
  for (let i = 0; i < 12; i++) p = bktUpdate(p, true);
  assert.ok(p > 0.9, `12 successes should near-master, got ${p}`);
  // learning transit: even a wrong answer includes P(T) chance of learning,
  // so from rock-bottom it can't pin to 0
  assert.ok(bktUpdate(0, false) >= 0 && bktUpdate(0, false) < BKT_DEFAULTS.pT + 0.01);
}

// ── ELO: expectation + symmetric update ───────────────────────────────────────
{
  // equal ability and difficulty → 50%
  assert.ok(Math.abs(eloExpected(0, 0) - 0.5) < 1e-9);
  // stronger learner → higher expectation
  assert.ok(eloExpected(1, 0) > 0.7 && eloExpected(1, 0) < 0.8);
  // succeed at an expected-hard item → ability jumps more
  const easyGain = eloUpdate(0, -2, 1).theta;   // expected ~0.88, small gain
  const hardGain = eloUpdate(0, +2, 1).theta;   // expected ~0.12, big gain
  assert.ok(hardGain > easyGain, `hard success should out-gain easy success`);
  // failure drops ability and raises item difficulty
  const f = eloUpdate(0.5, 0, 0);
  assert.ok(f.theta < 0.5 && f.b > 0);
  // graded outcome (acc 0..1) is honored: acc=0.5 vs expectation 0.5 → no move
  const still = eloUpdate(0, 0, 0.5);
  assert.ok(Math.abs(still.theta) < 1e-9 && Math.abs(still.b) < 1e-9);
}

// ── FSRS-lite: stability grows on success, resets shrink on failure ───────────
{
  const now = new Date('2026-07-10T00:00:00Z');
  // first good review from defaults → stability > 0, due in the future
  const s1 = fsrsUpdate({ stability: 0, difficulty: 5 }, 'good', now);
  assert.ok(s1.stability > 0.5, `first success should set stability, got ${s1.stability}`);
  assert.ok(s1.due.getTime() > now.getTime());
  // second success grows the interval
  const s2 = fsrsUpdate({ stability: s1.stability, difficulty: s1.difficulty }, 'good', now);
  assert.ok(s2.stability > s1.stability, 'stability should compound');
  // failure shrinks stability and raises difficulty
  const f = fsrsUpdate({ stability: 10, difficulty: 5 }, 'again', now);
  assert.ok(f.stability < 10 && f.difficulty > 5);
  // difficulty clamped to [1,10]
  const dHi = fsrsUpdate({ stability: 1, difficulty: 9.9 }, 'again', now);
  assert.ok(dHi.difficulty <= 10);
  const dLo = fsrsUpdate({ stability: 1, difficulty: 1.05 }, 'easy', now);
  assert.ok(dLo.difficulty >= 1);
}

// ── accToGrade: GOP % → review grade using the service's own verdict bands ────
{
  assert.strictEqual(accToGrade(85), 'easy');   // ≥80 nailed
  assert.strictEqual(accToGrade(70), 'good');   // ≥68 good band
  assert.strictEqual(accToGrade(50), 'hard');   // ≥40 close band
  assert.strictEqual(accToGrade(20), 'again');  // <40 miss
}

console.log('mastery core: all assertions pass');
