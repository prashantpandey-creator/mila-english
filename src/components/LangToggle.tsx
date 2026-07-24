'use client';

import { useI18n } from '@/lib/i18n-provider';
import { useProduct } from '@/lib/product-context';

export default function LangToggle() {
  const { lang, switchLang } = useI18n();
  const product = useProduct();

  // Mila English has one clear English interface and uses the learner's
  // selected native language inside explanations. Gia and Mia retain their
  // bilingual interface switch independently.
  if (product === 'mila') return null;

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
