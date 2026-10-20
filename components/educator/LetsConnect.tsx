'use client';

import GoToFormButton from './GoToFormButton';
import { CALLBACK, EMAIL, PHONE, PHONE_HREF } from './content';
import { useLang } from './i18n';
import { useSectionCopy } from '@/lib/cmsCopy';
import { LETS_CONNECT } from './copy';
import { SECTION_TITLE } from './styles';

// Line icons on a 48x48 grid, in the current text color.
const ICON_PROPS = {
  viewBox: '0 0 48 48',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: 'h-9 w-9 md:h-11 md:w-11',
  'aria-hidden': true,
};

function PhoneIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M10 8c0 17 13 30 30 30l4-6-8-6-5 4c-5-2-9-6-11-11l4-5-6-8z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="5" y="10" width="38" height="28" rx="4" />
      <path d="M6 13l18 13 18-13" />
    </svg>
  );
}

const LINK = 'font-bold text-coral underline decoration-2 underline-offset-4 hover:no-underline';
const CTA = `border-0 bg-transparent p-0 ${LINK}`;

// A big tappable contact card: icon, small label, then the number or address large.
const CARD =
  'group flex items-center gap-4 rounded-xtra border-2 border-solid border-coral/60 bg-white/5 px-5 py-5 text-left text-white no-underline transition-colors hover:border-coral hover:bg-coral hover:text-[#000066] hover:no-underline md:gap-5 md:px-7 md:py-6';
const BADGE =
  'flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-coral text-[#000066] transition-colors group-hover:bg-[#000066] group-hover:text-coral md:h-20 md:w-20';
const LABEL = 'block text-base font-normal uppercase tracking-widest text-coral group-hover:text-[#000066]';

export default function LetsConnect() {
  const lang = useLang();
  const { heading, intro, help, call, email } = useSectionCopy('letsConnect', LETS_CONNECT, lang, {
    callback: (
      <GoToFormButton className={CTA} track="callback-lets-connect">
        &ldquo;{CALLBACK[lang]}&rdquo;
      </GoToFormButton>
    ),
  });
  return (
    <section data-section="lets-connect" className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <h2 className={`${SECTION_TITLE} text-coral`}>{heading}</h2>
        <p className="mx-auto m-0 max-w-3xl text-center text-xl leading-snug md:text-2xl">{intro}</p>
        <p className="mx-auto mb-0 mt-5 max-w-3xl text-center text-xl leading-snug md:text-2xl">{help}</p>
        <div className="mt-12 grid gap-5 md:mt-16 md:grid-cols-2">
          <a className={CARD} href={PHONE_HREF}>
            <span className={BADGE}>
              <PhoneIcon />
            </span>
            <span className="min-w-0">
              <span className={LABEL}>{call}</span>
              <span className="mt-1 block whitespace-nowrap font-specials text-3xl leading-none md:text-4xl">{PHONE}</span>
            </span>
          </a>
          <a className={CARD} href={`mailto:${EMAIL}`}>
            <span className={BADGE}>
              <MailIcon />
            </span>
            <span className="min-w-0">
              <span className={LABEL}>{email}</span>
              {/* Breaks after the @ when it doesn't fit on one line, never mid-word. */}
              <span className="mt-1 block font-specials text-[clamp(1.25rem,5vw,1.75rem)] leading-tight">
                {EMAIL.split('@')[0]}@<wbr />
                {EMAIL.split('@')[1]}
              </span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
