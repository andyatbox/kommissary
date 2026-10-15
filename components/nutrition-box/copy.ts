// Built-in copy for the Nutrition Box page (/bronx), in English and Spanish.
//
// Every section here can be overridden from Sanity, field by field (lib/cmsCopy.tsx): an
// editor's text wins where filled in, and anything left empty falls back to this. The
// same data seeds the Sanity document (scripts/seed-outreach-pages.mts), so keep this file
// plain data: no JSX, no imports beyond types.
//
// Placeholders in braces are filled in by the section that shows them:
//   {getStarted}  the "Get Started" button that scrolls back to the form
//   {phone}       the phone number, as a link
//   {email}       the email address, as a link
//   {somos}       the link to SOMOS (the Bronx Social Care Network)

import type { Lang } from '@/lib/cmsCopy';

export type Hero = { headline: string[]; intro: string };
export type FeaturesCopy = { heading: string; features: { icon?: string; title: string; copy: string }[] };
export type HowItWorksCopy = { heading: string; step: string; steps: string[]; help: string };
export type TrustCopy = {
  heading: string;
  points: { big: string; copy: string; wide?: boolean; somos?: boolean }[];
};
export type FaqCopy = { heading: string; ready: string; faqs: { q: string; a: string }[] };

/** Two-part headline: the line always breaks between the parts. */
export const HERO: Record<Lang, Hero> = {
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

export const FEATURES: Record<Lang, FeaturesCopy> = {
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

export const HOW_IT_WORKS: Record<Lang, HowItWorksCopy> = {
  en: {
    heading: 'How It Works',
    step: 'Step',
    steps: [
      'Confirm that you receive Medicaid and your home address is in the Bronx. Then click {getStarted} and fill out the form so we can connect.',
      'Fill out the form, providing a phone number to reach you at.',
      'We’ll give you a call or text, whichever you prefer, and see if you qualify for free food and groceries, delivered to you right away!',
    ],
    help: 'Need help right away? Call us at {phone} or drop an email to {email}.',
  },
  es: {
    heading: 'Cómo funciona',
    step: 'Paso',
    steps: [
      'Confirme que recibe Medicaid y que su domicilio está en el Bronx. Luego haga clic en {getStarted} y llene el formulario para que podamos comunicarnos.',
      'Llene el formulario e incluya un número de teléfono donde podamos comunicarnos con usted.',
      'Le llamaremos o le enviaremos un mensaje de texto, como usted prefiera, para ver si califica para recibir comida y comestibles gratis, ¡entregados de inmediato!',
    ],
    help: '¿Necesita ayuda ahora mismo? Llámenos al {phone} o escríbanos a {email}.',
  },
};

export const TRUST: Record<Lang, TrustCopy> = {
  en: {
    heading: 'A Trusted Neighbor',
    points: [
      { big: '30,000+', copy: 'meals created every day in our kitchens.', wide: true },
      { big: 'Millions', copy: 'fed through schools, senior care facilities, and shelters across NYC.', wide: true },
      { big: 'USDA', copy: 'Your food is prepared in our USDA facility.' },
      { big: 'Dietitian', copy: 'approved menus, planned for your health.' },
      {
        big: 'SOMOS',
        somos: true,
        copy: 'We’re a provider in the {somos}, connecting Bronx Medicaid members with healthy food.',
      },
    ],
  },
  es: {
    heading: 'Un vecino de confianza',
    points: [
      { big: '30,000+', copy: 'comidas preparadas cada día en nuestras cocinas.', wide: true },
      {
        big: 'Millones',
        copy: 'de personas alimentadas en escuelas, centros para personas mayores y albergues de toda la ciudad de Nueva York.',
        wide: true,
      },
      { big: 'USDA', copy: 'Su comida se prepara en nuestras instalaciones USDA.' },
      { big: 'Dietistas', copy: 'aprueban nuestros menús, planificados para su salud.' },
      {
        big: 'SOMOS',
        somos: true,
        copy: 'Somos proveedor de la red {somos}, que conecta a los miembros de Medicaid del Bronx con comida saludable.',
      },
    ],
  },
};

export const FAQ: Record<Lang, FaqCopy> = {
  en: {
    heading: 'FAQ',
    ready: 'Ready to see if you qualify?',
    faqs: [
      {
        q: 'What is Nutrition Box?',
        a: 'Nutrition Box brings free, nutritious meals and groceries to the door of qualified Bronx Medicaid members. Every box is made by Kommissary and tailored to your diet and health needs.',
      },
      {
        q: 'Is it really free?',
        a: 'Yes. There’s zero cost to you. Nutrition Box is 100% covered by your Medicaid benefits through New York State’s Social Care Network program, which connects Medicaid members with help for health-related needs like healthy food. Kommissary is a provider in the Bronx’s network, led by {somos}.',
      },
      {
        q: 'Who can get a Nutrition Box?',
        a: 'You need to have Medicaid and live in the Bronx. After you reach out, we’ll do a short screening with you to confirm you qualify.',
      },
      {
        q: 'How do I sign up?',
        a: 'Click {getStarted} and answer a few quick questions, including a phone number where we can reach you. It only takes a minute.',
      },
      {
        q: 'What happens after I fill out the form?',
        a: 'We’ll call or text you, whichever you prefer, to check whether you qualify and answer your questions. If you do, we’ll set up your deliveries.',
      },
      {
        q: 'I’m not sure I qualify. Should I still reach out?',
        a: 'Yes. Fill out the form or call us at {phone}. We’ll help you check your eligibility, and if Nutrition Box isn’t the right fit, we’ll help connect you with other food resources.',
      },
      {
        q: 'What’s in the box?',
        a: 'Depending on your needs: medically tailored meals, fresh groceries sourced from local farms, and pantry staples. We also offer nutrition education to help you get the most from your food.',
      },
      {
        q: 'Can my meals fit my diet or health condition?',
        a: 'Yes. We assess your diet and medical needs and tailor your meals and groceries to them. Our menus are approved by dietitians.',
      },
      {
        q: 'Can my meals be halal or kosher?',
        a: 'Our meals can be made halal or kosher if requested in the eligibility screening.',
      },
      {
        q: 'How fast will my food arrive?',
        a: 'Once you’re set up, your Nutrition Box is delivered right to your door, often as soon as the next day.',
      },
      {
        q: 'Can I get help in my language?',
        a: 'Tell us your preferred language on the form, and we’ll do our best to reach you in it.',
      },
      {
        q: 'Who is Kommissary?',
        a: 'Kommissary is a New York City food company that feeds millions through schools, senior care facilities, and shelters, creating over 30,000 meals a day. Nutrition Box meals are made right here in the Bronx, in our kitchen at 509 Manida Street.',
      },
      {
        q: 'How can I contact you?',
        a: 'Call us at {phone} or email {email}.',
      },
    ],
  },
  es: {
    heading: 'Preguntas frecuentes',
    ready: '¿Quiere saber si califica?',
    faqs: [
      {
        q: '¿Qué es Nutrition Box?',
        a: 'Nutrition Box lleva comidas y comestibles nutritivos y gratis a la puerta de los miembros de Medicaid del Bronx que califiquen. Kommissary prepara cada caja y la adapta a su dieta y a sus necesidades de salud.',
      },
      {
        q: '¿De verdad es gratis?',
        a: 'Sí. No le cuesta nada. Nutrition Box está cubierto al 100% por sus beneficios de Medicaid a través del programa Social Care Network del estado de Nueva York, que conecta a los miembros de Medicaid con ayuda para necesidades relacionadas con la salud, como la comida saludable. Kommissary es proveedor de la red del Bronx, dirigida por {somos}.',
      },
      {
        q: '¿Quién puede recibir un Nutrition Box?',
        a: 'Necesita tener Medicaid y vivir en el Bronx. Cuando se comunique con nosotros, haremos una breve evaluación con usted para confirmar que califica.',
      },
      {
        q: '¿Cómo me inscribo?',
        a: 'Haga clic en {getStarted} y responda unas preguntas rápidas, incluido un número de teléfono donde podamos comunicarnos con usted. Solo toma un minuto.',
      },
      {
        q: '¿Qué pasa después de llenar el formulario?',
        a: 'Le llamaremos o le enviaremos un mensaje de texto, como usted prefiera, para ver si califica y responder sus preguntas. Si califica, organizaremos sus entregas.',
      },
      {
        q: 'No sé si califico. ¿Debo comunicarme de todos modos?',
        a: 'Sí. Llene el formulario o llámenos al {phone}. Le ayudaremos a verificar si califica y, si Nutrition Box no es la mejor opción, le ayudaremos a encontrar otros recursos de alimentos.',
      },
      {
        q: '¿Qué incluye la caja?',
        a: 'Según sus necesidades: comidas adaptadas a su salud, comestibles frescos de granjas locales y productos básicos de despensa. También ofrecemos educación nutricional para ayudarle a aprovechar al máximo sus alimentos.',
      },
      {
        q: '¿Mis comidas pueden adaptarse a mi dieta o a mi condición de salud?',
        a: 'Sí. Evaluamos su dieta y sus necesidades médicas, y adaptamos sus comidas y comestibles a ellas. Nuestros menús están aprobados por dietistas.',
      },
      {
        q: '¿Mis comidas pueden ser halal o kosher?',
        a: 'Nuestras comidas pueden prepararse halal o kosher si lo solicita durante la evaluación de elegibilidad.',
      },
      {
        q: '¿Qué tan rápido llegará mi comida?',
        a: 'Una vez que complete su inscripción, su Nutrition Box se entrega directo a su puerta, muchas veces desde el día siguiente.',
      },
      {
        q: '¿Pueden ayudarme en mi idioma?',
        a: 'Indíquenos su idioma preferido en el formulario y haremos todo lo posible por comunicarnos con usted en ese idioma.',
      },
      {
        q: '¿Quién es Kommissary?',
        a: 'Kommissary es una empresa de alimentos de la ciudad de Nueva York que alimenta a millones de personas en escuelas, centros para personas mayores y albergues, y prepara más de 30,000 comidas al día. Las comidas de Nutrition Box se preparan aquí mismo en el Bronx, en nuestra cocina del 509 de Manida Street.',
      },
      {
        q: '¿Cómo puedo comunicarme con ustedes?',
        a: 'Llámenos al {phone} o escríbanos a {email}.',
      },
    ],
  },
}
