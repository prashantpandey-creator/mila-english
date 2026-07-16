import assert from 'node:assert/strict';
import {
  buildReliableLessonPlan,
  RELIABLE_ASSESSMENT_QUESTIONS,
  scoreReliableAssessment,
} from './reliableAssessment';

const allCorrect = RELIABLE_ASSESSMENT_QUESTIONS.map((question) => question.answer);
const allWrong = RELIABLE_ASSESSMENT_QUESTIONS.map((question) => (question.answer + 1) % question.options.length);

const high = scoreReliableAssessment(allCorrect);
assert.equal(high.result.level, 'C1');
assert.equal(high.result.method, 'reliable');
assert.equal(high.result.score, 100);

const low = scoreReliableAssessment(allWrong);
assert.equal(low.result.level, 'A1');
assert.equal(low.result.score, 0);

const b1Answers = allWrong.slice();
for (let index = 0; index < 8; index += 1) b1Answers[index] = allCorrect[index];
assert.equal(scoreReliableAssessment(b1Answers).result.level, 'B1');

const plan = buildReliableLessonPlan(high.result);
assert.equal(plan.lessons.length, 3);
for (const lesson of plan.lessons) {
  assert.equal(lesson.exercises.length, 2);
  for (const exercise of lesson.exercises) {
    assert.equal(exercise.options.filter((option) => option === exercise.correctAnswer).length, 1);
  }
}

assert.throws(() => scoreReliableAssessment([]), /Expected 15 answers/);
console.log('reliable assessment: all assertions pass');
