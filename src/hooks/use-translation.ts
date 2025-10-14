"use client";

import { useContext } from 'react';
import { LanguageContext } from '@/context/language-context';

function get(obj: any, path: string, defaultValue: string = path): string {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
        result = result?.[key];
        if (result === undefined) {
            return defaultValue;
        }
    }
    return result || defaultValue;
}


export function useTranslation() {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }

  const { translations } = context;

  const t = (key: string, replacements?: Record<string, string | number>) => {
    let translation = get(translations, key);

    if (replacements) {
        Object.keys(replacements).forEach(placeholder => {
            translation = translation.replace(`{${placeholder}}`, String(replacements[placeholder]));
        });
    }

    return translation;
  }

  return { ...context, t };
}
