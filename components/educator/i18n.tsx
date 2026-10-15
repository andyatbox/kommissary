'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

// English / Spanish for this page only. The 1.0 nav and footer stay in English.
//
// The choice comes from ?lang=es in the URL first (so a Spanish link can be shared or
// printed on a flyer), then from what this visitor picked last time, then from their
// browser's first-choice language (Spanish if it's any variety of Spanish), then
// English. The
// static HTML is English; a Spanish visitor's switch happens before the page fades in
// (body starts at opacity 0 until SiteScripts adds "ready"), so it isn't seen.

export type Lang = 'en' | 'es';

const STORAGE_KEY = 'nutrition-box-lang';

type LangState = { lang: Lang; setLang: (lang: Lang) => void };

const LangContext = createContext<LangState>({ lang: 'en', setLang: () => {} });

export function useLang(): Lang {
  return useContext(LangContext).lang;
}

export function useSetLang(): (lang: Lang) => void {
  return useContext(LangContext).setLang;
}

/** The value for the current language from an { en, es } pair. */
export function useCopy<T>(copy: Record<Lang, T>): T {
  return copy[useLang()];
}

function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'es';
}

/** 'es' when the browser's first-choice language is Spanish (es, es-US, es-419, ...). */
function browserLang(): Lang | null {
  const first = navigator.languages?.[0] ?? navigator.language;
  return first?.toLowerCase().startsWith('es') ? 'es' : null;
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Private browsing or blocked storage: just don't remember.
    }
    const initial = isLang(fromUrl) ? fromUrl : isLang(saved) ? saved : (browserLang() ?? 'en');
    if (initial !== 'en') setLangState(initial);
  }, []);

  // Screen readers and browser translation read the page's language from <html lang>.
  useEffect(() => {
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = 'en';
    };
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not remembered, but the switch still happens.
    }
    // Keep the address shareable in the language being read.
    const url = new URL(window.location.href);
    if (next === 'es') url.searchParams.set('lang', 'es');
    else url.searchParams.delete('lang');
    window.history.replaceState(window.history.state, '', url);
  }, []);

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}
