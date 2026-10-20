'use client';

import Image, { type StaticImageData } from 'next/image';
import type { CSSProperties } from 'react';
import styles from './Illustration.module.css';
import { useCopy } from './i18n';
import layer1 from './assets/1-edu.png';
import layer2 from './assets/2-edu.png';
import layer3 from './assets/3-edu.png';
import layer4 from './assets/4-edu.png';
import layer5 from './assets/5-edu.png';
import layer6 from './assets/6-edu.png';
import layer7 from './assets/7-edu.png';

// Every layer is the same 902x1308 frame.
export const ILLUSTRATION_RATIO = 902 / 1308;

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

// Listed top to bottom: layer 1 is in front, layer 7 (the educator and children) is at
// the back and doesn't move. 1 lettuce, 2 red pepper, 3 bananas, 4 yellow pepper,
// 5 can, 6 meal tray. `origin` is where the item sits in its PNG; `move` shifts it from
// there (the lettuce beside her face; the pepper down a little; the bananas left by
// half their width).
const LAYERS: { src: StaticImageData; float?: Float }[] = [
  { src: layer1, float: { origin: ['43%', '7.5%'], move: ['-32%', '14.5%'], duration: 3.1, delay: -0.4, amp: '0.8%', rot: '3deg' } },
  { src: layer2, float: { origin: ['55.1%', '15.6%'], move: ['0%', '3%'], duration: 3.7, delay: -1.9, amp: '0.7%', rot: '3deg' } },
  { src: layer3, float: { origin: ['14.8%', '28.9%'], move: ['-10%', '2%'], duration: 2.9, delay: -1.1, amp: '0.9%', rot: '3.5deg' } },
  { src: layer4, float: { origin: ['41.4%', '31.9%'], duration: 3.4, delay: -2.6, amp: '0.7%', rot: '2.5deg' } },
  { src: layer5, float: { origin: ['50.2%', '27.3%'], duration: 3.9, delay: -0.9, amp: '0.8%', rot: '3deg' } },
  { src: layer6, float: { origin: ['24.6%', '35.7%'], duration: 4.2, delay: -3.1, amp: '0.5%', rot: '1.5deg' } },
  { src: layer7 },
];

const ALT = {
  en: 'A smiling educator holding a box of fresh groceries from Kommissary, with three children beside her',
  es: 'Una educadora sonriente sostiene una caja de comestibles frescos de Kommissary, junto a tres niños',
};

export default function Illustration({ className = '' }: { className?: string }) {
  const alt = useCopy(ALT);
  return (
    <div className={`relative aspect-[902/1308] ${className}`}>
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
