import { NextResponse } from 'next/server';
import { REASONS } from '@/lib/contact';

/**
 * Contact form → Google Forms.
 *
 * The browser posts JSON here and this route forwards it to the Google Form as a normal
 * form submission. Going through the server (rather than posting to Google from the
 * browser) buys us three things a direct post can't: a real success/failure answer
 * (a cross-origin post to Google is opaque — you never learn whether it worked), a
 * honeypot + rate limit in front of the form, and no Google endpoint in the page source.
 *
 * ── Re-generating the IDs below ────────────────────────────────────────────────
 * These come from the live form ("Contact Kommissary"). If a question is added,
 * removed, or retyped in Google Forms, the entry IDs change and must be updated here.
 * To read the current ones: open the form's public /viewform URL, view source, and
 * parse the `FB_PUBLIC_LOAD_DATA_` blob — each question carries its own entry number.
 */

/** Public form ID (the `/d/e/…` one from the live form URL — not a secret). */
const FORM_ID = '1FAIpQLSd3zYPEKgy7ClCpIrneUsmer0rZeKaaMjhqgNpqS82Ix8Q5VA';
const FORM_URL = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`;

/** Question → Google Forms field name. */
const ENTRY = {
  firstName: 'entry.804708344',
  lastName: 'entry.1669706645',
  email: 'entry.1726303987',
  phone: 'entry.645127787',
  reason: 'entry.714975873',
  message: 'entry.700090788',
} as const;

/** Field length caps, so a bot can't post megabytes through us. */
const MAX = { name: 100, email: 200, phone: 40, message: 5000 };

/** Best-effort in-memory rate limit (per server instance — enough for a contact form). */
const RPM_CAP = 5;
const RPD_CAP = 200;
let minuteStart = 0;
let minuteCount = 0;
let dayKey = '';
let dayCount = 0;

function withinRateLimits(now: number): boolean {
  if (now - minuteStart > 60_000) {
    minuteStart = now;
    minuteCount = 0;
  }
  if (minuteCount >= RPM_CAP) return false;

  const today = new Date(now).toISOString().slice(0, 10);
  if (today !== dayKey) {
    dayKey = today;
    dayCount = 0;
  }
  if (dayCount >= RPD_CAP) return false;

  minuteCount += 1;
  dayCount += 1;
  return true;
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad request.' }, { status: 400 });
  }

  // Honeypot: a hidden field real people never see. Bots fill it in, so pretend the
  // submission succeeded and drop it — telling them it failed just invites a retry.
  if (str(body.company, 200)) return NextResponse.json({ ok: true });

  const firstName = str(body.firstName, MAX.name);
  const lastName = str(body.lastName, MAX.name);
  const email = str(body.email, MAX.email);
  const phone = str(body.phone, MAX.phone);
  const reason = str(body.reason, 60);
  const message = str(body.message, MAX.message);

  const errors: Record<string, string> = {};
  if (!firstName) errors.firstName = 'Please enter your first name.';
  if (!lastName) errors.lastName = 'Please enter your last name.';
  // Email is optional on the Google Form itself, but required here — without it there's
  // no way to reply. Deliberately loose: real addresses reject stricter patterns.
  if (!email) errors.email = 'Please enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please check your email address.';
  if (!reason) errors.reason = 'Please choose a reason.';
  else if (!(REASONS as readonly string[]).includes(reason)) errors.reason = 'Please choose a reason.';
  if (!message) errors.message = 'Please enter a message.';

  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  if (!withinRateLimits(Date.now())) {
    return NextResponse.json(
      { ok: false, error: 'Too many messages just now — please try again in a minute.' },
      { status: 429 }
    );
  }

  const params = new URLSearchParams({
    [ENTRY.firstName]: firstName,
    [ENTRY.lastName]: lastName,
    [ENTRY.email]: email,
    [ENTRY.phone]: phone,
    [ENTRY.reason]: reason,
    [ENTRY.message]: message,
  });

  try {
    const res = await fetch(FORM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      // Google answers a good submission with a redirect to its confirmation page;
      // don't follow it, the status is all we need.
      redirect: 'manual',
    });

    // 200 (confirmation rendered) and 3xx (redirect to it) both mean accepted.
    const accepted = res.status === 200 || (res.status >= 300 && res.status < 400) || res.status === 0;
    if (!accepted) {
      console.error('Google Forms rejected the submission:', res.status);
      return NextResponse.json(
        { ok: false, error: "That didn't send — please email us directly." },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Contact form submission failed:', err);
    return NextResponse.json(
      { ok: false, error: "That didn't send — please email us directly." },
      { status: 502 }
    );
  }
}
