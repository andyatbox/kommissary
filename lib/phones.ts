/**
 * Where the iPhone models hang in the 3D scene, and how each sits there.
 *
 * Kept in its own plain module rather than in the component: the homepage's server
 * component reads PHONES.length to decide how many reels to fetch, and a server
 * component can't reach into a 'use client' module's exports.
 */
/** Where one phone hangs, and how it sits there. */
export type PhonePlacement = {
  /** Sentence word it hangs off. Must match the token exactly — note the sentence uses
   *  a curly apostrophe, so a straight one won't match. */
  anchorWord: string;
  /** Behind the word and slightly above centre, in the word's own frame. */
  offset: [number, number, number];
  /** Largest world dimension the model is fit to, whatever its authored scale. */
  targetSize: number;
  /** Resting rotation, radians. */
  rotX: number;
  rotY: number;
  rotZ: number;
  /** Hover bob and drift, matching the other models' feel. */
  hoverAmp: number;
  hoverFreq: number;
};

/**
 * The phones in the scene, in order. Each takes the next playable reel — the first gets
 * the newest, the second the one before it — so they never show the same clip. Add
 * another entry and it picks up the next reel along, provided one is available.
 */
export const PHONES: PhonePlacement[] = [
  {
    anchorWord: 'We’re',
    offset: [0, 1.0, -4],
    targetSize: 12,
    rotX: 0.12,
    rotY: -2.5,
    rotZ: 0.05,
    hoverAmp: 0.3,
    hoverFreq: 0.9,
  },
  {
    anchorWord: 'serving',
    offset: [0, 1.0, -4],
    targetSize: 12,
    // Turned the other way, and drifting at its own rate, so the two don't look cloned.
    rotX: 0.1,
    rotY: 2.5,
    rotZ: -0.05,
    hoverAmp: 0.28,
    hoverFreq: 0.98,
  },
];
