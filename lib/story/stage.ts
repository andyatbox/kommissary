'use client';

import { useSyncExternalStore } from 'react';
import type { ModelSpec } from './timeline';

/**
 * The bridge between the DOM timeline and the single WebGL canvas behind it.
 *
 * Each article renders an empty div as the "slot" its model should occupy, and
 * registers it here. The canvas subscribes, and every frame projects each slot's
 * bounding rect into world space — so the models track the DOM exactly, including
 * while the smooth-scroll transform is animating, with one WebGL context and one
 * render pass for the whole page.
 *
 * (The alternative — a separate <Canvas> per article — burns a context each and
 * caps out around 16 in most browsers, with duplicated lighting and env maps on
 * top. A fullscreen canvas driven by DOM rects gets the same isolation visually
 * for a fraction of the cost.)
 */

export type Slot = {
  id: string;
  el: HTMLElement;
  spec: ModelSpec;
};

const slots = new Map<string, Slot>();
const listeners = new Set<() => void>();

const EMPTY: Slot[] = [];
let snapshot: Slot[] = EMPTY;

function emit() {
  snapshot = Array.from(slots.values());
  listeners.forEach((listener) => listener());
}

/** Registers a slot and returns its unregister function (use it as an effect cleanup). */
export function registerSlot(slot: Slot): () => void {
  slots.set(slot.id, slot);
  emit();
  return () => {
    // Guard against a re-registration under the same id having already replaced this
    // entry — React can mount the replacement before running the old cleanup.
    if (slots.get(slot.id) === slot) {
      slots.delete(slot.id);
      emit();
    }
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => EMPTY;

export function useSlots(): Slot[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Pointer position in normalised device coordinates (-1…1, y up). Read straight off
 * this object inside useFrame — routing it through React state would re-render the
 * whole scene on every mouse move for no benefit.
 */
export const pointer = { x: 0, y: 0 };

export function trackPointer(): () => void {
  const onMove = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
  };
  // Pointer never leaves the window on touch, so recentre when the finger lifts.
  const onLeave = () => {
    pointer.x = 0;
    pointer.y = 0;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onLeave, { passive: true });
  window.addEventListener('pointerleave', onLeave, { passive: true });
  return () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onLeave);
    window.removeEventListener('pointerleave', onLeave);
  };
}
