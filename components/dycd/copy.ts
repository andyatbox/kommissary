// Built-in copy for the Community Leaders page (/dycd), in English and Spanish.
//
// Every section here can be overridden from Sanity, field by field (lib/cmsCopy.tsx): an
// editor's text wins where filled in, and anything left empty falls back to this. The
// same data seeds the Sanity document (scripts/seed-outreach-pages.mts), so keep this file
// plain data: no JSX, no imports beyond types.
//
// Placeholders in braces are filled in by the section that shows them:
//   {callback}  the "Request a Callback" button that scrolls back to the form
//   {somos}     the link to the SOMOS Social Care Network

import type { Lang } from '@/lib/cmsCopy';

export type Hero = { headline: string; intro: string };
export type FeaturesCopy = { heading: string; features: { icon?: string; title: string; copy: string }[] };
export type QualificationsCopy = {
  heading: string;
  points: { big: string; copy: string; wide?: boolean; somos?: boolean }[];
};
export type LetsConnectCopy = { heading: string; intro: string; help: string; call: string; email: string };

export const HERO: Record<Lang, Hero> = {
  en: {
    headline: 'Community leaders—connect Bronx families on Medicaid with free, nutritious food, delivered.',
    intro:
      '“It takes a village,” as they say. Help your community from food insecurity with free boxes of medically tailored food and groceries, delivered straight to their homes. Fill out the form below to connect and help feed the village.',
  },
  es: {
    headline: 'Líderes comunitarios: conecten a las familias del Bronx que tienen Medicaid con comida nutritiva y gratis, entregada a domicilio.',
    intro:
      '“Hace falta todo un pueblo”, como dicen. Ayude a su comunidad a enfrentar la inseguridad alimentaria con cajas gratis de comida y comestibles adaptados a sus necesidades médicas, entregadas directo a sus hogares. Llene el formulario a continuación para conectarse y ayudar a alimentar al pueblo.',
  },
};

export const FEATURES: Record<Lang, FeaturesCopy> = {
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

export const QUALIFICATIONS: Record<Lang, QualificationsCopy> = {
  en: {
    heading: 'The Kommissary Impact',
    points: [
      { big: '30,000+', copy: 'meals created every day in our kitchens.', wide: true },
      { big: 'Millions', copy: 'fed through schools, senior care facilities, and shelters across NYC.', wide: true },
      { big: 'USDA', copy: 'Meals are prepared in our USDA facility.' },
      { big: 'Dietitian', copy: 'approved menus, planned for each recipient’s health.' },
      {
        big: 'SOMOS',
        somos: true,
        copy: 'We’re a provider in the {somos}, connecting Bronx Medicaid members with healthy food.',
      },
    ],
  },
  es: {
    heading: 'El impacto de Kommissary',
    points: [
      { big: '30,000+', copy: 'comidas preparadas cada día en nuestras cocinas.', wide: true },
      {
        big: 'Millones',
        copy: 'de personas alimentadas en escuelas, centros para personas mayores y albergues de toda la ciudad de Nueva York.',
        wide: true,
      },
      { big: 'USDA', copy: 'Las comidas se preparan en nuestras instalaciones USDA.' },
      { big: 'Dietistas', copy: 'aprueban nuestros menús, planificados para la salud de cada beneficiario.' },
      {
        big: 'SOMOS',
        somos: true,
        copy: 'Somos proveedor de la red {somos}, que conecta a los miembros de Medicaid del Bronx con comida saludable.',
      },
    ],
  },
};

export const LETS_CONNECT: Record<Lang, LetsConnectCopy> = {
  en: {
    heading: 'Let’s Connect',
    intro: 'Click {callback} and fill out the form to get a call or text from us to discuss our program.',
    help: 'Need to get in touch sooner? Contact info below:',
    call: 'Call us',
    email: 'Email us',
  },
  es: {
    heading: 'Conectemos',
    intro: 'Haga clic en {callback} y llene el formulario para que lo llamemos o le enviemos un mensaje de texto y hablemos de nuestro programa.',
    help: '¿Necesita comunicarse antes? Información de contacto a continuación:',
    call: 'Llámenos',
    email: 'Escríbanos',
  },
}
