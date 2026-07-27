'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Overlay from '@/components/Overlay';
import { useUX, type HomeContent } from '@/lib/store';
import type { NavMenu } from '@/lib/nav';

const Experience = dynamic(() => import('@/components/Experience'), { ssr: false });

export default function HomeClient({ content, nav }: { content: HomeContent; nav: NavMenu[] }) {
  // Hydrate the store synchronously (before the 3D children mount) so the scene
  // builds from the real content on its first render — no rebuild flash.
  useState(() => {
    useUX.setState({ content, nav });
    return null;
  });

  return (
    <main className="h-dvh w-screen select-none">
      <Experience />
      <Overlay />
    </main>
  );
}
