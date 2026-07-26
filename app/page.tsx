'use client';

import dynamic from 'next/dynamic';
import Overlay from '@/components/Overlay';

const Experience = dynamic(() => import('@/components/Experience'), { ssr: false });

export default function Page() {
  return (
    <main className="h-dvh w-screen select-none">
      <Experience />
      <Overlay />
    </main>
  );
}
