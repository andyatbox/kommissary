'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useUX, view } from '@/lib/store';
import { progressToU, readingPose } from '@/lib/path';

const M = THREE.MathUtils;

// Kinetic scroll: input adds velocity immediately (no ease-in), and when input
// stops the velocity decays for a smooth ease-out coast.
const WHEEL_IMPULSE = 0.00025; // progress-velocity added per unit wheel delta
// An eighth of the original 0.001 — a tenth read as a little too slow, a third as
// too fast. TOUCH_FLING is a straight multiple of this, so tuning it here also
// scales the release-momentum by the same amount automatically.
const TOUCH_DRAG = 0.001 / 8; // progress per px while the finger is down (immediate 1:1)
const TOUCH_FLING = 50; // px-velocity → progress-velocity carried on release
const SCROLL_DECAY = 4.0; // higher = shorter coast / snappier ease-out
const MAX_SCROLL_VEL = 0.38; // clamp so a hard flick can't skip past whole sections
/** Duration (s) of a nav-chevron ease-in-out jump to the next/previous pill. */
const NAV_DURATION = 1.9;

/** How far the camera parks from a dot when focused — closer than the reading distance. */
const FOCUS_DIST = 5.5;

/** Viewport width the scene is tuned for; narrower windows back the camera off proportionally. */
const REF_WIDTH = 1440;
/** Max sideways/vertical camera shift from mouse parallax, in world units (scaled by distance). */
const PARALLAX = 3.6;
/** Scroll progress past which the splash logo is considered dismissed. */
const START_THRESHOLD = 0.012;

/** How close (in curve-u) the camera must get to the last word before the end shot fires.
 *  travelEnd sits ~0.02 past the last word's center, so this triggers as it centers. */
const END_U_MARGIN = 0.025;
/** Lerp rate of that pull-out — low, so it's a slow, graceful reveal. */
const OVERVIEW_RATE = 1.5;
/** Blend past which the overview counts as complete (models then reveal). */
const OVERVIEW_READY = 0.97;
/** Framing slack so the sentence isn't flush against the viewport edges. */
const OVERVIEW_PAD = 1.06;
/** Fog is pushed out of range at the overview, so the full sentence reads unclouded. */
const FOG_OFF_NEAR = 4000;
const FOG_OFF_FAR = 6000;
/** Direction the overview camera sits from the sentence's center (front, slightly raised). */
const OVERVIEW_DIR = new THREE.Vector3(0, 0.22, 1).normalize();

/** Parallax easing: the parallax eases out toward the pointer. Lower = slower, gentler. */
const PARALLAX_EASE = 3;

