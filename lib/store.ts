import { create } from 'zustand';
import * as THREE from 'three';
import type { PortableTextBlock } from '@portabletext/types';

/** Homepage content (from Sanity, or the default fallback). */
export type PillButton = { label: string; url: string };
export type PillContent = {
  label: string;
  words: string[];
  title?: string;
  body?: PortableTextBlock[];
  buttons?: PillButton[];
};
/** The five "Our Team" photos that float around the word "minority-run", keyed by their
 *  position in the cluster. Each value is a ready-to-load image URL built from the Sanity
 *  asset; a slot with no uploaded image is omitted and that plane simply isn't rendered. */
export type TeamSlot =
  | 'teamTopLeft'
  | 'teamTopRight'
  | 'teamBottomLeft'
  | 'teamBottomCenter'
  | 'teamBottomRight';
export type TeamImages = Partial<Record<TeamSlot, string>>;
export type HomeContent = {
  sentence: string;
  pills: PillContent[];
  team?: TeamImages;
  /** Landing tagline sentences, typed out and cycled above the arched logo. */
  typedLines?: string[];
};

export type FocusDot = {
  id: number;
  label: string;
  /** Content shown in the overlay when this pill is clicked. */
  title?: string;
  body?: PortableTextBlock[];
  buttons?: PillButton[];
  position: THREE.Vector3;
  /** Unit direction from the word toward where the camera should sit when focused. */
  normal: THREE.Vector3;
  /** Curve-u window in which this button is revealed (its trigger zone). */
  uStart: number;
  uEnd: number;
};

/** World placement of a word, used to hang 3D models off it in its own oriented frame. */
export type WordAnchor = {
  word: string;
  /** Centroid of the word's letters — models hang off this (their offsets are tuned to it). */
  position: THREE.Vector3;
  /** True center of the word's bounding box. Sits dead-center even on words with uneven
   *  glyph widths (the centroid drifts sideways there), so pills read as centered. */
  center: THREE.Vector3;
  /** Word basis: X = reading direction (screen-right), Y = up, Z = toward viewer. */
  quaternion: THREE.Quaternion;
  /** Curve parameter of the word's center along the spline. */
  u: number;
};

/**
 * Live scroll read-out, updated imperatively by the camera rig every frame and
 * read by the model manager. Kept off React state so it never triggers renders.
 */
export const view = {
  p: 0,
  u: 0,
  /** World point the camera is looking at — the shadow frustum follows this. */
  target: new THREE.Vector3(),
  /** 0→1 blend into the end-of-scroll overview shot. */
  overview: 0,
};

interface UXState {
  /** Homepage content (sentence + pills), hydrated from Sanity on the client. */
  content: HomeContent | null;
  setContent: (content: HomeContent) => void;

  /** Organic 3D spline the words sit on and the camera reads along; null until measured. */
  path: THREE.CatmullRomCurve3 | null;
  dots: FocusDot[];
  anchors: WordAnchor[];
  /** Curve-u the reading travel spans: the first word's u → the last word's u, so
   *  full scroll (0→1) lands exactly on the words with no dead lead-in or tail. */
  travelStart: number;
  travelEnd: number;
  /** Bounding box of the whole sentence, used to frame the end-of-scroll overview shot. */
  overviewCenter: THREE.Vector3;
  overviewSize: THREE.Vector3;
  /** True once the camera has finished pulling out to the full-sentence view. */
  overviewActive: boolean;
  setOverviewActive: (v: boolean) => void;
  ready: boolean;
  setPath: (
    path: THREE.CatmullRomCurve3,
    dots: FocusDot[],
    anchors: WordAnchor[],
    travelStart: number,
    travelEnd: number,
    overviewCenter: THREE.Vector3,
    overviewSize: THREE.Vector3
  ) => void;

  focus: FocusDot | null;
  setFocus: (focus: FocusDot | null) => void;

  /** True once a clicked pill's zoom-in finishes and its content modal takes over. */
  modalOpen: boolean;
  setModalOpen: (v: boolean) => void;

  /** True once scrolled in past the very start; flips back to false at the start. */
  started: boolean;
  setStarted: (v: boolean) => void;

  /** Target scroll progress the camera should ease to (set by the nav chevrons);
   *  null when there's no active jump. Cleared by the rig on arrival or manual input. */
  navTarget: number | null;
  setNavTarget: (p: number | null) => void;
}

export const useUX = create<UXState>((set) => ({
  content: null,
  setContent: (content) => set({ content }),

  path: null,
  dots: [],
  anchors: [],
  travelStart: 0,
  travelEnd: 1,
  overviewCenter: new THREE.Vector3(),
  overviewSize: new THREE.Vector3(),
  overviewActive: false,
  setOverviewActive: (v) => set({ overviewActive: v }),
  ready: false,
  setPath: (path, dots, anchors, travelStart, travelEnd, overviewCenter, overviewSize) =>
    set({
      path,
      dots,
      anchors,
      travelStart,
      travelEnd,
      overviewCenter,
      overviewSize,
      ready: true,
    }),

  focus: null,
  setFocus: (focus) => set({ focus }),

  modalOpen: false,
  setModalOpen: (v) => set({ modalOpen: v }),

  started: false,
  setStarted: (v) => set({ started: v }),

  navTarget: null,
  setNavTarget: (p) => set({ navTarget: p }),
}));
