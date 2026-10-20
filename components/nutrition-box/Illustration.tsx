'use client';

import Image, { type StaticImageData } from 'next/image';
import type { CSSProperties } from 'react';
import styles from './Illustration.module.css';
import { useCopy } from './i18n';
import layer1 from './assets/1-illo.png';
import layer2 from './assets/2-illo.png';
import layer3 from './assets/3-illo.png';
import layer4 from './assets/4-illo.png';
import layer5 from './assets/5-illo.png';
import layer6 from './assets/6-illo.png';
import layer7 from './assets/7-illo.png';

type Float = {
  /** Center of the item within the 784x1080 frame; it tilts around this point. */
  origin: [string, string];
  /** Seconds for one sweep (up or down). */
  duration: number;
  /** Negative so each item starts mid-motion, out of step with the others. */
  delay: number;
  /** Bob distance, as a percentage of the illustration's height. */
  amp: string;
  /** Tilt either side of level. */
  rot: string;
};

// Listed top to bottom: layer 1 is in front, layer 7 (the doorway) is at the back and
// doesn't move.
const LAYERS: { src: StaticImageData; float?: Float }[] = [
  { src: layer1, float: { origin: ['25.9%', '26.8%'], duration: 3.1, delay: -0.4, amp: '0.9%', rot: '3deg' } },
  { src: layer2, float: { origin: ['45.2%', '23.9%'], duration: 3.7, delay: -1.9, amp: '0.8%', rot: '2.5deg' } },
  { src: layer3, float: { origin: ['9.8%', '25.8%'], duration: 2.9, delay: -1.1, amp: '1%', rot: '3.5deg' } },
  { src: layer4, float: { origin: ['32.3%', '43%'], duration: 4.2, delay: -2.6, amp: '0.6%', rot: '1.5deg' } },
  { src: layer5, float: { origin: ['38.2%', '32.9%'], duration: 3.4, delay: -0.9, amp: '0.9%', rot: '3deg' } },
  { src: layer6, float: { origin: ['23.7%', '38.2%'], duration: 3.9, delay: -3.1, amp: '0.8%', rot: '2.5deg' } },
  { src: layer7 },
];

const ALT = {
  en: 'A smiling woman at her front door holding a delivered box of fresh groceries',
  es: 'Una mujer sonriente en la puerta de su casa sostiene una caja de comestibles frescos que le entregaron',
};

export default function Illustration({ className = '' }: { className?: string }) {
  const alt = useCopy(ALT);
  return (
    <div className={`relative aspect-[784/1080] ${className}`}>
      {LAYERS.map(({ src, float }, i) => (
        <Image
          key={i}
          src={src}
          alt={float ? '' : alt}
          aria-hidden={float ? true : undefined}
          priority
          className={`${styles.layer} ${float ? styles.float : ''}`}
          style={
            {
              zIndex: LAYERS.length - i,
              ...(float && {
                '--ox': float.origin[0],
                '--oy': float.origin[1],
                '--dur': `${float.duration}s`,
                '--delay': `${float.delay}s`,
                '--amp': float.amp,
                '--rot': float.rot,
              }),
            } as CSSProperties
          }
          sizes="(min-width: 768px) 50vw, 60vw"
        />
      ))}
    </div>
  );
}
