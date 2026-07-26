import { NextStudio } from 'next-sanity/studio';
import config from '@/sanity.config';

// A static shell; the Studio itself is a client app that boots on the browser.
export const dynamic = 'force-static';

export default function StudioPage() {
  return <NextStudio config={config} />;
}
