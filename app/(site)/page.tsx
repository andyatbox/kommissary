import { client } from '@/sanity/lib/client';
import { DEFAULT_CONTENT } from '@/lib/defaultContent';
import type { HomeContent } from '@/lib/store';
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

export default async function Page() {
  let content: HomeContent = DEFAULT_CONTENT;
  try {
    const data = await client.fetch<HomeContent | null>(HOMEPAGE_QUERY);
    if (data?.sentence) content = { sentence: data.sentence, pills: data.pills ?? [] };
  } catch {
    // Keep the default fallback if Sanity is unreachable.
  }

  return <HomeClient content={content} />;
}
