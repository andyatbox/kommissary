/**
 * Scroll physics for the Our Impact slider. Units are CSS px of travel, one slide being
 * one viewport width (W). The position is unbounded: the slider loops, so slide k sits
 * at k·W for every whole k, not only 0…n-1.
 *
 * Three modes:
 * - follow: the position chases a target on a critically damped spring. Wheel deltas and
 *   drags move the target, so the slides glide after the input rather than jumping.
 * - tween:  the snap. One cubic curve from the current position AND velocity to a slide,
 *   arriving at rest. Starting at the current velocity is what makes it a single motion:
 *   a fling eases straight into its slide instead of coasting to a stop and then sliding
 *   again. When the velocity allows it the curve is a pure ease-out (see tweenTo).
 * - idle:   settled on a slide.
 *
 * Where a gesture lands is decided early. A drag knows on release; a mouse wheel when its
 * notches stop; a trackpad as soon as its own momentum starts to fade, from how fast it is
 * fading (see wheelDelta). The rest of that momentum is then ignored, since the snap has
 * already accounted for it.
 */

type Mode = 'idle' | 'follow' | 'tween';

/** Spring stiffness (rad/s) while following the wheel: soft, so the wheel's steps blur. */
const WHEEL_OMEGA = 9;
/** While dragging: close to 1:1 under the finger, with just enough smoothing. */
const DRAG_OMEGA = 34;
/** Snap duration bounds, s. */
const MIN_T = 0.55;
const MAX_T = 1.3;
/** The snap length a release is projected for. A release at velocity v is expected to
 *  travel v·T/3: exactly how far an ease-out of length T starting at v goes. */
