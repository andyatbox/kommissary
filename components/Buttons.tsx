'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three-stdlib';
import { useUX, view } from '@/lib/store';

const M = THREE.MathUtils;

/** Fade rate as a pill enters/leaves its zone. */
const REVEAL_RATE = 7;

/**
 * CSS3DRenderer maps 1 CSS pixel to 1 world unit, so the objects are scaled way
 * down to sit sensibly next to size-2 words.
 */
const BUTTON_SCALE = 0.011;

/**
 * DOM pill buttons rendered into the 3D scene via CSS3DRenderer, on a layer above
 * the WebGL canvas. Clicking one focuses it, which the camera rig zooms to.
 *
 * Must be mounted after <CameraRig /> so its useFrame runs afterwards and the CSS
 * layer is drawn with the camera's current pose (otherwise buttons lag a frame).
 */
export default function Buttons() {
  const dots = useUX((s) => s.dots);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const wasVisible = useRef(false);

  const { renderer, cssScene } = useMemo(
    () => ({ renderer: new CSS3DRenderer(), cssScene: new THREE.Scene() }),
    []
  );

  // Overlay the CSS layer on the canvas. It ignores pointer events so the WebGL
  // scene stays interactive; the pills themselves opt back in.
  useEffect(() => {
    const el = renderer.domElement;
    el.style.position = 'absolute';
    el.style.top = '0';
    el.style.left = '0';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '5';
    const parent = gl.domElement.parentElement;
    parent?.appendChild(el);
    return () => {
      parent?.removeChild(el);
    };
  }, [renderer, gl]);

  useEffect(() => {
    renderer.setSize(size.width, size.height);
  }, [renderer, size]);

  // Build one CSS3D pill per focus point. Content is set imperatively — these live
  // outside React's DOM tree, so there's no portal to reconcile.
  const objects = useMemo(() => {
    return dots.map((dot) => {
      // Container's transform belongs to CSS3DRenderer, so the reveal fade rides on
      // an inner wrapper — that also leaves the button's own hover transform free.
      const el = document.createElement('div');
      const wrap = document.createElement('div');
      wrap.className = 'k-pill-wrap';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'k-pill';
      btn.textContent = dot.label;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        useUX.getState().setFocus(dot);
      });

      wrap.appendChild(btn);
      el.appendChild(wrap);

      const obj = new CSS3DObject(el);
      obj.position.copy(dot.position);
      obj.scale.setScalar(BUTTON_SCALE);
      obj.visible = false;
      return { obj, wrap, dot, shown: { v: 0 } };
    });
  }, [dots]);

  useEffect(() => {
    objects.forEach((o) => cssScene.add(o.obj));
    return () => {
      objects.forEach((o) => {
        cssScene.remove(o.obj);
        o.obj.element.remove();
      });
    };
  }, [objects, cssScene]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const u = view.u;
    // Hide as soon as the end pull-out begins (not just once it's complete), so the
    // last pill clears before the completion display comes in.
    const pullingOut = view.overview > 0.02;

    for (const o of objects) {
      const inZone = !pullingOut && u >= o.dot.uStart && u <= o.dot.uEnd;
      o.shown.v = M.damp(o.shown.v, inZone ? 1 : 0, REVEAL_RATE, dt);
      const s = o.shown.v;

      o.obj.visible = s > 0.01;
      o.wrap.style.opacity = String(s);
      o.wrap.style.transform = `scale(${0.86 + 0.14 * s})`;
      // Don't let a faded-out pill swallow clicks.
      o.wrap.style.pointerEvents = s > 0.5 ? 'auto' : 'none';

      // Billboard the pills so they stay square to the viewer as the path snakes.
      o.obj.quaternion.copy(camera.quaternion);
    }

    // Skip the CSS pass while nothing is on screen — but run one more frame after
    // the last pill hides, so the renderer gets to clear it.
    const anyVisible = objects.some((o) => o.obj.visible);
    if (anyVisible || wasVisible.current) renderer.render(cssScene, camera);
    wasVisible.current = anyVisible;
  });

  return null;
}
