'use client';

import { createContext, Fragment, isValidElement, useContext, type ReactNode } from 'react';

/**
 * Editable copy for the Nutrition Box, Educators and Community Leaders pages.
 *
 * Each page's built-in English and Spanish copy lives in its `copy.ts`. The page's Sanity
 * document (see sanity/schemaTypes/outreachPages.ts) can override any of it, field by
 * field: whatever an editor has filled in wins, anything left empty falls back to the
 * built-in text. So a page renders exactly as before when Sanity has nothing, and a
 * half-finished edit can never blank a section.
 *
 * Copy can contain placeholders like "Call us at {phone}". Each section fills in its own
 * (a link, a button); see the `tokens` each component passes. An unknown placeholder is
 * shown as written, so a typo stays visible instead of vanishing.
 */

export type Lang = 'en' | 'es';
export type Tokens = Record<string, ReactNode>;

/** A section's copy with its text turned renderable: placeholders become elements. */
export type Rich<T> = T extends string
  ? ReactNode
  : T extends readonly (infer U)[]
    ? Rich<U>[]
    : T extends object
      ? { [K in keyof T]: Rich<T[K]> }
      : T;

type Doc = Record<string, unknown>;

const CmsCopyContext = createContext<Doc | null>(null);

/** Supplies a page's Sanity document to its sections. `doc` is null when Sanity has none. */
export function CmsCopyProvider({ doc, children }: { doc: Doc | null; children: ReactNode }) {
  return <CmsCopyContext.Provider value={doc}>{children}</CmsCopyContext.Provider>;
}

/** One section's copy in the current language: the editor's where filled in, else built-in. */
export function useSectionCopy<T>(key: string, builtIn: Record<Lang, T>, lang: Lang): T;
export function useSectionCopy<T>(key: string, builtIn: Record<Lang, T>, lang: Lang, tokens: Tokens): Rich<T>;
export function useSectionCopy<T>(key: string, builtIn: Record<Lang, T>, lang: Lang, tokens?: Tokens) {
  const doc = useContext(CmsCopyContext);
  return resolve(builtIn[lang], doc?.[key], lang, tokens);
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && !isValidElement(v);

/** A Sanity localeString/localeText value: { en, es } (plus Sanity's own _type). */
function isLocale(v: unknown): v is { en?: string; es?: string } {
  if (!isPlainObject(v)) return false;
  const keys = Object.keys(v).filter((k) => !k.startsWith('_'));
  return keys.length > 0 && keys.every((k) => k === 'en' || k === 'es');
}

const isFilled = (v: unknown) => v !== undefined && v !== null && !(typeof v === 'string' && !v.trim());

/** A localized value in `lang`, falling back to English: a new item an editor has only
 *  written in English shows in English on the Spanish page rather than blank. */
function pick(v: unknown, lang: Lang): unknown {
  if (!isLocale(v)) return v;
  return isFilled(v[lang]) ? v[lang] : v.en;
}

function resolve(builtIn: unknown, cms: unknown, lang: Lang, tokens?: Tokens): unknown {
  const value = pick(cms, lang);

  // Lists: the editor's list replaces the built-in one whole (so a deleted item stays
  // deleted). Within an item, an empty field takes the built-in item's at that position.
  if (Array.isArray(builtIn) || Array.isArray(value)) {
    const fromCms = Array.isArray(value) && value.length > 0;
    const items: unknown[] = fromCms ? (value as unknown[]) : Array.isArray(builtIn) ? builtIn : [];
    const fallbacks = Array.isArray(builtIn) ? builtIn : [];
    return items.map((item, i) => resolve(fallbacks[i], fromCms ? item : undefined, lang, tokens));
  }

  if (isPlainObject(builtIn) || isPlainObject(value)) {
    const a = isPlainObject(builtIn) ? builtIn : {};
    const b = isPlainObject(value) ? value : {};
    const out: Record<string, unknown> = {};
    for (const k of Array.from(new Set([...Object.keys(a), ...Object.keys(b)]))) {
      if (!k.startsWith('_')) out[k] = resolve(a[k], b[k], lang, tokens);
    }
    return out;
  }

  const leaf = isFilled(value) ? value : builtIn;
  return typeof leaf === 'string' && tokens ? renderTokens(leaf, tokens) : leaf;
}

/** "Call us at {phone}." -> ['Call us at ', <Phone/>, '.']. Unknown placeholders stay as typed. */
export function renderTokens(text: string, tokens: Tokens): ReactNode {
  const parts = text.split(/\{(\w+)\}/);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 0 ? part : part in tokens ? <Fragment key={i}>{tokens[part]}</Fragment> : `{${part}}`,
  );
}
