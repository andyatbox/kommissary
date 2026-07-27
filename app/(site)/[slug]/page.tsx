import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { PortableTextBlock } from '@portabletext/types';
import { client } from '@/sanity/lib/client';
import PortableBody from '@/components/PortableBody';

// Re-fetch periodically so published content changes show without a redeploy.
export const revalidate = 60;

type PageDoc = {
  title: string;
  description?: string;
  body?: PortableTextBlock[];
};

const PAGE_QUERY = `*[_type == "page" && slug.current == $slug][0]{
  title,
  description,
  body
}`;

const SLUGS_QUERY = `*[_type == "page" && defined(slug.current)].slug.current`;

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

  return (
    // Top padding clears the fixed header (25px bar + nav + logo).
    <main className="min-h-dvh px-6 pb-28 pt-[120px] sm:px-8 md:pt-[168px]">
      <article className="mx-auto max-w-2xl">
        <h1 className="font-spirit text-4xl font-medium text-[#ff6666] sm:text-5xl">
          {page.title}
        </h1>

        {page.body?.length ? (
          <div className="mt-8">
            <PortableBody value={page.body} />
          </div>
        ) : (
          <p className="mt-8 text-lg text-white/60">Content coming soon.</p>
        )}
      </article>
    </main>
  );
}
