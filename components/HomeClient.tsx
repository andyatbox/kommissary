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

  return (
    <main className="h-dvh w-screen select-none">
      <Experience />
      <Overlay />
    </main>
  );
}
