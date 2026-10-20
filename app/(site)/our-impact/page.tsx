import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { client } from '@/sanity/lib/client';
import ImpactSlider from '@/components/impact/ImpactSlider';
import { IMPACT_QUERY, slidesFromSections, type ImpactPageDoc } from '@/lib/impact';

// Re-fetch periodically so published content changes show without a redeploy.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await client.fetch<ImpactPageDoc | null>(IMPACT_QUERY);
  if (!page) return {};
  const title = `${page.title} · Kommissary`;
  return {
    title,
    description: page.description,
    openGraph: { title, description: page.description },
  };
}

/**
 * Our Impact: the Page's Body Copy sections as a full-screen, endlessly looping slider.
 * The copy is edited on the Page in Studio as usual; see lib/impact.ts for how each
 * section becomes a slide.
 */
export default async function OurImpactPage() {
  const page = await client.fetch<ImpactPageDoc | null>(IMPACT_QUERY);
  if (!page) notFound();
  return <ImpactSlider title={page.title} slides={slidesFromSections(page.sections)} />;
}
