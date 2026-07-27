'use client';

import { PortableText } from 'next-sanity';
import type { PortableTextComponents } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import { urlFor } from '@/sanity/lib/image';

/**
 * Renders a Page's block content on the dark brand background: readable Roboto
 * Condensed body, New Spirit headings, salmon accents and list markers. Mirrors
 * the overlay Modal's renderer but tuned for a full standalone article.
 */
const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mt-5 text-lg leading-relaxed text-white/85 first:mt-0">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="font-spirit mt-12 text-3xl font-medium text-white first:mt-0 sm:text-4xl">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-spirit mt-9 text-2xl font-medium text-[#ff6666] first:mt-0">
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-6 border-l-2 border-[#ff6666] pl-5 text-lg italic text-white/70">
        {children}
      </blockquote>
    ),
  },
  // Tailwind's preflight strips list markers/indent, so restore them + salmon markers.
  list: {
    bullet: ({ children }) => (
      <ul className="mt-5 list-disc space-y-2 pl-6 text-lg leading-relaxed text-white/85 marker:text-[#ff6666]">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mt-5 list-decimal space-y-2 pl-6 text-lg leading-relaxed text-white/85 marker:text-[#ff6666]">
        {children}
      </ol>
    ),
  },
  listItem: ({ children }) => <li className="pl-1">{children}</li>,
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
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
        <img
          src={url}
          alt={value.alt ?? ''}
          className="mt-8 w-full rounded-xl"
          loading="lazy"
        />
      );
    },
  },
};

export default function PortableBody({ value }: { value: PortableTextBlock[] }) {
  return <PortableText value={value} components={components} />;
}
