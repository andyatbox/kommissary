'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Environment, Lightformer, SoftShadows, Text3D } from '@react-three/drei';
import { useUX, view, type FocusDot, type WordAnchor } from '@/lib/store';
import { splineFrame } from '@/lib/path';
import type { Quality } from '@/lib/perf';
import Models from './Models';

const M = THREE.MathUtils;

/** Letter size (doubled from the original 1). */
const SIZE = 2;
const MARGIN = 5;

/**
 * New Spirit (Medium) — the winding-repaired typeface from the Andy Weitzel CD
 * project, whose counters (e, o, d, a…) render as proper holes rather than solid
 * blobs. Fallback: "/fonts/helvetiker_bold.typeface.json".
 */
const FONT = '/fonts/NewSpirit-Medium.typeface.json';

/** How far above the words each button floats. */
const BUTTON_UP = 2.6;
/** How far either side of its words, in curve-u, a button stays revealed. */
const BUTTON_MARGIN_U = 0.045;

/** Where along the path the tail spiral begins (~"communities of New York City"). */
const SPIRAL_START = 0.62;

function buildSnake(span: number) {
  // A meandering 3D spline: steady travel along +X, with waves in Y and — more
  // strongly — Z, so consecutive words sit at clearly different depths and the
  // stream snakes through space rather than lying on one plane. The tail curls
  // into a tightening spiral instead of straightening out.
  const count = Math.max(6, Math.round(span / 4));
  const pts: THREE.Vector3[] = [];
  for (let k = 0; k < count; k++) {
    const f = k / (count - 1);
    let x = f * span;
    let y = Math.sin(f * Math.PI * 4.8) * 4.6 + Math.sin(f * Math.PI * 9.5) * 1.5;
    let z = Math.cos(f * Math.PI * 6.0 + 0.6) * 14.0 + Math.sin(f * Math.PI * 12.0) * 4.5;

    if (f > SPIRAL_START) {
      // Blend the tail into a spiral that winds inward as it approaches the end.
      const t = M.smootherstep((f - SPIRAL_START) / (1 - SPIRAL_START), 0, 1);
      const theta = t * Math.PI * 3.6; // ~1.8 turns
      const radius = M.lerp(12, 2, t); // draws inward
      y = M.lerp(y, Math.sin(theta) * radius, t);
      z = M.lerp(z, Math.cos(theta) * radius, t);
      x -= t * t * span * 0.08; // ease x back so it curls in rather than stretching out
    }

    pts.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
  curve.getLength(); // prime the arc-length cache
  return curve;
}

/**
 * Letter-based layout: one snaking curve, with every letter placed and oriented to
 * the path individually so the type flows continuously. Word anchors (for models and
 * pill buttons) are derived from each word's letters.
 */
const LETTER_GAP = 0.06; // extra spacing between letters within a word
const SPACE_WIDTH = 0.85; // advance for a space (between and within words)

/** Reduce the gap for these specific adjacent-glyph pairs (tighten loose kerning). */
const KERN_PAIRS: Record<string, number> = {
  We: 0.22,
  'y.': 0.22,
  'f-': 0.2,
  'r,': 0.2,
  Yo: 0.22,
  ve: 0.2,
  ey: 0.2,
  yo: 0.2,
  mu: 0.2,
};

type Tok = { ch: string; word: number; space: boolean };

/** Strip trailing punctuation so a pill's anchor word matches the sentence token
 *  even if the token carries a comma/period (e.g. anchor "City" ↔ token "City."). */
const stripTrailing = (s: string) => s.replace(/[.,;:!?…"'”’)\]}]+$/, '');

function Letters({ curveSegments }: { curveSegments: number }) {
  const content = useUX((s) => s.content);
  const setPath = useUX((s) => s.setPath);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const groups = useRef<(THREE.Group | null)[]>([]);

  // Split the sentence into words, then into per-letter tokens (spaces just advance).
  const { words, tokens } = useMemo(() => {
    const sentence = (content?.sentence ?? '').trim();
    const words = sentence ? sentence.split(/\s+/) : [];
    const tokens: Tok[] = [];
    words.forEach((w, wi) => {
      if (wi > 0) tokens.push({ ch: ' ', word: -1, space: true });
      for (const ch of w) tokens.push({ ch, word: wi, space: ch === ' ' });
    });
    return { words, tokens };
  }, [content?.sentence]);

  useLayoutEffect(() => {
    if (!tokens.length) return;
    const ready = tokens.every((t, i) => t.space || meshes.current[i]);
    if (!ready) return;

    // Lay every letter end-to-end along one arc-length ruler; spaces just advance it.
    // Only the x (advance) is set per-letter; y is handled below so baselines align.
    let s = MARGIN;
    let minY = Infinity;
    let maxY = -Infinity;
    let prevCh = '';
    const placed: { i: number; center: number }[] = [];
    tokens.forEach((t, i) => {
      if (t.space) {
        s += SPACE_WIDTH;
        prevCh = '';
        return;
      }
      // Pull this letter left to tighten a specific pair with the one before it.
      s -= KERN_PAIRS[prevCh + t.ch] ?? 0;

      const mesh = meshes.current[i]!;
      const geo = mesh.geometry;
      geo.computeBoundingBox();
      const bb = geo.boundingBox!;
      const w = bb.max.x - bb.min.x;
      mesh.position.x = -(bb.min.x + bb.max.x) / 2;
      minY = Math.min(minY, bb.min.y);
      maxY = Math.max(maxY, bb.max.y);
      placed.push({ i, center: s + w / 2 });
      s += w + LETTER_GAP;
      prevCh = t.ch;
    });
    if (!placed.length) return;
    const span = s - LETTER_GAP + MARGIN;

    // Baseline alignment: every glyph already has its font baseline at y = 0, so shift
    // them all by the SAME amount (the sentence's overall vertical center). A K and an e
    // then sit on one baseline and punctuation drops correctly, instead of each glyph
    // being individually centered to the tallest letter.
    const centerY = (minY + maxY) / 2;
    placed.forEach(({ i }) => {
      meshes.current[i]!.position.y = -centerY;
    });

    const curve = buildSnake(span);
    const len = curve.getLength();

    const X = new THREE.Vector3();
    const Y = new THREE.Vector3();
    const Z = new THREE.Vector3();
    const point = new THREE.Vector3();
    const mat = new THREE.Matrix4();
    const quat = new THREE.Quaternion();

    // Collect per-word letter poses (+ group indices) so each word gets a single anchor.
    const perWord = new Map<
      number,
      { pts: THREE.Vector3[]; idx: number[]; u: number[]; q: THREE.Quaternion[] }
    >();

    placed.forEach(({ i, center }) => {
      const u = M.clamp(center / len, 0, 1);
      curve.getPointAt(u, point);
      splineFrame(curve, u, X, Y, Z);
      mat.makeBasis(X, Y, Z);
      quat.setFromRotationMatrix(mat);

      const g = groups.current[i]!;
      g.position.copy(point);
      g.quaternion.copy(quat);

      const wi = tokens[i].word;
      if (!perWord.has(wi)) perWord.set(wi, { pts: [], idx: [], u: [], q: [] });
      const rec = perWord.get(wi)!;
      rec.pts.push(point.clone());
      rec.idx.push(i);
      rec.u.push(u);
      rec.q.push(quat.clone());
    });

    // Word anchor, oriented off its middle letter, with two centers:
    //  - position: centroid of the letters' curve points (models hang off this).
    //  - center:   the word's true bounding-box center. The centroid is the width-weighted
    //    average of letter centers, which drifts sideways on words with uneven glyph widths
    //    (~0.7u to the right on "Kommissary"); the box center sits dead-center, so a pill
    //    placed on it reads as centered over the word.
    const anchors: WordAnchor[] = [];
    const wordBox = new THREE.Box3();
    perWord.forEach((rec, wi) => {
      if (wi < 0 || !rec.pts.length) return;
      const c = new THREE.Vector3();
      rec.pts.forEach((p) => c.add(p));
      c.multiplyScalar(1 / rec.pts.length);

      wordBox.makeEmpty();
      rec.idx.forEach((i) => {
        const g = groups.current[i];
        if (!g) return;
        g.updateMatrixWorld(true);
        wordBox.expandByObject(g);
      });
      const center = wordBox.isEmpty() ? c.clone() : wordBox.getCenter(new THREE.Vector3());

      const midIdx = Math.floor((rec.pts.length - 1) / 2);
      anchors.push({ word: words[wi], position: c, center, quaternion: rec.q[midIdx], u: rec.u[midIdx] });
    });

    // Match a pill's anchor word to an anchor — exact first, then punctuation-tolerant.
    const byWord = new Map(anchors.map((a) => [a.word, a]));
    const byWordNorm = new Map(anchors.map((a) => [stripTrailing(a.word), a]));
    const findAnchor = (w: string) => byWord.get(w) ?? byWordNorm.get(stripTrailing(w));

    const dots: FocusDot[] = (content?.pills ?? []).flatMap((pill, id) => {
      const group = (pill.words ?? [])
        .map((w) => findAnchor(w))
        .filter((a): a is WordAnchor => a != null);
      if (!group.length) return [];
      const center = new THREE.Vector3();
      group.forEach((a) => center.add(a.center));
      center.multiplyScalar(1 / group.length);
      const mid = group[Math.floor((group.length - 1) / 2)];
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(mid.quaternion);
      const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(mid.quaternion);
      const us = group.map((a) => a.u);
      const uStart = Math.min(...us) - BUTTON_MARGIN_U;
      const uEnd = Math.max(...us) + BUTTON_MARGIN_U;
      return [
        {
          id,
          label: pill.label,
          title: pill.title,
          body: pill.body,
          buttons: pill.buttons,
          position: center.addScaledVector(up, BUTTON_UP),
          normal,
          uStart,
          uEnd,
        },
      ];
    });

    const PAD = 0.02;
    const travelStart = Math.max(0, M.clamp(placed[0].center / len, 0, 1) - PAD);
    const travelEnd = Math.min(1, M.clamp(placed[placed.length - 1].center / len, 0, 1) + PAD);

    const bounds = new THREE.Box3();
    groups.current.forEach((g) => {
      if (g) {
        g.updateMatrixWorld(true);
        bounds.expandByObject(g);
      }
    });
    const boxCenter = bounds.getCenter(new THREE.Vector3());
    const boxSize = bounds.getSize(new THREE.Vector3());

    setPath(curve, dots, anchors, travelStart, travelEnd, boxCenter, boxSize);
  }, [tokens, content, setPath]);

  return (
    <>
      {tokens.map((t, i) =>
        t.space ? null : (
          <group
            key={i}
            ref={(el) => {
              if (el) groups.current[i] = el;
            }}
          >
            <Text3D
              ref={(el) => {
                if (el) meshes.current[i] = el as unknown as THREE.Mesh;
              }}
              font={FONT}
              size={SIZE}
              height={0.6}
              curveSegments={curveSegments}
              bevelEnabled={false}
              castShadow
              receiveShadow
            >
              {t.ch}
              <meshStandardMaterial
                color="#ffcf33"
                emissive="#4a3708"
                emissiveIntensity={0.3}
                roughness={0.32}
                metalness={0.05}
                envMapIntensity={1}
              />
            </Text3D>
          </group>
        )
      )}
    </>
  );
}

/** Direction the key light sits from what we're looking at — the original raking angle. */
const LIGHT_DIR = new THREE.Vector3(-69, 26, 18).normalize();
const LIGHT_DIST = 60;
/** Half-size of the shadow frustum while reading, and when pulled back to the overview. */
const SHADOW_EXTENT_NEAR = 25;
const SHADOW_EXTENT_FAR = 75;

/**
 * The shadow frustum follows the reading point rather than blanketing the whole
 * sentence. Covering ~50 units instead of ~180 puts roughly 13x more shadow-map
 * detail on what's actually on screen, which is what kills the crawling edges.
 * Its centre is snapped to whole shadow texels so the map doesn't shimmer as it
 * moves, and it widens for the pulled-back overview so distant words keep shadows.
 */
function KeyLight({ mapSize }: { mapSize: number }) {
  const light = useRef<THREE.DirectionalLight>(null!);
  const extent = useRef(0);

  const basis = useMemo(() => {
    const z = LIGHT_DIR.clone();
    const x = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), z).normalize();
    const y = new THREE.Vector3().crossVectors(z, x).normalize();
    return { x, y, z, snapped: new THREE.Vector3() };
  }, []);

  useFrame(() => {
    const l = light.current;
    if (!l) return;

    const want = M.lerp(SHADOW_EXTENT_NEAR, SHADOW_EXTENT_FAR, view.overview);
    if (Math.abs(want - extent.current) > 0.5) {
      extent.current = want;
      const cam = l.shadow.camera;
      cam.left = -want;
      cam.right = want;
      cam.top = want;
      cam.bottom = -want;
      cam.updateProjectionMatrix();
    }

    // Snap the frustum centre to whole texels, otherwise sub-texel drift makes the
    // shadow edges shimmer every frame as the light follows the camera.
    const texel = (extent.current * 2) / mapSize;
    const t = view.target;
    const px = Math.round(t.dot(basis.x) / texel) * texel;
    const py = Math.round(t.dot(basis.y) / texel) * texel;
    basis.snapped
      .copy(basis.x)
      .multiplyScalar(px)
      .addScaledVector(basis.y, py)
      .addScaledVector(basis.z, t.dot(basis.z));

    l.target.position.copy(basis.snapped);
    l.target.updateMatrixWorld();
    l.position.copy(basis.snapped).addScaledVector(LIGHT_DIR, LIGHT_DIST);
  });

  return (
    <directionalLight
      ref={light}
      castShadow
      intensity={2.6}
      color="#ffeede"
      shadow-mapSize-width={mapSize}
      shadow-mapSize-height={mapSize}
      shadow-bias={-0.0002}
      shadow-normalBias={0.03}
      shadow-camera-near={LIGHT_DIST - SHADOW_EXTENT_FAR - 15}
      shadow-camera-far={LIGHT_DIST + SHADOW_EXTENT_FAR + 25}
    />
  );
}

export default function Scene({ quality }: { quality: Quality }) {
  return (
    <>
      {/* No scene background — the canvas is transparent so the animated gradient
          background (GradientBackground) shows behind the models. Fog still fades
          distant models toward navy, which sits over the gradient's blue range. */}
      <fog attach="fog" args={['#000666', 22, 88]} />
      {/* PCSS costs a texture lookup per sample per fragment — skipped on weak GPUs,
          which fall back to three's cheaper default PCF shadows. */}
      {quality.softShadows && (
        <SoftShadows size={7} samples={quality.softSamples} focus={0.7} />
      )}

      <ambientLight intensity={0.24} />
      <KeyLight mapSize={quality.shadowMapSize} />
      <directionalLight position={[-12, 10, -8]} intensity={0.4} color="#7c8bff" />

      <Letters curveSegments={quality.curveSegments} />
      <Models />

      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.4} position={[0, 8, -12]} scale={[20, 10, 1]} color="#fff2e2" />
        <Lightformer
          intensity={1.8}
          position={[-12, 5, 8]}
          rotation-y={Math.PI / 3}
          scale={[10, 8, 1]}
          color="#ffd8c2"
        />
        <Lightformer
          intensity={1.4}
          position={[18, 6, 10]}
          rotation-y={-Math.PI / 3}
          scale={[12, 8, 1]}
          color="#c2ccff"
        />
        <Lightformer
          form="ring"
          intensity={2}
          position={[0, 18, 4]}
          rotation-x={Math.PI / 2}
          scale={16}
          color="#ffffff"
        />
      </Environment>
    </>
  );
}
