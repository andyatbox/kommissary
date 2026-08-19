import { NextResponse } from 'next/server';
import { getKnowledge } from '@/lib/kai/knowledge';

/**
 * Ask Kai — the site chatbot, backed by Google Gemini.
 *
 * The key belongs to the company's own Google account, so billing is their decision
 * rather than something this route has to design around. What it still does guard
 * against is ABUSE: this endpoint is public and unauthenticated, so a script pointed at
 * it could otherwise run up either a bill or a quota outage.
 *
 *  1. The caps below bound how much this route will ever spend in a minute or a day,
 *     whatever traffic arrives.
 *  2. Per-request limits (MAX_TURNS, MAX_CHARS) bound the size of any single call.
 *  3. Any 429/quota error from Gemini temporarily disables the bot (the client shows a
 *     "recharging" state) rather than hammering a limiter that's already refusing.
 *
 * With no billing attached the key simply stops at Google's free quota — a safe default,
 * and the caps here sit within it.
 */

/**
 * Models to try, in order. Flash is fast, inexpensive and plenty capable for grounded
 * site Q&A. Two entries rather than one because both of Gemini's failure modes are
 * real here and neither is our fault:
 *
 *  - 503 UNAVAILABLE. The "-latest" alias is popular and gets oversubscribed; Google
 *    sheds larger requests first, so this route (which sends the whole site knowledge
 *    as a system instruction) is refused while trivial ones still succeed.
 *  - 404 NOT_FOUND. Google retires pinned versions, and a newly-created project can't
 *    use older ones at all — gemini-2.5-flash already answers "no longer available to
 *    new users" for this key.
 *
 * Falling through on either means one model being unavailable doesn't take Kai down.
 */
const MODELS = ['gemini-flash-latest', 'gemini-3.6-flash'];
const modelUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

/**
 * Kept BELOW Google's free-tier quotas, which for Flash models run around 10-15 requests
 * a minute and 1,500 a day. Those limits apply per PROJECT, not per key, so a second key
 * wouldn't buy more.
 *
 * Sitting under them matters: exceeding a free-tier quota earns a 429, and this route
 * responds to that by putting Kai to sleep for an hour (see QUOTA_COOLDOWN_MS). Better
 * to turn away one request at the door than to have the bot go dark for real visitors.
 *
 * Raise these only alongside attaching billing to the Google project — and then treat
 * them as a spend ceiling, since this endpoint is public and unauthenticated.
 */
const RPM_CAP = 8;
const RPD_CAP = 1200;
/** How long the bot naps after Gemini reports quota exhaustion. */
const QUOTA_COOLDOWN_MS = 60 * 60 * 1000;

/** Per-request guards. */
const MAX_TURNS = 12;
const MAX_CHARS = 1500;

// Best-effort in-memory state (per server instance — exact enough for a site bot).
let disabledUntil = 0;
let minuteStart = 0;
let minuteCount = 0;
let dayKey = '';
let dayCount = 0;

type Turn = { role: 'user' | 'model'; text: string };

const SYSTEM_PROMPT = `You are Kai, the friendly assistant on the Kommissary website. Kommissary is a progressive, minority-run purveyor of chef-crafted meals and a logistics leader serving the communities of New York City.

RULES:
- Be warm, brief and helpful — 1 to 4 short sentences unless a short list genuinely helps.
- Ground every answer ONLY in the SITE CONTENT below. Never invent facts, prices, addresses, emails, phone numbers or URLs.
- When pointing a visitor somewhere, use a markdown link whose URL is an internal path taken EXACTLY from the SITEMAP, e.g. [Our Story](/our-story). Never link to any external website.
- If the site doesn't yet cover what's asked, say so honestly and suggest the closest page — [Contact Us](/contact) is the right fallback for anything specific (quotes, partnerships, press, detailed credentials).
- Stay on topic: Kommissary, its services, story, credentials, food and NYC communities. Politely decline anything unrelated, personal, or inappropriate, and steer back to the site.`;

