import type { Metadata } from 'next';
import NutritionBox from '@/components/nutrition-box/NutritionBox';
import { getOutreachDoc } from '@/lib/outreachPage';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';

// Nutrition Box: free, medically tailored food for Bronx Medicaid members. Copy is edited
// in Sanity ("Nutrition Box (/bronx)"); re-fetched periodically so edits show without a
// redeploy.
export const revalidate = 60;

const DOC_ID = 'nutritionBoxPage';
const TITLE = 'Kommissary | Nutrition Box';
const DESCRIPTION =
  'Free, medically tailored food boxes delivered to the door for eligible Bronx Medicaid members. Check eligibility and request a callback from Kommissary.';

export async function generateMetadata(): Promise<Metadata> {
  const seo = (await getOutreachDoc(DOC_ID))?.seo;
  const meta = pageMetadata({ title: seo?.title || TITLE, description: seo?.description || DESCRIPTION, path: '/bronx' });
  // The page switches between English and Spanish in place.
  return { ...meta, openGraph: { ...meta.openGraph, alternateLocale: ['es_US'] } };
}

export default async function Page() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd('Nutrition Box', '/bronx')} />
      <NutritionBox cms={await getOutreachDoc(DOC_ID)} />
    </>
  );
}
