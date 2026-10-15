import type { Metadata } from 'next';
import DycdPage from '@/components/dycd/DycdPage';
import { getOutreachDoc } from '@/lib/outreachPage';

// Not linked from the nav: shared directly with Bronx community leaders. Copy is edited in Sanity
// ("Community Leaders (/dycd)"); re-fetched periodically so edits show without a redeploy.
export const revalidate = 60;

const DOC_ID = 'dycdPage';
const TITLE = 'Kommissary | Community Leaders: Connect Bronx Families to Free Nutrition Boxes';
const DESCRIPTION =
  'Bronx community leaders: help families on Medicaid get free, medically tailored meals and groceries delivered to their door. Request a callback and Kommissary will provide Nutrition Box materials to share.';

export async function generateMetadata(): Promise<Metadata> {
  const seo = (await getOutreachDoc(DOC_ID))?.seo;
  const title = seo?.title || TITLE;
  const description = seo?.description || DESCRIPTION;
  return {
    title,
    description,
    alternates: { canonical: '/dycd' },
    openGraph: {
      type: 'website',
      url: '/dycd',
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
  return <DycdPage cms={await getOutreachDoc(DOC_ID)} />;
}
