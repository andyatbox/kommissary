'use client';

import { formsSendForReal } from '@/lib/siteEnv';
import { keepTrackInPlace, releaseFocusIn } from '@/lib/stepSlider';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { sendEvent } from './analytics';
import { EMAIL, FOCUS_FORM_EVENT, PHONE, PHONE_HREF } from './content';
import { type Lang, useLang } from './i18n';
import PrivacyConsent from '../nutrition-box/PrivacyConsent';

// The callback-request form, built on the page and submitted straight to the client's
// Google Form "Community Leader Connect" (edit ID 1YTNqSESLaK0aQ68XZS8cHYbJGk-R7Irkf8AObZcsnvA),
// one question per step. It has no branching, so every answer goes in one submission.
//
// FIELDS mirrors the Google Form's questions: `entry` is each question's entry.NNN ID
// from the form's page source; choice answers are sent in the form's own wording. The
// form has: What's your full name?, Phone Number, Email (optional unless "Email" is
// chosen), How would you like us to contact you? (checkboxes: Call me / Text me /
// Email). If questions are added, removed or recreated there, update FIELDS to match;
// rewording needs no change.
const FORM_RESPONSE_URL: string | null =
  'https://docs.google.com/forms/d/e/1FAIpQLScOT3yetaQpcqJ8_InqaLN5Vv_61H8kg0aFxipbFHwHVY9IXw/formResponse';

type Kind = 'text' | 'email' | 'tel' | 'choice' | 'checkboxes';

type Field = {
  key: string;
  entry: string | null;
  kind: Kind;
  required: boolean;
  label: Record<Lang, string>;
  autoComplete?: string;
  placeholder?: string;
  options?: { value: string; label: Record<Lang, string> }[];
  /** Small print under the field. */
  note?: Record<Lang, string>;
};

const FIELDS: Field[] = [
  {
    key: 'name',
    entry: 'entry.881882259',
    kind: 'text',
    required: true,
    autoComplete: 'name',
    label: { en: 'What’s your full name?', es: '¿Cuál es su nombre completo?' },
  },
  {
    key: 'phone',
    entry: 'entry.1186125495',
    kind: 'tel',
    required: true,
    autoComplete: 'tel-national',
    placeholder: '718-555-0123',
    label: { en: 'What’s the best phone number to reach you?', es: '¿A qué número de teléfono podemos llamarle?' },
  },
  {
    key: 'email',
    entry: 'entry.1575643340',
    kind: 'email',
    // Optional, unless they choose to be contacted by email (checked at the contact step).
    required: false,
    autoComplete: 'email',
    placeholder: 'name@example.org',
    label: { en: 'What’s your email address?', es: '¿Cuál es su correo electrónico?' },
  },
  {
    key: 'contact',
    entry: 'entry.2030618880',
    // Checkboxes in the Google Form: either or both.
    kind: 'checkboxes',
    required: true,
    label: { en: 'How would you like us to contact you?', es: '¿Cómo prefiere que nos comuniquemos con usted?' },
    // Values are the Google Form's own wording.
    options: [
      { value: 'Call me', label: { en: 'Call me', es: 'Llámenme' } },
      { value: 'Text me', label: { en: 'Text me', es: 'Envíenme un mensaje de texto' } },
      { value: 'Email', label: { en: 'Email me', es: 'Envíenme un correo' } },
    ],
    note: { en: 'Choose one or more.', es: 'Elija una o más opciones.' },
  },
];

// Checkbox answers are kept in one string, joined with this.
const SEP = '|';
const picked = (value: string | undefined) => (value ? value.split(SEP).filter(Boolean) : []);

