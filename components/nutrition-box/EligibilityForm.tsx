'use client';

import { formsSendForReal } from '@/lib/siteEnv';
import { keepTrackInPlace, releaseFocusIn } from '@/lib/stepSlider';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { adSource, forgetAdSource, rememberAdSource } from './adSource';
import { isTestSite, sendEvent } from './analytics';
import { EMAIL, FOCUS_FORM_EVENT, PHONE, PHONE_HREF } from './content';
import { type Lang, useLang } from './i18n';
import PrivacyConsent from './PrivacyConsent';

// The Nutrition Box "Request to Connect" form, built on the page and submitted straight to the
// client's Google Form (responses go to its spreadsheet; an Apps Script emails each one
// to the care team). It asks only what's needed to call, text or email someone back:
// no Medicaid status and no health questions, so nothing in it is health information.
// Eligibility is checked later, by phone, in the SOMOS network's own system.
//
// Steps: ZIP → (outside the Bronx: a notice, then continue) → name → date of birth →
// language → how to reach them → their phone and/or email, with the consent line by the
// submit button → thank you. Which ad they came from (?src=) goes along unseen, as
// "Source" (adSource.ts).
//
// Google Form "Bronx Medicaid Nutrition Box" (edit ID 1trLJjU-aAFmxvWOU0xdaFheCX2n5tII8DiTw4z2i3ww),
// in the kommissary.com Workspace. All its questions are optional there on purpose: the
// site validates, and a required question left blank would make Google drop the response
// silently. If questions are added, removed or recreated there, update ENTRY to match
// (entry IDs are in the form's page source); rewording needs no change.
const FORM_RESPONSE_URL: string | null =
  'https://docs.google.com/forms/d/e/1FAIpQLSdZMb1ujzcMcVyMoqkRGr0sqsRMymrpbm0ZUygOGd2iF8RYNw/formResponse';

const ENTRY: Record<'zip' | 'inBronx' | 'firstName' | 'lastName' | 'dob' | 'language' | 'contact' | 'phone' | 'email' | 'source', string | null> = {
  zip: 'entry.1571081632',
  inBronx: 'entry.1634185568',
  firstName: 'entry.1391909617',
  lastName: 'entry.1030546784',
  // A Date-type question: Google takes it as _year, _month and _day parts (see submit).
  dob: 'entry.48814918',
  language: 'entry.1806830499',
  contact: 'entry.1429210405',
  phone: 'entry.390752080',
  email: 'entry.1994272451',
  // Not asked: the ad's creative variant from the link (?src=c1A), filled in by the page.
  source: 'entry.422505302',
};

// Bronx ZIP codes. The visitor only types a ZIP; whether it's in the Bronx is worked out
// here, picks the route (non-Bronx ZIPs see a notice, then continue), and is sent to the
// Google Form's "Bronx ZIP (filled in automatically)" question as Yes or No.
const BRONX_ZIPS = new Set(Array.from({ length: 25 }, (_, i) => String(10451 + i)));

type Method = 'call' | 'text' | 'email';
// Sent in English whatever the page language, so the spreadsheet stays consistent; these
// are the Google Form's checkbox options.
const METHOD_VALUE: Record<Method, string> = { call: 'Call me', text: 'Text me', email: 'Email me' };

// Shown as each language's own name, with the English name for non-Latin scripts.
// `value` is what goes in the spreadsheet.
const LANGUAGES: { value: string; label: string }[] = [
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Español (Spanish)' },
  { value: 'Bengali', label: 'বাংলা (Bengali)' },
  { value: 'Arabic', label: 'العربية (Arabic)' },
  { value: 'French', label: 'Français (French)' },
  { value: 'Haitian Creole', label: 'Kreyòl ayisyen (Haitian Creole)' },
  { value: 'Chinese (Mandarin)', label: '中文 (Chinese, Mandarin)' },
  { value: 'Chinese (Cantonese)', label: '粵語 (Chinese, Cantonese)' },
  { value: 'Russian', label: 'Русский (Russian)' },
  { value: 'Albanian', label: 'Shqip (Albanian)' },
  { value: 'Wolof', label: 'Wolof' },
  { value: 'Twi', label: 'Twi' },
  { value: 'Hindi', label: 'हिन्दी (Hindi)' },
  { value: 'Urdu', label: 'اردو (Urdu)' },
  { value: 'Vietnamese', label: 'Tiếng Việt (Vietnamese)' },
  { value: 'Korean', label: '한국어 (Korean)' },
  { value: 'Tagalog', label: 'Tagalog' },
  { value: 'Portuguese', label: 'Português (Portuguese)' },
  { value: 'Other', label: 'Other / Otro' },
];

