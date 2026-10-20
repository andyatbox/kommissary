'use client';

import type { ReactNode } from 'react';
import { FOCUS_FORM_EVENT } from './content';

/** A "Get Started" link further down the page: scrolls up to the eligibility form. */
export default function GoToFormButton({
  className = '',
  track,
  children,
}: {
  className?: string;
  /** Name for click analytics (see ClickTracking). */
  track?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      data-track={track}
      className={`cursor-pointer ${className}`}
      onClick={() => window.dispatchEvent(new Event(FOCUS_FORM_EVENT))}
    >
      {children}
    </button>
  );
}
