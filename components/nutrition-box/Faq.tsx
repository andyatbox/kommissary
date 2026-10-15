'use client';

import type { ReactNode } from 'react';
import GoToFormButton from './GoToFormButton';
import { EMAIL, GET_STARTED, OPENS_NEW_WINDOW, PHONE, PHONE_HREF, SOMOS_URL } from './content';
import { type Lang, useCopy, useLang } from './i18n';
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

type Copy = { heading: string; faqs: { q: string; a: ReactNode }[]; ready: string };

const COPY: Record<Lang, Copy> = {
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
        a: (
          <>
            Yes. There&rsquo;s zero cost to you. Nutrition Box is 100% covered by your Medicaid benefits through New
            York State&rsquo;s Social Care Network program, which connects Medicaid members with help for
            health-related needs like healthy food. Kommissary is a provider in the Bronx&rsquo;s network, led by{' '}
            <Somos lang="en" />.
          </>
        ),
      },
      {
        q: 'Who can get a Nutrition Box?',
        a: 'You need to have Medicaid and live in the Bronx. After you reach out, we’ll do a short screening with you to confirm you qualify.',
      },
      {
        q: 'How do I sign up?',
        a: (
          <>
            Click <GoToFormButton className={INLINE_CTA} track="get-started-faq-answer">{GET_STARTED.en}</GoToFormButton> and answer a few quick
            questions, including a phone number where we can reach you. It only takes a minute.
          </>
        ),
      },
      {
        q: 'What happens after I fill out the form?',
        a: 'We’ll call or text you, whichever you prefer, to check whether you qualify and answer your questions. If you do, we’ll set up your deliveries.',
      },
      {
        q: 'I’m not sure I qualify. Should I still reach out?',
        a: (
          <>
            Yes. Fill out the form or call us at <Phone />. We&rsquo;ll help you check your eligibility, and if
            Nutrition Box isn&rsquo;t the right fit, we&rsquo;ll help connect you with other food resources.
          </>
        ),
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
        a: (
          <>
            Call us at <Phone /> or email <Email />.
          </>
        ),
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
        a: (
          <>
            Sí. No le cuesta nada. Nutrition Box está cubierto al 100% por sus beneficios de Medicaid a través del
            programa Social Care Network del estado de Nueva York, que conecta a los miembros de Medicaid con ayuda para
            necesidades relacionadas con la salud, como la comida saludable. Kommissary es proveedor de la red del
            Bronx, dirigida por <Somos lang="es" />.
          </>
        ),
      },
      {
        q: '¿Quién puede recibir un Nutrition Box?',
        a: 'Necesita tener Medicaid y vivir en el Bronx. Cuando se comunique con nosotros, haremos una breve evaluación con usted para confirmar que califica.',
      },
      {
        q: '¿Cómo me inscribo?',
        a: (
          <>
            Haga clic en <GoToFormButton className={INLINE_CTA} track="get-started-faq-answer">{GET_STARTED.es}</GoToFormButton> y responda unas
            preguntas rápidas, incluido un número de teléfono donde podamos comunicarnos con usted. Solo toma un
            minuto.
          </>
        ),
      },
      {
        q: '¿Qué pasa después de llenar el formulario?',
        a: 'Le llamaremos o le enviaremos un mensaje de texto, como usted prefiera, para ver si califica y responder sus preguntas. Si califica, organizaremos sus entregas.',
      },
      {
        q: 'No sé si califico. ¿Debo comunicarme de todos modos?',
        a: (
          <>
            Sí. Llene el formulario o llámenos al <Phone />. Le ayudaremos a verificar si califica y, si Nutrition Box
            no es la mejor opción, le ayudaremos a encontrar otros recursos de alimentos.
          </>
        ),
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
        a: (
          <>
            Llámenos al <Phone /> o escríbanos a <Email />.
          </>
        ),
      },
    ],
  },
};

export default function Faq() {
  const lang = useLang();
  const { heading, faqs, ready } = useCopy(COPY);
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
