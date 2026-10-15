import localFont from 'next/font/local';

// New Spirit Condensed Specials: one weight only. Declared for 100-900 so headings that
// ask for bold use it as-is instead of the browser faking a bolder version.
//
// The Specials cut has no accented letters (á é í ó ú ñ ü) and no ¿, which the Spanish
// page needs everywhere. Those fall through, letter by letter, to New Spirit Condensed
// from Adobe Fonts (loaded in app/layout.tsx), the design the Specials cut was made
// from, so they match. next/font's own generated fallback is turned off because it
// would catch those letters first, in Times.
export const specials = localFont({
  src: [
    { path: './assets/New-Spirit-Condensed-Specials.woff2', weight: '100 900', style: 'normal' },
    { path: './assets/New-Spirit-Condensed-Specials.woff', weight: '100 900', style: 'normal' },
  ],
  display: 'swap',
  fallback: ['new-spirit-condensed', 'serif'],
  adjustFontFallback: false,
  variable: '--font-specials',
});