function checkRateLimits(now: number): { ok: boolean; reason?: string } {
  // Rolling minute window.
  if (now - minuteStart > 60_000) {
    minuteStart = now;
    minuteCount = 0;
  }
  if (minuteCount >= RPM_CAP) return { ok: false, reason: 'busy' };

  // Calendar-day window (UTC is fine for a best-effort cap).
  const today = new Date(now).toISOString().slice(0, 10);
  if (today !== dayKey) {
    dayKey = today;
    dayCount = 0;
  }
  if (dayCount >= RPD_CAP) return { ok: false, reason: 'quota' };

  minuteCount += 1;
  dayCount += 1;
  return { ok: true };
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ disabled: true, reason: 'unconfigured' });
  }

  const now = Date.now();
  if (now < disabledUntil) {
    return NextResponse.json({ disabled: true, reason: 'quota' });
  }

  const limits = checkRateLimits(now);
  if (!limits.ok) {
    if (limits.reason === 'quota') disabledUntil = now + QUOTA_COOLDOWN_MS;
    return NextResponse.json({ disabled: true, reason: limits.reason });
  }

  let turns: Turn[];
  try {
    const body = (await req.json()) as { messages?: Turn[] };
    turns = (body.messages ?? [])
      .filter((m) => (m.role === 'user' || m.role === 'model') && typeof m.text === 'string')
      .slice(-MAX_TURNS)
      .map((m) => ({ role: m.role, text: m.text.slice(0, MAX_CHARS) }));
  } catch {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }
  if (!turns.length || turns[turns.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 });
  }

  const knowledge = await getKnowledge();

  try {
    const body = JSON.stringify({
        systemInstruction: { parts: [{ text: `${SYSTEM_PROMPT}\n\n${knowledge}` }] },
        contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
        // This model spends internal "thinking" tokens out of the SAME budget as the
        // visible reply (~500-800 tokens observed even at minimum thinkingBudget), so
        // maxOutputTokens must be well above that or the reply gets cut off mid-sentence
        // (finishReason MAX_TOKENS). 2048 leaves comfortable headroom either way.
        generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
    });

    const call = (model: string) =>
      fetch(modelUrl(model), {
        method: 'POST',
        // Newer Gemini keys (AQ.* format) authenticate via this header rather than ?key=.
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body,
      });

    // Work down MODELS until one answers. A 503 gets one quick retry first, since the
    // congestion is often momentary and the preferred model is worth a second attempt.
    let res = await call(MODELS[0]);
    if (res.status === 503) {
      await new Promise((r) => setTimeout(r, 700));
      res = await call(MODELS[0]);
    }
    for (let i = 1; i < MODELS.length && (res.status === 503 || res.status === 404); i++) {
      console.warn(`Kai: ${MODELS[i - 1]} returned ${res.status}, trying ${MODELS[i]}`);
      res = await call(MODELS[i]);
    }

    if (res.status === 429) {
      // Free quota exhausted — nap until it refreshes. No billing attached, so this
      // is the hard stop Google enforces instead of ever charging.
      disabledUntil = Date.now() + QUOTA_COOLDOWN_MS;
      return NextResponse.json({ disabled: true, reason: 'quota' });
    }
    if (!res.ok) {
      // Logged server-side only (visible in Vercel's function logs) — never sent to
      // the client, so no upstream detail (or key material) is ever exposed.
      console.error('Kai upstream error', res.status, (await res.text()).slice(0, 500));
      return NextResponse.json({ error: 'upstream' }, { status: 502 });
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    };
    const candidate = data.candidates?.[0];
    const reply = (candidate?.content?.parts ?? [])
      .map((p) => p.text ?? '')
      .join('')
      .trim();

    if (!reply) {
      console.error('Kai empty reply', candidate?.finishReason);
      return NextResponse.json({ error: 'empty' }, { status: 502 });
    }
    return NextResponse.json({ reply });
  } catch (e) {
    console.error('Kai fetch threw', e);
    return NextResponse.json({ error: 'upstream', upstreamMessage: String(e) }, { status: 502 });
  }
}
