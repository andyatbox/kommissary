import type { Metadata } from 'next';
import EducatorPage from '@/components/educator/EducatorPage';
import { getOutreachDoc } from '@/lib/outreachPage';

// Not linked from the nav: shared directly with Bronx educators and school staff. Copy is edited in Sanity
// ("Educators (/educator)"); re-fetched periodically so edits show without a redeploy.
export const revalidate = 60;

const DOC_ID = 'educatorPage';
const TITLE = 'Kommissary | Educators: Connect Bronx Families to Free Nutrition Boxes';
const DESCRIPTION =
  'Bronx educators and school staff: help families and students on Medicaid get free, medically tailored meals and groceries delivered to their door. Request a callback and Kommissary will provide Nutrition Box materials to share.';

export async function generateMetadata(): Promise<Metadata> {
  const seo = (await getOutreachDoc(DOC_ID))?.seo;
  const title = seo?.title || TITLE;
  const description = seo?.description || DESCRIPTION;
  return {
    title,
    description,
    alternates: { canonical: '/educator' },
    openGraph: {
      type: 'website',
      url: '/educator',
      siteName: 'Kommissary',
      title,
      description,
      locale: 'en_US',
      alternateLocale: ['es_US'],
    },
    twitter: { card: 'summary', title, description },
  };
}

export default async function Page() {
  return <EducatorPage cms={await getOutreachDoc(DOC_ID)} />;
}
