'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PortableText } from 'next-sanity';
import type { PortableTextComponents } from '@portabletext/react';
import type { ImpactSlide } from '@/lib/impact';
import { Scroller } from './scroller';
import { ImpactGL, LOOK, PARALLAX, ZOOM } from './ImpactGL';

/**
 * Our Impact: the Page's Body Copy sections as a full-screen slider that loops forever.
 *
 * The pictures are WebGL (ImpactGL), the words are DOM laid over them, and one rAF loop
 * drives both from the same Scroller, so they can't drift apart. Wheel, trackpad, drag,
 * swipe, the arrow keys and the slide menu all move it; every gesture ends in a single
 * eased snap onto a slide (see scroller.ts).
 *
 * With a mouse, the colours also split around the cursor and the picture drifts slightly
 * against it; touch screens get neither.
 *
 * Each slide shows its header and subheader along the bottom. Once a slide has settled,
 * its paragraphs open beneath them (the block stays bottom-aligned, so the headers rise),
 * and the page title, fixed at the left, rises to stay just above the lot.
 */

/** The page's easing: a long, soft ease-out. */
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
/** Paragraphs opening once a slide settles, and closing when it moves again, ms. */
const OPEN_MS = 900;
const CLOSE_MS = 450;
/** RGB split per unit of speed (slide widths per second), and its cap, in image widths. */
const SHIFT_GAIN = 0.024;
const MAX_SHIFT = 0.06;
/** The cursor effect's strength with the mouse resting over the page, and how much it
 *  grows with mouse speed (screen heights per second). */
const HOVER_REST = 0.45;
const HOVER_SPEED_GAIN = 0.4;
/** The words travel slightly faster than their picture, for depth. */
const TEXT_SPEED = 1.12;
/** Space between the page title and the slide's header, px. */
const TITLE_GAP = 16;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** A slide's x offset on screen, wrapped so the loop never runs out: (-W, (n-1)·W]. */
function wrapX(x: number, n: number, W: number) {
  const total = n * W;
  let v = mod(x, total);
  if (v > total - W) v -= total;
  return v;
}

