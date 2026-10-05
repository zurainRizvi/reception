'use client';

import React from 'react';
import type { Locale } from '@/config/translations';

type Props = {
  locale: Locale;
  /** Accent color for label + chevron. */
  color?: string;
  /** Soft glow behind the chevron. */
  glow?: string;
  /**
   * `footer` — pinned to the bottom of a one-viewport page (default).
   * `afterContent` — sits in normal flow under the page content (schedules).
   */
  placement?: 'footer' | 'afterContent';
  className?: string;
  style?: React.CSSProperties;
};

/** Scroll the invitation one snap-page down. */
export function scrollInvitationDown(from?: HTMLElement | null) {
  const main = document.querySelector('main');
  if (!main) return;

  const pages = Array.from(main.querySelectorAll<HTMLElement>('.page-snap'));
  const current = from?.closest('.page-snap') as HTMLElement | null;
  const idx = current ? pages.indexOf(current) : -1;
  const next = idx >= 0 ? pages[idx + 1] : null;

  if (next) {
    next.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  main.scrollBy({ top: main.clientHeight, behavior: 'smooth' });
}

/** Compact, themed, clickable scroll-down cue. */
export function ScrollDownHint({
  locale,
  color = 'rgba(255, 248, 232, 0.95)',
  glow = 'rgba(224, 192, 117, 0.85)',
  placement = 'footer',
  className = '',
  style,
}: Props) {
  const isRtl = locale === 'ur';
  const rootRef = React.useRef<HTMLButtonElement>(null);
  const isFlow = placement === 'afterContent';

  return (
    <button
      ref={rootRef}
      type="button"
      className={`scroll-hint scroll-hint-compact ${className}`.trim()}
      aria-label={isRtl ? 'نیچے سکرول کریں' : 'Scroll down'}
      onClick={() => scrollInvitationDown(rootRef.current)}
      style={
        {
          '--scroll-hint-color': color,
          '--scroll-hint-glow': glow,
          position: isFlow ? 'relative' : 'absolute',
          left: isFlow ? undefined : 0,
          right: isFlow ? undefined : 0,
          bottom: isFlow ? undefined : 'max(10px, calc(env(safe-area-inset-bottom, 0px) + 6px))',
          zIndex: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          width: isFlow ? '100%' : undefined,
          margin: isFlow ? '8px auto 0' : 0,
          padding: isFlow ? '6px 12px 10px' : '6px 12px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          pointerEvents: 'auto',
          touchAction: 'manipulation',
          ...style,
        } as React.CSSProperties
      }
    >
      <span className="scroll-hint-label">
        {isRtl ? 'نیچے سکرول کریں' : 'SCROLL DOWN'}
      </span>
      <span className="scroll-hint-chevron" aria-hidden />
    </button>
  );
}
