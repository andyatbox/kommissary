import type { Metadata, Viewport } from 'next';
import { Roboto_Condensed } from 'next/font/google';
import './globals.css';

const robotoCondensed = Roboto_Condensed({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-condensed',
});

const DESCRIPTION =
  'Kommissary is a progressive, minority-run purveyor of chef-crafted meals and a logistics leader serving the communities of New York City.';

export const metadata: Metadata = {
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
  openGraph: {
    title: 'Kommissary',
    description: DESCRIPTION,
    siteName: 'Kommissary',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kommissary',
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: '#000666',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={robotoCondensed.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