type StepId = 'zip' | 'outside' | 'name' | 'dob' | 'language' | 'contact' | 'details' | 'done';
// Date of birth is required on both routes (the client's request, October 2026).
const STEPS_BRONX: StepId[] = ['zip', 'name', 'dob', 'language', 'contact', 'details', 'done'];
const STEPS_OUTSIDE: StepId[] = ['zip', 'outside', 'name', 'dob', 'language', 'contact', 'details', 'done'];
// The questions counted in "Step n of N" (not the notice or the thank-you).
const QUESTION_STEPS: StepId[] = ['zip', 'name', 'dob', 'language', 'contact', 'details'];

type Values = { zip: string; firstName: string; lastName: string; dobMonth: string; dobDay: string; dobYear: string; language: string; methods: Method[]; phone: string; email: string };

const COPY = {
  en: {
    formLabel: 'Nutrition Box request to connect',
    stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
    zip: 'What’s your ZIP code?',
    zipHint: 'For home delivery',
    outsideTitle: 'Nutrition Box serves the Bronx',
    outsideBody:
      'Right now, Nutrition Box delivers to Bronx addresses only. We can still connect you with food resources in your area. Share your information and we’ll reach out.',
    connect: 'Connect me',
    name: 'What’s your name?',
    firstName: 'First name',
    lastName: 'Last name',
    dob: 'What’s your date of birth?',
    dobMonth: 'Month',
    dobDay: 'Day',
    dobYear: 'Year',
    language: 'What language do you prefer?',
    contact: 'How should we reach you?',
    contactHint: 'Choose one or more.',
    details: 'Where can we reach you?',
    methods: { call: 'Call me', text: 'Text me', email: 'Email me' } satisfies Record<Method, string>,
    phone: 'Phone number',
    email: 'Email address',
    next: 'Next',
    back: 'Back',
    submit: 'Request to Connect',
    sending: 'Sending…',
    errors: {
      zip: 'Please enter a 5-digit ZIP code.',
      name: 'Please enter your first and last name.',
      dob: 'Please enter a valid date of birth (MM / DD / YYYY).',
      methods: 'Please choose how we should reach you.',
      phone: 'Please enter a 10-digit phone number.',
      email: 'Please enter a valid email address.',
    },
    notConnected: 'This form isn’t connected yet.',
    hipaa: 'HIPAA compliant',
    failed: (phone: ReactNode) => <>Something went wrong. Please try again, or call us at {phone}.</>,
    doneTitle: 'Thank you!',
    how: (methods: Method[]) => joinOr(methods.map((m) => ({ call: 'a call', text: 'a text', email: 'an email' })[m]), 'or'),
    doneBronx: (name: string, how: string) =>
      `${name ? `Thanks, ${name}. ` : ''}A member of our team will reach out with ${how} soon to see if you qualify for Nutrition Box.`,
    doneOutside: (name: string, how: string) =>
      `${name ? `Thanks, ${name}. ` : ''}A member of our team will reach out with ${how} soon to help connect you with food resources.`,
    questions: (phone: ReactNode, email: ReactNode) => (
      <>
        Questions? Call us at {phone} or email {email}.
      </>
    ),
  },
  es: {
    formLabel: 'Solicitud de contacto de Nutrition Box',
    stepOf: (n: number, total: number) => `Paso ${n} de ${total}`,
    zip: '¿Cuál es su código postal?',
    zipHint: 'Para la entrega a domicilio',
    outsideTitle: 'Nutrition Box atiende al Bronx',
    outsideBody:
      'Por ahora, Nutrition Box solo hace entregas a direcciones del Bronx. Aun así, podemos conectarle con recursos de alimentos en su zona. Comparta su información y nos comunicaremos con usted.',
    connect: 'Conéctenme',
    name: '¿Cuál es su nombre?',
    firstName: 'Nombre',
    lastName: 'Apellido',
    dob: '¿Cuál es su fecha de nacimiento?',
    dobMonth: 'Mes',
    dobDay: 'Día',
    dobYear: 'Año',
    language: '¿Qué idioma prefiere?',
    contact: '¿Cómo nos comunicamos con usted?',
    contactHint: 'Elija una o más opciones.',
    details: '¿Dónde podemos comunicarnos con usted?',
    methods: { call: 'Llámenme', text: 'Envíenme un texto', email: 'Envíenme un correo' } satisfies Record<Method, string>,
    phone: 'Número de teléfono',
    email: 'Correo electrónico',
    next: 'Siguiente',
    back: 'Atrás',
    submit: 'Solicitar contacto',
    sending: 'Enviando…',
    errors: {
      zip: 'Escriba un código postal de 5 dígitos.',
      name: 'Escriba su nombre y apellido.',
      dob: 'Escriba una fecha de nacimiento válida (MM / DD / AAAA).',
      methods: 'Elija cómo debemos comunicarnos con usted.',
      phone: 'Escriba un número de teléfono de 10 dígitos.',
      email: 'Escriba un correo electrónico válido.',
    },
    notConnected: 'Este formulario todavía no está conectado.',
    hipaa: 'Cumple con HIPAA',
    failed: (phone: ReactNode) => <>Algo salió mal. Inténtelo de nuevo o llámenos al {phone}.</>,
    doneTitle: '¡Gracias!',
    how: (methods: Method[]) =>
      joinOr(methods.map((m) => ({ call: 'una llamada', text: 'un mensaje de texto', email: 'un correo electrónico' })[m]), 'o'),
    doneBronx: (name: string, how: string) =>
      `${name ? `Gracias, ${name}. ` : ''}Pronto un miembro de nuestro equipo se comunicará con usted por ${how} para ver si califica para Nutrition Box.`,
    doneOutside: (name: string, how: string) =>
      `${name ? `Gracias, ${name}. ` : ''}Pronto un miembro de nuestro equipo se comunicará con usted por ${how} para ayudarle a encontrar recursos de alimentos.`,
    questions: (phone: ReactNode, email: ReactNode) => (
      <>
        ¿Preguntas? Llámenos al {phone} o escríbanos a {email}.
      </>
    ),
  },
} satisfies Record<Lang, unknown>;

