import type { MetadataRoute } from 'next';
import { client } from '@/sanity/lib/client';
import { WEEKLY_ENABLED } from '@/lib/features';
import { SITE_URL } from '@/lib/seo';

// Rebuilt hourly, so new and edited pages reach search engines without a deploy.
export const revalidate = 3600;

const QUERY = `{
  "home": *[_type == "homepage"][0]._updatedAt,
  "pages": *[_type == "page" && defined(slug.current)]{ "slug": slug.current, _updatedAt },
  "story": *[_type == "ourStoryPage"][0]._updatedAt,
  "outreach": *[_id in ["nutritionBoxPage", "educatorPage", "dycdPage"]]{ _id, _updatedAt },
  "posts": *[_type == "post" && defined(slug.current)]{ "slug": slug.current, _updatedAt }
}`;

type Result = {
  home?: string;
  pages?: { slug: string; _updatedAt: string }[];
  story?: string;
  outreach?: { _id: string; _updatedAt: string }[];
  posts?: { slug: string; _updatedAt: string }[];
};

/** Which document holds each lead page's copy. */
const OUTREACH_PATH: Record<string, string> = {
  nutritionBoxPage: '/bronx',
  educatorPage: '/educator',
  dycdPage: '/dycd',
};

/**
 * /sitemap.xml: every public page with when it last changed. Pages, Our Story and the
 * lead pages come from Sanity; Weekly and its posts only while Weekly is switched on.
 * Studio, the API and form thank-yous aren't pages and aren't listed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let data: Result = {};
  try {
    data = (await client.fetch<Result | null>(QUERY)) ?? {};
  } catch {
    // Sanity unreachable: still list the fixed pages.
  }

  // path → latest change. A route can draw on more than one document (/our-story has
  // both a Page, for the nav, and its own copy), so the newest date wins.
  const latest = new Map<string, string | undefined>();
  const add = (path: string, date?: string) => {
    const prev = latest.get(path);
    latest.set(path, prev && date && prev > date ? prev : (date ?? prev));
  };

  add('/', data.home);
  add('/privacy');
  for (const p of data.pages ?? []) {
    if (!WEEKLY_ENABLED && /^weekly(\/|$)/.test(p.slug)) continue;
    add(`/${p.slug}`, p._updatedAt);
  }
  add('/our-story', data.story);
  for (const o of data.outreach ?? []) if (OUTREACH_PATH[o._id]) add(OUTREACH_PATH[o._id], o._updatedAt);
  if (WEEKLY_ENABLED) for (const p of data.posts ?? []) add(`/weekly/${p.slug}`, p._updatedAt);

  return Array.from(latest).map(([path, date]) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    ...(date ? { lastModified: new Date(date) } : {}),
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }));
}
