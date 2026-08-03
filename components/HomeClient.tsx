'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Overlay from '@/components/Overlay';
import CanvasErrorBoundary from '@/components/CanvasErrorBoundary';
import type { TeaserPost } from '@/components/weekly/WeeklyGrid';
import { useUX, type HomeContent } from '@/lib/store';

const Experience = dynamic(() => import('@/components/Experience'), { ssr: false });

export default function HomeClient({
  content,
  latestWeekly,
}: {
  content: HomeContent;
  latestWeekly: TeaserPost[];
}) {
  // Hydrate the store synchronously (before the 3D children mount) so the scene
  // builds from the real content on its first render — no rebuild flash.
  useState(() => {
    useUX.setState({ content });
    return null;
  });

  // Fixed + overflow-hidden isolates the 3D canvas from document scroll, so the
  // homepage never scrolls even though the global body no longer locks overflow
  // (content pages need to scroll). touch-none stops iOS Safari's native
  // rubber-band/elastic bounce on any touch here (not just over the canvas, which
  // already had it — the Overlay/Nav sit on top and need the same opt-out) so it
  // can't fight the custom touch-driven camera scroll in CameraRig.tsx.
  return (
    <main className="fixed inset-0 touch-none select-none overflow-hidden overscroll-none">
      <CanvasErrorBoundary>
        <Experience />
      </CanvasErrorBoundary>
      <Overlay latestWeekly={latestWeekly} />
    </main>
  );
}
