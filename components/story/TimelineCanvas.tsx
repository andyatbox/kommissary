'use client';

import { Suspense, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, PerformanceMonitor, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { getQuality } from '@/lib/story/perf';
import { pointer, trackPointer, useSlots, type Slot } from '@/lib/story/stage';

const M = THREE.MathUtils;

/** Self-hosted Draco decoder (the GLBs are Draco-compressed); avoids any external CDN. */
const DRACO_PATH = '/draco/';

/**
 * The camera never moves. Models are placed on the z = 0 plane at the world position
 * their DOM slot projects to, which makes the pixel mapping exact and independent of
 * scroll: 1 CSS pixel is always `worldPerPixel` world units, everywhere on screen.
 */
const CAM_Z = 12;
const FOV = 35;

/** Fraction of the slot's shorter side the model's largest dimension fills. */
const FILL = 0.8;
/** How far outside the viewport, in viewport heights, a model mounts and keeps drawing. */
const MOUNT_MARGIN = 0.75;

/**
 * Pointer-driven rotation, in radians at full deflection.
 *
 * TURN (horizontal mouse → spin about Y) is deliberately slight — at 0.17 rad, ~10°,
 * a model reacts to the cursor without swinging away from the resting orientation set
 * in lib/modelRotations.ts. TILT (vertical mouse → pitch about X) is the livelier of
 * the two.
 */
const TURN = 0.17;
const TILT = 0.32;
/** Rate the rotation chases the pointer — higher is snappier, lower is heavier. */
const ROT_LAMBDA = 3.5;

/** World units of vertical idle drift, so a model is never completely static. */
const FLOAT_AMP = 0.12;

/** World units visible per CSS pixel at the z = 0 plane. */
function worldPerPixel(canvasHeight: number) {
  return (2 * CAM_Z * Math.tan(M.degToRad(FOV) / 2)) / canvasHeight;
}

/**
 * One model, locked to its DOM slot. Reads the slot's rect every frame rather than
 * subscribing to scroll, so it stays glued through the smooth-scroll transform,
 * resizes, font swaps and layout shifts alike.
 */
function TimelineModel({ slot }: { slot: Slot }) {
  const { scene } = useGLTF(slot.spec.url, DRACO_PATH);
  const group = useRef<THREE.Group>(null!);
  const size = useThree((s) => s.size);

  // Per-instance clone: geometry is shared (cheap), materials are cloned so the fade-in
  // can drive opacity without touching the cached original.
  const model = useMemo(() => {
    const object = scene.clone(true);
    const mats: { mat: THREE.Material; transparent: boolean; opacity: number }[] = [];
    object.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const cloned = (mesh.material as THREE.Material).clone();
      mesh.material = cloned;
      mats.push({ mat: cloned, transparent: cloned.transparent, opacity: cloned.opacity });
    });

    // Auto-fit: recentre on the origin and record the largest dimension, so a GLB's
    // authored scale is irrelevant — every model is sized to its slot instead.
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const dims = box.getSize(new THREE.Vector3());
    object.position.sub(center);

    return {
      object,
      mats,
      maxDim: Math.max(dims.x, dims.y, dims.z) || 1,
      phase: Math.random() * Math.PI * 2,
    };
  }, [scene]);

  const base = slot.spec.rotation;
  const shown = useRef(0);

  useFrame((state, rawDt) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(rawDt, 1 / 20);

    const rect = slot.el.getBoundingClientRect();
    const margin = size.height * MOUNT_MARGIN;
    const onScreen = rect.bottom > -margin && rect.top < size.height + margin;
    g.visible = onScreen;
    if (!onScreen) return;

    const wpp = worldPerPixel(size.height);
    const t = state.clock.elapsedTime;

    // Project the slot's centre into world space.
    g.position.x = (rect.left + rect.width / 2 - size.width / 2) * wpp;
    g.position.y =
      -(rect.top + rect.height / 2 - size.height / 2) * wpp +
      Math.sin(t * 0.6 + model.phase) * FLOAT_AMP;

    // Fade and grow in the first time the model comes within reach of the viewport.
    shown.current = M.damp(shown.current, 1, 4, dt);
    const fit = (Math.min(rect.width, rect.height) * wpp * FILL * (slot.spec.scale ?? 1)) / model.maxDim;
    g.scale.setScalar(fit * M.lerp(0.9, 1, shown.current));

    const opacity = M.clamp(shown.current, 0, 1);
    const fading = opacity < 0.995;
    for (const m of model.mats) {
      if (fading) {
        m.mat.transparent = true;
        m.mat.opacity = opacity * m.opacity;
      } else {
        m.mat.transparent = m.transparent;
        m.mat.opacity = m.opacity;
      }
    }

    // Turn toward the pointer, with a slow idle sway underneath so a still mouse
    // doesn't leave the model frozen.
    g.rotation.x = M.damp(g.rotation.x, base[0] - pointer.y * TILT, ROT_LAMBDA, dt);
    g.rotation.y = M.damp(g.rotation.y, base[1] + pointer.x * TURN, ROT_LAMBDA, dt);
    g.rotation.z = base[2] + Math.sin(t * 0.45 + model.phase) * 0.03;
  });

  return (
    <group ref={group} rotation={[base[0], base[1], base[2]]} scale={0}>
      <primitive object={model.object} />
    </group>
  );
}