const COPY = {
  en: {
    formLabel: 'Callback request form',
    stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
    optional: 'Optional',
    next: 'Next',
    back: 'Back',
    submit: 'Send',
    sending: 'Sending…',
    errors: {
      text: 'Please fill this in.',
      email: 'Please enter a valid email address.',
      tel: 'Please enter a 10-digit phone number.',
      choice: 'Please choose an option.',
      checkboxes: 'Please choose at least one.',
    } satisfies Record<Kind, string>,
    needEmail: 'To be contacted by email, go Back and add your email address.',
    notConnected: 'This form isn’t connected yet.',
    failed: (phone: ReactNode) => <>Something went wrong. Please try again, or call us at {phone}.</>,
    doneTitle: 'Thank you!',
    done: (name: string, how: string) =>
      `${name ? `Thanks, ${name}. ` : ''}We’ll reach out with ${how} soon to talk about bringing Nutrition Box to your community.`,
    how: (m: string[]) => joinOr(m.map((x) => ({ 'Call me': 'a call', 'Text me': 'a text', Email: 'an email' })[x] ?? x), 'or'),
    questions: (phone: ReactNode, email: ReactNode) => (
      <>
        Questions? Call us at {phone} or email {email}.
      </>
    ),
  },
  es: {
    formLabel: 'Formulario para solicitar una llamada',
    stepOf: (n: number, total: number) => `Paso ${n} de ${total}`,
    optional: 'Opcional',
    next: 'Siguiente',
    back: 'Atrás',
    submit: 'Enviar',
    sending: 'Enviando…',
    errors: {
      text: 'Complete este campo.',
      email: 'Escriba un correo electrónico válido.',
      tel: 'Escriba un número de teléfono de 10 dígitos.',
      choice: 'Elija una opción.',
      checkboxes: 'Elija al menos una opción.',
    } satisfies Record<Kind, string>,
    needEmail: 'Para recibir un correo, regrese y escriba su correo electrónico.',
    notConnected: 'Este formulario todavía no está conectado.',
    failed: (phone: ReactNode) => <>Algo salió mal. Inténtelo de nuevo o llámenos al {phone}.</>,
    doneTitle: '¡Gracias!',
    done: (name: string, how: string) =>
      `${name ? `Gracias, ${name}. ` : ''}Pronto nos comunicaremos con usted por ${how} para hablar sobre cómo llevar Nutrition Box a su comunidad.`,
    how: (m: string[]) => joinOr(m.map((x) => ({ 'Call me': 'una llamada', 'Text me': 'un mensaje de texto', Email: 'un correo electrónico' })[x] ?? x), 'o'),
    questions: (phone: ReactNode, email: ReactNode) => (
      <>
        ¿Preguntas? Llámenos al {phone} o escríbanos a {email}.
      </>
    ),
  },
} satisfies Record<Lang, unknown>;

/** US phone digits, without a leading country code 1. */
function phoneDigits(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
}

function formatPhone(value: string): string {
  const d = phoneDigits(value);
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : value.trim();
}

function smoothScrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const INPUT =
  'w-full rounded-2xl border-2 border-solid border-transparent bg-cream px-4 py-3 text-lg text-[#000066] outline-none placeholder:text-[#000066]/40 focus:border-canary';
const PRIMARY =
  'cursor-pointer rounded-full border-0 bg-canary px-6 py-2 font-specials text-xl text-[#000066] transition-colors hover:bg-white disabled:cursor-wait disabled:opacity-60 md:text-2xl';
const CHOICE =
  'cursor-pointer rounded-full border-2 border-solid border-canary bg-transparent px-6 py-2 font-specials text-xl text-canary transition-colors hover:bg-canary hover:text-[#000066] md:text-2xl';
const CHOICE_ON = 'cursor-pointer rounded-full border-2 border-solid border-canary bg-canary px-6 py-2 font-specials text-xl text-[#000066] md:text-2xl';
const QUESTION = 'm-0 mb-4 block p-0 font-specials text-2xl font-normal leading-tight text-white md:text-[1.75rem]';

