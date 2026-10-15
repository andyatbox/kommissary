/**
 * Writes sanity/seed/outreach-pages.ndjson: Sanity documents for the Nutrition Box,
 * Educators and Community Leaders pages, filled with their built-in copy (each page's
 * components/<page>/copy.ts), so editors start from exactly what the pages show today.
 *
 *   node scripts/seed-outreach-pages.mts
 *   npx sanity dataset import sanity/seed/outreach-pages.ndjson production --missing
 *
 * `--missing` imports only documents that don't exist yet, so re-running it can never
 * overwrite an editor's changes. Runs on Node's built-in TypeScript support (Node 23.6+).
 */
import { writeFileSync } from 'node:fs';
import * as nutritionBox from '../components/nutrition-box/copy.ts';
import * as educator from '../components/educator/copy.ts';
import * as dycd from '../components/dycd/copy.ts';

type Json = string | number | boolean | null | undefined | Json[] | { [k: string]: Json };

// Which English/Spanish pair type each field is, mirroring sanity/schemaTypes/outreachPages.ts.
const LONG_TEXT = new Set(['intro', 'copy', 'a', 'help']);
const ITEM_TYPE: Record<string, string> = { features: 'outreachFeature', points: 'outreachPoint', faqs: 'faqItem' };
const pairType = (key: string, inList: boolean) =>
  LONG_TEXT.has(key) || key === 'steps' || (key === 'headline' && !inList) ? 'localeText' : 'localeString';

// Built-in order of the feature icons (components/nutrition-box/Features.tsx).
const FEATURE_ICONS = ['stethoscope', 'pantry-box', 'apple-on-book', 'halal-kosher', 'delivery-truck', 'bronx-map-pin'];

/** Zips the English and Spanish copy into Sanity's side-by-side shape. */
function zip(en: Json, es: Json, key: string, path: string): Json {
  if (typeof en === 'string') {
    if (typeof es !== 'string') throw new Error(`${path}: English is text, Spanish isn't`);
    return { _type: pairType(key, false), en, es };
  }
  if (Array.isArray(en)) {
    if (!Array.isArray(es) || es.length !== en.length) {
      throw new Error(`${path}: ${en.length} English items, ${Array.isArray(es) ? es.length : 'no'} Spanish`);
    }
    return en.map((item, i) => {
      const _key = `${key}-${i}`;
      if (typeof item === 'string') {
        return { _type: pairType(key, true), _key, en: item, es: es[i] as string };
      }
      const obj = zip(item, es[i], key, `${path}[${i}]`) as Record<string, Json>;
      if (key === 'features' && !obj.icon) obj.icon = FEATURE_ICONS[i];
      return { _type: ITEM_TYPE[key], _key, ...obj };
    });
  }
  if (en && typeof en === 'object') {
    const out: Record<string, Json> = {};
    for (const k of Object.keys(en)) {
      out[k] = zip(en[k], (es as Record<string, Json>)?.[k], k, `${path}.${k}`);
    }
    return out;
  }
  if (en !== es) throw new Error(`${path}: English ${String(en)} vs Spanish ${String(es)}`);
  return en; // booleans (wide, somos) are the same in both languages
}

const section = (copy: Record<'en' | 'es', unknown>, name: string) => zip(copy.en as Json, copy.es as Json, name, name);

const docs = [
  {
    _id: 'nutritionBoxPage',
    _type: 'nutritionBoxPage',
    hero: section(nutritionBox.HERO, 'hero'),
    features: section(nutritionBox.FEATURES, 'features'),
    howItWorks: section(nutritionBox.HOW_IT_WORKS, 'howItWorks'),
    trust: section(nutritionBox.TRUST, 'trust'),
    faq: section(nutritionBox.FAQ, 'faq'),
  },
  ...[
    { id: 'educatorPage', name: 'Educators (/educator)', copy: educator },
    { id: 'dycdPage', name: 'Community Leaders (/dycd)', copy: dycd },
  ].map(({ id, name, copy }) => ({
    _id: id,
    _type: 'partnerOutreachPage',
    internalName: name,
    hero: section(copy.HERO, 'hero'),
    features: section(copy.FEATURES, 'features'),
    qualifications: section(copy.QUALIFICATIONS, 'qualifications'),
    letsConnect: section(copy.LETS_CONNECT, 'letsConnect'),
  })),
];

const out = new URL('../sanity/seed/outreach-pages.ndjson', import.meta.url);
writeFileSync(out, docs.map((d) => JSON.stringify(d)).join('\n') + '\n');
console.log(`Wrote ${docs.length} documents to sanity/seed/outreach-pages.ndjson`);