const PARAGRAPHS: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="mt-3 first:mt-0">{children}</p>,
    h2: ({ children }) => <p className="mt-3 font-medium text-white first:mt-0">{children}</p>,
    h3: ({ children }) => <p className="mt-3 font-medium text-white first:mt-0">{children}</p>,
    blockquote: ({ children }) => <p className="mt-3 italic first:mt-0">{children}</p>,
  },
  list: {
    bullet: ({ children }) => <ul className="mt-3 list-disc space-y-1 pl-5">{children}</ul>,
    number: ({ children }) => <ol className="mt-3 list-decimal space-y-1 pl-5">{children}</ol>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    center: ({ children }) => <>{children}</>,
    // The anchors already open their slide by URL (see the hash handling below); an id
    // here too would only duplicate it.
    anchor: ({ children }) => <>{children}</>,
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
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export default function ImpactSlider({ title, slides }: { title: string; slides: ImpactSlide[] }) {
  const n = slides.length;
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const headRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bodyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fallbackRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollerRef = useRef<Scroller | null>(null);
  if (!scrollerRef.current) scrollerRef.current = new Scroller();

  const [active, setActive] = useState(0);
  const [settled, setSettled] = useState(true);
  /** The entrance: words fade up on load, then the first slide's paragraphs open. */
  const [entered, setEntered] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [noGL, setNoGL] = useState(false);
  const [titleLift, setTitleLift] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;

  const open = settled && introDone;

  // Go to slide i the short way round the loop.
  const goToSlide = useCallback(
    (i: number) => {
      const s = scrollerRef.current!;
      const heading = s.heading;
      let delta = mod(i - mod(heading, n), n);
      if (delta > n / 2) delta -= n;
      s.goTo(heading + delta);
    },
    [n]
  );

  // The engine: input, physics, GL and the per-frame DOM writes.
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const scroller = scrollerRef.current!;
    if (!root || !canvas || !n) return;

    let gl: ImpactGL | null = null;
    try {
      gl = new ImpactGL(canvas, slides.map((s) => ({ url: s.image?.url ?? null, focus: s.image?.focus ?? [0.5, 0.5] })));
    } catch {
      setNoGL(true);
    }

    let W = root.clientWidth;
    let H = root.clientHeight;
    scroller.setWidth(W);
    gl?.resize(W, H);

    // /our-impact#getfoodnyc opens on that slide.
    const fromHash = slides.findIndex((s) => s.id && `#${s.id}` === window.location.hash);
    if (fromHash > 0) {
      scroller.jumpTo(fromHash);
      setActive(fromHash);
    }

    let force = true;
    const ro = new ResizeObserver(() => {
      W = root.clientWidth;
      H = root.clientHeight;
      scroller.setWidth(W);
      gl?.resize(W, H);
      force = true;
    });
    ro.observe(root);

    const canMove = n > 1;

    // Wheel and trackpad. Either axis moves the slides. A paragraph box that can still
    // scroll the way the wheel is going keeps it.
    const onWheel = (e: WheelEvent) => {
      if (!canMove || !(e.target instanceof Node) || !root.contains(e.target)) return;
      const box = e.target instanceof Element ? e.target.closest('[data-scroll-y]') : null;
      if (box && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const down = e.deltaY > 0 && box.scrollTop + box.clientHeight < box.scrollHeight - 1;
        const up = e.deltaY < 0 && box.scrollTop > 0;
        if (down || up) return;
      }
      e.preventDefault();
      let d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (e.deltaMode === 1) d *= 33;
      else if (e.deltaMode === 2) d *= W;
      scroller.wheelDelta(d, performance.now());
    };

    // Drag and swipe, decided after a few px. Sideways always moves the slides. Up/down
    // does too on touch screens (swipe up for the next), except in a paragraph box with
    // text to scroll: that box allows the browser's own vertical pan (touch-action: pan-y,
    // set where it's measured below) and keeps the gesture. A mouse dragged up/down does
    // nothing.
    type Drag = {
      id: number;
      x0: number;
      y0: number;
      axis: 'x' | 'y' | null;
      inScrollBox: boolean;
      samples: { x: number; y: number; t: number }[];
    };
    let drag: Drag | null = null;
    let suppressClick = false;
    const onPointerDown = (e: PointerEvent) => {
      if (!canMove || e.button !== 0) return;
      if (e.target instanceof Element && e.target.closest('a, button, input, textarea')) return;
      const box = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-scroll-y]') : null;
      drag = {
        id: e.pointerId,
        x0: e.clientX,
        y0: e.clientY,
        axis: null,
        inScrollBox: !!box && box.scrollHeight > box.clientHeight + 1,
        samples: [{ x: e.clientX, y: e.clientY, t: e.timeStamp }],
      };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x0;
      const dy = e.clientY - drag.y0;
      if (!drag.axis) {
        if (Math.hypot(dx, dy) < 6) return;
        drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (drag.axis === 'y' && (e.pointerType !== 'touch' || drag.inScrollBox)) {
          drag = null;
          return;
        }
        scroller.dragStart();
        root.style.cursor = 'grabbing';
        // Keep receiving the drag outside the window. Can refuse (a pointer that's
        // already gone); the drag works without it.
        try {
          root.setPointerCapture(e.pointerId);
        } catch {}
      }
      scroller.dragMove(drag.axis === 'x' ? dx : dy);
      drag.samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
      while (drag.samples.length > 2 && e.timeStamp - drag.samples[0].t > 100) drag.samples.shift();
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.axis) {
        const first = drag.samples[0];
        const last = drag.samples[drag.samples.length - 1];
        const dt = last.t - first.t;
        const travel = drag.axis === 'x' ? last.x - first.x : last.y - first.y;
        // Held still before letting go: no fling.
        const v = dt > 0 && e.timeStamp - last.t < 80 ? (travel / dt) * 1000 : 0;
        scroller.dragEnd(-v);
        suppressClick = true;
        root.style.cursor = '';
      }
      drag = null;
    };
    const onClickCapture = (e: MouseEvent) => {
      if (!suppressClick) return;
      suppressClick = false;
      e.preventDefault();
      e.stopPropagation();
    };

    const onKey = (e: KeyboardEvent) => {
      if (!canMove || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      // Space on a focused button or link is that control's own.
      if (e.key === ' ' && t?.closest?.('a, button')) return;
      const step =
        e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)
          ? 1
          : e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)
            ? -1
            : 0;
      if (!step) return;
      e.preventDefault();
      scroller.goTo(scroller.heading + step);
    };

    // The cursor, for the hover split and the parallax. Mouse only: a pen or finger never
    // sets it, and neither does a device whose main pointer isn't a fine, hovering one.
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const mouse = { tx: 0.5, ty: 0.5, x: 0.5, y: 0.5, over: false, speed: 0, t: 0 };
    const onMouseMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const nx = e.clientX / W;
      const ny = 1 - e.clientY / H;
      if (mouse.over) {
        const secs = Math.max(0.004, (e.timeStamp - mouse.t) / 1000);
        const dist = Math.hypot((nx - mouse.tx) * (W / H), ny - mouse.ty);
        mouse.speed = Math.max(mouse.speed, dist / secs);
      } else {
        // Arriving: start at the cursor, not sliding over from where it last left.
        mouse.x = nx;
        mouse.y = ny;
      }
      mouse.tx = nx;
      mouse.ty = ny;
      mouse.over = true;
      mouse.t = e.timeStamp;
    };
    const onMouseLeave = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') mouse.over = false;
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    root.addEventListener('pointermove', onMouseMove);
    root.addEventListener('pointerleave', onMouseLeave);
    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('pointerup', onPointerUp);
    root.addEventListener('pointercancel', onPointerUp);
    root.addEventListener('click', onClickCapture, true);

    // The loop. Physics every frame; DOM and GL writes only when something moved.
    const xs = new Array<number>(n).fill(0);
    let shift = 0;
    let hover = 0;
    let lookX = 0;
    let lookY = 0;
    let lastPos = NaN;
    let lastShift = NaN;
    let lastFx = '';
    let last = performance.now();
    let activeNow = -1;
    let settledNow = true;
    let raf = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      scroller.update(dt, now);

      // The split follows speed, eased so it builds and fades with the momentum, and
      // lands exactly on zero at rest.
      const goal = reducedRef.current ? 0 : clamp((scroller.vel / W) * SHIFT_GAIN, -MAX_SHIFT, MAX_SHIFT);
      shift += (goal - shift) * (1 - Math.exp(-dt * 12));
      if (goal === 0 && Math.abs(shift) < 1e-4) shift = 0;

      // The cursor: its spot eased a little, the effect easing in while the mouse is over
      // the page and swelling as it moves, easing out when it leaves. The parallax eases
      // back to centre without it. Never on touch screens, nor with reduced motion.
      const cursor = finePointer.matches && !reducedRef.current && mouse.over;
      const follow = 1 - Math.exp(-dt * 12);
      mouse.x += (mouse.tx - mouse.x) * follow;
      mouse.y += (mouse.ty - mouse.y) * follow;
      mouse.speed *= Math.exp(-dt * 3);
      const hoverGoal = cursor ? clamp(HOVER_REST + mouse.speed * HOVER_SPEED_GAIN, 0, 1) : 0;
      hover += (hoverGoal - hover) * (1 - Math.exp(-dt * 5));
      if (hoverGoal === 0 && hover < 1e-3) hover = 0;
      const drift = 1 - Math.exp(-dt * 3);
      lookX += ((cursor ? (mouse.x - 0.5) * 2 * LOOK : 0) - lookX) * drift;
      lookY += ((cursor ? (mouse.y - 0.5) * 2 * LOOK : 0) - lookY) * drift;
      if (!cursor && Math.abs(lookX) < 1e-5 && Math.abs(lookY) < 1e-5) lookX = lookY = 0;
      const fxKey = `${hover.toFixed(4)}|${mouse.x.toFixed(4)}|${mouse.y.toFixed(4)}|${lookX.toFixed(5)}|${lookY.toFixed(5)}`;
      const fxChanged = fxKey !== lastFx;
      lastFx = fxKey;

      const pos = scroller.pos;
      const moved = force || pos !== lastPos || shift !== lastShift;
      if (moved) {
        for (let i = 0; i < n; i++) {
          const x = wrapX(i * W - pos, n, W);
          xs[i] = x;
          const p = x / W;
          const el = slideRefs.current[i];
          if (el) {
            el.style.transform = `translate3d(${(x * TEXT_SPEED).toFixed(2)}px,0,0)`;
            el.style.opacity = String(1 - clamp((Math.abs(p) - 0.15) / 0.6, 0, 1));
            el.style.visibility = Math.abs(p) < 1 ? 'visible' : 'hidden';
          }
          const fb = fallbackRefs.current[i];
          if (fb) {
            fb.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
            const img = fb.firstElementChild as HTMLElement | null;
            if (img) img.style.transform = `translate3d(${(-p * PARALLAX * W * ZOOM).toFixed(2)}px,0,0) scale(${ZOOM})`;
          }
        }
        lastPos = pos;
        lastShift = shift;
      }
      gl?.frame(now, xs, { shift, mouseX: mouse.x, mouseY: mouse.y, hover, lookX, lookY }, moved || fxChanged);
      force = false;

      const idx = mod(Math.round(pos / W), n);
      if (idx !== activeNow) {
        activeNow = idx;
        setActive(idx);
        // Only the slide on screen can be tabbed into. Set here rather than as a prop:
        // React 18 doesn't pass `inert` through.
        slideRefs.current.forEach((el, i) => {
          if (el) el.inert = i !== idx;
        });
      }
      if (scroller.settled !== settledNow) {
        settledNow = scroller.settled;
        setSettled(settledNow);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      root.removeEventListener('pointermove', onMouseMove);
      root.removeEventListener('pointerleave', onMouseLeave);
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerup', onPointerUp);
      root.removeEventListener('pointercancel', onPointerUp);
      root.removeEventListener('click', onClickCapture, true);
      gl?.dispose();
    };
  }, [n, slides]);

  // The entrance.
  useEffect(() => {
    const a = requestAnimationFrame(() => setEntered(true));
    const t = setTimeout(() => setIntroDone(true), 1100);
    return () => {
      cancelAnimationFrame(a);
      clearTimeout(t);
    };
  }, []);

  // Keep the address pointing at the slide on screen, so a shared link opens on it.
  useEffect(() => {
    const id = slides[active]?.id;
    if (open && id && window.location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
  }, [open, active, slides]);

  // The title sits above the active slide's words: its header block, plus its paragraphs
  // once they're open. Measured, then eased there on the same curve and timing as the
  // paragraphs, so the two move as one.
  useLayoutEffect(() => {
    const measure = () => {
      const head = headRefs.current[active]?.offsetHeight ?? 0;
      const body = open ? (bodyRefs.current[active]?.offsetHeight ?? 0) : 0;
      setTitleLift(head + body);
      // A paragraph box with more text than fits lets a finger scroll it; one without
      // passes vertical swipes on to the slides (see the drag handling).
      for (const box of bodyRefs.current) {
        if (box) box.style.touchAction = box.scrollHeight > box.clientHeight + 1 ? 'pan-y' : 'none';
      }
    };
    measure();
    document.fonts?.ready.then(measure).catch(() => {});
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [active, open]);

  const motionMs = open ? OPEN_MS : CLOSE_MS;
  const fadeUp = (delay: number): React.CSSProperties => ({
    opacity: entered ? 1 : 0,
    transform: entered || reducedMotion ? 'none' : 'translateY(24px)',
    transition: `opacity 1000ms ${EASE} ${delay}ms, transform 1100ms ${EASE} ${delay}ms`,
  });

  return (
    <main
      ref={rootRef}
      aria-roledescription="carousel"
      aria-label={title}
      className="fixed inset-0 cursor-grab select-none overflow-hidden overscroll-none bg-[#000666] [touch-action:pinch-zoom]"
    >
      <canvas ref={canvasRef} aria-hidden className={`absolute inset-0 h-full w-full ${noGL ? 'hidden' : ''}`} />

      {/* Without WebGL: the same pictures as plain images, moved by the same loop. */}
      {noGL &&
        slides.map((s, i) => (
          <div
            key={s.key}
            ref={(el) => {
              fallbackRefs.current[i] = el;
            }}
            aria-hidden
            className="absolute inset-0 overflow-hidden"
          >
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.image.url}
                alt=""
                className="h-full w-full object-cover"
                style={{ objectPosition: `${s.image.focus[0] * 100}% ${s.image.focus[1] * 100}%` }}
              />
            )}
          </div>
        ))}

      {/* Shade for legibility: under the nav, along the bottom, and deeper on the left
          once the paragraphs are open. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#000666]/60 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[75%] bg-gradient-to-t from-[#000666]/90 via-[#000666]/40 to-transparent" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#000666]/75 via-[#000666]/30 to-transparent"
        style={{ opacity: open ? 1 : 0, transition: `opacity ${motionMs}ms ${EASE}` }}
      />

      {slides.map((s, i) => {
        const isOpen = open && i === active;
        return (
          <section
            key={s.key}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${n}: ${s.header}`}
            aria-hidden={i !== active}
            className="pointer-events-none absolute inset-0 flex items-end will-change-transform"
            style={i === 0 ? undefined : { visibility: 'hidden' }}
          >
            <div className="pointer-events-auto w-full px-6 pb-24 sm:px-8 sm:pb-14 lg:pb-16">
              <div
                ref={(el) => {
                  headRefs.current[i] = el;
                }}
                className="max-w-3xl"
                style={fadeUp(i === active ? 150 : 0)}
              >
                <h2 className="text-balance font-spirit text-2xl font-medium leading-[1.1] text-[#ff6666] sm:text-3xl lg:text-4xl wide:text-5xl">
                  {s.header}
                </h2>
                {s.subheader && (
                  <p className="mt-2 max-w-2xl text-sm font-medium uppercase tracking-wide text-[#ff6666] sm:text-base">
                    {s.subheader}
                  </p>
                )}
              </div>

              {/* Opens from nothing to its height: grid rows 0fr → 1fr animate the height
                  of content whose size isn't known in CSS. */}
              <div
                className="grid"
                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', transition: `grid-template-rows ${isOpen ? OPEN_MS : CLOSE_MS}ms ${EASE}` }}
              >
                <div className="min-h-0 overflow-hidden">
                  <div
                    ref={(el) => {
                      bodyRefs.current[i] = el;
                    }}
                    data-scroll-y
                    className="max-h-[min(40vh,30rem)] max-w-xl overflow-y-auto overscroll-contain pr-2 pt-4 text-[15px] leading-relaxed text-white/85 sm:max-h-[min(42vh,30rem)] sm:text-base"
                    style={{
                      opacity: isOpen ? 1 : 0,
                      transform: isOpen || reducedMotion ? 'none' : 'translateY(16px)',
                      transition: isOpen
                        ? `opacity ${OPEN_MS}ms ${EASE} 150ms, transform ${OPEN_MS}ms ${EASE} 150ms`
                        : `opacity ${CLOSE_MS * 0.6}ms ${EASE}, transform ${CLOSE_MS}ms ${EASE}`,
                    }}
                  >
                    <PortableText value={s.paragraphs} components={PARAGRAPHS} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* The page title: fixed at the left, lifted to sit just above the active slide's
          words, on the same curve as the paragraphs. */}
      <div className="pointer-events-none absolute bottom-24 left-6 sm:bottom-14 sm:left-8 lg:bottom-16" style={fadeUp(0)}>
        <h1
          className="font-spirit text-4xl font-medium leading-[1.05] text-[#ff6666] sm:text-5xl lg:text-6xl wide:text-7xl"
          style={{
            transform: `translateY(${-(titleLift + TITLE_GAP)}px)`,
            transition: `transform ${motionMs}ms ${EASE}`,
          }}
        >
          {title}
        </h1>
      </div>

      {/* The slide menu: numbers and a rule, joined by the headers on wide screens. Down
          the right-hand side from tablets up; on phones, where the words fill the width,
          a row under the logo instead. */}
      {n > 1 && (
        <div className="absolute left-6 top-[104px] sm:left-8 md:left-auto md:right-8 md:top-1/2 md:-translate-y-1/2">
        <nav aria-label="Slides" style={fadeUp(300)}>
          <ol className="flex flex-row gap-3 md:flex-col md:items-end md:gap-1">
            {slides.map((s, i) => {
              const current = i === active;
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => goToSlide(i)}
                    aria-current={current ? 'true' : undefined}
                    aria-label={`Go to slide ${i + 1}: ${s.header}`}
                    className={`group flex cursor-pointer items-center gap-3 py-1.5 transition-colors duration-500 ${
                      current ? 'text-[#ff6666]' : 'text-[#ff6666]/50 hover:text-[#ff6666]'
                    }`}
                  >
                    <span
                      className={`hidden max-w-[15rem] truncate text-right font-spirit text-sm transition-opacity duration-500 xl:block ${
                        current ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {s.header}
                    </span>
                    <span className="font-spirit text-xs tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                    <span
                      aria-hidden
                      className="h-px bg-current"
                      style={{ width: current ? 40 : 16, transition: `width 700ms ${EASE}` }}
                    />
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
        </div>
      )}

      {!n && (
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <p className="text-lg text-white/60">Content coming soon.</p>
        </div>
      )}
    </main>
  );
}
