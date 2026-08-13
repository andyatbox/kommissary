'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useUX, view, type WordAnchor } from '@/lib/store';
import type { PhonePlacement } from '@/lib/phones';

const M = THREE.MathUtils;

/* ── Tuning ─────────────────────────────────────────────────────────────────────
 * Placement is expressed in the anchor word's own frame, same convention as the
 * models in Models.tsx: X = reading direction (screen-right), Y = up, Z = toward
 * the viewer. So "behind and above" is +Y, −Z.
 */
const MODEL_URL = '/models/iphone/scene.gltf';


/** How far in front of the camera the phone sits once tapped. */
const FOCUS_DIST = 6;
/** Share of the viewport height the phone fills when focused. */
const FOCUS_FILL = 0.72;
/**
 * Rotation applied inside the camera's frame when focused, so the SCREEN faces the
 * viewer. This model's screen points down its local −Z, so it needs a half turn about Y
 * to bring that round to the camera — without it, the phone arrives back-first. Y is the
 * axis to turn on rather than X, because it leaves the phone standing upright.
 */
const FOCUS_FACE: [number, number, number] = [0, Math.PI, 0];
/** How quickly it flies to the camera and back. */
const FOCUS_RATE = 3.2;

/**
 * Screen texture orientation, against this model's UVs.
 *
 * The video comes in flipped vertically — and only vertically, so flipY corrects it on
 * its own (a flip is its own inverse). Rotating a half turn does NOT fix it: that's a
 * flip on both axes, which trades the upside-down image for a mirrored one.
 *
 * The three dials, if it ever needs adjusting again: FLIP_Y for upside down, MIRROR for
 * reversed left-to-right, ROTATION for anything on its side.
 */
const SCREEN_FLIP_Y = true;
const SCREEN_MIRROR = false;
const SCREEN_ROTATION = 0;

/** How far either side of the word, in curve-u, the phone is revealed. Matches MARGIN_U
 *  in Models.tsx so it appears alongside that zone's models. */
const MARGIN_U = 0.04;

/** Scroll distance, in curve-u, that releases a focused phone. Small enough that any
 *  deliberate scroll sends it back, large enough to ride out the camera settling. */
const SCROLL_RELEASE_U = 0.002;

useGLTF.preload(MODEL_URL);


/**
 * The iPhone that floats behind "We're", playing the newest @kommissary reel on its
 * screen as a video texture.
 *
 * Deliberately hand-placed rather than CMS-driven — it's a one-off, not a content slot.
 *
 * The video only runs while its zone is on screen: a decoding video uploads a fresh
 * frame to the GPU every tick, which is wasted work when the phone is nowhere in view,
 * and this scene already has a history of overwhelming weak hardware.
 */
export default function PhoneModel({
  placement,
  reel,
  allowVideo,
}: {
  placement: PhonePlacement;
  reel: { id: string; poster: string } | null;
  /** False only on hardware that genuinely can't take it — see Quality.videoTextures. */
  allowVideo: boolean;
}) {
  const anchors = useUX((s) => s.anchors);
  const anchor = useMemo(
    () => anchors.find((a) => a.word === placement.anchorWord),
    [anchors, placement.anchorWord]
  );
  if (!anchor || !reel) return null;
  return <Phone anchor={anchor} reel={reel} allowVideo={allowVideo} placement={placement} />;
}

