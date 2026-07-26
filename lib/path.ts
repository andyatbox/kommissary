import * as THREE from 'three';

const M = THREE.MathUtils;

/** Portion of the scroll over which the start-of-track lateral pan eases in. Sized so
 *  the pan's speed matches the word-tracking that follows, so entry feels continuous. */
export const APPROACH = 0.1;
/** Progress at which travel along the spline begins — tiny, so entering the experience is quick. */
export const PAN_START = 0.02;

/** Reading distance — constant for the whole track (no zoom in at the start). */
const CAM_DIST_READ = 13;
/** World -X the camera is offset by at the very start; scrolling pans it (+X) to zero. */
const APPROACH_PAN_X = 17;
/** Camera rides slightly above the word so the gaze tilts a touch downward. */
const CAM_HEIGHT = 1.2;

const _T = new THREE.Vector3();
const _Y = new THREE.Vector3();
const _Z = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

/**
 * Orthonormal frame of the spline at parameter u, matching how the words are
 * oriented: X = travel tangent, Y = world-up projected perpendicular, Z = the
 * word's facing normal (points back toward the reader). Writing the frame lets
 * the camera sit dead in front of the letter faces no matter how the path
 * twists through space.
 */
export function splineFrame(
  curve: THREE.CatmullRomCurve3,
  u: number,
  outX: THREE.Vector3,
  outY: THREE.Vector3,
  outZ: THREE.Vector3
) {
  curve.getTangentAt(M.clamp(u, 0, 1), outX);
  if (outX.lengthSq() < 1e-8) outX.set(1, 0, 0);
  outX.normalize();

  outY.copy(_up).addScaledVector(outX, -_up.dot(outX));
  if (outY.lengthSq() < 1e-6) outY.set(0, 1, 0);
  outY.normalize();

  outZ.crossVectors(outX, outY).normalize();
}

/**
 * Scroll progress p in [0, 1] → curve parameter u the camera is reading at,
 * remapped into [uStart, uEnd] so the travel covers exactly the words. Linear —
 * an eased mapping flattens to zero slope near the end, which makes the last
 * stretch feel like it takes endless scroll for no visual progress.
 */
export function progressToU(p: number, uStart = 0, uEnd = 1) {
  const t = M.clamp((p - PAN_START) / (1 - PAN_START), 0, 1);
  return M.lerp(uStart, uEnd, t);
}

/**
 * Camera pose while reading the snaking word-stream, for scroll progress p in
 * [0, 1]. Reading distance is constant — there's no zoom-in. Instead the track
 * starts offset in world -X and the first sliver of scroll pans (+X) it to zero,
 * so the sentence slides in laterally. Travel then walks the arc-length spline;
 * position is always the read point pushed out along the word's facing normal,
 * so the camera reads every word head-on.
 */
export function readingPose(
  curve: THREE.CatmullRomCurve3,
  p: number,
  distScale: number,
  uStart: number,
  uEnd: number,
  outPos: THREE.Vector3,
  outTarget: THREE.Vector3
) {
  // distScale backs the camera off on smaller viewports so the words read smaller, proportionally.
  const dist = CAM_DIST_READ * distScale;

  const u = progressToU(p, uStart, uEnd);
  curve.getPointAt(u, outTarget);

  splineFrame(curve, u, _T, _Y, _Z);
  outPos.copy(outTarget).addScaledVector(_Z, dist).addScaledVector(_Y, CAM_HEIGHT * distScale);

  // Lateral pan-in: scroll drives an -X → 0 offset over the approach. Both position
  // and target shift together (a pure truck), so the view stays head-on as it slides.
  const kIn = M.smootherstep(Math.min(p / APPROACH, 1), 0, 1);
  const panX = M.lerp(-APPROACH_PAN_X, 0, kIn) * distScale;
  outPos.x += panX;
  outTarget.x += panX;
}