const NATURAL_T = 0.9;
/** A gesture never moves more than this many slides. */
const MAX_STEPS = 2;
/** Wheel input this long silent ends the gesture (mouse wheels, slow trackpad moves). */
const WHEEL_IDLE_MS = 140;
/** A gap this long means the next wheel delta is a new gesture. */
const WHEEL_GAP_MS = 160;
/** Wheel travel under this goes back to the slide it started on. */
const WHEEL_MIN_TRAVEL = 40;
/** Drag releases slower than this snap to the nearest slide, not the next one. */
const FLICK_VELOCITY = 150;
/** How far past a slide a flick must be heading to go on to the next (fraction of W). */
const FLICK_THRESHOLD = 0.15;
/** How far a slow drag must be pulled to go on to the next instead of springing back. */
const DRAG_THRESHOLD = 0.25;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export class Scroller {
  /** One slide's width, px. */
  W = 1;
  pos = 0;
  /** px/s. */
  vel = 0;
  dragging = false;

  private mode: Mode = 'idle';
  private target = 0;
  private omega = WHEEL_OMEGA;
  private tw = { from: 0, to: 0, m0: 0, T: 1, t: 0 };
  /** The slide position the current gesture is measured from. */
  private base = 0;
  private dragOrigin = 0;
  private wheel = {
    /** The snap is decided; deltas until the next gesture are trackpad momentum. */
    locked: false,
    dir: 0,
    lastAbs: 0,
    lastT: -Infinity,
    idleAt: 0,
    hist: [] as { d: number; t: number }[],
  };

  get settled() {
    return this.mode === 'idle';
  }

  /** The (unwrapped) slide index the slider is on or heading to. */
  get heading() {
    if (this.mode === 'tween') return Math.round(this.tw.to / this.W);
    if (this.mode === 'follow') return Math.round(this.target / this.W);
    return Math.round(this.pos / this.W);
  }

  setWidth(W: number) {
    if (W <= 0 || W === this.W) return;
    const k = W / this.W;
    this.pos *= k;
    this.vel *= k;
    this.target *= k;
    this.base *= k;
    this.dragOrigin *= k;
    this.tw.from *= k;
    this.tw.to *= k;
    this.tw.m0 *= k;
    this.W = W;
  }

  jumpTo(index: number) {
    this.pos = this.target = index * this.W;
    this.vel = 0;
    this.mode = 'idle';
  }

  /** Ease to a slide from wherever the slider is, carrying its current velocity. */
  goTo(index: number) {
    this.endWheelGesture();
    this.dragging = false;
    this.tweenTo(index * this.W);
  }

  // --- Wheel -------------------------------------------------------------------------

  wheelDelta(d: number, now: number) {
    const sign = Math.sign(d);
    if (!sign) return;
    const w = this.wheel;
    const gap = now - w.lastT;

    if (w.locked) {
      // Trackpad momentum fades: smaller deltas, same way, no pause. Anything else is a
      // fresh swipe.
      const fresh = gap > WHEEL_GAP_MS || sign !== w.dir || Math.abs(d) > w.lastAbs * 1.4 + 3;
      w.lastAbs = Math.abs(d);
      w.lastT = now;
      w.dir = sign;
      if (!fresh) return;
      w.locked = false;
      w.hist = [];
    }

    if (!w.hist.length || gap > WHEEL_GAP_MS) {
      w.hist = [];
      this.base = this.gestureBase();
    }

    // Keep heading the same way as an unfinished snap rather than braking first; turning
    // back starts from where the slides actually are.
    let from = this.pos;
    if (this.mode === 'follow') from = this.target;
    else if (this.mode === 'tween' && Math.sign(this.tw.to - this.pos) === sign) from = this.tw.to;
    this.follow(from + d, WHEEL_OMEGA);

    w.hist.push({ d: Math.abs(d), t: now });
    if (w.hist.length > 6) w.hist.shift();
    w.dir = sign;
    w.lastAbs = Math.abs(d);
    w.lastT = now;
    w.idleAt = now + WHEEL_IDLE_MS;

    // Trackpad momentum: five quick deltas, each no bigger than the last, clearly fading.
    // Fading geometrically by r per event, it still has d·r/(1-r) to go, so the snap is
    // aimed at where it would have come to rest.
    const h = w.hist;
    if (h.length >= 5) {
      const first = h[h.length - 5];
      const last = h[h.length - 1];
      let falling = true;
      for (let i = h.length - 4; i < h.length; i++) if (h[i].d > h[i - 1].d + 0.5) falling = false;
      if (falling && last.t - first.t < 120 && last.d < first.d * 0.85) {
        const r = Math.min(0.97, Math.pow(last.d / first.d, 1 / 4));
        this.snapWheel(this.target + sign * ((last.d * r) / (1 - r)));
        w.locked = true;
        w.hist = [];
      }
    }
  }

  private snapWheel(projected: number) {
    const travel = projected - this.base;
    const steps =
      Math.abs(travel) < WHEEL_MIN_TRAVEL
        ? 0
        : Math.min(MAX_STEPS, Math.max(1, Math.round(Math.abs(travel) / this.W)));
    this.tweenTo(this.base + Math.sign(travel) * steps * this.W);
  }

  private endWheelGesture() {
    this.wheel.locked = false;
    this.wheel.hist = [];
  }

  // --- Drag --------------------------------------------------------------------------

  dragStart() {
    this.endWheelGesture();
    this.base = this.gestureBase();
    this.dragging = true;
    // Catch the slides where they are: the stiff spring brakes them under the finger.
    this.dragOrigin = this.pos;
    this.follow(this.pos, DRAG_OMEGA);
  }

  /** dx: px the pointer has moved since dragStart (right is positive). */
  dragMove(dx: number) {
    this.follow(this.dragOrigin - dx, DRAG_OMEGA);
  }

  /** v: the pointer's travel speed in scroll terms, px/s (dragging left is positive). */
  dragEnd(v: number) {
    this.dragging = false;
    // Judged from the finger (the drag's target), not the slides, which trail it a touch.
    const x = (this.target + (v * NATURAL_T) / 3) / this.W;
    const b = Math.round(this.base / this.W);
    // A flick goes the way it was thrown once it's heading 15% past a slide; a slow
    // release goes the way it was pulled once it's 25% across.
    const flick = Math.abs(v) > FLICK_VELOCITY;
    const dir = flick ? Math.sign(v) : Math.sign(x - b);
    const threshold = flick ? FLICK_THRESHOLD : DRAG_THRESHOLD;
    let index =
      dir > 0 ? Math.floor(x + 1 - threshold) : dir < 0 ? Math.ceil(x - 1 + threshold) : Math.round(x);
    // One of the two slides the finger let go between, however hard the flick: on a
    // phone a slide is so narrow that an ordinary flick would otherwise carry two.
    const f = this.target / this.W;
    index = clamp(index, Math.floor(f), Math.ceil(f));
    index = clamp(index, b - MAX_STEPS, b + MAX_STEPS);
    this.tweenTo(index * this.W);
  }

  // --- Motion ------------------------------------------------------------------------

  /** Where a gesture starting now counts from: the slide being snapped to, or the nearest. */
  private gestureBase() {
    if (this.mode === 'tween') return this.tw.to;
    return Math.round(this.pos / this.W) * this.W;
  }

  private follow(target: number, omega: number) {
    this.mode = 'follow';
    this.target = target;
    this.omega = omega;
  }

  /**
   * The snap: a cubic Hermite curve from (pos, vel) to (to, 0) over T seconds.
   *
   * With T = 3·distance/speed the curve is exactly an ease-out cubic, 1-(1-s)³, whose
   * starting speed is the current one: the release carries straight on and settles. T is
   * kept within bounds, and the starting slope within 3·distance (past 4× it would
   * overshoot and come back), trading a little continuity for never bouncing.
   */
  private tweenTo(to: number) {
    const d = to - this.pos;
    const v = this.vel;
    if (Math.abs(d) < 0.5 && Math.abs(v) < 5) {
      this.pos = this.target = to;
      this.vel = 0;
      this.mode = 'idle';
      return;
    }
    const sameWay = Math.sign(v) === Math.sign(d) && Math.abs(v) > 50;
    const T = sameWay
      ? clamp((3 * Math.abs(d)) / Math.abs(v), MIN_T, MAX_T)
      : clamp(0.65 + (Math.abs(d) / this.W) * 0.35, MIN_T, MAX_T);
    let m0 = v * T;
    if (sameWay) m0 = Math.sign(m0) * Math.min(Math.abs(m0), 3 * Math.abs(d));
    this.tw = { from: this.pos, to, m0, T, t: 0 };
    this.target = to;
    this.mode = 'tween';
  }

  update(dt: number, now: number) {
    const w = this.wheel;
    if (!w.locked && w.hist.length && now >= w.idleAt && !this.dragging) {
      this.snapWheel(this.target);
      w.hist = [];
    }

    if (this.mode === 'follow') {
      // Critically damped spring, solved exactly for this dt (stable at any frame rate).
      const x0 = this.pos - this.target;
      const c = this.vel + this.omega * x0;
      const e = Math.exp(-this.omega * dt);
      this.pos = this.target + (x0 + c * dt) * e;
      this.vel = (this.vel - this.omega * c * dt) * e;
    } else if (this.mode === 'tween') {
      const tw = this.tw;
      tw.t += dt;
      const s = Math.min(1, tw.t / tw.T);
      if (s >= 1) {
        this.pos = this.target = tw.to;
        this.vel = 0;
        this.mode = 'idle';
        return;
      }
      const s2 = s * s;
      const s3 = s2 * s;
      this.pos = (2 * s3 - 3 * s2 + 1) * tw.from + (s3 - 2 * s2 + s) * tw.m0 + (3 * s2 - 2 * s3) * tw.to;
      this.vel =
        ((6 * s2 - 6 * s) * tw.from + (3 * s2 - 4 * s + 1) * tw.m0 + (6 * s - 6 * s2) * tw.to) / tw.T;
    }
  }
}
