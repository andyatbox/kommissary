import type { Metadata, Viewport } from 'next';
import { Roboto_Condensed } from 'next/font/google';
import { client } from '@/sanity/lib/client';
import { buildNav, NAV_QUERY, type NavMenu, type NavPage } from '@/lib/nav';
import Nav from '@/components/Nav';
import SiteFooter from '@/components/SiteFooter';
import SmoothWheel from '@/components/SmoothWheel';
import KaiWidget from '@/components/kai/KaiWidget';
import GradientBackground from '@/components/GradientBackground';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import JsonLd from '@/components/JsonLd';
import { SITE_DESCRIPTION, siteJsonLd } from '@/lib/seo';
import './globals.css';

// Re-fetch nav periodically so page/order changes surface without a redeploy.
export const revalidate = 60;

const robotoCondensed = Roboto_Condensed({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-condensed',
});

const DESCRIPTION = SITE_DESCRIPTION;

export const metadata: Metadata = {
  // Canonical and share links always point at the public site, including from staging.
  metadataBase: new URL('https://kommissary.com'),
  title: 'Kommissary',
  description: DESCRIPTION,
  applicationName: 'Kommissary',
  keywords: [
    'Kommissary',
    'chef-crafted meals',
    'food distribution',
    'logistics',
    'minority-run',
    'New York City',
    'commissary kitchen',
    'meal purveyor',
  ],
  manifest: '/images/site.webmanifest',
  icons: {
    icon: [
      { url: '/images/favicon.ico', sizes: 'any' },
      { url: '/images/favicon.svg', type: 'image/svg+xml' },
      { url: '/images/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: '/images/apple-touch-icon.png',
  },
  // Defaults for any page without its own (each page sets these via pageMetadata).
  openGraph: {
    title: 'Kommissary',
    description: DESCRIPTION,
    siteName: 'Kommissary',
    locale: 'en_US',
    type: 'website',
    images: [{ url: 'https://kommissary.com/og.png', width: 1200, height: 630, alt: 'Kommissary' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kommissary',
    description: DESCRIPTION,
    images: ['https://kommissary.com/og.png'],
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: '#000666',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let nav: NavMenu[] = buildNav([]); // headings-only fallback if Sanity is unreachable
  try {
    const pages = await client.fetch<NavPage[] | null>(NAV_QUERY);
    nav = buildNav(pages ?? []);
  } catch {
    // Keep the fallback nav.
  }

  return (
    <html lang="en" className={robotoCondensed.variable}>
      <body className="antialiased">
        {/* Who Kommissary is and the site itself, for search engines (lib/seo.ts). */}
        <JsonLd data={siteJsonLd()} />
        {/* Animated organic gradient behind everything (the R3F scenes render transparent
            over it). Falls back to the body's solid #000666 if WebGL is unavailable. */}
        <GradientBackground />
        <Nav menus={nav} />
        {children}
        <SiteFooter />
        {/* Our Story's scroll feel on the other scrolling pages (mouse and trackpad). */}
        <SmoothWheel />
        {/* Ask Kai — floating chatbot, on every page. */}
        <KaiWidget />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