export default function CameraRig() {
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);

  const scroll = useRef({ current: 0, vel: 0, touching: false, lastY: 0 });
  // Nav-chevron ease: a timed ease-in-out tween from `navFrom` to the store's navTarget.
  const nav = useRef({ from: 0, elapsed: 0, target: null as number | null });
  const blend = useRef(0);
  const endBlend = useRef(0);
  const baseFog = useRef<{ near: number; far: number } | null>(null);
  const lastFocusPos = useRef(new THREE.Vector3());
  const lastFocusNormal = useRef(new THREE.Vector3(0, 0, 1));
  const progressEl = useRef<HTMLElement | null>(null);

  // Mouse parallax (pointer normalized to [-1, 1]) and responsive distance scale.
  const pointer = useRef({ tx: 0, ty: 0, x: 0, y: 0 });
  const distScale = useRef(1);

  const v = useMemo(
    () => ({
      pathPos: new THREE.Vector3(),
      pathTgt: new THREE.Vector3(),
      focusPos: new THREE.Vector3(),
      focusTgt: new THREE.Vector3(),
      pos: new THREE.Vector3(),
      tgt: new THREE.Vector3(),
      overviewPos: new THREE.Vector3(),
      overviewTgt: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      right: new THREE.Vector3(),
      up: new THREE.Vector3(),
    }),
    []
  );

  useEffect(() => {
    const s = scroll.current;

    const isTouch =
      typeof window !== 'undefined' &&
      (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);

    const computeScale = () => {
      // Narrower viewports back the camera off proportionally; at 767px and below,
      // back it off a bit further still so more of the sentence reads in frame
      // instead of feeling zoomed in on a small screen.
      const mobile = window.innerWidth <= 767 ? 1.15 : 1;
      distScale.current = M.clamp(REF_WIDTH / window.innerWidth, 0.85, 2.3) * mobile;
    };
    computeScale();
    window.addEventListener('resize', computeScale);

    // Mouse parallax only on non-touch devices, so touch input never drives it.
    const onMouseMove = (e: MouseEvent) => {
      pointer.current.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    if (!isTouch) window.addEventListener('mousemove', onMouseMove, { passive: true });

    const onWheel = (e: WheelEvent) => {
      // Nothing moves until the sentence has been measured and the path built. Scrolling
      // before that just runs the camera down a path the words aren't on yet.
      if (!useUX.getState().ready) return;
      if (useUX.getState().modalOpen) return; // modal owns scrolling while it's up
      if (useUX.getState().navTarget != null) useUX.getState().setNavTarget(null); // user takes over
      // Add velocity right away — the camera moves this frame, no ease-in ramp.
      s.vel = M.clamp(s.vel + e.deltaY * WHEEL_IMPULSE, -MAX_SCROLL_VEL, MAX_SCROLL_VEL);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!useUX.getState().ready) return;
      if (useUX.getState().navTarget != null) useUX.getState().setNavTarget(null); // user takes over
      s.touching = true;
      s.vel = 0;
      s.lastY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!s.touching || useUX.getState().modalOpen || !useUX.getState().ready) return;
      const y = e.touches[0].clientY;
      const dy = s.lastY - y;
      s.lastY = y;
      // Finger drives position directly (immediate), and sets the fling velocity for release.
      s.current = M.clamp(s.current + dy * TOUCH_DRAG, 0, 1);
      s.vel = M.clamp(dy * TOUCH_DRAG * TOUCH_FLING, -MAX_SCROLL_VEL, MAX_SCROLL_VEL);
    };

    const onTouchEnd = () => {
      s.touching = false;
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', computeScale);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const s = scroll.current;
    const n = nav.current;
    const { focus, path, travelStart, travelEnd, modalOpen, navTarget } = useUX.getState();
    if (!path) return;

    // Nav chevrons: ease-in-out toward the requested progress (centering a pill or the
    // end shot). Takes priority over kinetic scroll; interrupted by manual input (which
    // clears navTarget) and by the modal opening.
    if (navTarget != null && !modalOpen && !s.touching) {
      if (n.target !== navTarget) {
        n.target = navTarget;
        n.from = s.current;
        n.elapsed = 0;
      }
      n.elapsed += dt;
      const t = Math.min(n.elapsed / NAV_DURATION, 1);
      s.current = M.lerp(n.from, navTarget, M.smootherstep(t, 0, 1));
      s.vel = 0;
      if (t >= 1) {
        n.target = null;
        useUX.getState().setNavTarget(null);
      }
    } else {
      n.target = null;
      // Kinetic integration: move by velocity, then decay it (ease-out coast). No
      // damp-toward-target, so there's no ease-in lag when a gesture begins. Frozen
      // while the modal is up so the sentence doesn't drift behind it.
      if (modalOpen) {
        s.vel = 0;
      } else if (!s.touching) {
        s.current += s.vel * dt;
        s.vel *= Math.exp(-SCROLL_DECAY * dt);
        if (Math.abs(s.vel) < 1e-5) s.vel = 0;
      }
    }
    if (s.current <= 0) {
      s.current = 0;
      s.vel = 0;
    } else if (s.current >= 1) {
      s.current = 1;
      s.vel = 0;
    }

    // Publish live progress for the model manager (zones live in curve-u space).
    view.p = s.current;
    view.u = progressToU(s.current, travelStart, travelEnd);

    // The splash logo shows at the very start and slides away once scrolled in — and
    // returns when scrolled back. Only touch the store on a threshold crossing.
    const started = s.current > START_THRESHOLD;
    if (started !== useUX.getState().started) useUX.getState().setStarted(started);

    const scale = distScale.current;
    readingPose(path, s.current, scale, travelStart, travelEnd, v.pathPos, v.pathTgt);

    // End of scroll: leave the path and lerp out to frame the whole sentence, centered.
    // Triggered by curve position (last word essentially centered), not by scroll
    // reaching ~1 — so there's no dead scroll after the last word is on screen.
    const ux = useUX.getState();
    // Not while a pill is zooming in (which can happen on the last word's pill).
    const atEnd = !focus && view.u >= travelEnd - END_U_MARGIN;
    endBlend.current = M.damp(endBlend.current, atEnd ? 1 : 0, OVERVIEW_RATE, dt);
    const e = endBlend.current;
    if (ux.overviewSize.x > 0) {
      const cam = camera as THREE.PerspectiveCamera;
      const vFov = (cam.fov * Math.PI) / 180;
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * cam.aspect);
      // Fit the sentence's bounding box against the real FOV — far tighter than a
      // bounding-sphere fit, which badly over-estimates for a long, thin sentence.
      const halfW = ux.overviewSize.x / 2;
      const halfH = ux.overviewSize.y / 2;
      const halfD = ux.overviewSize.z / 2;
      const dist =
        Math.max(halfH / Math.tan(vFov / 2), halfW / Math.tan(hFov / 2)) * OVERVIEW_PAD +
        halfD;

      if (e > 0.001) {
        v.overviewTgt.copy(ux.overviewCenter);
        v.overviewPos.copy(ux.overviewCenter).addScaledVector(OVERVIEW_DIR, dist);
        v.pathPos.lerp(v.overviewPos, e);
        v.pathTgt.lerp(v.overviewTgt, e);
      }

      // Fade the fog out of range as we pull out, so the overview is unclouded
      // (and fade it back in on the way down into the sentence).
      const fog = scene.fog as THREE.Fog | null;
      if (fog) {
        if (!baseFog.current) baseFog.current = { near: fog.near, far: fog.far };
        fog.near = M.lerp(baseFog.current.near, FOG_OFF_NEAR, e);
        fog.far = M.lerp(baseFog.current.far, FOG_OFF_FAR, e);
      }
    }

    // Once the pull-out has settled, let every model reveal.
    const overviewDone = e > OVERVIEW_READY;
    if (overviewDone !== ux.overviewActive) ux.setOverviewActive(overviewDone);

    // Clicking a pill focuses it: the camera zooms in, and once that zoom finishes the
    // content modal opens. Closing the modal clears the focus and the camera eases back
    // out to the sentence path.
    if (focus) {
      lastFocusPos.current.copy(focus.position);
      lastFocusNormal.current.copy(focus.normal);
    }
    blend.current = M.damp(blend.current, focus ? 1 : 0, focus ? 2.8 : 2.4, dt);

    if (focus && blend.current > 0.98 && !ux.modalOpen) ux.setModalOpen(true);

    v.focusTgt.copy(lastFocusPos.current);
    v.focusPos
      .copy(lastFocusPos.current)
      .addScaledVector(lastFocusNormal.current, FOCUS_DIST * scale);
    v.focusPos.y += 0.4 * scale;

    const f = blend.current;
    v.pos.lerpVectors(v.pathPos, v.focusPos, f);
    v.tgt.lerpVectors(v.pathTgt, v.focusTgt, f);

    // Publish what we're looking at so the shadow frustum can follow it.
    view.target.copy(v.tgt);
    view.overview = e;

    // Shift the camera in its own screen plane for a mouse parallax effect — a small orbit
    // around the look target that reveals depth. Tracks fast while the pointer is moving
    // (no ease-in lag), then eases out slowly once it stops so the camera settles gently.
    const p = pointer.current;
    // Basic ease-out toward the pointer (exponential smoothing — no momentum/overshoot).
    p.x = M.damp(p.x, p.tx, PARALLAX_EASE, dt);
    p.y = M.damp(p.y, p.ty, PARALLAX_EASE, dt);

    v.dir.subVectors(v.tgt, v.pos).normalize();
    v.right.crossVectors(v.dir, camera.up).normalize();
    v.up.crossVectors(v.right, v.dir).normalize();
    const amt = PARALLAX * scale;
    v.pos.addScaledVector(v.right, p.x * amt).addScaledVector(v.up, p.y * amt);

    camera.position.copy(v.pos);
    camera.up.set(0, 1, 0);
    camera.lookAt(v.tgt);

    if (!progressEl.current) progressEl.current = document.getElementById('scroll-progress');
    if (progressEl.current) progressEl.current.style.transform = `scaleX(${s.current})`;
  });

  return null;
}
