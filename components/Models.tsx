'use client';

import { type RefObject, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useUX, view, type TeamSlot, type WordAnchor } from '@/lib/store';

const M = THREE.MathUtils;

/** Self-hosted Draco decoder (the GLBs are Draco-compressed); avoids any external CDN. */
const DRACO_PATH = '/draco/';

/**
 * A model hung off a word. `offset` is in the word's own frame — X = reading
 * direction (screen-right), Y = up, Z = toward the viewer — so "behind" is -Z,
 * "above" is +Y, "right" is +X. `target` is the desired largest world dimension;
 * each GLB is auto-fit to it regardless of its authored scale.
 */
type ModelSpec = {
  /** 'gltf' (default) auto-fits a GLB; 'image' shows a JPG/PNG on a plane (`target` = width). */
  kind?: 'gltf' | 'image';
  /** Bundled asset path (GLBs, and image planes that ship with the site). Team photos omit
   *  this — they're sourced from Sanity via `contentKey`; a slot with no uploaded image is
   *  simply not rendered. Guaranteed present for every model that actually mounts. */
  url?: string;
  /** For team photos: the Sanity homepage image slot that supplies this plane's image. */
  contentKey?: TeamSlot;
  anchor: string;
  offset: [number, number, number];
  target: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  hoverAmp?: number;
  hoverFreq?: number;
};

type ZoneDef = { id: string; triggers: string[]; models: ModelSpec[] };

