'use client';

// The Nutrition Box page content. This folder moves to 2.0 as-is; for images, use
// `import img from './x.jpg'` with next/image so paths resolve under any basePath.
import Faq from './Faq';
import Features from './Features';
import EligibilityForm from './EligibilityForm';
import { LangProvider, useCopy, useLang } from './i18n';
import ClickTracking from './ClickTracking';
import MetaPixel from './MetaPixel';
import LangToggle from './LangToggle';
import HowItWorks from './HowItWorks';
import Illustration from './Illustration';
import PartnerLinks from './PartnerLinks';
import { specials } from './fonts';
import StickyGetStarted from './StickyGetStarted';
import Trust from './Trust';
import floor from './assets/red-floor.svg';
import type { CSSProperties } from 'react';

// Height of 2.0's fixed header (top bar, nav and logo), which <main> pads past; the hero
// fills the rest of the screen. --nav-h matches the content pages' pt-[120px] md:pt-[168px].
const NAV_HEIGHT = 'var(--nav-h)';

// On landscape screens the hero never gets shorter than this, so the intro text and the
// eligibility form fit on short laptop screens (it runs a little past the fold there).
const HERO_MIN_LANDSCAPE = '720px';

// Headline size, shared so the illustration's overlap scales with it.
const HEADLINE_SIZE = 'clamp(2.75rem, 7.2vw, 8.5rem)';

// red-floor.svg is 612 x 222.2783.
const FLOOR_RATIO = 222.2783 / 612;

const HERO = {
  en: {
    // Two parts: the line always breaks between them.
    headline: ['Free, nutritious food, delivered', 'to your door.'],
    intro:
      'Zero cost to qualified Medicaid recipients living in the Bronx. Get medically tailored meals and groceries delivered to your door. Fill out the form below to see if you qualify.',
  },
  es: {
    headline: ['Comida nutritiva y gratis, directo', 'a su puerta.'],
    intro:
      'Sin costo para quienes califiquen, reciban Medicaid y vivan en el Bronx. Reciba comestibles y comidas adaptadas a sus necesidades médicas, entregados a su puerta. Llene el formulario a continuación para ver si califica.',
  },
};

export default function NutritionBox() {
  return (
    <LangProvider>
      <Page />
    </LangProvider>
  );
}

