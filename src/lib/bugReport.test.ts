import assert from 'node:assert';
import { bugReportSchema, buildBugReportEmail, parseBugReportRequest } from './bugReport';

const parsed = bugReportSchema.parse({
  area: 'Voice conversation',
  description: 'The microphone stays on Starting and never begins recording.',
  steps: 'Open Speak with Mila and tap the microphone.',
  expected: 'The recording should begin.',
  replyEmail: 'anna@example.com',
  diagnostics: {
    page: 'https://mila.purangpt.com/darshan',
    userAgent: 'Test Browser',
    screen: '390×844',
    language: 'ru-RU',
    timezone: 'Europe/Moscow',
  },
});

const email = buildBugReportEmail(parsed, {
  receivedAt: '2026-07-19T12:00:00.000Z',
});

assert.strictEqual(email.subject, '[FluentMitra bug] Voice conversation');
assert.strictEqual(email.replyTo, 'anna@example.com');
assert.match(email.text, /The microphone stays on Starting/);
assert.match(email.html, /390×844/);

const escaped = buildBugReportEmail(bugReportSchema.parse({
  area: '<Voice>\r\nBcc: attacker@example.com',
  description: '<script>alert("x")</script> stopped the page.',
}), { receivedAt: '2026-07-19T12:00:00.000Z' });

assert.doesNotMatch(escaped.subject, /\r|\n/);
assert.doesNotMatch(escaped.html, /<script>/);
assert.match(escaped.html, /&lt;script&gt;/);
assert.strictEqual(escaped.replyTo, undefined);

assert.strictEqual(parseBugReportRequest('Report this bug: the microphone never starts.'), 'the microphone never starts.');
assert.strictEqual(parseBugReportRequest('The screen stays blank. Please report this bug.'), 'The screen stays blank.');
assert.strictEqual(parseBugReportRequest('Сообщи об ошибке: кнопка записи ничего не делает.'), 'кнопка записи ничего не делает.');
assert.strictEqual(parseBugReportRequest('I found a bug, but I am not ready to send it.'), null);
assert.strictEqual(parseBugReportRequest('Report a bug'), '');

assert.strictEqual(bugReportSchema.safeParse({ area: 'Chat', description: 'Too short' }).success, false);
assert.strictEqual(bugReportSchema.safeParse({
  area: 'Chat',
  description: 'A long enough description.',
  replyEmail: 'not-an-email',
}).success, false);
assert.strictEqual(bugReportSchema.safeParse({
  area: 'Chat',
  description: 'A long enough description.',
  website: 'spam.example',
}).success, true);
