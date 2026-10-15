'use client';

import GoToFormButton from './GoToFormButton';
import { EMAIL, GET_STARTED, OPENS_NEW_WINDOW, PHONE, PHONE_HREF, SOMOS_URL } from './content';
import { type Lang, useLang } from './i18n';
import { useSectionCopy } from '@/lib/cmsCopy';
import { FAQ } from './copy';
import { SECTION_TITLE } from './styles';

const LINK = 'font-bold text-[#000066] underline decoration-2 underline-offset-4 hover:no-underline';
const INLINE_CTA = `border-0 bg-transparent p-0 ${LINK}`;

const Phone = () => (
  <a className={`${LINK} whitespace-nowrap`} href={PHONE_HREF}>
    {PHONE}
  </a>
);
const Email = () => (
  <a className={LINK} href={`mailto:${EMAIL}`}>
    {EMAIL}
  </a>
);

const Somos = ({ lang }: { lang: Lang }) => (
  <a className={LINK} href={SOMOS_URL} target="_blank" rel="noopener noreferrer">
    SOMOS
    <span className="sr-only">{OPENS_NEW_WINDOW[lang]}</span>
  </a>
);

export default function Faq() {
  const lang = useLang();
  const { heading, faqs, ready } = useSectionCopy('faq', FAQ, lang, {
    somos: <Somos lang={lang} />,
    getStarted: (
      <GoToFormButton className={INLINE_CTA} track="get-started-faq-answer">
        {GET_STARTED[lang]}
      </GoToFormButton>
    ),
    phone: <Phone />,
    email: <Email />,
  });
  return (
    <section data-section="faq" className="bg-canary px-4 py-16 text-[#000066] md:py-24">
      <div className="mx-auto max-w-3xl">
        <h2 className={SECTION_TITLE}>{heading}</h2>
        <div className="border-0 border-t-2 border-solid border-[#000066]/20">
          {faqs.map(({ q, a }, i) => (
            // Keyed by position and language, so switching language closes any open
            // answers rather than leaving one open under a different question.
            <details key={`${lang}-${i}`} className="group border-0 border-b-2 border-solid border-[#000066]/20">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-specials text-2xl leading-tight md:text-3xl [&::-webkit-details-marker]:hidden">
                {q}
                {/* Plus that turns into a minus when open. */}
                <span className="relative h-5 w-5 shrink-0" aria-hidden>
                  <span className="absolute left-0 top-1/2 h-[3px] w-5 -translate-y-1/2 rounded bg-[#000066]" />
                  <span className="absolute left-1/2 top-0 h-5 w-[3px] -translate-x-1/2 rounded bg-[#000066] transition-transform group-open:rotate-90" />
                </span>
              </summary>
              <div className="pb-6 pr-10 text-lg leading-relaxed">{a}</div>
            </details>
          ))}
        </div>
        <div className="mt-14 text-center">
          <p className="m-0 mb-5 font-specials text-3xl leading-tight md:text-4xl">{ready}</p>
          <GoToFormButton track="get-started-faq-bottom" className="rounded-full border-0 bg-[#000066] px-7 py-2 font-specials text-2xl text-canary transition-colors hover:bg-white hover:text-[#000066]">
            {GET_STARTED[lang]}
          </GoToFormButton>
        </div>
      </div>
    </section>
  );
}
