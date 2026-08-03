import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { galleryImageFromSanity, type SanityGalleryImage } from '@/lib/galleryImage';
import { DEFAULT_CONTENT } from '@/lib/defaultContent';
import type { HomeContent, TeamImages, TeamSlot } from '@/lib/store';
import type { TeaserPost } from '@/components/weekly/WeeklyGrid';
import HomeClient from '@/components/HomeClient';

// Re-fetch periodically so published content changes show without a redeploy.
export const revalidate = 60;

// Homepage content + the three latest Weekly posts (for the bottom teaser strip), in one
// round trip.
const PAGE_QUERY = `{
  "home": *[_type == "homepage"][0]{
    sentence,
    "pills": pills[]{
      label,
      words,
      title,
      body,
      "buttons": buttons[]{ label, url }
    },
    teamTopLeft, teamTopRight, teamBottomLeft, teamBottomCenter, teamBottomRight
  },
  "latestWeekly": *[_type == "post" && defined(slug.current)] | order(date desc)[0...3]{
    title,
    "slug": slug.current,
    date,
    "thumb": thumbnail{ asset, hotspot, crop, alt, "lqip": asset->metadata.lqip }
  }
}`;

type RawHome = HomeContent & Partial<Record<TeamSlot, SanityImageSource>>;
type RawPost = { slug: string; title: string; date?: string; thumb?: SanityGalleryImage | null };
type RawResult = { home: RawHome | null; latestWeekly: RawPost[] | null };

const TEAM_SLOTS: TeamSlot[] = [
  'teamTopLeft',
  'teamTopRight',
  'teamBottomLeft',
  'teamBottomCenter',
  'teamBottomRight',
];

/** The teaser thumbnails render small — cap width and let Sanity serve webp. */
const TEASER_SIZES = '(min-width: 640px) 200px, 30vw';

/** Team plane textures are small on screen — cap width and let Sanity serve webp. */
function buildTeam(data: RawHome): TeamImages {
  const team: TeamImages = {};
  for (const slot of TEAM_SLOTS) {
    const src = data[slot];
    if (src) team[slot] = urlFor(src).width(1024).quality(80).auto('format').url();
  }
  return team;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function buildTeasers(posts: RawPost[] | null | undefined): TeaserPost[] {
  return (posts ?? []).map((p) => ({
    slug: p.slug,
    title: p.title,
    date: formatDate(p.date),
    image: p.thumb ? galleryImageFromSanity(p.thumb, TEASER_SIZES) : null,
  }));
}

export default async function Page() {
  let content: HomeContent = DEFAULT_CONTENT;
  let latestWeekly: TeaserPost[] = [];
  try {
    const data = await client.fetch<RawResult | null>(PAGE_QUERY);
    if (data?.home?.sentence) {
      content = {
        sentence: data.home.sentence,
        pills: data.home.pills ?? [],
        team: buildTeam(data.home),
      };
    }
    latestWeekly = buildTeasers(data?.latestWeekly);
  } catch {
    // Keep the default fallback if Sanity is unreachable.
  }

  return <HomeClient content={content} latestWeekly={latestWeekly} />;
}