/**
 * Mounts a slot's model once it comes within `MOUNT_MARGIN` of the viewport, and keeps
 * it mounted thereafter. Loading eight Draco GLBs at once on first paint would stall
 * the main thread through the whole opening screen for models nobody has scrolled to.
 */
function Models() {
  const slots = useSlots();
  const mounted = useRef<Set<string>>(new Set());
  const [, bump] = useReducer((n: number) => n + 1, 0);

  useFrame(({ size }) => {
    const margin = size.height * MOUNT_MARGIN;
    let changed = false;
    for (const slot of slots) {
      if (mounted.current.has(slot.id)) continue;
      const rect = slot.el.getBoundingClientRect();
      if (rect.bottom > -margin && rect.top < size.height + margin) {
        mounted.current.add(slot.id);
        changed = true;
      }
    }
    if (changed) bump();
  });

  return (
    <>
      {slots
        .filter((slot) => mounted.current.has(slot.id))
        .map((slot) => (
          <Suspense key={slot.id} fallback={null}>
            <TimelineModel slot={slot} />
          </Suspense>
        ))}
    </>
  );
}

/** Trims resolution when frames get expensive, and restores it when they don't. */
function AdaptiveResolution({ min, max }: { min: number; max: number }) {
  const setDpr = useThree((s) => s.setDpr);
  return (
    <PerformanceMonitor
      onChange={({ factor }) => setDpr(min + (max - min) * factor)}
      flipflops={3}
      onFallback={() => setDpr(min)}
    />
  );
}

export default function TimelineCanvas() {
  // Detected once on the client; the server render can't know the GPU.
  const [quality, setQuality] = useState(() => getQuality());
  useEffect(() => setQuality(getQuality()), []);
  useEffect(() => trackPointer(), []);

  return (
    <div id="webgl-root" className="fixed inset-0 z-0">
      <Canvas
        dpr={quality.dpr}
        gl={{ antialias: quality.antialias, powerPreference: 'high-performance', alpha: true }}
        camera={{ position: [0, 0, CAM_Z], fov: FOV, near: 0.5, far: 60 }}
      >
        {/* Transparent canvas — the animated GradientBackground shows behind the models. */}

        <ambientLight intensity={0.28} />
        {/* The raking key/fill pair from the source project, which is what gives the
            models their warm-lit-from-the-left, cool-shadowed-right read. */}
        <directionalLight position={[-8, 6, 9]} intensity={2.4} color="#ffeede" />
        <directionalLight position={[7, 4, -6]} intensity={0.55} color="#7c8bff" />

        <Models />

        <Environment resolution={quality.envResolution} frames={1}>
          <Lightformer intensity={2.4} position={[0, 6, -10]} scale={[18, 10, 1]} color="#fff2e2" />
          <Lightformer
            intensity={1.8}
            position={[-10, 4, 7]}
            rotation-y={Math.PI / 3}
            scale={[10, 8, 1]}
            color="#ffd8c2"
          />
          <Lightformer
            intensity={1.4}
            position={[14, 5, 8]}
            rotation-y={-Math.PI / 3}
            scale={[12, 8, 1]}
            color="#c2ccff"
          />
          <Lightformer
            form="ring"
            intensity={2}
            position={[0, 14, 4]}
            rotation-x={Math.PI / 2}
            scale={14}
            color="#ffffff"
          />
        </Environment>

        <AdaptiveResolution min={quality.dpr[0]} max={quality.dpr[1]} />
      </Canvas>
    </div>
  );
}
