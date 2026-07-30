import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { PortableTextBlock } from '@portabletext/types';
import { client } from '@/sanity/lib/client';
import Reveal from '@/components/Reveal';
import SectionRenderer, { type PageSection } from '@/components/sections/SectionRenderer';

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

// Section projection: pull only the fields each section type needs, resolving image
// asset URLs/LQIP for sliders.
const SECTIONS = `sections[]{
  _key,
  _type,
  _type == "bodyCopy" => { content },
  _type == "videoEmbed" => { url, caption },
  _type == "imageSlider" => {
    "images": images[]{ asset, hotspot, crop, alt, "lqip": asset->metadata.lqip }
  },
  _type == "gridCopy" => { columns, column1, column2, column3 },
  _type == "htmlEmbed" => { code }
}`;

const PAGE_QUERY = `*[_type == "page" && slug.current == $slug][0]{
  title,
  description,
  body,
  ${SECTIONS}
}`;

const SLUGS_QUERY = `*[_type == "page" && defined(slug.current)].slug.current`;

/** Vimeo has no thumbnail-by-URL convention (unlike YouTube), so fetch its poster via
 *  oEmbed server-side and cache it for a day. Returns undefined on any failure. */
async function vimeoPoster(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}&width=1280`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return undefined;
    const data = (await res.json()) as { thumbnail_url?: string };
    return data.thumbnail_url;
  } catch {
    return undefined;
  }
}

// Slugs with a dedicated route of their own (a bespoke experience rather than the
// generic block template). The explicit route shadows [slug] anyway, but excluding
// them here keeps this template from also prerendering them.
const DEDICATED_ROUTES = new Set(['our-story']);

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

  // Resolve Vimeo posters server-side (other providers derive theirs on the client).
  const sections: PageSection[] = await Promise.all(
    rawSections.map(async (s) =>
      s._type === 'videoEmbed' && s.url.includes('vimeo.com')
        ? { ...s, poster: await vimeoPoster(s.url) }
        : s
    )
  );

  return (
    // Full-width main (no single max-width wrapper): each section owns its width, so
    // sliders/grids can go full-bleed while copy/video stay in a readable column.
    // Top padding clears the fixed header (25px bar + nav + logo).
    <main className="min-h-dvh pb-28 pt-[120px] md:pt-[168px]">
      <Reveal>
        <div className="mx-auto w-full max-w-3xl px-6 sm:px-8">
          <h1 className="font-spirit text-4xl font-medium text-[#ff6666] sm:text-5xl md:text-center">
            {page.title}
          </h1>
        </div>
      </Reveal>

      {sections.length ? (
        <div className="mt-12 space-y-16 md:mt-16 md:space-y-24">
          {sections.map((section) => (
            <Reveal key={section._key}>
              <SectionRenderer section={section} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="mx-auto w-full max-w-3xl px-6 pt-8 sm:px-8">
          <p className="text-lg text-white/60">Content coming soon.</p>
        </div>
      )}
    </main>
  );
}
