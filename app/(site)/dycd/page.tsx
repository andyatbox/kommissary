import type { Metadata } from 'next';
import DycdPage from '@/components/dycd/DycdPage';

// Not linked from the nav: shared directly with Bronx community leaders.
const TITLE = 'Kommissary | Community Leaders: Connect Bronx Families to Free Nutrition Boxes';
const DESCRIPTION =
  'Bronx community leaders: help families on Medicaid get free, medically tailored meals and groceries delivered to their door. Request a callback and Kommissary will provide Nutrition Box materials to share.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/dycd' },
  openGraph: {
    type: 'website',
    url: '/dycd',
    siteName: 'Kommissary',
    title: TITLE,
    description: DESCRIPTION,
    locale: 'en_US',
    alternateLocale: ['es_US'],
  },
  twitter: { card: 'summary', title: TITLE, description: DESCRIPTION },
};

export default function Page() {
  return <DycdPage />;
}
