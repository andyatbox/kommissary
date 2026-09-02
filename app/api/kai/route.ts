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
 * Kept BELOW Google's free-tier quota, which a 429 body reports as **5 requests a minute**
 * for this model — not the 10-15 the docs imply. It applies per PROJECT, not per key, so a
 * second key wouldn't buy more.
 *
 * Staying under it is the whole point: going over earns a 429, and a 429 takes Kai off the
 * air for everyone. Better to turn one request away at the door than to go dark.
 *
 * Raise these only alongside attaching billing to the Google project — and then treat them
 * as a spend ceiling, since this endpoint is public and unauthenticated.
 */
const RPM_CAP = 4;
const RPD_CAP = 1200;
/** How long to nap when the DAILY allowance is gone — nothing frees up before it resets. */
const QUOTA_COOLDOWN_MS = 60 * 60 * 1000;
/** Ceiling on a per-minute nap, in case Google ever asks us to wait an unreasonable while. */
const RATE_COOLDOWN_MAX_MS = 5 * 60 * 1000;

/**
 * Per-request guards. MAX_TOTAL_CHARS is the one that matters for cost: capping each
 * message alone still allowed MAX_TURNS x MAX_CHARS of attacker-chosen text in a single
 * call, and the whole knowledge base rides along as a system instruction every time.
 */
const MAX_TURNS = 10;
const MAX_CHARS = 800;
const MAX_TOTAL_CHARS = 4000;

/**
 * A single IP's share of one instance's budget. These counters live in memory, so each
 * serverless instance keeps its own — that makes this a brake on any one caller rather
 * than a true global limit. A real global limit needs shared state (Vercel KV/Upstash) or
 * a Vercel Firewall rate rule; this is the part that can be done in the app itself.
 */
const IP_RPM_CAP = 2;
/** Bound on the IP table. Unbounded, it would itself be a way to exhaust memory. */
const IP_TABLE_MAX = 4096;

// Best-effort in-memory state (per server instance — exact enough for a site bot).
let disabledUntil = 0;
let minuteStart = 0;
let minuteCount = 0;
let dayKey = '';
let dayCount = 0;
const ipHits = new Map<string, { count: number; start: number }>();

type Turn = { role: 'user' | 'model'; text: string };

const SYSTEM_PROMPT = `You are Kai, the friendly assistant on the Kommissary website. Kommissary is a progressive, minority-run purveyor of chef-crafted meals and a logistics leader serving the communities of New York City.

RULES:
- Be warm, brief and helpful — 1 to 4 short sentences unless a short list genuinely helps.
- Ground every answer ONLY in the SITE CONTENT below. Never invent facts, prices, addresses, emails, phone numbers or URLs.
- When pointing a visitor somewhere, use a markdown link whose URL is an internal path taken EXACTLY from the SITEMAP, e.g. [Our Story](/our-story). Never link to any external website.
- If the site doesn't yet cover what's asked, say so honestly and suggest the closest page — [Contact Us](/contact) is the right fallback for anything specific (quotes, partnerships, press, detailed credentials).
- Stay on topic: Kommissary, its services, story, credentials, food and NYC communities. Politely decline anything unrelated, personal, or inappropriate, and steer back to the site.`;

/** Caller identity, as far as we can know it behind Vercel's proxy. */
function callerIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}

/** True if this IP has already had its share of the current minute. */
function ipOverLimit(ip: string, now: number): boolean {
  const seen = ipHits.get(ip);
  if (!seen || now - seen.start > 60_000) {
    // Sweep expired entries before growing, and hard-stop if the table is still full, so
    // a flood of spoofed addresses can't turn this defence into a memory problem.
    if (ipHits.size >= IP_TABLE_MAX) {
      ipHits.forEach((v, k) => {
        if (now - v.start > 60_000) ipHits.delete(k);
      });
      if (ipHits.size >= IP_TABLE_MAX) return true;
    }
    ipHits.set(ip, { count: 1, start: now });
    return false;
  }
  seen.count += 1;
  return seen.count > IP_RPM_CAP;
}

/**
 * Only serve the site's own pages. Origin is trivially forged by anything that isn't a
 * browser, so this turns away casual scripts rather than a determined caller — the real
 * limits above are what carry the weight. A MISSING Origin is allowed: some privacy tools
 * strip it, and blocking those visitors would cost more than it gains.
 */
function originAllowed(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try {
    const host = new URL(origin).host;
    return (
      host === req.headers.get('host') ||
      host === 'kommissary.com' ||
      host.endsWith('.kommissary.com') ||
      host.endsWith('.vercel.app') ||
      host.startsWith('localhost')
    );
  } catch {
    return false;
  }
}

/**
 * How long Gemini's 429 says to wait, and whether it was the per-minute or the per-day
 * allowance. Both come straight from the error body — a per-minute 429 clears in well
 * under a minute, so treating it like daily exhaustion would take Kai down for an hour
 * over something that fixes itself.
 */
function readQuotaError(body: string): { daily: boolean; waitMs: number } {
  const daily = /PerDay/i.test(body);
  const match = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(body);
  const advised = match ? Math.ceil(parseFloat(match[1]) * 1000) + 2_000 : 60_000;
  return {
    daily,
    waitMs: daily ? QUOTA_COOLDOWN_MS : Math.min(advised, RATE_COOLDOWN_MAX_MS),
  };
}

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

  if (!originAllowed(req)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const now = Date.now();
  if (now < disabledUntil) {
    return NextResponse.json({ disabled: true, reason: 'quota' });
  }

  // Checked before the shared budget, so one noisy caller uses up its own allowance
  // rather than the whole instance's.
  if (ipOverLimit(callerIp(req), now)) {
    return NextResponse.json({ disabled: true, reason: 'busy' });
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
    // Drop the oldest turns until the conversation fits the budget. The newest one is the
    // question actually being asked, so it's the last thing to go.
    let total = turns.reduce((n, t) => n + t.text.length, 0);
    while (turns.length > 1 && total > MAX_TOTAL_CHARS) {
      total -= turns[0].text.length;
      turns.shift();
    }
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
      // Quota gone. Which quota matters enormously: the per-minute one clears in about
      // forty seconds, and treating that like daily exhaustion used to take Kai off the
      // air for a full hour — something any visitor could trigger with a handful of
      // requests. Google states both the kind and the wait, so use what it says.
      const { daily, waitMs } = readQuotaError(await res.text());
      disabledUntil = Date.now() + waitMs;
      console.warn(`Kai: ${daily ? 'daily' : 'per-minute'} quota hit, pausing ${waitMs}ms`);
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