const ZONES: ZoneDef[] = [
  {
    id: 'kommissary',
    triggers: ['Kommissary'],
    models: [
      // Behind and above the word, toward the left.
      {
        url: '/models/fish-market.glb',
        anchor: 'Kommissary',
        offset: [-5.2, -2, -4],
        target: 6,
        rotationY: 1,
        hoverAmp: 0.28,
        hoverFreq: 0.85,
      },
      // Above and behind the word, toward the right. Van faces away by default,
      // so spin it ~180° plus a bit to show a three-quarter front view.
      {
        url: '/models/korilla.glb',
        anchor: 'Kommissary',
        offset: [4, 2.6, -3],
        target: 7.5,
        rotationX: 0.3,
        rotationY: 1.8,
        hoverAmp: 0.4,
        hoverFreq: 1.05,
      },
    ],
  },
  {
    id: 'progressive',
    triggers: ['progressive'],
    models: [
      // Centered behind the word — a raised-fist backdrop.
      {
        url: '/models/fist.glb',
        anchor: 'progressive',
        offset: [0, 0, 2],
        target: 4,
        rotationY: 0,
        hoverAmp: 0.25,
        hoverFreq: 0.8,
      },
      // Behind the word and off to the right, turned toward the camera.
      {
        url: '/models/free-food-truck.glb',
        anchor: 'progressive',
        offset: [5.6, 2, -4],
        target: 6.5,
        rotationY: -0.5,
        hoverAmp: 0.3,
        hoverFreq: 0.92,
      },
    ],
  },
  {
    // Team photos as textured planes scattered around the word — each sourced from a
    // Sanity homepage image slot (see `contentKey`). The bottom-centre plane is the
    // largest and closest to camera.
    id: 'minority-run',
    triggers: ['minority-run'],
    models: [
      { kind: 'image', contentKey: 'teamBottomCenter', anchor: 'minority-run', offset: [0.7, -2, 4], target: 5.0, rotationY: -0.5, hoverAmp: 0.32, hoverFreq: 0.9 },
      { kind: 'image', contentKey: 'teamTopLeft', anchor: 'minority-run', offset: [-5.6, 2, -1.5], target: 4, rotationY: -0.2, rotationZ: -0.13, hoverAmp: 0.34, hoverFreq: 1.05 },
      { kind: 'image', contentKey: 'teamTopRight', anchor: 'minority-run', offset: [5.3, 2, -3], target: 3.2, rotationY: -1.8, rotationZ: 0.1, hoverAmp: 0.3, hoverFreq: 0.88 },
      { kind: 'image', contentKey: 'teamBottomLeft', anchor: 'minority-run', offset: [-4.9, -2, 3.5], target: 3.2, rotationY: 0.1, rotationZ: 0.15, hoverAmp: 0.33, hoverFreq: 1.12 },
      { kind: 'image', contentKey: 'teamBottomRight', anchor: 'minority-run', offset: [5.0, -2.0, 1.9], target: 3.5, rotationY: -1.5, rotationZ: -0.12, hoverAmp: 0.34, hoverFreq: 1.15 },
    ],
  },
  {
    id: 'chef',
    triggers: ['chef-crafted'],
    models: [
      // Below and in front, toward the right.
      {
        url: '/models/lettuce-broccoli.glb',
        anchor: 'chef-crafted',
        offset: [-4, 1.4, -2],
        target: 6,
        rotationY: 0.9,
        hoverAmp: 0.32,
        hoverFreq: 0.9,
      },
      // Below and behind "chef-crafted"; tip it toward the camera to reveal the top.
      {
        url: '/models/cutting-board.glb',
        anchor: 'chef-crafted',
        offset: [2, -2.6, -2.6],
        target: 6.6,
        rotationX: 0.5,
        hoverAmp: 0.3,
        hoverFreq: 0.95,
      },
    ],
  },
  {
    id: 'meals',
    triggers: ['meals'],
    models: [
      // Behind and above the word.
      {
        url: '/models/chicken.glb',
        anchor: 'meals',
        offset: [-2.3, 2, -4],
        target: 4.6,
        rotationX: 0.9,
        rotationY: 0,
        hoverAmp: 0.32,
        hoverFreq: 1.0,
      },
      // Below, in front, toward the right of "kitchen".
      {
        url: '/models/ramen.glb',
        anchor: 'meals',
        offset: [3.4, -2.1, 3],
        target: 4.4,
        rotationX: 0.3,
        hoverAmp: 0.35,
        hoverFreq: 1.2,
      },
    ],
  },
  {
    id: 'provisions',
    triggers: ['provisions'],
    models: [
      // To the right, behind the word.
      {
        url: '/models/bananas-apple.glb',
        anchor: 'provisions',
        offset: [3, 1, -4],
        target: 5.7,
        rotationY: M.degToRad(95),
        hoverAmp: 0.38,
        hoverFreq: 1.1,
      },
      // Below, in front, toward the right of the word.
      {
        url: '/models/boxes.glb',
        anchor: 'provisions',
        offset: [8, -1, 4],
        target: 2.5,
        rotationY: 0,
        hoverAmp: 0.3,
        hoverFreq: 0.95,
      },
    ],
  },
  {
    id: 'distributor',
    triggers: ['logistics'],
    models: [
      // Below and in front, toward the right — the delivery truck.
      {
        url: '/models/kommy-truck.glb',
        anchor: 'logistics',
        offset: [7, 1.5, -2],
        target: 7,
        rotationY: -0.3,
        hoverAmp: 0.3,
        hoverFreq: 0.95,
      },
    ],
  },
  {
    id: 'communities',
    triggers: ['communities'],
    models: [
      // Behind the word and slightly above, centered on it — a backdrop of rowhouses.
      {
        url: '/models/brownstones.glb',
        anchor: 'communities',
        offset: [4, 1, -11],
        target: 15,
        rotationY: -0.5,
        hoverAmp: 0.25,
        hoverFreq: 0.8,
      },
      // In front of the word, toward the left — angled slightly right/toward camera.
      {
        url: '/models/komi-pitcher.glb',
        anchor: 'communities',
        offset: [-4, -1.7, 2],
        target: 4,
        rotationY: 0,
        hoverAmp: 0.25,
        hoverFreq: 0.8,
      },
      // In front of the word, toward the right — mirrored angle, facing back left.
      {
        url: '/models/komi-batter.glb',
        anchor: 'communities',
        offset: [4, -1, 2],
        target: 4,
        rotationY: -1.5,
        hoverAmp: 0.25,
        hoverFreq: 0.8,
      },
    ],
  },
  {
    id: 'york',
    triggers: ['York'],
    models: [
      // In front of the word and to the left, slightly below.
      {
        url: '/models/statue-of-liberty.glb',
        anchor: 'York',
        offset: [-4.6, -1.4, 3.6],
        target: 10,
        rotationY: 0.7,
        hoverAmp: 0.3,
        hoverFreq: 1.0,
      },
      // Behind the word, centered — a backdrop spanning the scene, same treatment
      // as the brownstones backdrop in 'communities'.
      {
        url: '/models/bridge.glb',
        anchor: 'York',
        offset: [5, 2, -12],
        target: 15,
        rotationY: 0.8,
        hoverAmp: 0.2,
        hoverFreq: 0.75,
      },
    ],
  },
];

