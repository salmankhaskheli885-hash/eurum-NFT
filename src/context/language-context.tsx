"use client";

import React, { createContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import en from '@/locales/en.json';
import ur from '@/locales/ur.json';

type Language = 'en' | 'ur';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: any;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translationsData = { en, ur };

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('fynix-pro-lang') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ur')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('fynix-pro-lang', lang);
  };

  const translations = useMemo(() => translationsData[language], [language]);
  
  const value = useMemo(() => ({
    language,
    setLanguage: handleSetLanguage,
    translations,
  }), [language, translations]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
  }, [language]);


  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
