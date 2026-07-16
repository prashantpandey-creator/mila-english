'use client';

import { useI18n } from '@/lib/i18n-provider';

export default function LangToggle() {
  const { lang, switchLang } = useI18n();

  return (
    <div className="lang-toggle" role="group" aria-label={lang === 'ru' ? 'Язык интерфейса' : 'Interface language'}>
      {(['ru', 'en'] as const).map((code) => (
        <button
          key={code}
          type="button"
          className={lang === code ? 'active' : ''}
          aria-pressed={lang === code}
          aria-label={code === 'ru' ? 'Русский' : 'English'}
          title={code === 'ru' ? 'Русский' : 'English'}
          onClick={() => switchLang(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
