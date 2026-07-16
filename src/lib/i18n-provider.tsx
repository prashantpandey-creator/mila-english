'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Lang, getLangFromStorage, setLangStorage, t, RU } from './i18n';

type I18nContextType = {
  lang: Lang;
  switchLang: (l: Lang) => void;
  t: (key: keyof typeof RU) => string;
};

const I18nContext = createContext<I18nContextType>({
  lang: 'ru',
  switchLang: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('ru');

  useEffect(() => {
    const storedLang = getLangFromStorage();
    setLang(storedLang);
    document.documentElement.lang = storedLang;
  }, []);

  const switchLang = (l: Lang) => {
    setLang(l);
    setLangStorage(l);
    document.documentElement.lang = l;
  };

  return (
    <I18nContext.Provider value={{ lang, switchLang, t: (k) => t(k, lang) }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
