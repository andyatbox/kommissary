/**
 * One-off migration: move each Page's legacy `body` into the new page-builder as a
 * single `bodyCopy` section, then remove `body`.
 *
 * Usage:
 *   1. Create a Sanity write token (manage → API → Tokens, Editor permission).
 *   2. Add it to .env.local as:  SANITY_API_WRITE_TOKEN=sk...
 *   3. Run:  node scripts/migrate-body-to-sections.mjs
 *
 * Safe to run more than once — pages with no `body` left are skipped.
 */
import { readFileSync } from 'node:fs';
import { createClient } from 'next-sanity';

// Minimal .env.local loader (so the token stays out of the shell/history).
function loadEnv() {
  try {
    for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* no .env.local — rely on the ambient environment */
  }
}
loadEnv();

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error('Missing SANITY_API_WRITE_TOKEN (add it to .env.local).');
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-10-01',
  token,
  useCdn: false,
});

const key = () => Math.random().toString(36).slice(2, 12);

const pages = await client.fetch(`*[_type == "page" && count(body) > 0]{ _id, body }`);
if (!pages.length) {
  console.log('Nothing to migrate — no pages with a legacy body.');
  process.exit(0);
}

let tx = client.transaction();
for (const p of pages) {
  tx = tx.patch(p._id, (patch) =>
    patch.set({ sections: [{ _type: 'bodyCopy', _key: key(), content: p.body }] }).unset(['body'])
  );
}
const res = await tx.commit();
console.log(`Migrated ${res.results.length} page(s): body → bodyCopy section.`);
