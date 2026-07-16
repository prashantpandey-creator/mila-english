'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n-provider';
import { getThemePreference, setThemePreference, type ThemePreference } from '@/lib/themePreference';

const OPTIONS: ThemePreference[] = ['system', 'light', 'dark'];

// Sits beside LangToggle in the welcome-room toolbars and reuses its pill
// styling. Only the welcome room reacts — the focus studio is always dark.
export default function ThemeToggle() {
  const { lang } = useI18n();
  const [preference, setPreference] = useState<ThemePreference>('system');

  useEffect(() => { setPreference(getThemePreference()); }, []);

  const labels: Record<ThemePreference | 'group', string> = lang === 'ru'
    ? { system: 'Авто', light: 'День', dark: 'Ночь', group: 'Тема оформления' }
    : { system: 'Auto', light: 'Day', dark: 'Night', group: 'Color theme' };

  return (
    <div className="lang-toggle theme-toggle" role="group" aria-label={labels.group}>
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          className={preference === option ? 'active' : ''}
          aria-pressed={preference === option}
          title={labels[option]}
          onClick={() => { setPreference(option); setThemePreference(option); }}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  );
}
