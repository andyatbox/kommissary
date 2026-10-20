'use client';

import type { ReactNode } from 'react';
import GoToFormButton from './GoToFormButton';
import { EMAIL, GET_STARTED, PHONE, PHONE_HREF } from './content';
import { useLang } from './i18n';
import { useSectionCopy } from '@/lib/cmsCopy';
import { HOW_IT_WORKS } from './copy';
import { SECTION_TITLE } from './styles';

// Simple line icons, drawn on a 48x48 grid in the current text color.
const ICON_PROPS = {
  viewBox: '0 0 48 48',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: 'h-14 w-14 md:h-16 md:w-16',
  'aria-hidden': true,
};

/** A document with two checked boxes. */
function ChecklistIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M12 4h17l9 9v28a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" />
      <path d="M29 4v9h9" />
      <rect x="14" y="18" width="7" height="7" rx="1.5" />
      <path d="M15.5 21.5l1.8 1.8 3.5-3.8" />
      <path d="M25 21.5h8" />
      <rect x="14" y="30" width="7" height="7" rx="1.5" />
      <path d="M15.5 33.5l1.8 1.8 3.5-3.8" />
      <path d="M25 33.5h8" />
    </svg>
  );
}

/** A form on a clipboard, with a pen. */
function FormIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M30 8h4a3 3 0 0 1 3 3v8" />
      <path d="M18 8h-4a3 3 0 0 0-3 3v30a3 3 0 0 0 3 3h12" />
      <rect x="18" y="4" width="12" height="7" rx="2" />
      <path d="M17 20h14M17 27h10M17 34h6" />
      <path d="M41 25l3 3-11 11-4 1 1-4z" />
    </svg>
  );
}

/** A phone with a chat bubble. */
function CallTextIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M8 14c0 15 11 26 26 26l4-5-7-5-4 3c-4-2-7-5-9-9l3-4-5-7z" />
      <path d="M26 6h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-6l-5 4v-4h-3a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z" />
      <path d="M29 12h8M29 15.5h5" />
    </svg>
  );
}

const ICONS = [<ChecklistIcon key="checklist" />, <FormIcon key="form" />, <CallTextIcon key="call" />];

const CTA =
  'border-0 bg-transparent p-0 font-bold text-coral underline decoration-2 underline-offset-4 hover:no-underline';

const Phone = () => (
  <a className="whitespace-nowrap text-coral" href={PHONE_HREF}>
    {PHONE}
  </a>
);
const Email = () => (
  <a className="text-coral" href={`mailto:${EMAIL}`}>
    {EMAIL}
  </a>
);

export default function HowItWorks() {
  const lang = useLang();
  const { heading, step, steps, help } = useSectionCopy('howItWorks', HOW_IT_WORKS, lang, {
    getStarted: (
      <GoToFormButton className={CTA} track="get-started-how-it-works">
        &ldquo;{GET_STARTED[lang]}&rdquo;
      </GoToFormButton>
    ),
    phone: <Phone />,
    email: <Email />,
  });
  return (
    <section data-section="how-it-works" className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className={`${SECTION_TITLE} text-coral`}>{heading}</h2>
        <ol className="m-0 grid list-none gap-12 p-0 md:grid-cols-3 md:gap-10">
          {steps.map((text, i) => (
            <li key={i} className="flex flex-col items-center text-center">
              <div className="flex items-center gap-4 text-coral">
                <span className="font-specials text-[7rem] leading-[0.8] md:text-[9rem]" aria-hidden>
                  {i + 1}
                </span>
                {ICONS[i]}
              </div>
              <p className="m-0 mt-6 max-w-xs text-xl leading-snug">
                <span className="sr-only">
                  {step} {i + 1}:{' '}
                </span>
                {text}
              </p>
            </li>
          ))}
        </ol>
        <p className="mx-auto mb-0 mt-16 max-w-2xl text-center text-xl leading-snug md:mt-20">{help}</p>
      </div>
    </section>
  );
}
