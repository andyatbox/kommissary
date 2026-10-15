import type { Metadata } from 'next';
import EducatorPage from '@/components/educator/EducatorPage';

// Not linked from the nav: shared directly with Bronx educators and school staff.
const TITLE = 'Kommissary | Educators: Connect Bronx Families to Free Nutrition Boxes';
const DESCRIPTION =
  'Bronx educators and school staff: help families and students on Medicaid get free, medically tailored meals and groceries delivered to their door. Request a callback and Kommissary will provide Nutrition Box materials to share.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/educator' },
  openGraph: {
    type: 'website',
    url: '/educator',
    siteName: 'Kommissary',
    title: TITLE,
    description: DESCRIPTION,
    locale: 'en_US',
    alternateLocale: ['es_US'],
  },
  twitter: { card: 'summary', title: TITLE, description: DESCRIPTION },
};

export default function Page() {
  return <EducatorPage />;
}
