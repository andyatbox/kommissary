import { client } from '@/sanity/lib/client';
import { NAV_QUERY, nextInNav, type NavPage } from '@/lib/nav';

/**
 * "Continue on..." at the foot of a page: a pill linking to the next page in the nav,
 * in the header's order (dropdown by dropdown, column by column, as sorted in Studio),
 * wrapping from the last page back to the first. Renders nothing on a page that isn't in
 * the nav. The fetch is the layout's own nav query, so it's shared rather than repeated.
 *
 * Used by the content pages ([slug]) and Our Story. The homepage, Nutrition Box and Our
 * Impact don't have it.
 */
export default async function ContinueOn({ from }: { from: string }) {
  let next: { title: string; href: string } | null = null;
  try {
    next = nextInNav((await client.fetch<NavPage[] | null>(NAV_QUERY)) ?? [], from);
  } catch {
    // Sanity unreachable: leave it out.
  }
  if (!next) return null;

  return (
    <nav aria-label="Next page" className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 text-center sm:px-8">
      <p className="font-spirit text-lg font-medium text-white/70 sm:text-xl">Continue on...</p>
      <a
        href={next.href}
        className="group mt-4 inline-flex items-center gap-3 rounded-full border-2 border-[#ff6666] px-7 py-3 font-spirit text-2xl font-medium text-[#ff6666] transition-colors duration-300 hover:border-[#ffcf33] hover:text-[#ffcf33] focus-visible:border-[#ffcf33] focus-visible:text-[#ffcf33] sm:px-9 sm:text-3xl"
      >
        {next.title}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-1 sm:h-7 sm:w-7"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </a>
    </nav>
  );
}