/** Seconds between each model's staggered entrance. */
const STAGGER = 0.16;
/** Extra delay per zone when the overview reveals every zone at once, so they cascade. */
const ZONE_STAGGER = 0.14;
/** How far on either side of the trigger word(s), in curve-u, the zone plays its reveal. */
const MARGIN_U = 0.04;
/**
 * Extra buffer beyond the reveal window in which the zone is mounted but idle.
 * The models load, upload, and compile their shaders here — while invisible and
 * ahead of the reveal — so springing them in never stalls the frame.
 */
const PREPARE_U = 0.06;
/** Preload a zone's GLBs into cache once the camera is within this much u of its center. */
const LOOKAHEAD_U = 0.16;

type ZoneRange = { def: ZoneDef; uStart: number; uEnd: number; centerU: number };

export default function Models() {
  const anchors = useUX((s) => s.anchors);
  const team = useUX((s) => s.content?.team);

  // Team photos are Sanity-driven: give each team plane the uploaded image for its slot,
  // and drop any slot with no image so nothing points at a missing asset. Non-team models
  // pass through untouched. Stable across renders (content is hydrated once) so zones
  // never needlessly remount.
  const zones = useMemo<ZoneDef[]>(() => {
    return ZONES.map((z) => ({
      ...z,
      models: z.models.flatMap((m) => {
        if (!m.contentKey) return [m];
        const url = team?.[m.contentKey];
        return url ? [{ ...m, url }] : [];
      }),
    }));
  }, [team]);

  // Match a zone trigger / model anchor to a sentence word, tolerating trailing
  // punctuation on the token — so an anchor of 'meals' still resolves when the
  // sentence reads 'meals,' (as it does now). Exact tokens win; stripped keys fill
  // in only where they don't collide with one.
  const byWord = useMemo(() => {
    const stripTrailing = (s: string) => s.replace(/[.,;:!?…"'”’)\]}]+$/, '');
    const m = new Map<string, WordAnchor>();
    for (const a of anchors) if (!m.has(a.word)) m.set(a.word, a);
    for (const a of anchors) {
      const k = stripTrailing(a.word);
      if (!m.has(k)) m.set(k, a);
    }
    return m;
  }, [anchors]);

  const ranges = useMemo<ZoneRange[]>(() => {
    if (!anchors.length) return [];
    return zones.flatMap((def) => {
      const us = def.triggers
        .map((w) => byWord.get(w)?.u)
        .filter((u): u is number => u != null);
      if (!us.length) return [];
      const uStart = Math.min(...us) - MARGIN_U;
      const uEnd = Math.max(...us) + MARGIN_U;
      return [{ def, uStart, uEnd, centerU: (uStart + uEnd) / 2 }];
    });
  }, [anchors, byWord, zones]);

  // Zones currently in the tree (mounted early, revealed later) and which are revealing.
  const [mounted, setMounted] = useState<string[]>([]);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const mountedKey = useRef('');
  const activeKey = useRef('');
  const preloaded = useRef<Set<string>>(new Set());

  useFrame(() => {
    const u = view.u;
    const overview = useUX.getState().overviewActive;

    // Preload zones we're approaching — and everything as we near the end, since
    // the overview reveals every zone at once.
    const preloadAll = overview || view.p > 0.85;
    for (const r of ranges) {
      if (preloadAll || Math.abs(u - r.centerU) < LOOKAHEAD_U) {
        for (const m of r.def.models) {
          if (!m.url || preloaded.current.has(m.url)) continue;
          preloaded.current.add(m.url);
          if (m.kind === 'image') useTexture.preload(m.url);
          else useGLTF.preload(m.url, DRACO_PATH);
        }
      }
    }

    // Overview: mount and reveal every zone. Otherwise mount whatever is inside the
    // (wider) prepare window and reveal only the zone being read.
    let prepared: string[];
    let actives: string[];
    if (overview) {
      prepared = ranges.map((r) => r.def.id);
      actives = prepared;
    } else {
      prepared = ranges
        .filter((r) => u >= r.uStart - PREPARE_U && u <= r.uEnd + PREPARE_U)
        .map((r) => r.def.id);
      const hit = ranges.find((r) => u >= r.uStart && u <= r.uEnd);
      actives = hit ? [hit.def.id] : [];
    }

    const mKey = prepared.join(',');
    if (mKey !== mountedKey.current) {
      mountedKey.current = mKey;
      setMounted(prepared);
    }
    const aKey = actives.join(',');
    if (aKey !== activeKey.current) {
      activeKey.current = aKey;
      setActiveIds(actives);
    }
  });

  return (
    <>
      {mounted.map((id, i) => {
        const range = ranges.find((r) => r.def.id === id);
        if (!range) return null;
        // Cascade the zones when the overview brings them all in together.
        const zoneDelay = activeIds.length > 1 ? i * ZONE_STAGGER : 0;
        return (
          <Suspense key={id} fallback={null}>
            <ModelZone
              zone={range.def}
              anchors={byWord}
              active={activeIds.includes(id)}
              delayOffset={zoneDelay}
            />
          </Suspense>
        );
      })}
    </>
  );
}

function ModelZone({
  zone,
  anchors,
  active,
  delayOffset = 0,
}: {
  zone: ZoneDef;
  anchors: Map<string, WordAnchor>;
  active: boolean;
  delayOffset?: number;
}) {
  return (
    <>
      {zone.models.map((spec, i) => {
        const anchor = anchors.get(spec.anchor);
        if (!anchor) return null;
        const Comp = spec.kind === 'image' ? ImageModel : GltfModel;
        return (
          <Comp
            key={spec.url}
            spec={spec}
            anchor={anchor}
            active={active}
            delay={delayOffset + i * STAGGER}
          />
        );
      })}
    </>
  );
}

/** Cloned/created material with its original blend state (so it can be restored solid). */
type MatRec = { mat: THREE.Material; transparent: boolean; opacity: number; depthWrite: boolean };
type RevealData = {
  object: THREE.Object3D;
  mats: MatRec[];
  meshes: THREE.Mesh[];
  baseScale: number;
  worldPos: THREE.Vector3;
  phase: number;
};

/**
 * Shared behavior for any model (GLB or image plane): spring in on a stagger, fade
 * opacity, gate shadow-casting until visible, restore culling once shown, and hover +
 * oscillate. GltfModel and ImageModel just build the `RevealData` differently.
 */
function useReveal(
  group: RefObject<THREE.Group>,
  data: RevealData,
  spec: ModelSpec,
  active: boolean,
  delay: number
) {
  const shown = useRef(0);
  const vel = useRef(0);
  const elapsed = useRef(0);
  const culled = useRef(false);

  useFrame((state, rawDt) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(rawDt, 1 / 20);
    const t = state.clock.elapsedTime;

    if (active) elapsed.current += dt;
    else elapsed.current = 0;
    const started = active && elapsed.current >= delay;
    const targetShown = started ? 1 : 0;

    // Spring: underdamped on the way in (a little bounce/overshoot), overdamped out.
    const k = active ? 165 : 210;
    const c = active ? 12 : 30;
    const acc = (targetShown - shown.current) * k - vel.current * c;
    vel.current += acc * dt;
    shown.current += vel.current * dt;
    if (shown.current < 0) {
      shown.current = 0;
      vel.current = 0;
    }

    g.scale.setScalar(data.baseScale * shown.current);

    const op = M.clamp(shown.current, 0, 1);
    const fading = op < 0.999;
    for (const m of data.mats) {
      if (fading) {
        if (!m.mat.transparent) m.mat.transparent = true;
        m.mat.opacity = op * m.opacity;
        m.mat.depthWrite = op > 0.6;
      } else {
        if (m.mat.transparent !== m.transparent) m.mat.transparent = m.transparent;
        m.mat.opacity = m.opacity;
        m.mat.depthWrite = m.depthWrite;
      }
    }
    // Cast shadows only once visible — the shadow depth pass ignores opacity.
    const casting = op > 0.5;
    for (const mesh of data.meshes) mesh.castShadow = casting;

    // Culling starts off so shaders compile while hidden; turn it back on once shown.
    if (!culled.current && op > 0.99) {
      culled.current = true;
      for (const mesh of data.meshes) mesh.frustumCulled = true;
    }

    const amp = spec.hoverAmp ?? 0.35;
    const freq = spec.hoverFreq ?? 1.1;
    g.position.set(
      data.worldPos.x,
      data.worldPos.y + Math.sin(t * freq + data.phase) * amp,
      data.worldPos.z
    );
    g.rotation.set(
      (spec.rotationX ?? 0) + Math.sin(t * 0.7 + data.phase) * 0.045,
      (spec.rotationY ?? 0) + Math.sin(t * 0.6 + data.phase) * 0.12,
      (spec.rotationZ ?? 0) + Math.sin(t * 0.85 + data.phase) * 0.05
    );
  });
}

type ModelProps = { spec: ModelSpec; anchor: WordAnchor; active: boolean; delay: number };

function GltfModel({ spec, anchor, active, delay }: ModelProps) {
  const { scene } = useGLTF(spec.url!, DRACO_PATH);
  const group = useRef<THREE.Group>(null!);

  // Per-instance clone: geometry is shared (cheap), materials are cloned so opacity
  // can fade without touching the cached original; frustumCulled off so shaders compile
  // while invisible; original blend state kept so opaque double-sided GLBs render right.
  const data = useMemo<RevealData>(() => {
    const object = scene.clone(true);
    const mats: MatRec[] = [];
    const meshes: THREE.Mesh[] = [];
    object.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
        const cloned = (mesh.material as THREE.Material).clone();
        mesh.material = cloned;
        mats.push({ mat: cloned, transparent: cloned.transparent, opacity: cloned.opacity, depthWrite: cloned.depthWrite });
        meshes.push(mesh);
      }
    });

    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    object.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const baseScale = spec.target / maxDim;
    const worldPos = anchor.position
      .clone()
      .add(new THREE.Vector3(...spec.offset).applyQuaternion(anchor.quaternion));

    return { object, mats, meshes, baseScale, worldPos, phase: Math.random() * Math.PI * 2 };
  }, [scene, spec, anchor]);

  // Free the per-instance cloned materials when this zone unmounts. Geometry and
  // textures are shared with the GLTF cache (cloned by reference), so they're left
  // alone; only the clones we made here are ours to dispose. Without this, every
  // scroll past a zone leaks a material program on the GPU — the slow buildup that
  // eventually exhausts memory on weak devices.
  useEffect(
    () => () => {
      for (const rec of data.mats) rec.mat.dispose();
    },
    [data]
  );

  useReveal(group, data, spec, active, delay);
  return (
    <group ref={group}>
      <primitive object={data.object} />
    </group>
  );
}

