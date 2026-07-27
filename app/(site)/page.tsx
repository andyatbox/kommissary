import { client } from '@/sanity/lib/client';
import { DEFAULT_CONTENT } from '@/lib/defaultContent';
import type { HomeContent } from '@/lib/store';
import { buildNav, type NavMenu, type NavPage } from '@/lib/nav';
import HomeClient from '@/components/HomeClient';

// Re-fetch periodically so published content changes show without a redeploy.
export const revalidate = 60;

const HOMEPAGE_QUERY = `*[_type == "homepage"][0]{
  sentence,
  "pills": pills[]{
    label,
    words,
    title,
    body,
    "buttons": buttons[]{ label, url }
  }
}`;

// Nav-enabled pages, in the Pages list's drag order (drives link order per column).
const NAV_QUERY = `*[_type == "page" && defined(navGroup)]|order(orderRank){
  navGroup,
  navColumn,
  "label": coalesce(navLabel, title),
  "href": slug.current
}`;

export default async function Page() {
  let content: HomeContent = DEFAULT_CONTENT;
  let nav: NavMenu[] = buildNav([]); // headings-only fallback if Sanity is unreachable
  try {
    const [data, pages] = await Promise.all([
      client.fetch<HomeContent | null>(HOMEPAGE_QUERY),
      client.fetch<NavPage[] | null>(NAV_QUERY),
    ]);
    if (data?.sentence) content = { sentence: data.sentence, pills: data.pills ?? [] };
    nav = buildNav(pages ?? []);
  } catch {
    // Keep the default fallbacks if Sanity is unreachable.
  }

  return <HomeClient content={content} nav={nav} />;
}
