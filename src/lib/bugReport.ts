import { z } from 'zod';

export const BUG_REPORT_RECIPIENT = 'fcpuru95@gmail.com';

export const bugReportSchema = z.object({
  area: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(5000),
  steps: z.string().trim().max(2500).optional().default(''),
  expected: z.string().trim().max(2000).optional().default(''),
  replyEmail: z.union([z.string().trim().email().max(320), z.literal('')]).optional().default(''),
  website: z.string().trim().max(200).optional().default(''),
  diagnostics: z.object({
    page: z.string().trim().max(1000).optional().default(''),
    previousPage: z.string().trim().max(1000).optional().default(''),
    userAgent: z.string().trim().max(1000).optional().default(''),
    screen: z.string().trim().max(80).optional().default(''),
    language: z.string().trim().max(40).optional().default(''),
    timezone: z.string().trim().max(100).optional().default(''),
  }).optional().default({}),
});

export type BugReport = z.infer<typeof bugReportSchema>;

export type BugReportEmailContext = {
  receivedAt: string;
  requestUserAgent?: string;
};

/** Explicit phrasing only: describing a problem is not permission to email it. */
export function parseBugReportRequest(message: string): string | null {
  if (/(?:\b(?:do\s+not|don['’]t|not\s+ready\s+to)\b[^.!?\n]{0,32}\b(?:report|submit|send|email)\b|\bне\s+(?:готов[\p{L}]*\s+)?(?:отправ|сообщ|регистрир)[\p{L}]*)/iu.test(message)) return null;
  const explicit = /(?:\b(?:please\s+)?(?:report|submit|send|email)\b[^.!?\n]{0,36}\b(?:this\s+)?(?:bug|issue|problem)\b|\b(?:this\s+)?(?:bug|issue|problem)\b[^.!?\n]{0,36}\b(?:report|submit|send|email)\b|(?:отправ|сообщ|зарегистрир)[\p{L}]*[^.!?\n]{0,40}(?:баг|ошибк|проблем)[\p{L}]*|(?:баг|ошибк|проблем)[\p{L}]*[^.!?\n]{0,40}(?:отправ|сообщ|зарегистрир)[\p{L}]*)/iu;
  if (!explicit.test(message)) return null;
  const description = message
    .replace(explicit, ' ')
    .replace(/^[\s:;,—-]+|[\s:;,—-]+$/gu, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.!?])/g, '$1')
    .replace(/([.!?])\1+/g, '$1')
    .trim();
  return description.length >= 10 ? description.slice(0, 5000) : '';
}

const printable = (value: string | undefined, fallback = 'Not provided') => value?.trim() || fallback;

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const htmlBlock = (label: string, value: string | undefined) => `
  <tr>
    <th style="padding:10px 12px;text-align:left;vertical-align:top;color:#75003f;border-bottom:1px solid #f0c7da;width:150px">${escapeHtml(label)}</th>
    <td style="padding:10px 12px;white-space:pre-wrap;border-bottom:1px solid #f0c7da">${escapeHtml(printable(value))}</td>
  </tr>`;

export function buildBugReportEmail(report: BugReport, context: BugReportEmailContext) {
  const reporterEmail = report.replyEmail;
  const userAgent = report.diagnostics.userAgent || context.requestUserAgent || '';
  const subjectArea = report.area.replace(/[\r\n]+/g, ' ').trim().slice(0, 100);
  const subject = `[Mila bug] ${subjectArea}`;
  const rows: Array<[string, string | undefined]> = [
    ['Area / feature', report.area],
    ['What happened', report.description],
    ['Steps to reproduce', report.steps],
    ['Expected result', report.expected],
    ['Reply email', reporterEmail],
    ['Page', report.diagnostics.page],
    ['Previous page', report.diagnostics.previousPage],
    ['Device / browser', userAgent],
    ['Screen', report.diagnostics.screen],
    ['Language', report.diagnostics.language],
    ['Timezone', report.diagnostics.timezone],
    ['Received at', context.receivedAt],
  ];

  const text = rows.map(([label, value]) => `${label}:\n${printable(value)}`).join('\n\n');
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#fffcfe;color:#26131f;font:15px/1.55 Arial,sans-serif">
    <div style="max-width:760px;margin:0 auto">
      <p style="margin:0 0 8px;color:#d9006c;font-size:12px;font-weight:700;letter-spacing:.08em">MILA BUG REPORT</p>
      <h1 style="margin:0 0 20px;font-size:26px">${escapeHtml(report.area)}</h1>
      <table role="presentation" style="width:100%;border-collapse:collapse;background:#fff4fa;border:1px solid #f0c7da;border-radius:12px;overflow:hidden">
        ${rows.map(([label, value]) => htmlBlock(label, value)).join('')}
      </table>
    </div>
  </body>
</html>`;

  return { subject, text, html, replyTo: reporterEmail || undefined };
}
