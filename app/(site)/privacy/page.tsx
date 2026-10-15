import type { Metadata } from 'next';
import PrivacyPage from '@/components/privacy/PrivacyPage';

// Linked from the consent line on every lead form (components/nutrition-box/PrivacyConsent).
export const metadata: Metadata = {
  title: 'Kommissary | Privacy Notice',
  description: 'How Kommissary collects, uses and shares information on kommissary.com.',
  alternates: { canonical: '/privacy' },
};

export default function Page() {
  return <PrivacyPage />;
}
