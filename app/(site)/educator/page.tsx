import type { Metadata } from 'next';
import EducatorPage from '@/components/educator/EducatorPage';
import { getOutreachDoc } from '@/lib/outreachPage';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';

// Not linked from the nav: shared directly with Bronx educators and school staff. Copy is edited in Sanity
// ("Educators (/educator)"); re-fetched periodically so edits show without a redeploy.
export const revalidate = 60;

const DOC_ID = 'educatorPage';
const TITLE = 'Kommissary | Educators: Connect Bronx Families to Free Nutrition Boxes';
const DESCRIPTION =
  'Bronx educators and school staff: help families and students on Medicaid get free, medically tailored meals and groceries delivered to their door. Request a callback and Kommissary will provide Nutrition Box materials to share.';

export async function generateMetadata(): Promise<Metadata> {
  const seo = (await getOutreachDoc(DOC_ID))?.seo;
  const meta = pageMetadata({ title: seo?.title || TITLE, description: seo?.description || DESCRIPTION, path: '/educator' });
  // The page switches between English and Spanish in place.
  return { ...meta, openGraph: { ...meta.openGraph, alternateLocale: ['es_US'] } };
}

export default async function Page() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd('Educators', '/educator')} />
      <EducatorPage cms={await getOutreachDoc(DOC_ID)} />
    </>
  );
}
