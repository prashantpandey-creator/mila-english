'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Lang, getLangFromStorage, setLangStorage, t, RU } from './i18n';
import { useProduct } from './product-context';

type I18nContextType = {
  lang: Lang;
  switchLang: (l: Lang) => void;
  t: (key: keyof typeof RU) => string;
};

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  switchLang: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const product = useProduct();
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const nextLang = product === 'mila' ? 'en' : getLangFromStorage();
    setLang(nextLang);
    if (product === 'mila') setLangStorage('en');
    document.documentElement.lang = nextLang;
  }, [product]);

  const switchLang = (l: Lang) => {
    const nextLang = product === 'mila' ? 'en' : l;
    setLang(nextLang);
    setLangStorage(nextLang);
    document.documentElement.lang = nextLang;
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
