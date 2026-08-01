'use client';

import { Suspense, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useUX } from '@/lib/store';

const M = THREE.MathUtils;

/** Self-hosted Draco decoder — the intro GLBs are Draco-compressed like the rest. */
const DRACO_PATH = '/draco/';

/**
 * One featured model in the landing cycle.
 *
 * `startDeg` is the Y rotation (degrees) the model faces at fade-in; `sweepDeg` is how
 * far it turns while it's on screen (the "rotate ~180°" default). Together they let you
 * dial in each model's facing mid-rotation — e.g. start 90° further round and sweep a
 * smaller arc: `{ startDeg: 90, sweepDeg: 90 }`. `tiltX` is a static forward/back lean.
 */
type IntroCfg = {
  url: string;
  /** Largest world dimension the GLB is fit to, regardless of its authored scale. */
  target: number;
  startDeg?: number;
  sweepDeg?: number;
  tiltX?: number;
};

const INTRO: IntroCfg[] = [
  { url: '/models/intro-tray.glb', target: 4.2, startDeg: 0, sweepDeg: 180 },
  { url: '/models/intro-deliver.glb', target: 5.5, startDeg: 0, sweepDeg: 180 },
  { url: '/models/intro-heart.glb', target: 4.6, startDeg: 0, sweepDeg: 180 },
];

INTRO.forEach((c) => useGLTF.preload(c.url, DRACO_PATH));

/** Distance in front of the camera the cycle sits — clear of the fog (near = 22). */
const DIST = 13;
/** Vertical nudge in the camera plane; 0 = perfectly centered behind the logo. */
const Y_OFF = 0;

/** Seconds each model is on screen, and the crossfade overlap between consecutive ones.
 *  ON_SCREEN also sets the rotation speed — a full ~180° sweep spans this whole window. */
const ON_SCREEN = 8.5;
const OVERLAP = 1.5;
/** Time between successive model onsets — the overlap is what makes them dissolve/morph. */
const STEP = ON_SCREEN - OVERLAP;
const CYCLE = STEP * INTRO.length;

/** How fast the whole cycle fades in on landing / fades away once you scroll in. */
const VIS_IN_RATE = 3.2;
const VIS_OUT_RATE = 6;

/** Shared, render-free cycle state advanced by the parent and read by each model. */
type Clock = { t: number; vis: number };

export default function IntroModels() {
  return (
    <Suspense fallback={null}>
      <IntroCycle />
    </Suspense>
  );
}

function IntroCycle() {
  const camera = useThree((s) => s.camera);
  const root = useRef<THREE.Group>(null!);
  const clock = useRef<Clock>({ t: 0, vis: 0 });

  // Mimic the camera's world transform every frame so the group's children are locked to
  // screen space (dead center in front of the lens), no matter where the camera roams.
  // Runs after CameraRig (mounted later in the Canvas), so the pose is this frame's.
  useFrame((_, rawDt) => {
    const g = root.current;
    if (!g) return;
    const dt = Math.min(rawDt, 1 / 20);

    camera.updateMatrixWorld();
    g.position.copy(camera.position);
    g.quaternion.copy(camera.quaternion);

    // While reading (scrolled in) the cycle fades away and freezes; once fully hidden it
    // resets to the first model, so scrolling back to the very top replays from the start.
    const started = useUX.getState().started;
    const c = clock.current;
    if (started) {
      c.vis = M.damp(c.vis, 0, VIS_OUT_RATE, dt);
      if (c.vis < 0.02) c.t = 0;
    } else {
      c.vis = M.damp(c.vis, 1, VIS_IN_RATE, dt);
      c.t += dt;
    }
  });

  return (
    <group ref={root}>
      {INTRO.map((cfg, i) => (
        <IntroModel key={cfg.url} cfg={cfg} index={i} clock={clock} />
      ))}
    </group>
  );
}

type MatRec = { mat: THREE.Material; opacity: number };

function IntroModel({
  cfg,
  index,
  clock,
}: {
  cfg: IntroCfg;
  index: number;
  clock: React.RefObject<Clock>;
}) {
  const { scene } = useGLTF(cfg.url, DRACO_PATH);
  const group = useRef<THREE.Group>(null!);

  // Clone once: geometry is shared, materials are cloned so opacity can be driven per
  // instance; the model is centered on its own origin so the Y spin turns it in place.
  const data = useMemo(() => {
    const object = scene.clone(true);
    const mats: MatRec[] = [];
    object.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.frustumCulled = false; // always dead center; never cull mid-fade
      const cloned = (mesh.material as THREE.Material).clone();
      mesh.material = cloned;
      mats.push({ mat: cloned, opacity: cloned.opacity });
    });

    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    object.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return { object, mats, baseScale: cfg.target / maxDim };
  }, [scene, cfg]);

  const startYaw = M.degToRad(cfg.startDeg ?? 0);
  const sweep = M.degToRad(cfg.sweepDeg ?? 180);
  const tiltX = M.degToRad(cfg.tiltX ?? 0);

  useFrame(() => {
    const g = group.current;
    const c = clock.current;
    if (!g || !c) return;

    // This model's phase within the looping cycle: 0 at its onset, climbing to ON_SCREEN.
    const r = ((c.t - index * STEP) % CYCLE + CYCLE) % CYCLE;
    const onScreen = r < ON_SCREEN;

    // Opacity + a subtle scale swell so the crossfade reads as a dissolve/morph rather
    // than a hard swap: the incoming model grows in as the outgoing one lifts and fades.
    let op = 0;
    let swell = 1;
    if (onScreen) {
      if (r < OVERLAP) {
        const k = M.smoothstep(r / OVERLAP, 0, 1);
        op = k;
        swell = M.lerp(0.82, 1, k);
      } else if (r > ON_SCREEN - OVERLAP) {
        const k = M.smoothstep((ON_SCREEN - r) / OVERLAP, 0, 1);
        op = k;
        swell = M.lerp(1.12, 1, k);
      } else {
        op = 1;
      }
    }
    op *= c.vis;

    if (op < 0.004) {
      g.visible = false;
      return;
    }
    g.visible = true;

    // Rotate startYaw → startYaw + sweep across the on-screen span (slow, ~180°/5.5s).
    const spin = onScreen ? sweep * M.clamp(r / ON_SCREEN, 0, 1) : 0;
    g.rotation.set(tiltX, startYaw + spin, 0);
    g.scale.setScalar(data.baseScale * swell * M.lerp(0.6, 1, c.vis));

    const fading = op < 0.999;
    for (const m of data.mats) {
      m.mat.transparent = true;
      m.mat.opacity = op * m.opacity;
      m.mat.depthWrite = !fading;
    }
  });

  return (
    <group ref={group} position={[0, Y_OFF, -DIST]}>
      <primitive object={data.object} />
    </group>
  );
}
