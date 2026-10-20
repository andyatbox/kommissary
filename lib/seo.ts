import type { Metadata } from 'next';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import { urlFor } from '@/sanity/lib/image';

/**
 * Search and sharing: one place for the public address, the per-page metadata shape,
 * share images and the schema.org data the pages carry.
 *
 * kommissary.com (no www) is the one public address: canonicals, the sitemap and
 * structured data all use it, and middleware.ts sends www.kommissary.com there.
 */

export const SITE_URL = 'https://kommissary.com';
export const SITE_NAME = 'Kommissary';
export const SITE_DESCRIPTION =
  'Kommissary is a progressive, minority-run purveyor of chef-crafted meals and a logistics leader serving the communities of New York City.';

/** Kommissary's own profiles, as linked from the site. */
export const SOCIAL_PROFILES = [
  'https://www.instagram.com/kommissary/',
  'https://www.facebook.com/kommissary/',
  'https://www.linkedin.com/company/kommissary',
];

/** The branded fallback card (app/og.png), for pages without a picture of their own. */
const DEFAULT_SHARE_IMAGE = { url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: SITE_NAME };

/** A 1200×630 JPEG of a Sanity image (cropped around its hotspot), the size link previews
 *  expect; the default card without one. */
export function shareImage(src?: SanityImageSource | null, alt?: string) {
  if (!src) return DEFAULT_SHARE_IMAGE;
  return {
    url: urlFor(src).width(1200).height(630).fit('crop').format('jpg').quality(82).url(),
    width: 1200,
    height: 630,
    alt: alt || SITE_NAME,
  };
}

/**
 * A page's metadata: title and description, its canonical address, and the same for
 * link previews (Open Graph, X/Twitter). `path` is the page's own path, e.g. "/logistics".
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description?: string;
  path: string;
  image?: ReturnType<typeof shareImage>;
}): Metadata {
  const images = [image ?? DEFAULT_SHARE_IMAGE];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', siteName: SITE_NAME, locale: 'en_US', url: path, title, description, images },
    twitter: { card: 'summary_large_image', title, description, images: images.map((i) => i.url) },
  };
}

/** Plain text of Portable Text blocks, cut at a word to about `max` characters. */
export function excerpt(blocks: unknown, max = 155): string {
  const text = (Array.isArray(blocks) ? blocks : [])
    .filter((b) => b?._type === 'block')
    .map((b) => (b.children ?? []).map((c: { text?: string }) => c.text ?? '').join(''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, text.lastIndexOf(' ', max - 1))}…`;
}

// --- Structured data (schema.org JSON-LD) -------------------------------------------

const ORG_ID = `${SITE_URL}/#organization`;

/** Who Kommissary is and the site itself, on every page (from the layout). */
export function siteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORG_ID,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/images/web-app-manifest-512x512.png`,
        description: SITE_DESCRIPTION,
        areaServed: { '@type': 'City', name: 'New York City' },
        sameAs: SOCIAL_PROFILES,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: 'en-US',
        publisher: { '@id': ORG_ID },
      },
    ],
  };
}

/** Home › this page, so results can show the site's structure instead of a bare URL. */
export function breadcrumbJsonLd(title: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: title, item: `${SITE_URL}${path}` },
    ],
  };
}