function Page() {
  const copy = useCopy(HERO);
  const lang = useLang();
  return (
    <main id="nutrition-box" className={`${specials.variable} bg-[#000066] text-white pt-[var(--nav-h)] [--nav-h:120px] md:[--nav-h:168px]`}>
      {/* Hero: fills the first screen. It spans the full window width so the floor does too, and clips the
          floor where it runs past the bottom edge.
          Landscape: exactly the screen's height below the nav, but never less than
          HERO_MIN_LANDSCAPE, so the text and form always fit on short laptop screens.
          Portrait: at least the screen's height, growing when the text, form and
          illustration need more (small phones). */}
      <section
        data-section="hero"
        className="relative flex flex-col px-8 pb-6 [container-type:inline-size] md:pb-10 portrait:min-h-[var(--hero-h)] landscape:h-[max(var(--hero-h),var(--hero-min))]"
        style={
          {
            '--hero-h': `calc(100svh - ${NAV_HEIGHT})`,
            '--hero-min': HERO_MIN_LANDSCAPE,
            '--headline': HEADLINE_SIZE,
          } as CSSProperties
        }
      >
        {/* Landscape floor: full width at its natural proportions, sitting on the
            bottom of the screen. Its top edge never rises above the middle of the
            window; when it's taller than that, the rest runs off the bottom and is
            cropped. Its width is 100cqw (the section's content box) plus the section's
            2rem side padding. Portrait screens use the floor under the form instead. */}
        {/* Wrapped so only the floor is cropped at the hero's bottom edge; the hero itself
            doesn't clip, so a long form step can extend into the coral section below. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden portrait:hidden">
          <img
            src={floor.src}
            alt=""
            className="absolute left-0 h-auto w-full max-w-none select-none"
            style={{ top: `max(calc(100% - (100cqw + 4rem) * ${FLOOR_RATIO}), calc(50svh - ${NAV_HEIGHT}))` }}
          />
        </div>
        {/* Portrait: sized so the first line just fits on one line, using the section's
            width less 1rem a side (-mx-4 into its 2rem padding). The first line is
            11.2em wide in English and 12em in Spanish, so each gets its own size.
            Capped for upright tablets. */}
        <h1
          className={`relative z-[1] m-0 p-0 text-center font-specials text-[length:var(--headline)] leading-[0.85] tracking-[-0.02em] text-canary portrait:-mx-4 portrait:mb-8 portrait:mt-6 ${
            lang === 'es'
              ? 'portrait:text-[length:min(calc((100cqw+2rem)/12.2),6.5rem)]'
              : 'portrait:text-[length:min(calc((100cqw+2rem)/11.4),6.5rem)]'
          }`}
        >
          {copy.headline[0]}
          <br />
          {copy.headline[1]}
        </h1>
        {/* Portrait screens (phones, upright tablets): the intro beside the
            illustration, then the form across the full width, standing on the floor.
            Landscape: the intro and form on the left, the illustration on the right,
            pulled up 1.35 headline lines (0.85 each) so it clears the second line and
            overlaps the first. The intro and form are centered as a block in their
            area, left-aligned inside.
            The intro-and-form wrapper is display: contents on portrait, so its two
            children can take their own grid areas there. */}
        <div className="relative z-[2] grid flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] grid-rows-[auto_1fr] gap-x-3 [grid-template-areas:'intro_illo'_'form_form'] landscape:min-h-0 landscape:grid-cols-2 landscape:grid-rows-[minmax(0,1fr)] landscape:gap-x-10 landscape:[grid-template-areas:'text_illo']">
          {/* Landscape side padding keeps the copy off the illustration and the window
              edge; the width steps up on wide screens so the middle isn't left empty.
              w-full rather than sizing to its content: the form's slider lays all its
              steps side by side, which would otherwise make the block far too wide. */}
          <div className="contents landscape:block landscape:w-full landscape:max-w-[40rem] landscape:[align-self:safe_center] landscape:justify-self-center landscape:pt-4 landscape:[grid-area:text] lg:landscape:px-6 xl:landscape:max-w-[46rem] 2xl:landscape:max-w-[54rem] 2xl:landscape:px-10">
            <h2 className="relative z-[1] m-0 self-center font-specials text-[clamp(1.2rem,5.4cqw,1.75rem)] font-normal leading-[1.1] text-white [grid-area:intro] landscape:max-w-[26em] landscape:pt-0 landscape:text-[clamp(1.25rem,2.3vw,2.5rem)]">
              {copy.intro}
            </h2>
            <div className="relative z-0 pt-12 [grid-area:form] landscape:pt-0">
              {/* Portrait floor: its peak sits behind the illustration's lower half
                  (0.6 of the floor's height above the form), then solid floor color
                  down to the bottom of the hero, behind the form. */}
              <div
                aria-hidden
                className="pointer-events-none absolute -left-8 -right-8 -bottom-12 flex flex-col landscape:hidden"
                style={{ top: `calc((100cqw + 4rem) * ${-0.6 * FLOOR_RATIO})` }}
              >
                <img src={floor.src} alt="" className="block h-auto w-full max-w-none select-none" />
                <div className="-mt-px flex-1 bg-coral" />
              </div>
              <EligibilityForm className="relative z-[1] mx-auto landscape:mx-0 landscape:mt-8" />
              {/* Portrait: under the form. */}
              <PartnerLinks className="relative z-[1] mx-auto mt-5 max-w-[34rem] justify-center landscape:hidden" />
            </div>
          </div>
          <div className="relative z-[1] flex items-start justify-end [container-type:inline-size] [grid-area:illo] landscape:-mt-[calc(var(--headline)*1.35)] landscape:h-[calc(100%+var(--headline)*1.35)] landscape:justify-center landscape:[container-type:size]">
            <Illustration className="w-full landscape:w-[min(100cqw,calc(100cqh*784/1080))]" />
          </div>
        </div>
        {/* Landscape: bottom right of the hero, on the floor. */}
        <PartnerLinks className="absolute bottom-6 right-8 z-[3] justify-end portrait:hidden md:bottom-8" />
      </section>
      <LangToggle />
      <ClickTracking />
      <MetaPixel />
      <StickyGetStarted />
      <Features />
      <HowItWorks />
      <Trust />
      <Faq />
    </main>
  );
}
