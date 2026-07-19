import assert from 'node:assert/strict';
import { selectCurrentAssessmentLesson } from './assessmentResult';

const lessons = [
  { id: 31, title: 'Old generated lesson', createdByUserId: 7 },
  { id: 32, title: 'Current generated lesson', createdByUserId: 7 },
  { id: 33, title: 'Global lesson', createdByUserId: null },
];

assert.equal(selectCurrentAssessmentLesson(lessons, null), null, 'generation failure never falls back to an old lesson');
assert.equal(selectCurrentAssessmentLesson(lessons, '999'), null, 'a missing expected lesson never falls back');
assert.equal(selectCurrentAssessmentLesson(lessons, '33'), null, 'a global lesson cannot be presented as the generated result');
assert.deepEqual(selectCurrentAssessmentLesson(lessons, '32'), { id: 32, title: 'Current generated lesson' });

console.log('assessment result selection: all assertions pass');
