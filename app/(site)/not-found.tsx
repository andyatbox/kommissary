import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found · Kommissary',
  robots: { index: false },
};

/** Any address the site doesn't have (and pages that call notFound()). On brand, with a
 *  way back in, instead of Next's plain white default. */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 pb-28 pt-[120px] text-center md:pt-[168px]">
      <p className="font-spirit text-lg font-medium text-white/60">404</p>
      <h1 className="mt-2 text-balance font-spirit text-5xl font-medium leading-[1.05] text-gold sm:text-6xl">
        This page isn&rsquo;t on the menu
      </h1>
      <p className="mt-6 max-w-md text-lg text-white/80">
        The address may have changed, or the page has moved. Everything&rsquo;s still in the menu
        above.
      </p>
      <a
        href="/"
        className="mt-10 inline-flex items-center gap-3 rounded-full border-2 border-[#ff6666] px-7 py-3 font-spirit text-2xl font-medium text-[#ff6666] transition-colors duration-300 hover:border-[#ffcf33] hover:text-[#ffcf33]"
      >
        Back to the homepage
      </a>
    </main>
  );
}