function ImageModel({ spec, anchor, active, delay }: ModelProps) {
  const texture = useTexture(spec.url!) as THREE.Texture;
  const group = useRef<THREE.Group>(null!);

  // A photo on a double-sided plane sized to its aspect ratio (target = width). It
  // casts/receives shadows and hovers like the GLB models. baseScale is 1 — the plane
  // is already world-sized, so the reveal spring just scales it 0 → 1.
  const data = useMemo<RevealData>(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const img = texture.image as { width: number; height: number } | undefined;
    const aspect = img && img.height ? img.width / img.height : 1;
    const width = spec.target;
    const geo = new THREE.PlaneGeometry(width, width / aspect);
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    const worldPos = anchor.position
      .clone()
      .add(new THREE.Vector3(...spec.offset).applyQuaternion(anchor.quaternion));

    return {
      object: mesh,
      mats: [{ mat, transparent: mat.transparent, opacity: 1, depthWrite: mat.depthWrite }],
      meshes: [mesh],
      baseScale: 1,
      worldPos,
      phase: Math.random() * Math.PI * 2,
    };
  }, [texture, spec, anchor]);

  // The plane geometry and material are built per instance here (the texture comes from
  // the shared useTexture cache), so dispose those two on unmount to avoid leaking them.
  useEffect(
    () => () => {
      (data.object as THREE.Mesh).geometry.dispose();
      for (const rec of data.mats) rec.mat.dispose();
    },
    [data]
  );

  useReveal(group, data, spec, active, delay);
  return (
    <group ref={group}>
      <primitive object={data.object} />
    </group>
  );
}
