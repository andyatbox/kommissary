import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { galleryImageFromSanity, type SanityGalleryImage } from '@/lib/galleryImage';
import { SECTIONS_PROJECTION, enrichSections } from '@/lib/sections';
import Reveal from '@/components/Reveal';
import SectionRenderer, { type PageSection } from '@/components/sections/SectionRenderer';
import ShareButtons from '@/components/weekly/ShareButtons';

export const revalidate = 60;

type Adjacent = { title: string; slug: string } | null;

type PostDoc = {
  title: string;
  date?: string;
  description?: string;
  thumbnail?: SanityGalleryImage | null;
  sections?: PageSection[];
  prev?: Adjacent;
  next?: Adjacent;
};

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  title,
  date,
  description,
  "thumbnail": thumbnail{ asset, hotspot, crop, alt, "lqip": asset->metadata.lqip },
  ${SECTIONS_PROJECTION},
  "prev": *[_type == "post" && defined(slug.current) && date < ^.date] | order(date desc)[0]{ title, "slug": slug.current },
  "next": *[_type == "post" && defined(slug.current) && date > ^.date] | order(date asc)[0]{ title, "slug": slug.current }
}`;

const SLUGS_QUERY = `*[_type == "post" && defined(slug.current)].slug.current`;

function formatDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export async function generateStaticParams() {
  try {
    const slugs = await client.fetch<string[] | null>(SLUGS_QUERY);
    return (slugs ?? []).map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await client.fetch<PostDoc | null>(POST_QUERY, { slug: params.slug });
  if (!post) return {};
  const title = `${post.title} · Kommissary Weekly`;
  const image = post.thumbnail?.asset ? urlFor(post.thumbnail).width(1200).height(630).fit('crop').url() : undefined;
  return {
    title,
    description: post.description,
    openGraph: {
      title,
      description: post.description,
      type: 'article',
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await client.fetch<PostDoc | null>(POST_QUERY, { slug: params.slug });
  if (!post) notFound();

  const sections = await enrichSections(post.sections ?? []);
  const hero = post.thumbnail?.asset ? galleryImageFromSanity(post.thumbnail, '(min-width: 768px) 768px, 100vw') : null;

  return (
    <main className="min-h-dvh pb-28 pt-[120px] md:pt-[168px]">
      {/* Header: date, title, share */}
      <Reveal>
        <header className="mx-auto w-full max-w-3xl px-6 text-center sm:px-8">
          {post.date && (
            <time className="font-spirit text-sm uppercase tracking-[0.2em] text-[#ff6666]">
              {formatDate(post.date)}
            </time>
          )}
          <h1 className="font-spirit mt-3 text-4xl font-medium text-[#ff6666] sm:text-5xl">
            {post.title}
          </h1>
          <div className="mt-6">
            <ShareButtons title={post.title} />
          </div>
        </header>
      </Reveal>

      {/* Feature image (the thumbnail), if set */}
      {hero && (
        <Reveal className="mx-auto mt-10 w-full max-w-4xl px-6 sm:px-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero.src}
            srcSet={hero.srcSet}
            sizes="(min-width: 896px) 896px, 100vw"
            alt={hero.alt}
            className="aspect-[16/9] w-full rounded-2xl object-cover"
            style={hero.objectPosition ? { objectPosition: hero.objectPosition } : undefined}
          />
        </Reveal>
      )}

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
      ) : null}

      {/* Post navigation: previous · all · next */}
      <nav
        aria-label="Post navigation"
        className="font-spirit mx-auto mt-16 flex w-full max-w-3xl flex-wrap items-center justify-center gap-3 px-6 sm:px-8"
      >
        {post.prev ? (
          <a href={`/weekly/${post.prev.slug}`} className={pill} aria-label={`Previous post: ${post.prev.title}`}>
            ← Previous Post
          </a>
        ) : (
          <span className={pillDisabled} aria-disabled="true">
            ← Previous Post
          </span>
        )}

        <a href="/weekly" className={pill}>
          All Posts
        </a>

        {post.next ? (
          <a href={`/weekly/${post.next.slug}`} className={pill} aria-label={`Next post: ${post.next.title}`}>
            Next Post →
          </a>
        ) : (
          <span className={pillDisabled} aria-disabled="true">
            Next Post →
          </span>
        )}
      </nav>
    </main>
  );
}

const pill =
  'rounded-full border border-[#ff6666] px-5 py-2.5 text-[#ff6666] transition-colors hover:bg-[#ff6666] hover:text-[#000666]';
const pillDisabled =
  'pointer-events-none rounded-full border border-[#ff6666]/25 px-5 py-2.5 text-[#ff6666]/30';
