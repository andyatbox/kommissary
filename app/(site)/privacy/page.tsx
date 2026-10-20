import type { Metadata } from 'next';
import PrivacyPage from '@/components/privacy/PrivacyPage';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';

// Linked from the consent line on every lead form (components/nutrition-box/PrivacyConsent).
export const metadata: Metadata = pageMetadata({
  title: 'Kommissary | Privacy Notice',
  description: 'How Kommissary collects, uses and shares information on kommissary.com.',
  path: '/privacy',
});

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd('Privacy Notice', '/privacy')} />
      <PrivacyPage />
    </>
  );
}
