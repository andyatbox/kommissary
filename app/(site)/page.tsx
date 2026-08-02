import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { DEFAULT_CONTENT } from '@/lib/defaultContent';
import type { HomeContent, TeamImages, TeamSlot } from '@/lib/store';
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
  },
  teamTopLeft, teamTopRight, teamBottomLeft, teamBottomCenter, teamBottomRight
}`;

type RawHome = HomeContent & Partial<Record<TeamSlot, SanityImageSource>>;

const TEAM_SLOTS: TeamSlot[] = [
  'teamTopLeft',
  'teamTopRight',
  'teamBottomLeft',
  'teamBottomCenter',
  'teamBottomRight',
];

/** Team plane textures are small on screen — cap width and let Sanity serve webp. */
function buildTeam(data: RawHome): TeamImages {
  const team: TeamImages = {};
  for (const slot of TEAM_SLOTS) {
    const src = data[slot];
    if (src) team[slot] = urlFor(src).width(1024).quality(80).auto('format').url();
  }
  return team;
}

export default async function Page() {
  let content: HomeContent = DEFAULT_CONTENT;
  try {
    const data = await client.fetch<RawHome | null>(HOMEPAGE_QUERY);
    if (data?.sentence) {
      content = { sentence: data.sentence, pills: data.pills ?? [], team: buildTeam(data) };
    }
  } catch {
    // Keep the default fallback if Sanity is unreachable.
  }

  return <HomeClient content={content} />;
}
