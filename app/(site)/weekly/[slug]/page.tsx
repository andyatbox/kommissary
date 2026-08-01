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

type PostDoc = {
  title: string;
  date?: string;
  description?: string;
  thumbnail?: SanityGalleryImage | null;
  sections?: PageSection[];
};

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  title,
  date,
  description,
  "thumbnail": thumbnail{ asset, hotspot, crop, alt, "lqip": asset->metadata.lqip },
  ${SECTIONS_PROJECTION}
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
            <Reveal key={section._key}>
              <SectionRenderer section={section} />
            </Reveal>
          ))}
        </div>
      ) : null}

      {/* Back to the index */}
      <div className="mx-auto mt-16 w-full max-w-3xl px-6 text-center sm:px-8">
        <a
          href="/weekly"
          className="font-spirit text-[#ff6666] underline decoration-[#ff6666]/40 underline-offset-4 transition-colors hover:text-[#ffcf33]"
        >
          ← All of Kommissary Weekly
        </a>
      </div>
    </main>
  );
}
