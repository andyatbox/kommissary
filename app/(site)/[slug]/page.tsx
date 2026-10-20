import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { PortableTextBlock } from '@portabletext/types';
import { client } from '@/sanity/lib/client';
import Reveal from '@/components/Reveal';
import ContinueOn from '@/components/ContinueOn';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, excerpt, pageMetadata, shareImage } from '@/lib/seo';
import SectionRenderer, { type PageSection } from '@/components/sections/SectionRenderer';
import { SECTIONS_PROJECTION, enrichSections } from '@/lib/sections';

// Re-fetch periodically so published content changes show without a redeploy.
export const revalidate = 60;

type PageDoc = {
  title: string;
  description?: string;
  sections?: PageSection[];
  /** Legacy single body field, before the page-builder. Rendered as a Body Copy
   *  section until the content is migrated into `sections`. */
  body?: PortableTextBlock[];
};

const PAGE_QUERY = `*[_type == "page" && slug.current == $slug][0]{
  title,
  description,
  body,
  ${SECTIONS_PROJECTION}
}`;

const SLUGS_QUERY = `*[_type == "page" && defined(slug.current)].slug.current`;

// Slugs with a dedicated route of their own (a bespoke experience rather than the
// generic block template). The explicit route shadows [slug] anyway, but excluding
// them here keeps this template from also prerendering them.
// For most of these, a Page document with the slug only puts the page in the nav (its copy
// is edited elsewhere: Our Story Page, or the Nutrition Box / Educators / Community
// Leaders documents for bronx, educator and dycd). our-impact is the exception: its route
// reads the Page's own Body Copy sections as the slides of its slider.
const DEDICATED_ROUTES = new Set([
  'our-story',
  'our-impact',
  'weekly',
  'bronx',
  'educator',
  'dycd',
  'privacy',
]);

// Pre-render every page at build; new/edited pages still resolve on demand (revalidate).
export async function generateStaticParams() {
  try {
    const slugs = await client.fetch<string[] | null>(SLUGS_QUERY);
    return (slugs ?? []).filter((slug) => !DEDICATED_ROUTES.has(slug)).map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const page = await client.fetch<PageDoc | null>(PAGE_QUERY, { slug: params.slug });
  if (!page) return {};
  const sections = page.sections ?? [];
  const pic = firstImage(sections);
  return pageMetadata({
    title: `${page.title} · Kommissary`,
    // Studio's meta description, or the page's opening text if it has none.
    description: page.description || excerpt(firstText(sections) ?? page.body) || undefined,
    path: `/${params.slug}`,
    image: pic ? shareImage(pic, pic.alt || page.title) : undefined,
  });
}

type SharePic = { asset?: { _ref?: string } | null; alt?: string | null };
type Block = { _type?: string; asset?: { _ref?: string } } & SharePic;

/** The page's first picture, in reading order, for link previews. */
function firstImage(sections: PageSection[]): SharePic | null {
  const inBlocks = (blocks?: unknown[]) =>
    ((blocks ?? []) as Block[]).find((b) => b._type === 'image' && b.asset?._ref) ?? null;
  for (const s of sections) {
    const found =
      s._type === 'singleImage'
        ? s.image?.asset?._ref
          ? s.image
          : null
        : s._type === 'imageSlider'
          ? (s.images ?? []).find((i) => i.asset?._ref) ?? null
          : s._type === 'bodyCopy'
            ? inBlocks(s.content)
            : s._type === 'gridCopy'
              ? inBlocks(s.column1) ?? inBlocks(s.column2) ?? inBlocks(s.column3)
              : null;
    if (found) return found;
  }
  return null;
}

/** The first section with running text, for a description fallback. */
function firstText(sections: PageSection[]) {
  for (const s of sections) {
    if (s._type === 'bodyCopy' && s.content?.length) return s.content;
    if (s._type === 'gridCopy' && s.column1?.length) return s.column1;
  }
  return null;
}

export default async function SlugPage({ params }: { params: { slug: string } }) {
  const page = await client.fetch<PageDoc | null>(PAGE_QUERY, { slug: params.slug });
  if (!page) notFound();

  // Prefer the new page-builder sections; fall back to the legacy body as one Body
  // Copy section so un-migrated pages still render.
  const rawSections: PageSection[] =
    page.sections?.length
      ? page.sections
      : page.body?.length
        ? [{ _type: 'bodyCopy', _key: 'legacy-body', content: page.body }]
        : [];

  const sections = await enrichSections(rawSections);

  return (
    // Full-width main (no single max-width wrapper): each section owns its width, so
    // sliders/grids can go full-bleed while copy/video stay in a readable column.
    // Top padding clears the fixed header (25px bar + nav + logo).
    <main className="min-h-dvh pb-28 pt-[120px] md:pt-[168px]">
      <JsonLd data={breadcrumbJsonLd(page.title, `/${params.slug}`)} />
      <Reveal>
        <div className="mx-auto w-full max-w-3xl wide:max-w-4xl px-6 sm:px-8">
          <h1 className="text-balance text-center font-spirit text-5xl font-medium leading-[1.05] text-gold sm:text-6xl lg:text-7xl">
            {page.title}
          </h1>
        </div>
      </Reveal>

      {sections.length ? (
        <div className="mt-12 space-y-16 md:mt-16 md:space-y-24">
          {sections.map((section) => (
            // Body Copy's cream card blends against whatever's behind it (exclusion);
            // that only takes effect one level up from the card itself, on this wrapper.
            <Reveal
              key={section._key}
              className={section._type === 'bodyCopy' ? 'mix-blend-exclusion' : undefined}
            >
              <SectionRenderer section={section} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="mx-auto w-full max-w-3xl wide:max-w-4xl px-6 pt-8 sm:px-8">
          <p className="text-lg text-white/60">Content coming soon.</p>
        </div>
      )}

      <Reveal className="mt-24 md:mt-32">
        <ContinueOn from={`/${params.slug}`} />
      </Reveal>
    </main>
  );
}
