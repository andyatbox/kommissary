'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

/**
 * Pages that place the footer themselves, or have none:
 * - `/` and `/our-impact`: fixed full-screen experiences with nothing below them.
 * - `/our-story`: its content scrolls in a transformed layer (SmoothScroll), so a footer
 *   out here in normal flow would drift against it. The page renders <Footer /> inside.
 */
const NO_LAYOUT_FOOTER = new Set(['/', '/our-story', '/our-impact']);

export default function SiteFooter() {
  const pathname = usePathname();
  if (NO_LAYOUT_FOOTER.has(pathname)) return null;
  return <Footer />;
}
