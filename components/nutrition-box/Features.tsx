'use client';

import Image, { type StaticImageData } from 'next/image';
import stethoscope from './assets/features/01-stethoscope.png';
import pantryBox from './assets/features/02-pantry-box.png';
import appleOnBook from './assets/features/03-apple-on-book.png';
import halalKosher from './assets/features/04-halal-and-kosher.png';
import deliveryTruck from './assets/features/05-delivery-truck.png';
import bronxMapPin from './assets/features/06-bronx-map-pin.png';
import { type Lang, useCopy } from './i18n';
import { SECTION_TITLE } from './styles';

type Feature = { title: string; copy: string };

const ICONS: StaticImageData[] = [stethoscope, pantryBox, appleOnBook, halalKosher, deliveryTruck, bronxMapPin];

const COPY: Record<Lang, { heading: string; features: Feature[] }> = {
  en: {
    heading: 'What You Get',
    features: [
      {
        title: 'Medically Tailored Meals',
        copy: 'We assess your diet and medical needs, then build your meals and groceries around them. Nutritious food, customized for your health.',
      },
      {
        title: 'Fresh Grocery & Pantry Box',
        copy: 'Fresh, healthy groceries sourced from local farms, plus pantry staples to round out your kitchen. Farm-to-table food that nourishes.',
      },
      {
        title: 'Nutrition Education',
        copy: 'Learn how to eat well for your diet and your health, with practical guidance that helps you get the most from every meal.',
      },
      {
        title: 'Halal & Kosher Options',
        copy: 'Meals can be made halal or kosher friendly, so your box can honor your faith and food traditions.',
      },
      {
        title: 'Next Day Delivery',
        copy: 'Whenever possible, your Nutrition Box arrives the very next day, delivered right to your door.',
      },
      {
        title: 'Made In The Bronx',
        copy: 'Your meals are made locally, in our Bronx kitchen at 509 Manida Street.',
      },
    ],
  },
  es: {
    heading: 'Lo que recibe',
    features: [
      {
        title: 'Comidas adaptadas a su salud',
        copy: 'Evaluamos su dieta y sus necesidades médicas, y preparamos sus comidas y comestibles de acuerdo con ellas. Comida nutritiva, hecha a la medida de su salud.',
      },
      {
        title: 'Caja de comestibles frescos y despensa',
        copy: 'Comestibles frescos y saludables de granjas locales, además de productos básicos de despensa para completar su cocina. Comida de la granja a la mesa que nutre.',
      },
      {
        title: 'Educación nutricional',
        copy: 'Aprenda a comer bien según su dieta y su salud, con consejos prácticos que le ayudan a aprovechar al máximo cada comida.',
      },
      {
        title: 'Opciones halal y kosher',
        copy: 'Las comidas pueden prepararse aptas para dietas halal o kosher, para que su caja respete su fe y sus tradiciones alimentarias.',
      },
      {
        title: 'Entrega al día siguiente',
        copy: 'Siempre que sea posible, su Nutrition Box llega al día siguiente, directo a su puerta.',
      },
      {
        title: 'Hecho en el Bronx',
        copy: 'Sus comidas se preparan aquí, en nuestra cocina del Bronx en el 509 de Manida Street.',
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
    <section data-section="what-you-get" className="relative -mt-[3px] bg-coral px-4 py-16 text-[#000066] md:py-24">
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
