'use client';

import { useEffect, useState } from 'react';
import KommissaryWordmark from './KommissaryWordmark';
import type { NavItem, NavMenu } from '@/lib/nav';

function Chevron({ open }: { open?: boolean }) {
  return (
    <svg
      className={`h-[0.7em] w-[0.7em] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function Logo() {
  return (
    <a
      href="/"
      aria-label="Kommissary home"
      className="group pointer-events-auto relative block shrink-0"
    >
      {/* Full wordmark, letters transparent until hover lights them up left to right. */}
      <KommissaryWordmark className="block h-[50px] w-auto md:h-20" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/k-logo.svg"
        alt=""
        aria-hidden="true"
        className="absolute left-0 top-0 h-full w-auto group-hover:hidden"
      />
    </a>
  );
}

export default function Nav({ menus }: { menus: NavMenu[] }) {
  const [open, setOpen] = useState<string | null>(null); // desktop dropdown
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeMenu = menus.find((m) => m.id === open) ?? null;

  // Escape closes whatever's open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {/* Header + dropdown share one region. onMouseLeave here (not just on the link)
          keeps a dropdown open while the pointer is anywhere over the header or panel,
          so moving from the trigger down into the panel doesn't dismiss it. */}
      {/* Top bar on its own fixed layer at the very top — above the mobile menu (z-40),
          so it doesn't add to the header's height and stays visible while the menu is open.
          Holds the scroll-progress fill (behind) and the certifications image (right edge
          matching the nav padding, so it sits under the Connect chevron). */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[25px] overflow-hidden">
        <div
          id="scroll-progress"
          className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-[#ff6666]"
        />
        <a
          href="/certification"
          aria-label="Certification & compliance"
          className="pointer-events-auto absolute right-6 top-0 block h-full sm:right-8"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/certs.svg" alt="Certifications" className="h-full w-auto" />
        </a>
      </div>

      {/* On mobile, clear the 25px top bar so the logo/hamburger sit at the same lower
          position as the open menu's logo/close (which also has pt-[25px]). */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 pt-[25px] md:pt-0">
        <div
          onMouseLeave={() => setOpen(null)}
          className={`transition-colors duration-200 ${
            activeMenu
              ? 'pointer-events-auto bg-[#000666]/30 backdrop-blur-2xl'
              : 'pointer-events-none'
          }`}
        >
          <nav
            aria-label="Main"
            className="flex items-center justify-between gap-4 p-6 sm:p-8"
          >
            <Logo />

            {/* Desktop trigger buttons */}
            <ul className="font-spirit hidden items-center gap-5 text-lg font-medium md:flex lg:gap-7">
              {menus.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={open === m.id}
                    onMouseEnter={() => setOpen(m.id)}
                    onFocus={() => setOpen(m.id)}
                    onClick={() => setOpen((o) => (o === m.id ? null : m.id))}
                    className={`pointer-events-auto inline-flex cursor-pointer items-center gap-1.5 transition-colors duration-200 hover:text-[#ffcf33] focus-visible:text-[#ffcf33] ${
                      open === m.id ? 'text-[#ffcf33]' : 'text-[#ff6666]'
                    }`}
                  >
                    {m.label}
                    <Chevron open={open === m.id} />
                  </button>
                </li>
              ))}
            </ul>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              className="pointer-events-auto text-[#ff6666] transition-colors hover:text-[#ffcf33] md:hidden"
            >
              <HamburgerIcon />
            </button>
          </nav>

          {/* Desktop dropdown: full width, three columns, under the nav. */}
          {activeMenu && (
            <div className="hidden md:block">
              <div className="mx-auto grid max-w-6xl grid-cols-3 gap-10 px-8 pb-14">
                {activeMenu.columns.map((col, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    {col.map((it, j) =>
                      it.kind === 'h2' ? (
                        <h2
                          key={j}
                          className="font-spirit text-3xl font-medium text-white"
                        >
                          {it.text}
                        </h2>
                      ) : (
                        <a
                          key={j}
                          href={it.href}
                          className="font-spirit text-lg text-[#ff6666] transition-colors duration-200 hover:text-[#ffcf33]"
                        >
                          {it.text}
                        </a>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile full-screen overlay: stacked sections, sub-links exposed and indented. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-[#000666]/95 pt-[25px] backdrop-blur-2xl md:hidden">
          <div className="flex items-center justify-between p-6">
            <Logo />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="text-[#ff6666] transition-colors hover:text-[#ffcf33]"
            >
              <CloseIcon />
            </button>
          </div>

          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-8 pb-16">
            <ul className="font-spirit flex flex-col gap-9">
              {menus.map((m) => {
                const links = m.columns.flat().filter((it) => it.kind === 'link') as Extract<
                  NavItem,
                  { kind: 'link' }
                >[];
                return (
                  <li key={m.id}>
                    <div className="text-3xl font-medium text-white">{m.label}</div>
                    <ul className="mt-3 flex flex-col gap-2 border-l border-[#ff6666]/30 pl-5">
                      {links.map((it, j) => (
                        <li key={j}>
                          <a
                            href={it.href}
                            onClick={() => setMobileOpen(false)}
                            className="text-xl text-[#ff6666] transition-colors hover:text-[#ffcf33]"
                          >
                            {it.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
