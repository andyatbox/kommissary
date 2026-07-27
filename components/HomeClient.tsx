'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Overlay from '@/components/Overlay';
import { useUX, type HomeContent } from '@/lib/store';

const Experience = dynamic(() => import('@/components/Experience'), { ssr: false });

export default function HomeClient({ content }: { content: HomeContent }) {
  // Hydrate the store synchronously (before the 3D children mount) so the scene
  // builds from the real content on its first render — no rebuild flash.
  useState(() => {
    useUX.setState({ content });
    return null;
  });

  // Fixed + overflow-hidden isolates the 3D canvas from document scroll, so the
  // homepage never scrolls even though the global body no longer locks overflow
  // (content pages need to scroll).
  return (
    <main className="fixed inset-0 select-none overflow-hidden overscroll-none">
      <Experience />
      <Overlay />
    </main>
  );
}
