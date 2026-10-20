'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { type Lang, useLang, useSetLang } from './i18n';
import styles from './LangToggle.module.css';

const OPTIONS: { lang: Lang; short: string; label: string }[] = [
  { lang: 'en', short: 'EN', label: 'English' },
  { lang: 'es', short: 'ES', label: 'Español' },
];

// The English / Español switch, a tab in the top bar beside the certifications badge.
// Portaled to <body> so no transformed ancestor can break its position: fixed. Where it
// sits is in LangToggle.module.css.
export default function LangToggle() {
  const lang = useLang();
  const setLang = useSetLang();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div role="group" aria-label="Language / Idioma" data-section="language-toggle" className={styles.toggle}>
      {OPTIONS.map((o) => (
        <button
          key={o.lang}
          data-track={`language-${o.lang}`}
          type="button"
          lang={o.lang}
          aria-label={o.label}
          aria-pressed={lang === o.lang}
          className={`${styles.option} ${lang === o.lang ? styles.active : ''}`}
          onClick={() => setLang(o.lang)}
        >
          {o.short}
        </button>
      ))}
    </div>,
    document.body,
  );
}
