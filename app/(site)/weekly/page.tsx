import type { Metadata } from 'next';
import { client } from '@/sanity/lib/client';
import { galleryImageFromSanity, type SanityGalleryImage } from '@/lib/galleryImage';
import Reveal from '@/components/Reveal';
import WeeklyGrid, { type TeaserPost } from '@/components/weekly/WeeklyGrid';

export const revalidate = 60;

const TITLE = 'Kommissary Weekly · Kommissary';
const DESCRIPTION = 'Stories, updates, and dispatches from Kommissary.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION },
};

const PER_PAGE = 9;
const TEASER_SIZES = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw';

type RawPost = {
  slug: string;
  title: string;
  date?: string;
  thumb?: SanityGalleryImage | null;
};

const QUERY = `{
  "total": count(*[_type == "post" && defined(slug.current)]),
  "posts": *[_type == "post" && defined(slug.current)] | order(date desc) [$start...$end] {
    title,
    "slug": slug.current,
    date,
    "thumb": thumbnail{ asset, hotspot, crop, alt, "lqip": asset->metadata.lqip }
  }
}`;

function formatDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default async function WeeklyIndexPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const current = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const start = (current - 1) * PER_PAGE;

  let total = 0;
  let posts: TeaserPost[] = [];
  try {
    const data = await client.fetch<{ total: number; posts: RawPost[] }>(QUERY, {
      start,
      end: start + PER_PAGE,
    });
    total = data?.total ?? 0;
    posts = (data?.posts ?? []).map((p) => ({
      slug: p.slug,
      title: p.title,
      date: formatDate(p.date),
      image: p.thumb ? galleryImageFromSanity(p.thumb, TEASER_SIZES) : null,
    }));
  } catch {
    // leave empty
  }

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <main className="min-h-dvh px-6 pb-28 pt-[120px] sm:px-8 md:pt-[168px]">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <h1 className="font-spirit text-4xl font-medium text-[#ff6666] sm:text-5xl md:text-center">
            Kommissary Weekly
          </h1>
        </Reveal>

        {posts.length ? (
          <Reveal className="mt-12 md:mt-16">
            <WeeklyGrid posts={posts} />
          </Reveal>
        ) : (
          <p className="mt-12 text-center text-lg text-white/60">No posts yet — check back soon.</p>
        )}

        {totalPages > 1 && (
          <nav
            aria-label="Pagination"
            className="font-spirit mt-14 flex items-center justify-center gap-2 text-[#ff6666]"
          >
            {current > 1 && (
              <a
                href={`/weekly${current - 1 === 1 ? '' : `?page=${current - 1}`}`}
                className="rounded-md border border-[#ff6666] px-4 py-2 transition-colors hover:bg-[#ff6666] hover:text-[#000666]"
              >
                ← Prev
              </a>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <a
                key={n}
                href={`/weekly${n === 1 ? '' : `?page=${n}`}`}
                aria-current={n === current ? 'page' : undefined}
                className={`rounded-md px-4 py-2 transition-colors ${
                  n === current
                    ? 'bg-[#ff6666] text-[#000666]'
                    : 'border border-[#ff6666] hover:bg-[#ff6666] hover:text-[#000666]'
                }`}
              >
                {n}
              </a>
            ))}
            {current < totalPages && (
              <a
                href={`/weekly?page=${current + 1}`}
                className="rounded-md border border-[#ff6666] px-4 py-2 transition-colors hover:bg-[#ff6666] hover:text-[#000666]"
              >
                Next →
              </a>
            )}
          </nav>
        )}
      </div>
    </main>
  );
}
