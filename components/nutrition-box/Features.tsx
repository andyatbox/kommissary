'use client';

import Image, { type StaticImageData } from 'next/image';
import stethoscope from './assets/features/01-stethoscope.png';
import pantryBox from './assets/features/02-pantry-box.png';
import appleOnBook from './assets/features/03-apple-on-book.png';
import halalKosher from './assets/features/04-halal-and-kosher.png';
import deliveryTruck from './assets/features/05-delivery-truck.png';
import bronxMapPin from './assets/features/06-bronx-map-pin.png';
import { useLang } from './i18n';
import { useSectionCopy } from '@/lib/cmsCopy';
import { FEATURES } from './copy';
import { SECTION_TITLE } from './styles';

const ICONS: StaticImageData[] = [stethoscope, pantryBox, appleOnBook, halalKosher, deliveryTruck, bronxMapPin];

/** Icons an editor can pick per feature in Sanity. A feature without one takes the icon
 *  at its position, which matches the built-in order. */
export const FEATURE_ICONS: Record<string, StaticImageData> = {
  stethoscope,
  'pantry-box': pantryBox,
  'apple-on-book': appleOnBook,
  'halal-kosher': halalKosher,
  'delivery-truck': deliveryTruck,
  'bronx-map-pin': bronxMapPin,
};

export default function Features() {
  const { heading, features } = useSectionCopy('features', FEATURES, useLang());
  return (
    // -mt-[3px] tucks it under the hero's floor: the floor image's bottom edge is
    // anti-aliased, and with only a 1px overlap the navy behind that soft edge
    // still showed through as a hairline. Same coral, so the overlap is invisible.
    <section data-section="what-you-get" className="relative -mt-[3px] bg-coral px-4 py-16 text-[#000066] md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className={SECTION_TITLE}>{heading}</h2>
        <ul className="m-0 grid list-none gap-x-10 gap-y-14 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon, title, copy }, i) => (
            <li key={i} className="text-center">
              <Image
                src={(icon && FEATURE_ICONS[icon]) || ICONS[i % ICONS.length]}
                alt=""
                className="mx-auto h-auto w-40 md:w-48"
                sizes="(min-width: 768px) 192px, 160px"
              />
              <h3 className="mb-2 mt-4 font-specials text-3xl font-normal leading-none">{title}</h3>
              <p className="mx-auto m-0 max-w-xs text-lg leading-snug">{copy}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
