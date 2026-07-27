'use client';

import { PortableText } from 'next-sanity';
import type { PortableTextComponents } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import { urlFor } from '@/sanity/lib/image';

/**
 * Renders a Page's block content. `tone` picks the palette:
 *  - 'dark'  (default): white text on the navy page background.
 *  - 'light': black text for use on a light card (e.g. the Body Copy cream panel).
 *             Everything is black except hyperlinks, which stay coral.
 */
type Tone = 'dark' | 'light';

function makeComponents(tone: Tone): PortableTextComponents {
  const light = tone === 'light';
  const body = light ? 'text-black' : 'text-white/85';
  const heading = light ? 'text-black' : 'text-white';
  const sub = light ? 'text-black' : 'text-[#ff6666]';
  const quote = light ? 'text-black/70' : 'text-white/70';
  const marker = light ? 'marker:text-black' : 'marker:text-[#ff6666]';
  const strong = light ? 'text-black' : 'text-white';

  return {
    block: {
      normal: ({ children }) => (
        <p className={`mt-5 text-lg leading-relaxed ${body} first:mt-0`}>{children}</p>
      ),
      h2: ({ children }) => (
        <h2 className={`font-spirit mt-12 text-3xl font-medium ${heading} first:mt-0 sm:text-4xl`}>
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className={`font-spirit mt-9 text-2xl font-medium ${sub} first:mt-0`}>{children}</h3>
      ),
      blockquote: ({ children }) => (
        <blockquote className={`mt-6 border-l-2 border-[#ff6666] pl-5 text-lg italic ${quote}`}>
          {children}
        </blockquote>
      ),
    },
    // Tailwind's preflight strips list markers/indent, so restore them.
    list: {
      bullet: ({ children }) => (
        <ul className={`mt-5 list-disc space-y-2 pl-6 text-lg leading-relaxed ${body} ${marker}`}>
          {children}
        </ul>
      ),
      number: ({ children }) => (
        <ol className={`mt-5 list-decimal space-y-2 pl-6 text-lg leading-relaxed ${body} ${marker}`}>
          {children}
        </ol>
      ),
    },
    listItem: ({ children }) => <li className="pl-1">{children}</li>,
    marks: {
      strong: ({ children }) => <strong className={`font-semibold ${strong}`}>{children}</strong>,
      em: ({ children }) => <em className="italic">{children}</em>,
      // Hyperlinks stay coral in both tones (the one exception to "all black").
      link: ({ children, value }) => {
        const href = (value as { href?: string })?.href ?? '#';
        const external = /^https?:\/\//.test(href);
        return (
          <a
            href={href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="text-[#ff6666] underline decoration-[#ff6666]/40 underline-offset-4 transition-colors hover:text-[#ffcf33]"
          >
            {children}
          </a>
        );
      },
    },
    types: {
      image: ({ value }) => {
        if (!value?.asset) return null;
        const url = urlFor(value).width(1400).fit('max').auto('format').url();
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={value.alt ?? ''} className="mt-8 w-full rounded-xl" loading="lazy" />
        );
      },
    },
  };
}

const componentsByTone: Record<Tone, PortableTextComponents> = {
  dark: makeComponents('dark'),
  light: makeComponents('light'),
};

export default function PortableBody({
  value,
  tone = 'dark',
}: {
  value: PortableTextBlock[];
  tone?: Tone;
}) {
  return <PortableText value={value} components={componentsByTone[tone]} />;
}
