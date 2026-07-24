'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n-provider';

const REPORT_EMAIL = 'fcpuru95@gmail.com';

type FormState = {
  area: string;
  description: string;
  steps: string;
  expected: string;
  replyEmail: string;
  website: string;
};

const EMPTY_FORM: FormState = {
  area: '',
  description: '',
  steps: '',
  expected: '',
  replyEmail: '',
  website: '',
};

type SubmitState = 'idle' | 'sending' | 'sent' | 'fallback' | 'rate-limited' | 'error';

function browserDiagnostics() {
  if (typeof window === 'undefined') return {};
  return {
    page: window.location.href,
    previousPage: document.referrer,
    userAgent: navigator.userAgent,
    screen: `${window.screen.width}×${window.screen.height}; viewport ${window.innerWidth}×${window.innerHeight}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
  };
}

function mailtoHref(form: FormState, ru: boolean, diagnostics: ReturnType<typeof browserDiagnostics>) {
  const subject = `[FluentMitra bug] ${form.area || (ru ? 'Сообщение об ошибке' : 'Bug report')}`;
  const body = [
    ru ? 'Что произошло:' : 'What happened:', form.description || '—', '',
    ru ? 'Как повторить:' : 'Steps to reproduce:', form.steps || '—', '',
    ru ? 'Ожидаемый результат:' : 'Expected result:', form.expected || '—', '',
    ru ? 'Email для ответа:' : 'Reply email:', form.replyEmail || '—', '',
    '---',
    `${ru ? 'Страница' : 'Page'}: ${diagnostics.page || '—'}`,
    `${ru ? 'Устройство / браузер' : 'Device / browser'}: ${diagnostics.userAgent || '—'}`,
    `${ru ? 'Экран' : 'Screen'}: ${diagnostics.screen || '—'}`,
    `${ru ? 'Часовой пояс' : 'Timezone'}: ${diagnostics.timezone || '—'}`,
  ].join('\n');
  return `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function BugReportForm() {
  const { lang } = useI18n();
  const ru = lang === 'ru';
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [state, setState] = useState<SubmitState>('idle');
  const [diagnostics, setDiagnostics] = useState<ReturnType<typeof browserDiagnostics>>({});
  const fallbackHref = useMemo(() => mailtoHref(form, ru, diagnostics), [diagnostics, form, ru]);

  useEffect(() => setDiagnostics(browserDiagnostics()), []);

  const update = (field: keyof FormState) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (state !== 'idle' && state !== 'sending') setState('idle');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === 'sending') return;
    setState('sending');

    try {
      const response = await fetch('/api/bug-reports', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, diagnostics: browserDiagnostics() }),
      });
      if (response.ok) {
        setState('sent');
        return;
      }
      if (response.status === 429) {
        setState('rate-limited');
        return;
      }
      const result = await response.json().catch(() => ({})) as { fallback?: string };
      setState(result.fallback === 'mailto' ? 'fallback' : 'error');
    } catch {
      setState('fallback');
    }
  };

  return (
    <section className="bug-report" aria-labelledby="bug-report-title">
      <div className="bug-report__intro">
        <p className="legal-page__kicker">{ru ? 'СООБЩИТЬ ОБ ОШИБКЕ' : 'REPORT A BUG'}</p>
        <h2 id="bug-report-title">{ru ? 'Расскажи, что сломалось.' : 'Tell us what broke.'}</h2>
        <p>
          {ru
            ? 'Отчёт отправится владельцу FluentMitra по электронной почте. Не добавляй пароли, банковские данные или личные разговоры.'
            : 'Your report goes to FluentMitra’s owner by email. Do not include passwords, banking details, or private conversations.'}
        </p>
      </div>

      <form className="bug-report__form" onSubmit={submit}>
        <div className="bug-report__field">
          <label htmlFor="bug-area">{ru ? 'Где возникла ошибка?' : 'Where did it happen?'}</label>
          <input
            id="bug-area"
            value={form.area}
            onChange={(event) => update('area')(event.target.value)}
            placeholder={ru ? 'Например: голосовой разговор' : 'For example: voice conversation'}
            minLength={2}
            maxLength={120}
            required
          />
        </div>

        <div className="bug-report__field">
          <label htmlFor="bug-description">{ru ? 'Что произошло?' : 'What happened?'}</label>
          <textarea
            id="bug-description"
            value={form.description}
            onChange={(event) => update('description')(event.target.value)}
            placeholder={ru ? 'Опиши результат или сообщение об ошибке.' : 'Describe the result or error message.'}
            minLength={10}
            maxLength={5000}
            rows={5}
            required
          />
        </div>

        <div className="bug-report__field">
          <label htmlFor="bug-steps">{ru ? 'Как повторить? (необязательно)' : 'How can we reproduce it? (optional)'}</label>
          <textarea
            id="bug-steps"
            value={form.steps}
            onChange={(event) => update('steps')(event.target.value)}
            placeholder={ru ? '1. Открыла… 2. Нажала… 3. Увидела…' : '1. Opened… 2. Tapped… 3. Saw…'}
            maxLength={2500}
            rows={3}
          />
        </div>

        <div className="bug-report__field">
          <label htmlFor="bug-expected">{ru ? 'Что ты ожидала? (необязательно)' : 'What did you expect? (optional)'}</label>
          <textarea
            id="bug-expected"
            value={form.expected}
            onChange={(event) => update('expected')(event.target.value)}
            maxLength={2000}
            rows={2}
          />
        </div>

        <div className="bug-report__field">
          <label htmlFor="bug-email">{ru ? 'Твой email для ответа (необязательно)' : 'Your reply email (optional)'}</label>
          <input
            id="bug-email"
            type="email"
            value={form.replyEmail}
            onChange={(event) => update('replyEmail')(event.target.value)}
            autoComplete="email"
            maxLength={320}
            placeholder="name@example.com"
          />
        </div>

        <div className="bug-report__trap" aria-hidden="true">
          <label htmlFor="bug-website">Website</label>
          <input id="bug-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => update('website')(event.target.value)} />
        </div>

        <p className="bug-report__privacy">
          {ru
            ? 'FluentMitra автоматически добавит страницу, тип устройства и браузера, размер экрана, язык и часовой пояс. История чата и аудио не отправляются.'
            : 'FluentMitra automatically adds the page, device/browser, screen size, language, and timezone. Chat history and audio are never attached.'}
        </p>

        <div className="bug-report__actions">
          <button className="bug-report__submit" type="submit" disabled={state === 'sending'}>
            {state === 'sending'
              ? (ru ? 'Отправляю…' : 'Sending…')
              : (ru ? 'Отправить отчёт' : 'Send bug report')}
          </button>
          <a className="bug-report__email" href={fallbackHref}>{ru ? 'Или открыть email' : 'Or open email'}</a>
        </div>

        <div className={`bug-report__status bug-report__status--${state}`} aria-live="polite" role="status">
          {state === 'sent' && (ru ? 'Готово — отчёт отправлен владельцу FluentMitra.' : 'Done — the report was emailed to FluentMitra’s owner.')}
          {state === 'fallback' && (
            <>
              {ru ? 'Прямая отправка сейчас недоступна. ' : 'Direct delivery is unavailable right now. '}
              <a href={fallbackHref}>{ru ? 'Открой готовое письмо' : 'Open the ready-to-send email'}</a>.
            </>
          )}
          {state === 'rate-limited' && (ru ? 'Слишком много отчётов за короткое время. Попробуй позже или открой email.' : 'Too many reports were sent recently. Try later or open email.')}
          {state === 'error' && (ru ? 'Не удалось отправить отчёт. Проверь поля или открой email.' : 'The report could not be sent. Check the fields or open email.')}
        </div>
      </form>
    </section>
  );
}
