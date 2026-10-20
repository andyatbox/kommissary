import type { Metadata } from 'next';
import { client } from '@/sanity/lib/client';
import Footer from '@/components/Footer';
import ContinueOn from '@/components/ContinueOn';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';
import CanvasHost from '@/components/story/CanvasHost';
import SmoothScroll from '@/components/story/SmoothScroll';
import Timeline from '@/components/story/Timeline';
import MillionsServed from '@/components/story/MillionsServed';
import {
  getMoments,
  momentFromSanity,
  type Moment,
  type SanityMoment,
} from '@/lib/story/timeline';
import { getStats, type Stat } from '@/lib/story/stats';

// Re-fetch periodically so published content changes show without a redeploy.
export const revalidate = 60;

const TITLE = 'Our Story & Timeline · Kommissary';
const DESCRIPTION =
  'From a single food truck to a citywide kitchen and logistics operation — the story of Kommissary, a progressive, minority-run purveyor of chef-crafted meals serving the communities of New York City.';

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: '/our-story' });

// Moments in the drag-orderable list order. Models are hard-set in lib/story/timeline.ts
// (not read from Sanity).
const MOMENTS_QUERY = `*[_type == "moment"]|order(orderRank){
  "id": _id,
  period,
  title,
  body
}`;

const PAGE_QUERY = `*[_type == "ourStoryPage"][0]{
  title,
  statsHeading,
  statsUnit,
  "stats": stats[]{ year, value }
}`;

type PageContent = {
  title?: string;
  statsHeading?: string;
  statsUnit?: string;
  stats?: Stat[] | null;
};

export default async function OurStoryPage() {
  let moments: Moment[];
  let stats: Stat[];
  let page: PageContent | null = null;

  try {
    const [rawMoments, rawPage] = await Promise.all([
      client.fetch<SanityMoment[] | null>(MOMENTS_QUERY),
      client.fetch<PageContent | null>(PAGE_QUERY),
    ]);
    page = rawPage;
    moments = rawMoments && rawMoments.length ? rawMoments.map(momentFromSanity) : await getMoments();
    stats = page?.stats && page.stats.length ? page.stats : await getStats();
  } catch {
    // Sanity unreachable — render the local fallback content.
    [moments, stats] = await Promise.all([getMoments(), getStats()]);
  }

  return (
    <>
      <JsonLd data={breadcrumbJsonLd('Our Story', '/our-story')} />
      {/* Fixed WebGL backdrop; the DOM above owns every pointer interaction. */}
      <CanvasHost />
      <SmoothScroll>
        <main>
          <Timeline moments={moments} heading={page?.title || undefined} />
          <MillionsServed
            stats={stats}
            heading={page?.statsHeading || undefined}
            unit={page?.statsUnit || undefined}
          />
        </main>
        {/* Inside the scroll rig so they move with the page (see SiteFooter). */}
        <div className="pb-16 pt-8">
          <ContinueOn from="/our-story" />
        </div>
        <Footer />
      </SmoothScroll>
      {/* The shared header comes from app/(site)/layout.tsx — not rendered here. */}
    </>
  );
}
