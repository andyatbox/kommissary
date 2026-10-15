import type { Metadata } from 'next';
import NutritionBox from '@/components/nutrition-box/NutritionBox';
import { getOutreachDoc } from '@/lib/outreachPage';

// Nutrition Box: free, medically tailored food for Bronx Medicaid members. Copy is edited
// in Sanity ("Nutrition Box (/bronx)"); re-fetched periodically so edits show without a
// redeploy.
export const revalidate = 60;

const DOC_ID = 'nutritionBoxPage';
const TITLE = 'Kommissary | Nutrition Box';
const DESCRIPTION =
  'Kommissary nourishes and empowers communities, upholding the universal right to cultural, nutritious, and delicious meals of exceptional quality.';

export async function generateMetadata(): Promise<Metadata> {
  const seo = (await getOutreachDoc(DOC_ID))?.seo;
  return {
    title: seo?.title || TITLE,
    description: seo?.description || DESCRIPTION,
    alternates: { canonical: '/bronx' },
  };
}

export default async function Page() {
  return <NutritionBox cms={await getOutreachDoc(DOC_ID)} />;
}