function Phone({
  anchor,
  reel,
  allowVideo,
  placement,
}: {
  anchor: WordAnchor;
  reel: { id: string; poster: string };
  allowVideo: boolean;
  placement: PhonePlacement;
}) {
  const { scene } = useGLTF(MODEL_URL);
  const camera = useThree((s) => s.camera);
  const group = useRef<THREE.Group>(null!);
  /**
   * Whether the phone has come forward. A ref, NOT state: the frame loop reads this
   * every tick, and a state update doesn't reach that loop until React has re-rendered.
   * That one-frame lag was enough for the loop to see "not focused" straight after a
   * click and re-mute the video — and since unmuting is only permitted inside a user
   * gesture, that silenced it for good. Nothing in the markup depends on this, so a ref
   * costs nothing and updates the instant it's set.
   */
  const focused = useRef(false);

  // Hidden <video> driving the texture. crossOrigin is essential: without it the video
  // taints the WebGL context and three refuses to use it as a texture. Instagram's CDN
  // sends `access-control-allow-origin: *`, so the anonymous request is accepted.
  const media = useMemo(() => {
    if (typeof document === 'undefined') return null;

    // Only the genuinely incapable get a still instead — a software rasteriser, or a
    // machine reporting almost no memory or cores. Phones play the reel like everything
    // else; one muted clip is minor next to the 3D scene they're already running.
    if (!allowVideo) {
      const texture = new THREE.TextureLoader().load(reel.poster);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = SCREEN_FLIP_Y;
      return { el: null as HTMLVideoElement | null, texture };
    }

    const el = document.createElement('video');
    el.crossOrigin = 'anonymous';
    el.loop = true;
    el.muted = true;
    el.playsInline = true;
    el.preload = 'auto';
    el.src = `/api/instagram/video/${reel.id}`;
    // Kept in the document rather than detached. Browsers treat a detached media element
    // as a second-class citizen — Safari in particular can refuse to output audio for one
    // — so it lives here, one transparent pixel, out of the way of everything.
    el.style.cssText =
      'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0.001;pointer-events:none;z-index:-1';
    document.body.appendChild(el);
    const texture = new THREE.VideoTexture(el);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = SCREEN_FLIP_Y;
    if (SCREEN_ROTATION) {
      // Rotate about the middle of the screen, not its corner.
      texture.center.set(0.5, 0.5);
      texture.rotation = SCREEN_ROTATION;
    }
    if (SCREEN_MIRROR) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.repeat.x = -1;
    }
    return { el: el as HTMLVideoElement | null, texture };
  }, [reel.id, reel.poster, allowVideo]);

  // Clone the model, fit it to TARGET_SIZE, and put the video on the screen.
  const data = useMemo(() => {
    const object = scene.clone(true);
    /** Width ÷ height of the screen face, measured off the mesh below. */
    let screenAspect = 0;
    object.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      // 'Wallpaper' is the screen — see the glTF's material list.
      if (mat?.name === 'Wallpaper' && media) {
        // Measure the screen so the video can be fitted to it. Its two largest
        // dimensions are the face; the third is the panel's thickness.
        mesh.geometry.computeBoundingBox();
        const s = mesh.geometry.boundingBox!.getSize(new THREE.Vector3());
        const [h, w] = [s.x, s.y, s.z].sort((a, b) => b - a);
        screenAspect = w / h;

        const screen = mat.clone();
        screen.map = media.texture;
        screen.emissiveMap = media.texture;
        // Lit from itself, so the reel reads brightly rather than sitting in scene shadow.
        screen.emissive = new THREE.Color(0xffffff);
        screen.emissiveIntensity = 1;
        screen.toneMapped = false;
        mesh.material = screen;
      }
    });

    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    object.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return {
      object,
      screenAspect,
      baseScale: placement.targetSize / maxDim,
      /** Height at scale 1, so the focused size can be solved from the camera frustum. */
      unitHeight: size.y || 1,
      home: anchor.position
        .clone()
        .add(new THREE.Vector3(...placement.offset).applyQuaternion(anchor.quaternion)),
      phase: Math.random() * Math.PI * 2,
    };
  }, [scene, anchor, media, placement]);

  /**
   * Fit the reel to the screen without distorting it: crop the overhanging axis rather
   * than stretch, the way `object-fit: cover` would. A 9:16 reel on a ~9:19.5 phone
   * screen is relatively too wide, so this trims its sides — much better than squashing
   * the video, and far better than widening the phone, which would misshape the model.
   */
  useEffect(() => {
    if (!media || !data.screenAspect) return;
    const { el, texture } = media;

    const fit = () => {
      // Source dimensions come from the video, or from the still on phones.
      const img = texture.image as { width?: number; height?: number } | undefined;
      const srcW = el ? el.videoWidth : (img?.width ?? 0);
      const srcH = el ? el.videoHeight : (img?.height ?? 0);
      if (!srcW || !srcH) return;

      const srcAspect = srcW / srcH;
      if (srcAspect > data.screenAspect) {
        const r = data.screenAspect / srcAspect; // too wide — trim the sides
        texture.repeat.set(r, 1);
        texture.offset.set((1 - r) / 2, 0);
      } else {
        const r = srcAspect / data.screenAspect; // too tall — trim top and bottom
        texture.repeat.set(1, r);
        texture.offset.set(0, (1 - r) / 2);
      }
      texture.needsUpdate = true;
    };

    fit(); // in case it's already loaded
    if (!el) {
      // A still has no metadata event to wait on, so check briefly until it decodes.
      let tries = 0;
      const id = window.setInterval(() => {
        const img = texture.image as { width?: number } | undefined;
        if ((img?.width ?? 0) > 0 || ++tries > 40) {
          fit();
          window.clearInterval(id);
        }
      }, 100);
      return () => window.clearInterval(id);
    }
    el.addEventListener('loadedmetadata', fit);
    return () => el.removeEventListener('loadedmetadata', fit);
  }, [media, data]);

  // Free the clone's screen material and the video when this unmounts.
  useEffect(() => {
    return () => {
      if (media) {
        if (media.el) {
          media.el.pause();
          media.el.removeAttribute('src');
          media.el.load();
          media.el.remove();
        }
        media.texture.dispose();
      }
      data.object.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && (mesh.material as THREE.Material)?.name === 'Wallpaper') {
          (mesh.material as THREE.Material).dispose();
        }
      });
    };
  }, [media, data]);

  const shown = useRef(0);
  const focus = useRef(0);
  /** Throttles retries, so a blocked autoplay can't fire a rejected promise every frame. */
  const lastPlayAttempt = useRef(-1);
  /** Scroll position when the phone came forward — scrolling from here sends it back. */
  const focusU = useRef(0);
  const vecs = useMemo(
    () => ({
      home: new THREE.Vector3(),
      focusPos: new THREE.Vector3(),
      forward: new THREE.Vector3(),
      restQuat: new THREE.Quaternion(),
      faceQuat: new THREE.Quaternion().setFromEuler(new THREE.Euler(...FOCUS_FACE)),
      focusQuat: new THREE.Quaternion(),
      euler: new THREE.Euler(),
    }),
    []
  );

  useFrame((state, rawDt) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(rawDt, 1 / 20);
    const t = state.clock.elapsedTime;

    const overview = useUX.getState().overviewActive;
    const inZone = Math.abs(view.u - anchor.u) < MARGIN_U;
    // Visible with its zone, and also in the pulled-back overview where everything shows.
    const visible = inZone || overview;

    // Any scrolling at all sends it back — you don't have to leave the zone first.
    // Measured against where the scroll was when it came forward, so the phone releases
    // the moment you move on rather than hanging in front of the words. The zone check
    // is the backstop for anything that jumps the scroll without a gradual move.
    if (focused.current && (Math.abs(view.u - focusU.current) > SCROLL_RELEASE_U || !inZone)) {
      focused.current = false;
    }

    shown.current = M.damp(shown.current, visible ? 1 : 0, 4, dt);
    focus.current = M.damp(focus.current, focused.current ? 1 : 0, FOCUS_RATE, dt);

    if (shown.current < 0.002) {
      g.visible = false;
    } else {
      g.visible = true;
    }

    // Loop for as long as the phone is on screen — including the pulled-back overview.
    // It still stops once the phone is gone, so a video isn't decoding and uploading a
    // frame per tick for something nobody can see. Muted unless it's come to the camera.
    const shouldPlay = visible;
    // `media.el` is null on phones, where the screen is a still — nothing to drive.
    if (media?.el) {
      const el = media.el;
      if (shouldPlay) {
        // Checked against the element itself rather than a flag we set, so playback
        // recovers on its own if the browser stopped it (backgrounded tab, decode
        // stall, a blocked autoplay that a later interaction has since permitted).
        if (el.paused && t - lastPlayAttempt.current > 0.5) {
          lastPlayAttempt.current = t;
          void el.play().catch(() => {});
        }
        // Sound fades up as it arrives. Done with VOLUME, not muted: unmuting is
        // gesture-restricted and this runs long after the click, so the unmute itself
        // happens in the handler below while volume starts at zero.
        //
        // Re-muting is keyed off `focused`, NOT off how far it has travelled. Muting is
        // always permitted but unmuting is not, so re-muting on the frame right after a
        // click — while focus has yet to ramp — would silently revoke that unmute for
        // good.
        if (focused.current) {
          el.volume = M.clamp(M.smoothstep(focus.current, 0.5, 0.95), 0, 1);
        } else {
          el.volume = 0;
          if (focus.current < 0.02) el.muted = true;
        }
      } else if (!el.paused) {
        el.pause();
        el.muted = true;
      }
    }

    // Resting pose: hovering just behind the word.
    vecs.home.copy(data.home);
    vecs.home.y += Math.sin(t * placement.hoverFreq + data.phase) * placement.hoverAmp;
    vecs.euler.set(
      placement.rotX + Math.sin(t * 0.7 + data.phase) * 0.04,
      placement.rotY + Math.sin(t * 0.6 + data.phase) * 0.1,
      placement.rotZ + Math.sin(t * 0.85 + data.phase) * 0.04
    );
    vecs.restQuat.setFromEuler(vecs.euler);

    // Focused pose: dead ahead of the lens, square to it.
    camera.updateMatrixWorld();
    camera.getWorldDirection(vecs.forward);
    vecs.focusPos.copy(camera.position).addScaledVector(vecs.forward, FOCUS_DIST);
    vecs.focusQuat.copy(camera.quaternion).multiply(vecs.faceQuat);

    // Size it to fill FOCUS_FILL of the frame at that distance.
    const cam = camera as THREE.PerspectiveCamera;
    const viewHeight = 2 * Math.tan(M.degToRad(cam.fov) / 2) * FOCUS_DIST;
    const focusScale = (viewHeight * FOCUS_FILL) / data.unitHeight;

    const f = focus.current;
    g.position.lerpVectors(vecs.home, vecs.focusPos, f);
    g.quaternion.slerpQuaternions(vecs.restQuat, vecs.focusQuat, f);
    g.scale.setScalar(M.lerp(data.baseScale, focusScale, f) * shown.current);
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const next = !focused.current;
    // These run straight in the handler, NOT inside a setState updater. React treats
    // updaters as pure and may run them later, during render — outside the click's
    // gesture window, which is the only moment a browser will honour an unmute.
    if (next && media?.el) {
      media.el.currentTime = 0;
      media.el.volume = 0; // silent until it arrives; the frame loop fades it up
      media.el.muted = false;
      void media.el.play().catch(() => {});
    }
    // Where the scroll was when it came forward, so any scrolling sends it back.
    focusU.current = view.u;
    focused.current = next;
  };

  return (
    <group ref={group} onClick={onClick}>
      <primitive object={data.object} />
    </group>
  );
}