/** "a call, a text or an email" */
function joinOr(items: string[], or: string): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} ${or} ${items[items.length - 1]}`;
}

/** US phone digits, without a leading country code 1. */
function phoneDigits(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
}

function formatPhone(value: string): string {
  const d = phoneDigits(value);
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : value.trim();
}

/** "MM/DD/YYYY" for a real, past date (from 1900 on), else null. */
function dobString(v: { dobMonth: string; dobDay: string; dobYear: string }): string | null {
  const m = Number(v.dobMonth), d = Number(v.dobDay), y = Number(v.dobYear);
  if (!/^\d{4}$/.test(v.dobYear.trim()) || y < 1900) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d || date > new Date()) return null;
  return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`;
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function smoothScrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const INPUT =
  'w-full rounded-2xl border-2 border-solid border-transparent bg-cream px-4 py-3 text-lg text-[#000066] outline-none placeholder:text-[#000066]/40 focus:border-canary';
const SMALL_LABEL = 'mb-1.5 block text-base text-white/80';
const PRIMARY =
  'cursor-pointer rounded-full border-0 bg-canary px-6 py-2 font-specials text-xl text-[#000066] transition-colors hover:bg-white disabled:cursor-wait disabled:opacity-60 md:text-2xl';
const CHOICE =
  'cursor-pointer rounded-full border-2 border-solid border-canary bg-transparent px-5 py-1.5 font-specials text-xl text-canary transition-colors hover:bg-canary hover:text-[#000066]';
const CHOICE_ON = 'cursor-pointer rounded-full border-2 border-solid border-canary bg-canary px-5 py-1.5 font-specials text-xl text-[#000066]';
const QUESTION = 'm-0 mb-4 block p-0 font-specials text-2xl font-normal leading-tight text-white md:text-[1.75rem]';

