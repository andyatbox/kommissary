'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

/**
 * Pages that place the footer themselves, or have none:
 * - `/`: the homepage is a fixed full-screen scene with nothing below it.
 * - `/our-story`: its content scrolls in a transformed layer (SmoothScroll), so a footer
 *   out here in normal flow would drift against it. The page renders <Footer /> inside.
 */
const NO_LAYOUT_FOOTER = new Set(['/', '/our-story']);

export default function SiteFooter() {
  const pathname = usePathname();
  if (NO_LAYOUT_FOOTER.has(pathname)) return null;
  return <Footer />;
}
