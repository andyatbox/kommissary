import type { Metadata } from 'next';
import NutritionBox from '@/components/nutrition-box/NutritionBox';

// Nutrition Box: free, medically tailored food for Bronx Medicaid members.
export const metadata: Metadata = {
  title: 'Kommissary | Nutrition Box',
  description:
    'Kommissary nourishes and empowers communities, upholding the universal right to cultural, nutritious, and delicious meals of exceptional quality.',
  alternates: { canonical: '/bronx' },
};

export default function Page() {
  return <NutritionBox />;
}
