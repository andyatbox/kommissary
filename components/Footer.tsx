/**
 * The site footer: a hairline rule, then the copyright and credit. Placed by SiteFooter
 * on most pages; Our Story renders it inside its own scroll rig instead (see SiteFooter).
 */
export default function Footer() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-6 sm:px-8">
      {/* Bottom padding clears the Ask Kai launcher, which floats over the corner. */}
      <div className="border-t border-[#ff6666]/40 pb-24 pt-8 text-center text-sm text-white/60 sm:pb-10">
        ©2026 LIC COM LLC All Rights Reserved. Site by{' '}
        <a
          href="https://www.box.biz"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-white/30 underline-offset-4 transition-colors hover:text-[#ffcf33]"
        >
          box
        </a>
        .
      </div>
    </footer>
  );
}
