'use client';

import { useEffect, useState } from 'react';

/** Social share row for a Post. Uses the live page URL (no server base-URL config) and
 *  the platforms' public share endpoints — no API keys. Copy-link + native share too. */
export default function ShareButtons({ title }: { title: string }) {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const e = encodeURIComponent;
  const links = [
    { name: 'Share on X', href: `https://twitter.com/intent/tweet?url=${e(url)}&text=${e(title)}`, path: 'M18.9 2H22l-7.3 8.3L23.3 22h-6.8l-5.3-6.9L4.8 22H1.7l7.8-8.9L1 2h7l4.8 6.3L18.9 2Zm-1.2 18h1.9L7.4 3.9H5.4L17.7 20Z' },
    { name: 'Share on Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`, path: 'M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z' },
    { name: 'Share on LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`, path: 'M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0-.02-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.3 0-2.95-1.8-2.95s-2.07 1.4-2.07 2.85V21H9V9Z' },
  ];

  return (
    <div className="flex items-center justify-center gap-3">
      {canNativeShare && (
        <button
          type="button"
          onClick={() => navigator.share({ title, url }).catch(() => {})}
          aria-label="Share"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff6666] text-[#000666] transition-colors hover:bg-[#ffcf33]"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
          </svg>
        </button>
      )}
      {links.map((l) => (
        <a
          key={l.name}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.name}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ff6666] text-[#ff6666] transition-colors hover:bg-[#ff6666] hover:text-[#000666]"
        >
          <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={l.path} />
          </svg>
        </a>
      ))}
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          });
        }}
        aria-label="Copy link"
        className="flex h-10 items-center gap-2 rounded-full border border-[#ff6666] px-4 text-sm text-[#ff6666] transition-colors hover:bg-[#ff6666] hover:text-[#000666]"
      >
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
          <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
        </svg>
        <span className="font-spirit">{copied ? 'Copied!' : 'Copy link'}</span>
      </button>
    </div>
  );
}
