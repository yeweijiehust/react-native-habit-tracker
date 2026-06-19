import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getLocales } from 'expo-localization';

import { en } from '@/locales/en';
import { zh } from '@/locales/zh';

type Lang = 'en' | 'zh';
type Translations = Record<string, string>;

const translations: Record<Lang, Translations> = { en, zh };

type I18nContextType = {
  lang: Lang;
  t: Translations;
  setLang: (lang: Lang) => Promise<void>;
};

const I18nContext = createContext<I18nContextType | null>(null);

function getSystemLang(): Lang {
  const code = getLocales()[0]?.languageCode;
  return code === 'zh' ? 'zh' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [lang, setLangState] = useState<Lang>(getSystemLang);

  useEffect(() => {
    db.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      'language'
    ).then((row: { value: string } | null) => {
      if (row && (row.value === 'en' || row.value === 'zh')) {
        setLangState(row.value as Lang);
      }
    });
  }, [db]);

  const setLang = async (newLang: Lang) => {
    setLangState(newLang);
    await db.runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      'language',
      newLang
    );
  };

  return (
    <I18nContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
