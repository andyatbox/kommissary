import TimelineSection from './TimelineSection';
import type { Moment } from '@/lib/story/timeline';

/** Fades the rule in and out at its ends instead of letting it stop dead. */
const RULE_FADE =
  'linear-gradient(to bottom, transparent 0, #000 5rem, #000 calc(100% - 10rem), transparent 100%)';

export default function Timeline({
  moments,
  heading = 'Our Story & Timeline',
}: {
  moments: Moment[];
  heading?: string;
}) {
  return (
    <div>
      {/* Half the viewport, so the first moment's ring lands dead centre on load. */}
      <header className="tl-col flex h-[50vh] flex-col justify-end pb-[7vh]">
        <h1 className="max-w-[16ch] text-4xl font-medium leading-[1.05] text-white sm:text-5xl md:text-6xl lg:text-7xl">
          {heading}
        </h1>
      </header>

      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-[var(--line-x)] top-0 w-[3px] -translate-x-1/2 bg-coral/40"
          style={{ maskImage: RULE_FADE, WebkitMaskImage: RULE_FADE }}
        />

        <div className="space-y-[14vh] pb-[22vh] md:space-y-[18vh]">
          {moments.map((moment) => (
            <TimelineSection key={moment.id} moment={moment} />
          ))}
        </div>
      </div>
    </div>
  );
}
