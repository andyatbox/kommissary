import { NextResponse } from 'next/server';
import { getKnowledge } from '@/lib/kai/knowledge';

/**
 * Ask Kai — the site chatbot, backed by Google Gemini's FREE tier.
 *
 * Cost safety, in layers:
 *  1. The API key must be an AI Studio key on a project with NO billing account —
 *     Google then hard-blocks usage past the free quota (429) and cannot charge.
 *  2. Self-imposed caps below keep us safely inside the free per-minute/per-day
 *     quotas so real users rarely even hit Google's limiter.
 *  3. Any 429/quota error from Gemini temporarily disables the bot (client shows a
 *     "recharging" state) until the cooldown passes.
 */

/**
 * The "-latest" alias always resolves to a currently-available flash model, so it
 * won't 404 when Google retires a pinned version (as happened to gemini-2.x-flash).
 * Flash = fast, cheap, free-tier eligible, plenty capable for grounded site Q&A.
 */
const MODEL = 'gemini-flash-latest';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/** Self-imposed caps, kept below Google's free-tier quotas. */
const RPM_CAP = 8;
const RPD_CAP = 400;
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
    const res = await fetch(API_URL, {
      method: 'POST',
      // Newer Gemini keys (AQ.* format) authenticate via this header rather than ?key=.
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `${SYSTEM_PROMPT}\n\n${knowledge}` }] },
        contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
        generationConfig: { temperature: 0.5, maxOutputTokens: 512 },
      }),
    });

    if (res.status === 429) {
      // Free quota exhausted — nap until it refreshes. No billing attached, so this
      // is the hard stop Google enforces instead of ever charging.
      disabledUntil = Date.now() + QUOTA_COOLDOWN_MS;
      return NextResponse.json({ disabled: true, reason: 'quota' });
    }
    if (!res.ok) {
      // Temporary: surface Google's own status/message so a production-only failure
      // (env var typo, key restriction, region block, etc.) can be diagnosed without
      // Vercel log access. No key material is ever included. Remove once confirmed.
      const detail = await res.text();
      console.error('Kai upstream error', res.status, detail.slice(0, 500));
      return NextResponse.json(
        { error: 'upstream', upstreamStatus: res.status, upstreamMessage: detail.slice(0, 300) },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const reply = (data.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? '')
      .join('')
      .trim();

    if (!reply) return NextResponse.json({ error: 'empty' }, { status: 502 });
    return NextResponse.json({ reply });
  } catch (e) {
    console.error('Kai fetch threw', e);
    return NextResponse.json({ error: 'upstream', upstreamMessage: String(e) }, { status: 502 });
  }
}
