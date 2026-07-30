/**
 * ============================================================================
 *  MODEL RESTING ROTATIONS — the tuning surface. Edit the numbers below.
 * ============================================================================
 *
 * Every model's default orientation, in DEGREES, keyed by the moment id it belongs
 * to (the ids are the `id` fields in lib/timeline.ts). These are the angles a model
 * rests at when the cursor is centred; the pointer-driven rotation in
 * components/TimelineCanvas.tsx is added on top of them and always returns here.
 *
 * Which knob does what, looking at the screen:
 *
 *   x — PITCH. Positive tips the model's top away from you, showing more of its top
 *       face. Negative tips the top toward you. Use it to look down onto flat things
 *       (a cutting board, a plated dish).
 *
 *   y — YAW / TURN. Positive spins the model anticlockwise seen from above, bringing
 *       its left side toward you. This is the one to reach for first: most GLBs are
 *       authored facing away from camera, so 90–180 is the usual correction. A
 *       three-quarter view generally reads better than a dead-on one.
 *
 *   z — ROLL. Positive tilts the model anticlockwise on screen. Mostly left at 0;
 *       a few degrees can stop a symmetrical object looking stiff.
 *
 * Degrees, not radians, so they can be eyeballed: 90 is a quarter turn, 180 faces the
 * model the other way. Fractions are fine. All three are optional and default to 0.
 *
 * Not here: per-model `scale` lives beside the content in lib/timeline.ts, since it
 * is about how big a thing reads next to its copy rather than how it is posed. The
 * pointer sensitivity that rides on top of these angles (TURN / TILT) is in
 * components/TimelineCanvas.tsx.
 */

export type RestingRotation = {
  /** Pitch: + tips the top away from the viewer. */
  x?: number;
  /** Yaw: + brings the model's left side toward the viewer. */
  y?: number;
  /** Roll: + tilts anticlockwise on screen. */
  z?: number;
};

export const MODEL_ROTATIONS: Record<string, RestingRotation> = {
  // The food truck. Faces away as authored, so turn it most of the way round and
  // stop short of square-on for a three-quarter front view.
  korilla: { x: 0, y: 45 },

  // Market stall — angled so the frontage opens toward the copy rather than the edge.
  'fish-market': { x: 15, y: 30 },

  // Board and ingredients lie flat; pitch it forward so you look down onto the top.
  'cutting-board': { x: 26, y: 17 },

  // Plated dish, same reasoning as the board — the interest is all on the top face.
  chicken: { x: 40, y: 11 },

  // Delivery truck, presented broadside-on to read as a vehicle in profile.
  'kommy-truck': { x: 0, y: 89 },

  // Loose produce; a slight turn keeps the fruit from stacking up in silhouette.
  'bananas-apple': { x: 0, y: 20 },

  // Row of houses — turned the other way so the street recedes toward the timeline.
  brownstones: { x: 0, y: 40 },

  // The statue reads best slightly off-axis, torch side toward the copy.
  'statue-of-liberty': { x: 0, y: 40 },
};

const DEG_TO_RAD = Math.PI / 180;

/**
 * The resting rotation for a moment, converted to the radian triple three.js wants.
 * Unknown ids fall back to no rotation rather than throwing — a newly authored moment
 * simply renders at the model's authored orientation until it is tuned above.
 */
export function restingRotation(id: string): [number, number, number] {
  const r = MODEL_ROTATIONS[id] ?? {};
  return [(r.x ?? 0) * DEG_TO_RAD, (r.y ?? 0) * DEG_TO_RAD, (r.z ?? 0) * DEG_TO_RAD];
}
