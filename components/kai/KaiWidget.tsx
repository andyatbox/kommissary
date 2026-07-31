'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';

/**
 * Ask Kai — floating site chatbot. A fixed kai.svg launcher in the bottom-right
 * corner (every page); clicking it opens the chat panel over the site. Replies come
 * from /api/kai (Gemini free tier). The conversation survives page navigations via
 * sessionStorage. When the free quota is exhausted the server reports disabled and
 * the panel shows a friendly "recharging" state instead of erroring.
 */

type Msg = { role: 'user' | 'model'; text: string };

const STORE_KEY = 'kai-chat';
const GREETING =
  "Hi, I'm Kai! Ask me anything about Kommissary — what we do, our story, certifications, or how to get in touch.";

/** Renders **bold** and [label](url) markdown; only internal (path) links become
 *  anchors — anything external is shown as plain text, never a link. */
function renderMessage(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[3] !== undefined) {
      out.push(<strong key={k++}>{m[3]}</strong>);
    } else {
      const href = m[2];
      if (href.startsWith('/')) {
        out.push(
          <a key={k++} href={href} className="font-medium text-[#ff6666] underline underline-offset-2 transition-colors hover:text-[#c2402f]">
            {m[1]}
          </a>
        );
      } else {
        out.push(m[1]); // external → text only, never a link
      }
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function KaiWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore / persist the conversation across page loads (anchors do full loads).
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {}
  }, [messages]);

  // Keep the newest message in view; focus the input when the panel opens.
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages, busy, open]);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setNotice(null);
    const next: Msg[] = [...messages, { role: 'user', text }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await fetch('/api/kai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(-12) }),
      });
      const data = (await res.json()) as { reply?: string; disabled?: boolean; reason?: string };
      if (data.disabled) {
        setNotice(
          data.reason === 'unconfigured'
            ? "Kai isn't quite awake yet — please check back soon!"
            : data.reason === 'busy'
              ? "Kai's a little swamped right now — give it a few seconds and try again."
              : 'Kai has hit his daily limit and is recharging. Please try again later!'
        );
      } else if (data.reply) {
        setMessages((m) => [...m, { role: 'model', text: data.reply! }]);
      } else {
        setNotice('Hmm, something went wrong. Please try that again.');
      }
    } catch {
      setNotice('Hmm, something went wrong. Please try that again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Launcher: fixed to the bottom-right on every page, responsive size. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask Kai — open chat"
        className={`fixed bottom-4 right-4 z-[65] cursor-pointer transition-all duration-300 hover:scale-110 sm:bottom-6 sm:right-6 ${
          open ? 'pointer-events-none scale-75 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/kai.svg"
          alt=""
          aria-hidden="true"
          className="h-auto w-14 drop-shadow-[0_8px_24px_rgba(255,102,102,0.35)] sm:w-16 md:w-20"
        />
      </button>

      {/* Chat panel over the site. */}
      <div
        role="dialog"
        aria-modal="false"
        aria-label="Ask Kai"
        aria-hidden={!open}
        className={`fixed bottom-4 right-4 z-[65] flex w-[calc(100vw-2rem)] max-w-[440px] flex-col overflow-hidden rounded-2xl border border-[#ff6666]/30 bg-[#000666]/80 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-all duration-300 sm:bottom-6 sm:right-6 sm:max-w-[500px] lg:max-w-[560px] h-[min(640px,calc(100dvh_-_5rem))] sm:h-[min(720px,calc(100dvh_-_6rem))] lg:h-[min(800px,calc(100dvh_-_6rem))] ${
          open
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/kai.svg" alt="" aria-hidden="true" className="h-9 w-9" />
          <div className="flex-1">
            <div className="font-spirit text-lg font-medium leading-tight text-white">Ask Kai</div>
            <div className="text-xs text-white/50">Kommissary&rsquo;s helper</div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="text-[#ff6666] transition-colors hover:text-[#ffcf33]"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
          <Bubble role="model">{renderMessage(GREETING)}</Bubble>
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role}>
              {renderMessage(m.text)}
            </Bubble>
          ))}
          {busy && (
            <Bubble role="model">
              <span className="inline-flex gap-1" aria-label="Kai is typing">
                <Dot delay="0ms" />
                <Dot delay="150ms" />
                <Dot delay="300ms" />
              </span>
            </Bubble>
          )}
          {notice && (
            <p className="rounded-xl bg-white/5 px-4 py-3 text-center text-sm text-white/70">
              {notice}
            </p>
          )}
        </div>

        {/* Input */}
        <form onSubmit={send} className="flex items-center gap-2 border-t border-white/10 p-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={500}
            placeholder="Ask about Kommissary…"
            aria-label="Your question for Kai"
            // text-base (16px), not text-sm: iOS Safari auto-zooms the page on focus for
            // any input under 16px, which sticks and breaks this fixed-position layout.
            className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-base text-white placeholder-white/40 outline-none transition-colors focus:border-[#ff6666]/60"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="font-spirit shrink-0 rounded-full bg-[#ff6666] px-5 py-2.5 text-sm font-medium text-[#000666] transition-colors hover:bg-[#ffcf33] disabled:pointer-events-none disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </>
  );
}

function Bubble({ role, children }: { role: 'user' | 'model'; children: ReactNode }) {
  return role === 'user' ? (
    <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-[#ff6666] px-4 py-2.5 text-sm leading-relaxed text-[#000666]">
      {children}
    </div>
  ) : (
    <div className="mr-auto w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-[#FFE9CC] px-4 py-2.5 text-sm leading-relaxed text-black">
      {children}
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-black/50"
      style={{ animationDelay: delay }}
    />
  );
}