export default function CallbackForm({ className = '' }: { className?: string }) {
  const lang = useLang();
  const t = COPY[lang];
  const id = useId();
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<ReactNode>(null);
  const [sending, setSending] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const [trackHeight, setTrackHeight] = useState<number>();
  const slideRefs = useRef<(HTMLFieldSetElement | null)[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  // Set once they've moved between steps, so going Back to the first step focuses it too
  // (but the page doesn't grab focus on load).
  const moved = useRef(false);

  const doneIndex = FIELDS.length;
  const field = FIELDS[index] as Field | undefined;
  const isLast = index === FIELDS.length - 1;

  const set = (key: string, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setError(null);
  };

  // Put the cursor in the current step's field (or first choice) after it slides in.
  const focusCurrent = useCallback((i: number) => {
    const slide = slideRefs.current[i];
    slide?.querySelector<HTMLElement>('input, button[data-choice], [data-focus]')?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!moved.current) return;
    const timer = setTimeout(() => focusCurrent(index), 60);
    return () => clearTimeout(timer);
  }, [index, focusCurrent]);

  /** Moves to step i (see lib/stepSlider.ts for why focus is dropped first). */
  const go = (i: number) => {
    releaseFocusIn(trackRef.current);
    moved.current = true;
    setIndex(i);
  };

  // The card fits the current step (steps differ in height), easing between them.
  useEffect(() => {
    const slide = slideRefs.current[index];
    if (!slide) return;
    const observer = new ResizeObserver(() => setTrackHeight(slide.offsetHeight));
    observer.observe(slide);
    return () => observer.disconnect();
  }, [index]);

  // "Callback Request" links further down the page scroll back up here.
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

  const validate = (f: Field): string | null => {
    const value = (values[f.key] ?? '').trim();
    if (!value) return f.required ? t.errors[f.kind] : null;
    if (f.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t.errors.email;
    if (f.kind === 'tel' && phoneDigits(value).length !== 10) return t.errors.tel;
    if (f.key === 'contact' && picked(values.contact).includes('Email') && !(values.email ?? '').trim()) return t.needEmail;
    return null;
  };

  const submit = async () => {
    const unconnected = !FORM_RESPONSE_URL || FIELDS.some((f) => !f.entry);
    if (unconnected) {
      setError(t.notConnected);
      return;
    }
    const body = new URLSearchParams({ fvv: '1', pageHistory: '0' });
    for (const f of FIELDS) {
      const value = (values[f.key] ?? '').trim();
      if (!value) continue;
      // Google Forms takes one entry per checked box.
      if (f.kind === 'checkboxes') picked(value).forEach((v) => body.append(f.entry as string, v));
      else body.set(f.entry as string, f.kind === 'tel' ? formatPhone(value) : value);
    }

    // Off the live site (localhost, staging), show the thank-you without sending: a real
    // submission emails the care team. Add ?livesubmit=1 to send anyway (lib/siteEnv.ts).
    if (!formsSendForReal()) {
      console.info('[form] test site, not sent:', Object.fromEntries(body));
      sendEvent('generate_lead', { form_name: 'dycd_callback', page_language: lang });
      go(doneIndex);
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
      sendEvent('generate_lead', { form_name: 'dycd_callback', page_language: lang });
      go(doneIndex);
    } catch {
      setError(t.failed(<PhoneLink />));
    } finally {
      setSending(false);
    }
  };

  const next = () => {
    if (!field) return;
    const problem = validate(field);
    if (problem) {
      setError(problem);
      focusCurrent(index);
      return;
    }
    if (isLast) void submit();
    else go(index + 1);
  };

  const back = () => {
    setError(null);
    go(Math.max(0, index - 1));
  };

  const errorId = `${id}-error`;

  return (
    <div
      data-section="callback-form"
      className={`w-full max-w-[34rem] rounded-xtra border-2 border-solid bg-[#000066]/90 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur transition-colors duration-500 md:p-6 ${
        highlight ? 'border-canary' : 'border-white/20'
      } ${className}`}
    >
      <form
        aria-label={t.formLabel}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (index < doneIndex) next();
        }}
      >
        {index < doneIndex && (
          <div className="mb-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-canary transition-[width] duration-500 motion-reduce:transition-none"
                style={{ width: `${((index + 1) / FIELDS.length) * 100}%` }}
              />
            </div>
            <p className="m-0 whitespace-nowrap text-sm text-white/70" aria-live="polite">
              {t.stepOf(index + 1, FIELDS.length)}
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
            {[...FIELDS, null].map((f, i) => (
              <fieldset
                key={f?.key ?? 'done'}
                ref={(el) => {
                  slideRefs.current[i] = el;
                }}
                // Only the current step can be reached by keyboard or screen reader.
                {...(i !== index ? { inert: '' as unknown as boolean, 'aria-hidden': true } : {})}
                className="m-0 w-full min-w-0 shrink-0 border-0 p-0"
              >
                {f ? renderField(f) : renderDone()}
              </fieldset>
            ))}
          </div>
        </div>

        {error && (
          <p id={errorId} role="alert" className="m-0 mt-3 text-base text-canary">
            {error}
          </p>
        )}

        {index < doneIndex && (
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
            <button type="submit" data-track={isLast ? 'form-submit' : 'form-next'} disabled={sending} className={PRIMARY}>
              {sending ? t.sending : isLast ? t.submit : t.next}
            </button>
          </div>
        )}
      </form>
    </div>
  );

  function renderField(f: Field) {
    const inputId = `${id}-${f.key}`;
    const label = (
      <>
        {f.label[lang]}
        {!f.required && <span className="font-sans text-base text-white/60"> ({t.optional})</span>}
      </>
    );
    if (f.kind === 'checkboxes') {
      const on = picked(values[f.key]);
      // Updates from the latest state, so quick taps on both options can't overwrite each other.
      const toggle = (v: string) => {
        setValues((prev) => {
          const cur = picked(prev[f.key]);
          return { ...prev, [f.key]: (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]).join(SEP) };
        });
        setError(null);
      };
      return (
        <>
          <legend className={QUESTION}>{label}</legend>
          <div className="flex flex-wrap gap-3">
            {f.options?.map((o) => (
              <button
                key={o.value}
                type="button"
                role="checkbox"
                aria-checked={on.includes(o.value)}
                data-choice
                className={on.includes(o.value) ? CHOICE_ON : CHOICE}
                onClick={() => toggle(o.value)}
              >
                {on.includes(o.value) ? '✓ ' : ''}
                {o.label[lang]}
              </button>
            ))}
          </div>
          {f.note && <p className="m-0 mt-3 text-sm text-white/70">{f.note[lang]}</p>}
          {f.key === 'contact' && <PrivacyConsent variant="any" lang={lang} className="mt-3" />}
        </>
      );
    }
    if (f.kind === 'choice') {
      return (
        <>
          <legend className={QUESTION}>{label}</legend>
          <div className="flex flex-wrap gap-3" role="radiogroup">
            {f.options?.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={values[f.key] === o.value}
                data-choice
                className={values[f.key] === o.value ? CHOICE_ON : CHOICE}
                onClick={() => set(f.key, o.value)}
              >
                {o.label[lang]}
              </button>
            ))}
          </div>
          {f.note && <p className="m-0 mt-3 text-sm text-white/70">{f.note[lang]}</p>}
          {f.key === 'contact' && <PrivacyConsent variant="any" lang={lang} className="mt-3" />}
        </>
      );
    }
    return (
      <>
        <label htmlFor={inputId} className={QUESTION}>
          {label}
        </label>
        <input
          id={inputId}
          type={f.kind === 'tel' ? 'tel' : f.kind === 'email' ? 'email' : 'text'}
          inputMode={f.kind === 'tel' ? 'tel' : f.kind === 'email' ? 'email' : undefined}
          autoComplete={f.autoComplete}
          placeholder={f.placeholder}
          value={values[f.key] ?? ''}
          onChange={(e) => set(f.key, e.target.value)}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
          className={INPUT}
        />
      </>
    );
  }

  function renderDone() {
    const first = (values.name ?? '').trim().split(/\s+/)[0] ?? '';
    return (
      <div role="status" data-focus tabIndex={-1} className="outline-none">
        <p className="m-0 mb-3 font-specials text-4xl leading-none text-canary">{t.doneTitle}</p>
        <p className="m-0 text-xl leading-snug">
          {t.done(first, t.how(picked(values.contact)))}
        </p>
        <p className="m-0 mt-4 text-base text-white/80">{t.questions(<PhoneLink />, <EmailLink />)}</p>
      </div>
    );
  }
}

/** "a call, a text or an email" */
function joinOr(items: string[], or: string): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} ${or} ${items[items.length - 1]}`;
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
