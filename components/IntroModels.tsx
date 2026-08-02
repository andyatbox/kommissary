'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
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
 * `startDeg` is the Y rotation (degrees) the model faces at entry; `sweepDeg` is how far
 * it turns while on screen (the "rotate ~180°" default). Together they let you dial in
 * each model's facing mid-rotation — e.g. `{ startDeg: 90, sweepDeg: 90 }`. `tiltX` is a
 * static X lean (negative tips the top toward the camera).
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
  { url: '/models/intro-tray.glb', target: 3.4, startDeg: -90, sweepDeg: 180, tiltX: 10 },
  { url: '/models/intro-deliver.glb', target: 4.2, startDeg: -180, sweepDeg: 180 },
];

INTRO.forEach((c) => useGLTF.preload(c.url, DRACO_PATH));

/** Distance in front of the camera the cycle sits — clear of the fog (near = 22). */
const DIST = 13;
/** Vertical nudge in the camera plane; 0 = perfectly centered behind the logo. */
const Y_OFF = 0;

/** Seconds each model is featured (scale in → rotate → scale out) before the next. The
 *  ~180° sweep spans this whole window, so a larger value also means a slower turn. */
const SLOT = 16;
/** Scale-in / scale-out portion (seconds) at each end of a slot. */
const GROW = 0.6;
const CYCLE = SLOT * INTRO.length;

/** How fast the whole cycle scales in on landing / shrinks away once you scroll in. */
const VIS_IN_RATE = 2.2;
const VIS_OUT_RATE = 3.5;

/** Shared, render-free cycle state advanced by the parent and read by the model. */
type Clock = { t: number; vis: number };

/** On phones (≤767px) the models are shrunk by 40% so they don't crowd the small logo. */
const NARROW_SCALE = 0.6;

function useNarrowScale() {
  const [mul, setMul] = useState(1);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setMul(mq.matches ? NARROW_SCALE : 1);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return mul;
}

export default function IntroModels() {
  return <IntroCycle />;
}

function IntroCycle() {
  const camera = useThree((s) => s.camera);
  const root = useRef<THREE.Group>(null!);
  const clock = useRef<Clock>({ t: 0, vis: 0 });
  const scaleMul = useNarrowScale();

  // Only ONE model is mounted at a time (null = nothing, while scrolled in). Keeping a
  // single GLB resident — and unmounting the intro entirely once reading — is the whole
  // point of this rework: on a weak GPU it's the per-frame draw cost that kills the context.
  const [index, setIndex] = useState<number | null>(0);

  // Mimic the camera's world transform every frame so the mounted model is locked to
  // screen space (dead center in front of the lens). Runs after CameraRig (mounted later
  // in the Canvas), so the pose is this frame's — no lag.
  useFrame((_, rawDt) => {
    const g = root.current;
    if (!g) return;
    const dt = Math.min(rawDt, 1 / 20);

    camera.updateMatrixWorld();
    g.position.copy(camera.position);
    g.quaternion.copy(camera.quaternion);

    const started = useUX.getState().started;
    const c = clock.current;

    if (started) {
      // Scrolled in: shrink the cycle away, then unmount it completely and rewind, so the
      // GPU is free while reading and the intro replays from the top on scroll-back.
      c.vis = M.damp(c.vis, 0, VIS_OUT_RATE, dt);
      if (c.vis < 0.02) {
        c.t = 0;
        if (index !== null) setIndex(null);
      }
    } else {
      c.vis = M.damp(c.vis, 1, VIS_IN_RATE, dt);
      c.t += dt;
      const want = Math.floor((c.t % CYCLE) / SLOT);
      if (want !== index) setIndex(want);
    }
  });

  return (
    <group ref={root}>
      {index !== null && (
        <Suspense fallback={null}>
          <IntroModel key={index} cfg={INTRO[index]} index={index} clock={clock} scaleMul={scaleMul} />
        </Suspense>
      )}
    </group>
  );
}

function IntroModel({
  cfg,
  index,
  clock,
  scaleMul,
}: {
  cfg: IntroCfg;
  index: number;
  clock: React.RefObject<Clock>;
  scaleMul: number;
}) {
  const { scene } = useGLTF(cfg.url, DRACO_PATH);
  const group = useRef<THREE.Group>(null!);

  // Clone the scene (geometry + materials shared with the cache by reference — cheap) and
  // center it on its own origin so the Y spin turns it in place. Materials are left fully
  // opaque and untouched: driving opacity was distorting the model's overlapping planes,
  // so entry/exit is done purely by scale instead.
  const data = useMemo(() => {
    const object = scene.clone(true);
    object.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    });

    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    object.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return { object, baseScale: cfg.target / maxDim };
  }, [scene, cfg]);

  const startYaw = M.degToRad(cfg.startDeg ?? 0);
  const sweep = M.degToRad(cfg.sweepDeg ?? 180);
  const tiltX = M.degToRad(cfg.tiltX ?? 0);

  useFrame(() => {
    const g = group.current;
    const c = clock.current;
    if (!g || !c) return;

    // Phase within this model's own slot: 0 at scale-in, climbing to SLOT at scale-out.
    const local = ((c.t % CYCLE) - index * SLOT + CYCLE) % CYCLE;

    // Scale envelope: grow from 0 on entry, hold at 1, shrink to 0 on exit — no opacity
    // anywhere, so nothing goes transparent and the planes never sort/distort.
    let env = 1;
    if (local < GROW) env = M.smoothstep(local / GROW, 0, 1);
    else if (local > SLOT - GROW) env = M.smoothstep((SLOT - local) / GROW, 0, 1);

    const s = data.baseScale * env * c.vis * scaleMul;
    if (s < 0.001) {
      g.visible = false;
      return;
    }
    g.visible = true;

    // Rotate startYaw → startYaw + sweep across the slot (slow, ~180° over SLOT seconds).
    const spin = sweep * M.clamp(local / SLOT, 0, 1);
    g.rotation.set(tiltX, startYaw + spin, 0);
    g.scale.setScalar(s);
  });

  return (
    <group ref={group} position={[0, Y_OFF, -DIST]}>
      <primitive object={data.object} />
    </group>
  );
}