export default function EligibilityForm({ className = '' }: { className?: string }) {
  const lang = useLang();
  const t = COPY[lang];
  const id = useId();
  const [inBronx, setInBronx] = useState(true);
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<Values>({
    zip: '',
    firstName: '',
    lastName: '',
    dobMonth: '',
    dobDay: '',
    dobYear: '',
    language: '',
    methods: [],
    phone: '',
    email: '',
  });
  const [error, setError] = useState<ReactNode>(null);
  const [sending, setSending] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const [trackHeight, setTrackHeight] = useState<number>();
  const slideRefs = useRef<(HTMLFieldSetElement | null)[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  // Set once they've moved between steps, so going Back to the first step focuses it too
  // (but the page doesn't grab focus on load).
  const moved = useRef(false);

  const steps = inBronx ? STEPS_BRONX : STEPS_OUTSIDE;
  const step = steps[index];
  const questionNumber = steps.slice(0, index + 1).filter((s) => QUESTION_STEPS.includes(s)).length;
  const questionTotal = steps.filter((s) => QUESTION_STEPS.includes(s)).length;
  // Default the language to the page's, until they pick one.
  const language = values.language || (lang === 'es' ? 'Spanish' : 'English');

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setError(null);
  };

  // Updates from the latest state, so quick taps on two options can't overwrite each other.
  const toggleMethod = (m: Method) => {
    setValues((v) => ({ ...v, methods: v.methods.includes(m) ? v.methods.filter((x) => x !== m) : [...v.methods, m] }));
    setError(null);
  };

  // Put the cursor in the current step's first field (or button) after it slides in.
  const focusCurrent = useCallback((i: number) => {
    const slide = slideRefs.current[i];
    slide?.querySelector<HTMLElement>('input, select, button[data-choice], [data-focus]')?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!moved.current) return;
    const timer = setTimeout(() => focusCurrent(index), 60);
    return () => clearTimeout(timer);
  }, [index, inBronx, focusCurrent]);

  /** Moves to step i (see lib/stepSlider.ts for why focus is dropped first). */
  const go = (i: number) => {
    releaseFocusIn(trackRef.current);
    moved.current = true;
    setIndex(i);
  };

  // An ad link's creative variant (?src=c1A), kept until the form is sent.
  useEffect(() => rememberAdSource(), []);

  // The card fits the current step (steps differ in height), easing between them.
  useEffect(() => {
    const slide = slideRefs.current[index];
    if (!slide) return;
    const observer = new ResizeObserver(() => setTrackHeight(slide.offsetHeight));
    observer.observe(slide);
    return () => observer.disconnect();
  }, [index, inBronx]);

  // "Get Started" buttons further down the page scroll back up here.
  useEffect(() => {
    const onFocusForm = () => {
      smoothScrollToTop();
      setHighlight(true);
      focusCurrent(index);
      setTimeout(() => setHighlight(false), 2200);
    };
    window.addEventListener(FOCUS_FORM_EVENT, onFocusForm);
    return () => window.removeEventListener(FOCUS_FORM_EVENT, onFocusForm);
  }, [index, focusCurrent]);

  const wantsPhone = values.methods.includes('call') || values.methods.includes('text');
  const wantsEmail = values.methods.includes('email');

  const validate = (s: StepId): string | null => {
    if (s === 'zip' && !/^\d{5}$/.test(values.zip.trim())) return t.errors.zip;
    if (s === 'name' && (!values.firstName.trim() || !values.lastName.trim())) return t.errors.name;
    if (s === 'dob' && !dobString(values)) return t.errors.dob;
    if (s === 'contact' && !values.methods.length) return t.errors.methods;
    if (s === 'details') {
      if (wantsPhone && phoneDigits(values.phone).length !== 10) return t.errors.phone;
      if (wantsEmail && !isEmail(values.email)) return t.errors.email;
    }
    return null;
  };

  const submit = async () => {
    const methods = (['call', 'text', 'email'] as const).filter((m) => values.methods.includes(m));
    const source = adSource();
    const answers: [keyof typeof ENTRY, string][] = [
      ['zip', values.zip.trim()],
      ['inBronx', inBronx ? 'Yes' : 'No'],
      ['firstName', values.firstName.trim()],
      ['lastName', values.lastName.trim()],
      ['language', language],
      ['phone', wantsPhone ? formatPhone(values.phone) : ''],
      ['email', wantsEmail ? values.email.trim() : ''],
      ['source', source],
    ];
    // Analytics and Meta get only that a request was sent, its language and which ad it came
    // from: nothing anyone typed.
    const lead = { form_name: 'nutrition_box_callback', page_language: lang, ...(source ? { source } : {}) };

    const connected = FORM_RESPONSE_URL && Object.values(ENTRY).every(Boolean);
    if (!connected) {
      if (isTestSite()) {
        // Preview only: show the thank-you so the flow can be reviewed. Nothing is sent.
        console.info('[form] not connected; would send', Object.fromEntries(answers), dobString(values), methods.map((m) => METHOD_VALUE[m]));
        go(steps.length - 1);
      } else {
        setError(t.notConnected);
      }
      return;
    }

    const body = new URLSearchParams({ fvv: '1', pageHistory: '0' });
    for (const [key, value] of answers) if (value) body.set(ENTRY[key] as string, value);
    // Date of birth: the Google Form's Date question takes year, month and day separately.
    const dob = dobString(values);
    if (dob) {
      const [mm, dd, yyyy] = dob.split('/');
      body.set(`${ENTRY.dob}_year`, yyyy);
      body.set(`${ENTRY.dob}_month`, String(Number(mm)));
      body.set(`${ENTRY.dob}_day`, String(Number(dd)));
    }
    // Google Forms takes one entry per checked box.
    for (const m of methods) body.append(ENTRY.contact as string, METHOD_VALUE[m]);

    // Off the live site (localhost, staging), show the thank-you without sending: a real
    // submission emails the care team. Add ?livesubmit=1 to send anyway (lib/siteEnv.ts).
    if (!formsSendForReal()) {
      console.info('[form] test site, not sent:', Object.fromEntries(body));
      sendEvent('generate_lead', lead);
      go(steps.length - 1);
      return;
    }

    setSending(true);
    setError(null);
    try {
      // Google doesn't allow reading the reply from another site (no-cors), so success
      // means the request reached Google. Answers are validated here first.
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      await fetch(FORM_RESPONSE_URL as string, { method: 'POST', mode: 'no-cors', body, signal: controller.signal });
      clearTimeout(timeout);
      sendEvent('generate_lead', lead);
      forgetAdSource();
      go(steps.length - 1);
    } catch {
      setError(t.failed(<PhoneLink />));
    } finally {
      setSending(false);
    }
  };

  const next = () => {
    const problem = validate(step);
    if (problem) {
      setError(problem);
      focusCurrent(index);
      return;
    }
    if (step === 'zip') {
      const bronx = BRONX_ZIPS.has(values.zip.trim());
      setInBronx(bronx);
      go(1);
      return;
    }
    if (steps[index + 1] === 'done') void submit();
    else go(index + 1);
  };

  const back = () => {
    setError(null);
    go(Math.max(0, index - 1));
  };

  const errorId = `${id}-error`;
  const invalid = { 'aria-invalid': Boolean(error) || undefined, 'aria-describedby': error ? errorId : undefined };
  const isLast = steps[index + 1] === 'done';

  return (
    <div
      data-section="eligibility-form"
      className={`w-full max-w-[34rem] rounded-xtra border-2 border-solid bg-[#000066]/90 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur transition-colors duration-500 md:p-6 ${
        highlight ? 'border-canary' : 'border-white/20'
      } ${className}`}
    >
      <form
        aria-label={t.formLabel}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (step !== 'done') next();
        }}
      >
        {step !== 'done' && (
          <div className="mb-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-canary transition-[width] duration-500 motion-reduce:transition-none"
                style={{ width: `${(questionNumber / questionTotal) * 100}%` }}
              />
            </div>
            <p className="m-0 whitespace-nowrap text-sm text-white/70" aria-live="polite">
              {t.stepOf(questionNumber, questionTotal)}
            </p>
          </div>
        )}

        {/* The slider: every step sits side by side; the track moves one width per step. */}
        <div
          ref={trackRef}
          onScroll={keepTrackInPlace}
          className="overflow-hidden transition-[height] duration-500 ease-out motion-reduce:transition-none"
          style={{ height: trackHeight }}
        >
          <div
            className="flex items-start transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {steps.map((s, i) => (
              <fieldset
                key={s}
                ref={(el) => {
                  slideRefs.current[i] = el;
                }}
                // Only the current step can be reached by keyboard or screen reader.
                {...(i !== index ? { inert: '' as unknown as boolean, 'aria-hidden': true } : {})}
                className="m-0 w-full min-w-0 shrink-0 border-0 p-0"
              >
                {renderStep(s)}
              </fieldset>
            ))}
          </div>
        </div>

        {error && (
          <p id={errorId} role="alert" className="m-0 mt-3 text-base text-canary">
            {error}
          </p>
        )}

        {step !== 'done' && (
          <div className={`mt-5 flex items-center gap-4 ${index > 0 ? 'justify-between' : 'justify-end'}`}>
            {index > 0 && (
              <button
                type="button"
                data-track="form-back"
                onClick={back}
                className="cursor-pointer border-0 bg-transparent p-0 text-lg text-white/80 underline decoration-1 underline-offset-4 hover:text-white"
              >
                {t.back}
              </button>
            )}
            <button
              type="submit"
              data-track={isLast ? 'form-submit' : step === 'outside' ? 'form-outside-connect' : 'form-next'}
              disabled={sending}
              className={PRIMARY}
            >
              {sending ? t.sending : isLast ? t.submit : step === 'outside' ? t.connect : t.next}
            </button>
          </div>
        )}
      </form>
      <p className="m-0 mt-4 flex items-center gap-1.5 border-0 border-t border-solid border-white/15 pt-3 text-xs text-white/60">
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-canary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" />
          <rect x="9" y="11" width="6" height="5" rx="1" />
          <path d="M10.5 11V9.5a1.5 1.5 0 0 1 3 0V11" />
        </svg>
        {t.hipaa} ·{' '}
        <a className="text-white/80 underline decoration-1 underline-offset-2 hover:text-canary" href={`/privacy/${lang === 'es' ? '?lang=es' : ''}`} target="_blank" rel="noopener" data-track="privacy-notice-badge">
          {lang === 'es' ? 'Aviso de privacidad' : 'Privacy Notice'}
        </a>
      </p>
    </div>
  );

  function renderStep(s: StepId) {
    switch (s) {
      case 'zip':
        return (
          <>
            <label htmlFor={`${id}-zip`} className={QUESTION}>
              {t.zip} <span className="block font-sans text-base text-white/60">{t.zipHint}</span>
            </label>
            <input
              id={`${id}-zip`}
              {...invalid}
              className={INPUT}
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={5}
              placeholder="104__"
              value={values.zip}
              onChange={(e) => set('zip', e.target.value.replace(/\D/g, ''))}
            />
          </>
        );
      case 'outside':
        return (
          <div data-focus tabIndex={-1} className="outline-none">
            <p className="m-0 mb-3 font-specials text-2xl leading-tight text-canary md:text-[1.75rem]">{t.outsideTitle}</p>
            <p className="m-0 text-lg leading-snug">{t.outsideBody}</p>
          </div>
        );
      case 'name':
        return (
          <>
            <legend className={QUESTION}>{t.name}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor={`${id}-first`} className={SMALL_LABEL}>
                  {t.firstName}
                </label>
                <input
                  id={`${id}-first`}
                  {...invalid}
                  className={INPUT}
                  type="text"
                  autoComplete="given-name"
                  value={values.firstName}
                  onChange={(e) => set('firstName', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor={`${id}-last`} className={SMALL_LABEL}>
                  {t.lastName}
                </label>
                <input
                  id={`${id}-last`}
                  {...invalid}
                  className={INPUT}
                  type="text"
                  autoComplete="family-name"
                  value={values.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                />
              </div>
            </div>
          </>
        );
      case 'dob':
        return (
          <>
            <legend className={QUESTION}>{t.dob}</legend>
            <div className="grid grid-cols-[1fr_1fr_1.5fr] gap-3">
              {(
                [
                  ['dobMonth', t.dobMonth, 'MM', 2, 'bday-month'],
                  ['dobDay', t.dobDay, 'DD', 2, 'bday-day'],
                  ['dobYear', t.dobYear, 'YYYY', 4, 'bday-year'],
                ] as const
              ).map(([key, label, ph, max, ac]) => (
                <div key={key}>
                  <label htmlFor={`${id}-${key}`} className={SMALL_LABEL}>
                    {label}
                  </label>
                  <input
                    id={`${id}-${key}`}
                    {...invalid}
                    className={INPUT}
                    type="text"
                    inputMode="numeric"
                    autoComplete={ac}
                    maxLength={max}
                    placeholder={ph}
                    value={values[key]}
                    onChange={(e) => set(key, e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              ))}
            </div>
          </>
        );
      case 'language':
        return (
          <>
            <label htmlFor={`${id}-language`} className={QUESTION}>
              {t.language}
            </label>
            <select
              id={`${id}-language`}
              className={`${INPUT} cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22><path d=%22M5 7l5 6 5-6%22 fill=%22none%22 stroke=%22%23000066%22 stroke-width=%222.5%22/></svg>')] bg-[length:1.25rem] bg-[right_1rem_center] bg-no-repeat pr-12`}
              value={language}
              onChange={(e) => set('language', e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </>
        );
      case 'contact':
        return (
          <>
            <legend className={QUESTION}>
              {t.contact} <span className="block font-sans text-base text-white/60">{t.contactHint}</span>
            </legend>
            <div className="flex flex-wrap gap-2.5">
              {(['call', 'text', 'email'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="checkbox"
                  aria-checked={values.methods.includes(m)}
                  data-choice
                  data-track={`form-contact-${m}`}
                  className={values.methods.includes(m) ? CHOICE_ON : CHOICE}
                  onClick={() => toggleMethod(m)}
                >
                  {values.methods.includes(m) ? '✓ ' : ''}
                  {t.methods[m]}
                </button>
              ))}
            </div>
          </>
        );
      case 'details':
        return (
          <>
            <legend className={QUESTION}>{t.details}</legend>
            {/* Side by side when both are asked for, on wider screens. */}
            <div className={`grid gap-3 ${wantsPhone && wantsEmail ? 'sm:grid-cols-2' : ''}`}>
              {wantsPhone && (
                <div>
                  <label htmlFor={`${id}-phone`} className={SMALL_LABEL}>
                    {t.phone}
                  </label>
                  <input
                    id={`${id}-phone`}
                    {...invalid}
                    className={INPUT}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="718-555-0123"
                    value={values.phone}
                    onChange={(e) => set('phone', e.target.value)}
                  />
                </div>
              )}
              {wantsEmail && (
                <div>
                  <label htmlFor={`${id}-email`} className={SMALL_LABEL}>
                    {t.email}
                  </label>
                  <input
                    id={`${id}-email`}
                    {...invalid}
                    className={INPUT}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={values.email}
                    onChange={(e) => set('email', e.target.value)}
                  />
                </div>
              )}
            </div>
            <PrivacyConsent variant="any" lang={lang} className="mt-4" />
          </>
        );
      case 'done': {
        const first = values.firstName.trim();
        const methods = (['call', 'text', 'email'] as const).filter((m) => values.methods.includes(m));
        const how = t.how(methods);
        return (
          <div role="status" data-focus tabIndex={-1} className="outline-none">
            <p className="m-0 mb-3 font-specials text-4xl leading-none text-canary">{t.doneTitle}</p>
            <p className="m-0 text-xl leading-snug">{inBronx ? t.doneBronx(first, how) : t.doneOutside(first, how)}</p>
            <p className="m-0 mt-4 text-base text-white/80">{t.questions(<PhoneLink />, <EmailLink />)}</p>
          </div>
        );
      }
    }
  }
}

function EmailLink() {
  return (
    <a className="whitespace-nowrap text-canary" href={`mailto:${EMAIL}`}>
      {EMAIL}
    </a>
  );
}

function PhoneLink() {
  return (
    <a className="whitespace-nowrap text-canary" href={PHONE_HREF}>
      {PHONE}
    </a>
  );
}
