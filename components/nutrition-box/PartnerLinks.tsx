'use client';

import { useCopy } from './i18n';

// Pill links to the partner pages (not in the nav): bottom right of the hero on
// landscape screens, under the form on portrait.
const COPY = {
  en: { label: 'For partners', educators: 'For Educators', leaders: 'For Community Leaders' },
  es: { label: 'Para aliados', educators: 'Para educadores', leaders: 'Para líderes comunitarios' },
};

const PILL =
  'inline-block whitespace-nowrap rounded-full border-2 border-solid border-[#000066] bg-[#000066] px-3.5 py-1.5 font-specials text-base leading-tight sm:px-4 sm:text-lg text-canary no-underline shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-colors hover:bg-white hover:text-[#000066] hover:no-underline md:px-5 md:text-xl';

export default function PartnerLinks({ className = '' }: { className?: string }) {
  const t = useCopy(COPY);
  return (
    <nav aria-label={t.label} className={`flex flex-wrap gap-2.5 ${className}`}>
      <a href="/educator/" data-track="partner-educators" className={PILL}>
        {t.educators}
      </a>
      <a href="/dycd/" data-track="partner-community-leaders" className={PILL}>
        {t.leaders}
      </a>
    </nav>
  );
}
