import type { Metadata } from 'next';
import CanvasHost from '@/components/story/CanvasHost';
import SmoothScroll from '@/components/story/SmoothScroll';
import Timeline from '@/components/story/Timeline';
import MillionsServed from '@/components/story/MillionsServed';
import { getMoments } from '@/lib/story/timeline';
import { getStats } from '@/lib/story/stats';

const TITLE = 'Our Story & Timeline · Kommissary';
const DESCRIPTION =
  'From a single food truck to a citywide kitchen and logistics operation — the story of Kommissary, a progressive, minority-run purveyor of chef-crafted meals serving the communities of New York City.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

export default async function OurStoryPage() {
  const [moments, stats] = await Promise.all([getMoments(), getStats()]);

  return (
    <>
      {/* Fixed WebGL backdrop; the DOM above owns every pointer interaction. */}
      <CanvasHost />
      <SmoothScroll>
        <main>
          <Timeline moments={moments} />
          <MillionsServed stats={stats} />
        </main>
      </SmoothScroll>
      {/* The shared header comes from app/(site)/layout.tsx — not rendered here. */}
    </>
  );
}
