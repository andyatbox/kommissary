'use client';

// The Educators page (kommissary.com/educator): lead generation for Bronx educators and
// school staff who can share Nutrition Box with families. Not linked from the nav or
// footer. Built from the Nutrition Box page (components/nutrition-box); this folder
// moves to 2.0 as-is. For images, use `import img from './x.jpg'` with next/image so
// paths resolve under any basePath.
import CallbackForm from './CallbackForm';
import ClickTracking from './ClickTracking';
import MetaPixel from './MetaPixel';
import Features from './Features';
import { LangProvider, useCopy, useLang } from './i18n';
import LangToggle from './LangToggle';
import LetsConnect from './LetsConnect';
import Illustration from './Illustration';
import Qualifications from './Qualifications';
import StickyCallback from './StickyCallback';
import { specials } from './fonts';
import floor from './assets/red-floor.svg';
import { useRef, type CSSProperties } from 'react';
import { useIllustrationFit } from './useIllustrationFit';

// Height of 2.0's fixed header (top bar, nav and logo), which <main> pads past; the hero
// fills the rest of the screen. --nav-h matches the content pages' pt-[120px] md:pt-[168px].
const NAV_HEIGHT = 'var(--nav-h)';

// On landscape screens the hero never gets shorter than this, so the intro text and the
// form fit on short laptop screens (it runs a little past the fold there).
const HERO_MIN_LANDSCAPE = '640px';

// Headline size on landscape screens, shared so the illustration's overlap scales with
// it. Smaller than the Nutrition Box page's: this headline is a full sentence and wraps.
const HEADLINE_SIZE = 'clamp(2.25rem, 4.4vw, 5.5rem)';

// red-floor.svg is 612 x 222.2783 (this page's version peaks on the right).
const FLOOR_RATIO = 222.2783 / 612;

const HERO = {
  en: {
    headline: 'Educators—connect Bronx students and families on Medicaid with free, nutritious food, delivered.',
    intro:
      '“It takes a village,” as they say. Help your community from food insecurity with free boxes of medically tailored food and groceries, delivered straight to their homes. Fill out the form below to connect and help feed the village.',
  },
  es: {
    headline:
      'Educadores: conecten a los estudiantes y familias del Bronx que tienen Medicaid con comida nutritiva y gratis, entregada a domicilio.',
    intro:
      '“Hace falta todo un pueblo”, como dicen. Ayude a su comunidad a enfrentar la inseguridad alimentaria con cajas gratis de comida y comestibles adaptados a sus necesidades médicas, entregadas directo a sus hogares. Llene el formulario a continuación para conectarse y ayudar a alimentar al pueblo.',
  },
};

export default function EducatorPage() {
  return (
    <LangProvider>
      <Page />
    </LangProvider>
  );
}

function Page() {
  const copy = useCopy(HERO);
  const lang = useLang();
  const heroRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const illoRef = useRef<HTMLDivElement>(null);
  useIllustrationFit(heroRef, headlineRef, illoRef, [lang]);
  return (
    <main id="educator" className={`${specials.variable} bg-[#000066] text-white pt-[var(--nav-h)] [--nav-h:120px] md:[--nav-h:168px]`}>
      {/* Hero: fills the first screen. It spans the full window width so the floor does too, and clips the
          floor where it runs past the bottom edge.
          Landscape: exactly the screen's height below the nav, but never less than
          HERO_MIN_LANDSCAPE, so the text and form always fit on short laptop screens.
          Portrait: at least the screen's height, growing when the text, form and
          illustration need more (small phones). */}
      <section
        ref={heroRef}
        data-section="hero"
        className="relative flex flex-col overflow-hidden px-8 pb-6 [container-type:inline-size] md:pb-10 portrait:min-h-[var(--hero-h)] landscape:h-[max(var(--hero-h),var(--hero-min))]"
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
        <img
          src={floor.src}
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-0 z-0 h-auto w-full max-w-none select-none portrait:hidden"
          style={{ top: `max(calc(100% - (100cqw + 4rem) * ${FLOOR_RATIO}), calc(50svh - ${NAV_HEIGHT}))` }}
        />
        <h1 ref={headlineRef} className="relative z-[1] mx-auto m-0 max-w-[24em] p-0 text-center font-specials text-[length:var(--headline)] leading-[0.92] tracking-[-0.015em] text-canary portrait:mb-8 portrait:mt-6 portrait:text-[length:clamp(1.75rem,8.2cqw,2.9rem)]">
          {copy.headline}
        </h1>
        {/* Portrait screens (phones, upright tablets): the intro beside the
            illustration, then the form across the full width, standing on the floor.
            Landscape: the intro and form on the left, the illustration on the right,
            placed by useIllustrationFit: her head at the middle of the headline's
            second line, her shoes 60px above the fold. The intro and form are
            centered as a block in their area, left-aligned inside.
            The intro-and-form wrapper is display: contents on portrait, so its two
            children can take their own grid areas there. */}
        <div className="relative z-[2] grid flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] grid-rows-[auto_1fr] md:portrait:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-x-3 [grid-template-areas:'intro_illo'_'form_form'] landscape:min-h-0 landscape:grid-cols-2 landscape:grid-rows-[minmax(0,1fr)] landscape:gap-x-10 landscape:[grid-template-areas:'text_illo']">
          {/* Landscape side padding keeps the copy off the illustration and the window
              edge; the width steps up on wide screens so the middle isn't left empty.
              w-full rather than sizing to its content: the form's slider lays all its
              steps side by side, which would otherwise make the block far too wide. */}
          <div className="contents landscape:block landscape:w-full landscape:max-w-[40rem] landscape:self-center landscape:justify-self-center landscape:[grid-area:text] lg:landscape:px-6 xl:landscape:max-w-[46rem] 2xl:landscape:max-w-[54rem] 2xl:landscape:px-10">
            <h2 className="relative z-[1] m-0 self-center font-specials text-[clamp(1.1rem,5cqw,1.6rem)] font-normal leading-[1.1] text-white [grid-area:intro] landscape:max-w-[28em] landscape:pt-0 landscape:text-[clamp(1.15rem,1.9vw,2.1rem)]">
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
              <CallbackForm className="relative z-[1] mx-auto landscape:mx-0 landscape:mt-8" />
            </div>
          </div>
          <div ref={illoRef} className="relative z-[1] flex items-start justify-end [container-type:inline-size] [grid-area:illo] landscape:justify-center landscape:[container-type:size]">
            <Illustration className="w-full landscape:w-[min(100cqw,calc(100cqh*902/1308))]" />
          </div>
        </div>
      </section>
      <LangToggle />
      <ClickTracking />
      <MetaPixel />
      <StickyCallback />
      <Features />
      <LetsConnect />
      <Qualifications />
    </main>
  );
}
