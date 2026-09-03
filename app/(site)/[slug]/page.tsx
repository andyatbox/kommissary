import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { PortableTextBlock } from '@portabletext/types';
import { client } from '@/sanity/lib/client';
import Reveal from '@/components/Reveal';
import SectionRenderer, { type PageSection } from '@/components/sections/SectionRenderer';
import AnchorMenu from '@/components/AnchorMenu';
import { SECTIONS_PROJECTION, enrichSections } from '@/lib/sections';
import { collectAnchors } from '@/lib/anchors';

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
const DEDICATED_ROUTES = new Set(['our-story', 'weekly']);

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
  return {
    title: `${page.title} · Kommissary`,
    description: page.description,
    openGraph: { title: `${page.title} · Kommissary`, description: page.description },
  };
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
  // Built from whatever the editor has tagged; renders nothing when there's nothing.
  const anchors = collectAnchors(sections);

  return (
    // Full-width main (no single max-width wrapper): each section owns its width, so
    // sliders/grids can go full-bleed while copy/video stay in a readable column.
    // Top padding clears the fixed header (25px bar + nav + logo).
    <main className="min-h-dvh pb-28 pt-[120px] md:pt-[168px]">
      <Reveal>
        <div className="mx-auto w-full max-w-3xl wide:max-w-4xl px-6 sm:px-8">
          <h1 className="font-spirit text-4xl font-medium text-[#ff6666] sm:text-5xl md:text-center">
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

      <AnchorMenu anchors={anchors} />
    </main>
  );
}
