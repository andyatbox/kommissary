'use client';

// The consent line under each form's "how should we reach you" step, linking to the
// Privacy Notice (in a new tab, so the visitor doesn't lose their answers). Used by the
// Nutrition Box, Educator and Community Leaders forms; each passes its own language,
// since each page has its own language context.
//
// `phone`: the client's wording, for forms that only call or text.
// `any`: the same wording widened to cover email, for the Nutrition Box form.

export const PRIVACY_PATH = '/privacy/';

const COPY = {
  phone: {
    en: {
      before:
        'By submitting, you agree that Kommissary may call or text you at this number about this program. Message and data rates may apply. Reply STOP to opt out of texts. See our ',
      link: 'Privacy Notice',
    },
    es: {
      before:
        'Al enviar, usted acepta que Kommissary le llame o le envíe mensajes de texto a este número sobre este programa. Pueden aplicarse cargos por mensajes y datos. Responda STOP para dejar de recibir mensajes de texto. Consulte nuestro ',
      link: 'Aviso de privacidad',
    },
  },
  any: {
    en: {
      before:
        'By submitting, you agree that Kommissary may call, text or email you about this program using the information you provided. Message and data rates may apply. Reply STOP to opt out of texts. See our ',
      link: 'Privacy Notice',
    },
    es: {
      before:
        'Al enviar, usted acepta que Kommissary le llame, le envíe mensajes de texto o le escriba por correo electrónico sobre este programa usando la información que nos dio. Pueden aplicarse cargos por mensajes y datos. Responda STOP para dejar de recibir mensajes de texto. Consulte nuestro ',
      link: 'Aviso de privacidad',
    },
  },
};

const OPENS_NEW = { en: ' (opens in a new tab)', es: ' (se abre en una pestaña nueva)' };

export default function PrivacyConsent({
  variant,
  lang,
  className = '',
}: {
  variant: 'phone' | 'any';
  lang: 'en' | 'es';
  className?: string;
}) {
  const t = COPY[variant][lang];
  return (
    <p className={`m-0 text-sm leading-snug text-white/70 ${className}`}>
      {t.before}
      <a
        className="text-white underline decoration-1 underline-offset-2 hover:text-canary"
        href={`${PRIVACY_PATH}${lang === 'es' ? '?lang=es' : ''}`}
        target="_blank"
        rel="noopener"
        data-track="privacy-notice"
      >
        {t.link}
        <span className="sr-only">{OPENS_NEW[lang]}</span>
      </a>
      .
    </p>
  );
}
