import { client } from '@/sanity/lib/client';

/**
 * Kai's knowledge base: the whole site flattened to text, plus a sitemap of every
 * internal URL Kai is allowed to link to. Rebuilt from Sanity on a short TTL, so as
 * pages/sections/moments are added or edited in the Studio, Kai stays aware without
 * a redeploy.
 */

/** How long a built knowledge snapshot is reused before re-fetching from Sanity. */
const TTL_MS = 5 * 60 * 1000;

type Span = { text?: string };
type Block = { _type?: string; style?: string; children?: Span[] };

/** Flattens portable text to plain text (headings kept as their own lines). */
function plain(blocks?: Block[] | null): string {
  return (blocks ?? [])
    .map((b) =>
      b._type === 'block' ? (b.children ?? []).map((c) => c.text ?? '').join('') : ''
    )
    .filter(Boolean)
    .join('\n');
}

type PageSectionDoc = {
  _type?: string;
  content?: Block[];
  column1?: Block[];
  column2?: Block[];
  column3?: Block[];
  caption?: string;
};

type PageDoc = {
  title?: string;
  slug?: string;
  description?: string;
  navGroup?: string;
  sections?: PageSectionDoc[] | null;
};

type KnowledgeData = {
  settings?: { title?: string; description?: string } | null;
  homepage?: {
    sentence?: string;
    pills?: { label?: string; title?: string; body?: Block[] }[] | null;
  } | null;
  story?: {
    title?: string;
    statsHeading?: string;
    statsUnit?: string;
    stats?: { year?: string; value?: string }[] | null;
  } | null;
  moments?: { period?: string; title?: string; body?: string }[] | null;
  pages?: PageDoc[] | null;
};

const QUERY = `{
  "settings": *[_type == "siteSettings"][0]{ title, description },
  "homepage": *[_type == "homepage"][0]{ sentence, "pills": pills[]{ label, title, body } },
  "story": *[_type == "ourStoryPage"][0]{ title, statsHeading, statsUnit, "stats": stats[]{ year, value } },
  "moments": *[_type == "moment"]|order(orderRank){ period, title, body },
  "pages": *[_type == "page" && defined(slug.current)]|order(orderRank){
    title,
    "slug": slug.current,
    description,
    navGroup,
    sections[]{
      _type,
      _type == "bodyCopy" => { content },
      _type == "gridCopy" => { column1, column2, column3 },
      _type == "videoEmbed" => { caption }
    }
  }
}`;

function sectionText(s: PageSectionDoc): string {
  switch (s._type) {
    case 'bodyCopy':
      return plain(s.content);
    case 'gridCopy':
      return [plain(s.column1), plain(s.column2), plain(s.column3)].filter(Boolean).join('\n');
    case 'videoEmbed':
      return s.caption ? `Video: ${s.caption}` : '';
    default:
      return '';
  }
}

/** Minimal fallback if Sanity is unreachable, so Kai still knows the site's shape. */
const FALLBACK = `SITEMAP (the ONLY URLs you may link to):
- / — Homepage: an interactive 3D introduction to Kommissary.
- /our-story — Our Story & Timeline: Kommissary's history from 1984 to today.
- /contact — Contact Us.

SITE CONTENT:
Kommissary is a progressive, minority-run purveyor of chef-crafted meals and a
logistics leader serving the communities of New York City.`;

function build(data: KnowledgeData): string {
  const lines: string[] = [];
  const pages = data.pages ?? [];

  // --- Sitemap: every internal URL Kai may recommend. ---
  lines.push('SITEMAP (the ONLY URLs you may link to):');
  lines.push('- / — Homepage: an interactive 3D introduction to Kommissary.');
  lines.push(
    "- /our-story — Our Story & Timeline: Kommissary's history and growth from 1984 to today, plus yearly meals-served figures."
  );
  for (const p of pages) {
    if (!p.slug || p.slug === 'our-story') continue;
    const desc = p.description ? `: ${p.description}` : '';
    lines.push(`- /${p.slug} — ${p.title ?? p.slug}${desc}`);
  }
  lines.push('');

  // --- Content, page by page. ---
  lines.push('SITE CONTENT:');
  const s = data.settings;
  if (s?.description) lines.push(`About Kommissary: ${s.description}`);
  if (data.homepage?.sentence) lines.push(`\nHomepage statement: ${data.homepage.sentence}`);
  for (const pill of data.homepage?.pills ?? []) {
    const body = plain(pill.body);
    if (pill.title || body) {
      lines.push(`\n[Homepage — ${pill.title ?? pill.label}]`);
      if (body) lines.push(body);
    }
  }

  if (data.moments?.length) {
    lines.push('\n[/our-story — Our Story & Timeline]');
    for (const m of data.moments) {
      lines.push(`${m.period ?? ''} ${m.title ?? ''}: ${m.body ?? ''}`.trim());
    }
    if (data.story?.stats?.length) {
      const unit = data.story.statsUnit ?? 'Meals';
      lines.push(
        `${data.story.statsHeading ?? 'Millions Served'}: ` +
          data.story.stats.map((st) => `${st.year}: ${st.value} ${unit}`).join(', ')
      );
    }
  }

  for (const p of pages) {
    if (!p.slug || p.slug === 'our-story') continue;
    const text = (p.sections ?? []).map(sectionText).filter(Boolean).join('\n');
    lines.push(`\n[/${p.slug} — ${p.title ?? p.slug}]`);
    if (p.description) lines.push(p.description);
    if (text) lines.push(text);
    if (!p.description && !text) lines.push('(Page exists; detailed content coming soon.)');
  }

  return lines.join('\n');
}

let cache: { text: string; at: number } | null = null;

/** The current knowledge snapshot (cached ~5 min per server instance). */
export async function getKnowledge(): Promise<string> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.text;
  try {
    const data = await client.fetch<KnowledgeData>(QUERY);
    cache = { text: build(data ?? {}), at: Date.now() };
  } catch {
    // Keep a stale snapshot if we have one; otherwise fall back to the minimal map.
    if (!cache) cache = { text: FALLBACK, at: Date.now() };
    else cache.at = Date.now();
  }
  return cache.text;
}
