'use client';

import Image, { type StaticImageData } from 'next/image';
import stethoscope from '../nutrition-box/assets/features/01-stethoscope.png';
import pantryBox from '../nutrition-box/assets/features/02-pantry-box.png';
import appleOnBook from '../nutrition-box/assets/features/03-apple-on-book.png';
import halalKosher from '../nutrition-box/assets/features/04-halal-and-kosher.png';
import deliveryTruck from '../nutrition-box/assets/features/05-delivery-truck.png';
import bronxMapPin from '../nutrition-box/assets/features/06-bronx-map-pin.png';
import { type Lang, useCopy } from './i18n';
import { SECTION_TITLE } from './styles';

type Feature = { title: string; copy: string };

const ICONS: StaticImageData[] = [stethoscope, pantryBox, appleOnBook, halalKosher, deliveryTruck, bronxMapPin];

// Describes the program to community leaders, about the families who'd receive it rather than
// to them.
const COPY: Record<Lang, { heading: string; features: Feature[] }> = {
  en: {
    heading: 'Nutrition Box Features',
    features: [
      {
        title: 'Medically Tailored Meals',
        copy: 'Kommissary assesses each Box recipient’s diet and medical needs, building their meals and groceries around them. Nutritious food, customized for their health.',
      },
      {
        title: 'Fresh Grocery & Pantry Box',
        copy: 'Fresh, healthy groceries sourced from local farms, plus pantry staples to round out a family’s kitchen. Farm-to-table food that nourishes.',
      },
      {
        title: 'Nutrition Education',
        copy: 'Recipients learn how to eat well for their diet and health, with practical guidance to get the most from every meal.',
      },
      {
        title: 'Halal & Kosher Options',
        copy: 'Meals can be made halal or kosher friendly, honoring each family’s faith and food traditions.',
      },
      {
        title: 'Next Day Delivery',
        copy: 'Whenever possible, a Nutrition Box arrives the very next day, delivered right to the recipient’s door.',
      },
      {
        title: 'Made In The Bronx',
        copy: 'Meals are made locally, in Kommissary’s Bronx kitchen at 509 Manida Street.',
      },
    ],
  },
  es: {
    heading: 'Características de Nutrition Box',
    features: [
      {
        title: 'Comidas adaptadas a la salud',
        copy: 'Kommissary evalúa la dieta y las necesidades médicas de cada beneficiario y prepara sus comidas y comestibles de acuerdo con ellas. Comida nutritiva, hecha a la medida de su salud.',
      },
      {
        title: 'Caja de comestibles frescos y despensa',
        copy: 'Comestibles frescos y saludables de granjas locales, además de productos básicos de despensa para completar la cocina de cada familia. Comida de la granja a la mesa que nutre.',
      },
      {
        title: 'Educación nutricional',
        copy: 'Los beneficiarios aprenden a comer bien según su dieta y su salud, con consejos prácticos para aprovechar al máximo cada comida.',
      },
      {
        title: 'Opciones halal y kosher',
        copy: 'Las comidas pueden prepararse aptas para dietas halal o kosher, respetando la fe y las tradiciones alimentarias de cada familia.',
      },
      {
        title: 'Entrega al día siguiente',
        copy: 'Siempre que sea posible, la Nutrition Box llega al día siguiente, directo a la puerta del beneficiario.',
      },
      {
        title: 'Hecho en el Bronx',
        copy: 'Las comidas se preparan aquí, en la cocina de Kommissary en el Bronx, en el 509 de Manida Street.',
      },
    ],
  },
};

export default function Features() {
  const { heading, features } = useCopy(COPY);
  return (
    // -mt-[3px] tucks it under the hero's floor: the floor image's bottom edge is
    // anti-aliased, and with only a 1px overlap the navy behind that soft edge
    // still showed through as a hairline. Same coral, so the overlap is invisible.
    <section data-section="features" className="relative -mt-[3px] bg-coral px-4 py-16 text-[#000066] md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className={SECTION_TITLE}>{heading}</h2>
        <ul className="m-0 grid list-none gap-x-10 gap-y-14 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, copy }, i) => (
            <li key={i} className="text-center">
              <Image
                src={ICONS[i]}
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
