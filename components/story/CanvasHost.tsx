'use client';

import dynamic from 'next/dynamic';

/**
 * The canvas is client-only — there is no GPU on the server, and rendering it there
 * would only produce an empty element to hydrate over. Isolated in its own client
 * component so app/page.tsx can stay a server component and fetch the content.
 */
const TimelineCanvas = dynamic(() => import('./TimelineCanvas'), { ssr: false });

export default function CanvasHost() {
  return <TimelineCanvas />;
}
