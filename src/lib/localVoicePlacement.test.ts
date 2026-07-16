import assert from 'node:assert/strict';
import { analyzeLocalVoice, scoreLocalVoicePlacement, type VoiceTranscriptSample } from './localVoicePlacement';

const sample = (intro: string, past: string, hypothetical: string, opinion: string): VoiceTranscriptSample[] => [
  { id: 'intro', text: intro }, { id: 'past', text: past },
  { id: 'hypothetical', text: hypothetical }, { id: 'opinion', text: opinion },
];

assert.equal(analyzeLocalVoice(sample('My name Anna', 'Work home', 'Live London', 'Technology good')).level, 'A1');

assert.equal(analyzeLocalVoice(sample(
  'My name is Anna and I live in Moscow.',
  'Yesterday I worked at home and watched a film.',
  'I would live in London because I like English.',
  'I think technology helps people because lessons are easy.',
)).level, 'A2');

const b1 = sample(
  'My name is Anna and I work in design. I am learning English because I want to travel more confidently.',
  'Yesterday I worked at home, talked with my colleague, and then watched a film with my family.',
  'If I could live anywhere for one year, I would choose London because I could practise English every day.',
  'I think technology helps language learners because they can practise when they have free time, although a teacher is still important.',
);
assert.equal(analyzeLocalVoice(b1).level, 'B1');
assert.equal(scoreLocalVoicePlacement(72, b1).method, 'local-voice');

const c1 = sample(
  'My professional experience is in communication and education, although I particularly enjoy independent projects because they create a significant opportunity to learn from different perspectives every day.',
  'Yesterday I worked on a challenging technology project, which required careful communication, and afterwards I discussed the experience with colleagues because we had encountered several significant problems.',
  'If I could live anywhere for a year, I would choose an unfamiliar environment because the challenge might broaden my perspective, while also giving me an opportunity to communicate independently.',
  'In my opinion technology is particularly effective for education because it creates independent practice; however, learners need meaningful communication, whereas automatic exercises alone are not sufficient, although they remain useful.',
);
assert.equal(analyzeLocalVoice(c1).level, 'C1');
assert.equal(scoreLocalVoicePlacement(88, c1).level, 'C1');

console.log('local voice placement: all assertions pass');
