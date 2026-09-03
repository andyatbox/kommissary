'use client';

import { useState } from 'react';
import { REASONS } from '@/lib/contact';

/**
 * Contact form section. Posts to /api/contact, which forwards it to the Google Form —
 * so the styling is entirely ours (no Google iframe) while responses still land in the
 * client's existing spreadsheet + notification flow.
 *
 * Layout: name and contact fields pair up two-across from `sm` and stack on phones;
 * the reason and message always run full width.
 */

type Status = 'idle' | 'sending' | 'sent';

const FIELD =
  'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white placeholder-white/35 outline-none transition-colors focus:border-[#ff6666]/60 disabled:opacity-50';
const LABEL = 'mb-1.5 block text-sm font-medium text-white/70';
const ERROR = 'mt-1.5 text-sm text-[#ff6666]';

export default function ContactForm({ heading, intro }: { heading?: string; intro?: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'sending') return;

    const data = Object.fromEntries(new FormData(e.currentTarget));
    setStatus('sending');
    setErrors({});
    setFormError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        errors?: Record<string, string>;
        error?: string;
      };

      if (json.ok) {
        setStatus('sent');
        return;
      }
      setErrors(json.errors ?? {});
      setFormError(json.error ?? 'Please check the highlighted fields.');
      setStatus('idle');
    } catch {
      setFormError("That didn't send — please check your connection and try again.");
      setStatus('idle');
    }
  }

  if (status === 'sent') {
    return (
      <section className="mx-auto w-full max-w-3xl wide:max-w-4xl px-6 sm:px-8">
        <div
          role="status"
          className="rounded-2xl border border-[#ff6666]/30 bg-white/5 px-6 py-12 text-center"
        >
          <h2 className="font-spirit text-3xl font-medium text-[#ff6666] sm:text-4xl">
            Thanks — message sent.
          </h2>
          <p className="mt-3 text-lg text-white/70">
            We&rsquo;ve got it and someone will be in touch shortly.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-3xl wide:max-w-4xl px-6 sm:px-8">
      {heading && (
        <h2 className="font-spirit text-3xl font-medium text-[#ff6666] sm:text-4xl">{heading}</h2>
      )}
      {intro && <p className="mt-3 text-lg leading-relaxed text-white/85">{intro}</p>}

      <form onSubmit={onSubmit} noValidate className={heading || intro ? 'mt-8' : ''}>
        {/* Honeypot: hidden from people and screen readers, catnip for bots. */}
        <div aria-hidden className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
          <label>
            Company
            <input type="text" name="company" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
          <Field
            name="firstName"
            label="First name"
            required
            autoComplete="given-name"
            error={errors.firstName}
            disabled={status === 'sending'}
          />
          <Field
            name="lastName"
            label="Last name"
            required
            autoComplete="family-name"
            error={errors.lastName}
            disabled={status === 'sending'}
          />
          <Field
            name="email"
            label="Email address"
            type="email"
            required
            autoComplete="email"
            error={errors.email}
            disabled={status === 'sending'}
          />
          <Field
            name="phone"
            label="Phone number"
            type="tel"
            autoComplete="tel"
            hint="Optional"
            error={errors.phone}
            disabled={status === 'sending'}
          />

          <div className="sm:col-span-2">
            <label htmlFor="reason" className={LABEL}>
              Reason for contact <span className="text-[#ff6666]">*</span>
            </label>
            <select
              id="reason"
              name="reason"
              defaultValue=""
              required
              disabled={status === 'sending'}
              aria-invalid={!!errors.reason}
              className={FIELD}
            >
              <option value="" disabled className="bg-[#000666]">
                Select a reason…
              </option>
              {REASONS.map((r) => (
                <option key={r} value={r} className="bg-[#000666]">
                  {r}
                </option>
              ))}
            </select>
            {errors.reason && <p className={ERROR}>{errors.reason}</p>}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="message" className={LABEL}>
              Message <span className="text-[#ff6666]">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              rows={6}
              required
              maxLength={5000}
              disabled={status === 'sending'}
              aria-invalid={!!errors.message}
              className={`${FIELD} resize-y`}
            />
            {errors.message && <p className={ERROR}>{errors.message}</p>}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={status === 'sending'}
            className="font-spirit rounded-full bg-[#ff6666] px-8 py-3 text-base font-medium text-[#000666] transition-colors hover:bg-[#ffcf33] disabled:pointer-events-none disabled:opacity-50"
          >
            {status === 'sending' ? 'Sending…' : 'Send message'}
          </button>
          {formError && (
            <p role="alert" className="text-sm text-[#ff6666]">
              {formError}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required = false,
  autoComplete,
  hint,
  error,
  disabled,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className={LABEL}>
        {label} {required ? <span className="text-[#ff6666]">*</span> : hint && <span className="text-white/40">({hint})</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={!!error}
        className={FIELD}
      />
      {error && <p className={ERROR}>{error}</p>}
    </div>
  );
}
