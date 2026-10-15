'use client';

// The Privacy Notice (kommissary.com/privacy), English and Spanish. Linked from the
// footer of the Next pages and from each form's consent line. Text supplied by the
// client; keep the effective date current when it changes.
import type { ReactNode } from 'react';
import { specials } from '../nutrition-box/fonts';
import { LangProvider, type Lang, useCopy } from '../nutrition-box/i18n';
import LangToggle from '../nutrition-box/LangToggle';

const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a className="break-words text-canary underline decoration-1 underline-offset-2 hover:no-underline" href={href} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

const PHONE = <a className="whitespace-nowrap text-canary" href="tel:+19293493890">929-349-3890</a>;
const EMAIL = <a className="text-canary" href="mailto:careservices@kommissary.com">careservices@kommissary.com</a>;

type Section = { h: string; body: ReactNode };

const COPY: Record<Lang, { title: string; effective: string; sections: Section[] }> = {
  en: {
    title: 'Privacy Notice',
    effective: 'Effective date: October 2026',
    sections: [
      {
        h: 'Who we are',
        body: (
          <p>
            Kommissary (LIC COM LLC) is a New York City food company and a provider in the SOMOS Social Care Network. This
            notice explains what information we collect on kommissary.com, including the Nutrition Box, Educator and
            Community Leaders pages, and how we use it.
          </p>
        ),
      },
      {
        h: 'What we collect',
        body: (
          <ul>
            <li>
              Information you give us in a form: your name, date of birth (Nutrition Box page), phone number, email address, ZIP code, preferred language, how
              you want to be contacted, and your school or organization (Educator and Community Leaders pages).
            </li>
            <li>
              Information collected automatically: the pages you visit, the device and browser you use, and cookies or
              similar identifiers, collected through tools such as Google Analytics and the Meta Pixel.
            </li>
          </ul>
        ),
      },
      {
        h: 'How we use it',
        body: (
          <ul>
            <li>To call or text you about the program you asked about, check whether you qualify, and set up services.</li>
            <li>To run and improve our website and to measure how our ads perform.</li>
          </ul>
        ),
      },
      {
        h: 'Who we share it with',
        body: (
          <>
            <ul>
              <li>Service providers that help us operate (for example website, form, analytics, phone and text-message providers).</li>
              <li>The SOMOS Social Care Network and New York State Medicaid program partners, as needed to screen, enroll and serve you.</li>
              <li>Authorities, when the law requires it.</li>
            </ul>
            <p>We do not sell your personal information.</p>
          </>
        ),
      },
      {
        h: 'Cookies and advertising',
        body: (
          <p>
            Third parties, including Meta and Google, may use cookies, pixels and similar technologies to collect or receive
            information from this website and elsewhere on the internet, and use that information to provide measurement
            services and to target and deliver ads. You can opt out of this use at{' '}
            <A href="https://www.aboutads.info/choices">https://www.aboutads.info/choices</A>, in your Facebook or Instagram ad
            settings (<A href="https://www.facebook.com/adpreferences">https://www.facebook.com/adpreferences</A>), and in your
            Google ad settings (<A href="https://adssettings.google.com">https://adssettings.google.com</A>). You can also block
            cookies in your browser.
          </p>
        ),
      },
      {
        h: 'Calls and texts',
        body: (
          <p>
            If you give us your phone number, we will call or text you about the program you asked about. Message and data
            rates may apply. Reply STOP to any text to stop receiving texts. We do not share your phone number with other
            companies for their marketing.
          </p>
        ),
      },
      {
        h: 'How long we keep it',
        body: <p>We keep your information as long as needed for the purposes above and as required by law and program rules.</p>,
      },
      {
        h: 'Your choices',
        body: (
          <p>
            You can ask us to update or delete your information, or to stop contacting you, by calling {PHONE} or emailing{' '}
            {EMAIL}.
          </p>
        ),
      },
      {
        h: 'Children',
        body: <p>This website is for adults. We do not knowingly collect information from children under 13.</p>,
      },
      {
        h: 'Changes',
        body: <p>We may update this notice. The date at the top shows the latest version.</p>,
      },
      {
        h: 'Contact',
        body: (
          <p>
            Kommissary (LIC COM LLC), 509 Manida Street, Bronx, NY 10474 · {PHONE} · {EMAIL}
          </p>
        ),
      },
    ],
  },
  es: {
    title: 'Aviso de privacidad',
    effective: 'Fecha de vigencia: octubre de 2026',
    sections: [
      {
        h: 'Quiénes somos',
        body: (
          <p>
            Kommissary (LIC COM LLC) es una empresa de alimentos de la ciudad de Nueva York y un proveedor de la red SOMOS
            Social Care Network. Este aviso explica qué información recopilamos en kommissary.com, incluidas las páginas de
            Nutrition Box, de Educadores y de Líderes comunitarios, y cómo la usamos.
          </p>
        ),
      },
      {
        h: 'Qué información recopilamos',
        body: (
          <ul>
            <li>
              La información que usted nos da en un formulario: su nombre, fecha de nacimiento (página de Nutrition Box), número de teléfono,
              correo electrónico, código postal, idioma preferido, cómo prefiere que nos comuniquemos con usted y su escuela u organización (páginas de
              Educadores y de Líderes comunitarios).
            </li>
            <li>
              Información que se recopila automáticamente: las páginas que visita, el dispositivo y el navegador que usa, y
              cookies o identificadores similares, mediante herramientas como Google Analytics y el píxel de Meta.
            </li>
          </ul>
        ),
      },
      {
        h: 'Cómo la usamos',
        body: (
          <ul>
            <li>
              Para llamarle o enviarle mensajes de texto sobre el programa que le interesa, verificar si califica y coordinar
              los servicios.
            </li>
            <li>Para operar y mejorar nuestro sitio web y medir el rendimiento de nuestros anuncios.</li>
          </ul>
        ),
      },
      {
        h: 'Con quién la compartimos',
        body: (
          <>
            <ul>
              <li>
                Proveedores de servicios que nos ayudan a operar (por ejemplo, servicios de sitio web, formularios, análisis,
                teléfono y mensajes de texto).
              </li>
              <li>
                La red SOMOS Social Care Network y los socios del programa Medicaid del estado de Nueva York, según sea
                necesario para evaluarle, inscribirle y atenderle.
              </li>
              <li>Las autoridades, cuando la ley lo exige.</li>
            </ul>
            <p>No vendemos su información personal.</p>
          </>
        ),
      },
      {
        h: 'Cookies y publicidad',
        body: (
          <p>
            Terceros, incluidos Meta y Google, pueden usar cookies, píxeles y tecnologías similares para recopilar o recibir
            información de este sitio web y de otros lugares de internet, y usar esa información para ofrecer servicios de
            medición y para dirigir y mostrar anuncios. Usted puede optar por no participar en{' '}
            <A href="https://www.aboutads.info/choices">https://www.aboutads.info/choices</A>, en la configuración de anuncios
            de Facebook o Instagram (<A href="https://www.facebook.com/adpreferences">https://www.facebook.com/adpreferences</A>)
            y en la configuración de anuncios de Google (<A href="https://adssettings.google.com">https://adssettings.google.com</A>).
            También puede bloquear las cookies en su navegador.
          </p>
        ),
      },
      {
        h: 'Llamadas y mensajes de texto',
        body: (
          <p>
            Si nos da su número de teléfono, le llamaremos o le enviaremos mensajes de texto sobre el programa que le
            interesa. Pueden aplicarse cargos por mensajes y datos. Responda STOP a cualquier mensaje para dejar de recibir
            mensajes de texto. No compartimos su número de teléfono con otras empresas para sus fines de mercadeo.
          </p>
        ),
      },
      {
        h: 'Cuánto tiempo la conservamos',
        body: <p>Conservamos su información el tiempo necesario para los fines indicados y según lo exijan la ley y las reglas del programa.</p>,
      },
      {
        h: 'Sus opciones',
        body: (
          <p>
            Puede pedirnos que actualicemos o eliminemos su información, o que dejemos de comunicarnos con usted, llamando al{' '}
            {PHONE} o escribiendo a {EMAIL}.
          </p>
        ),
      },
      {
        h: 'Menores',
        body: <p>Este sitio web es para adultos. No recopilamos a sabiendas información de menores de 13 años.</p>,
      },
      {
        h: 'Cambios',
        body: <p>Podemos actualizar este aviso. La fecha que aparece arriba indica la versión más reciente.</p>,
      },
      {
        h: 'Contacto',
        body: (
          <p>
            Kommissary (LIC COM LLC), 509 Manida Street, Bronx, NY 10474 · {PHONE} · {EMAIL}
          </p>
        ),
      },
    ],
  },
};

export default function PrivacyPage() {
  return (
    <LangProvider>
      <Notice />
    </LangProvider>
  );
}

function Notice() {
  const { title, effective, sections } = useCopy(COPY);
  return (
    <main id="privacy" className={`${specials.variable} bg-[#000066] px-5 pb-20 pt-[120px] text-white md:pt-[168px]`}>
      <article className="mx-auto max-w-3xl text-lg leading-relaxed [&_li]:mb-2 [&_p]:m-0 [&_p]:mb-4 [&_ul]:m-0 [&_ul]:mb-4 [&_ul]:pl-6">
        <h1 className="m-0 font-specials text-[clamp(2.75rem,7vw,5rem)] font-normal leading-[0.9] text-canary">{title}</h1>
        <p className="!mt-6 text-base text-white/70">{effective}</p>
        {sections.map(({ h, body }) => (
          <section key={h} className="mt-10">
            <h2 className="m-0 mb-3 font-specials text-3xl font-normal leading-tight text-canary">{h}</h2>
            {body}
          </section>
        ))}
      </article>
      <LangToggle />
    </main>
  );
}
