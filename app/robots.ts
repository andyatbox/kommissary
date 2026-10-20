import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { LIVE_HOSTS } from '@/lib/siteEnv';
import { SITE_URL } from '@/lib/seo';

/**
 * /robots.txt, decided by the address it's asked for (like everything in lib/siteEnv):
 * on kommissary.com, crawl everything but Studio and the API, and here's the sitemap;
 * anywhere else (the preview, localhost), crawl nothing.
 */
export default function robots(): MetadataRoute.Robots {
  const host = (headers().get('host') ?? '').split(':')[0].toLowerCase();
  if (!LIVE_HOSTS.includes(host)) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/studio', '/api/'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
