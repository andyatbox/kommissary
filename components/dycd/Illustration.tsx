'use client';

import Image, { type StaticImageData } from 'next/image';
import type { CSSProperties } from 'react';
import styles from './Illustration.module.css';
import { useCopy } from './i18n';
import layer1 from './assets/1-dycd.png';
import layer2 from './assets/2-dycd.png';
import layer3 from './assets/3-dycd.png';
import layer4 from './assets/4-dycd.png';
import layer5 from './assets/5-dycd.png';
import layer6 from './assets/6-dycd.png';
import layer7 from './assets/7-dycd.png';

// Every layer is the same 902x1080 frame.
export const ILLUSTRATION_RATIO = 902 / 1080;

type Float = {
  /** Center of the item within the frame; it tilts around this point. */
  origin: [string, string];
  /** Seconds for one sweep (up or down). */
  duration: number;
  /** Negative so each item starts mid-motion, out of step with the others. */
  delay: number;
  /** Bob distance, as a percentage of the illustration's height. */
  amp: string;
  /** Tilt either side of level. */
  rot: string;
  /** Moves the item from where it sits in its PNG, as [x, y] percentages of the frame. */
  move?: [string, string];
};

// Listed top to bottom: layer 1 is in front, layer 7 (the community leader at a table)
// is at the back and doesn't move. 1 yellow pepper, 2 lettuce, 3 bananas, 4 can,
// 5 red pepper, 6 meal tray. `origin` is where the item sits in its PNG.
const LAYERS: { src: StaticImageData; float?: Float }[] = [
  { src: layer1, float: { origin: ['34.9%', '18.5%'], duration: 3.1, delay: -0.4, amp: '0.8%', rot: '3deg' } },
  { src: layer2, float: { origin: ['23.4%', '11.3%'], duration: 3.7, delay: -1.9, amp: '0.8%', rot: '2.5deg' } },
  { src: layer3, float: { origin: ['23.3%', '29.7%'], duration: 2.9, delay: -1.1, amp: '0.9%', rot: '3.5deg' } },
  { src: layer4, float: { origin: ['42.4%', '30%'], duration: 3.4, delay: -2.6, amp: '0.7%', rot: '3deg' } },
  { src: layer5, float: { origin: ['45%', '42%'], duration: 3.9, delay: -0.9, amp: '0.6%', rot: '2.5deg' } },
  { src: layer6, float: { origin: ['31.4%', '43.1%'], duration: 4.2, delay: -3.1, amp: '0.5%', rot: '1.5deg' } },
  { src: layer7 },
];

const ALT = {
  en: 'A smiling community leader at a table with a Kommissary box of fresh groceries and prepared meals',
  es: 'Un líder comunitario sonriente junto a una mesa con una caja de Kommissary de comestibles frescos y comidas preparadas',
};

export default function Illustration({ className = '' }: { className?: string }) {
  const alt = useCopy(ALT);
  return (
    <div className={`relative aspect-[902/1080] ${className}`}>
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
                // The translate property applies after the hover animation's transform,
                // so the item still tilts around its own center, and stays moved when
                // the animation is off (reduced motion).
                ...(float.move && { translate: `${float.move[0]} ${float.move[1]}` }),
              }),
            } as CSSProperties
          }
          sizes="(min-width: 768px) 50vw, 60vw"
        />
      ))}
    </div>
  );
}
