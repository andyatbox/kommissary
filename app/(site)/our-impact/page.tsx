import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { client } from '@/sanity/lib/client';
import ImpactSlider from '@/components/impact/ImpactSlider';
import { IMPACT_QUERY, slidesFromSections, type ImpactPageDoc } from '@/lib/impact';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, pageMetadata, shareImage } from '@/lib/seo';

// Re-fetch periodically so published content changes show without a redeploy.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await client.fetch<ImpactPageDoc | null>(IMPACT_QUERY);
  if (!page) return {};
  // Link previews show the first slide's picture.
  const pic = page.sections?.flatMap((s) => s.content ?? []).find((b) => b._type === 'image' && b.asset?._ref);
  return pageMetadata({
    title: `${page.title} · Kommissary`,
    description: page.description,
    path: '/our-impact',
    image: pic ? shareImage(pic, pic.alt || page.title) : undefined,
  });
}

/**
 * Our Impact: the Page's Body Copy sections as a full-screen, endlessly looping slider.
 * The copy is edited on the Page in Studio as usual; see lib/impact.ts for how each
 * section becomes a slide.
 */
export default async function OurImpactPage() {
  const page = await client.fetch<ImpactPageDoc | null>(IMPACT_QUERY);
  if (!page) notFound();
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(page.title, '/our-impact')} />
      <ImpactSlider title={page.title} slides={slidesFromSections(page.sections)} />
    </>
  );
}
