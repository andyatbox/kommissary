'use client';

import { OPENS_NEW_WINDOW, SOMOS_URL } from './content';
import { type Lang, useLang } from './i18n';
import { useSectionCopy } from '@/lib/cmsCopy';
import { TRUST } from './copy';
import { SECTION_TITLE } from './styles';

// Each point is a big word or number with a line of explanation. The first two (the
// stats) take wider tiles on desktop: a 6-column grid, 3 + 3 then 2 + 2 + 2.

const somosLink = (lang: Lang) => (
  <a
    className="text-coral underline decoration-2 underline-offset-4 hover:no-underline"
    href={SOMOS_URL}
    target="_blank"
    rel="noopener noreferrer"
  >
    SOMOS Social Care Network
    <span className="sr-only">{OPENS_NEW_WINDOW[lang]}</span>
  </a>
);

export default function Trust() {
  const lang = useLang();
  const { heading, points } = useSectionCopy('trust', TRUST, lang, { somos: somosLink(lang) });
  return (
    <section data-section="trust" className="px-4 pb-16 md:pb-24">
      <div className="mx-auto max-w-6xl border-0 border-t-2 border-solid border-white/15 pt-16 md:pt-24">
        <h2 className={`${SECTION_TITLE} text-coral`}>{heading}</h2>
        <ul className="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-6">
          {points.map(({ big, copy, wide, somos }, i) => (
            <li
              key={i}
              className={`rounded-xtra border-2 border-solid border-white/15 p-6 md:p-8 ${
                wide ? 'lg:col-span-3' : 'lg:col-span-2'
              } ${somos ? 'sm:col-span-2 lg:col-span-2' : ''}`}
            >
              <p
                className={`m-0 font-specials leading-[0.9] text-coral ${
                  wide ? 'text-[clamp(3.5rem,7vw,6rem)]' : 'text-[clamp(2.75rem,4.5vw,4rem)]'
                }`}
              >
                {big}
              </p>
              <p className="m-0 mt-3 text-xl leading-snug">{copy}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
