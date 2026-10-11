'use client';

import React, { useEffect, useRef, useState } from 'react';

type Props = {
  children: React.ReactNode;
  /** How far ahead of the viewport to mount (taller = earlier). */
  rootMargin?: string;
  /** Placeholder height before the real snap page mounts. */
  minHeight?: string | number;
};

/**
 * Mounts children only when the guest is approaching this slot.
 * Keeps a full-viewport snap placeholder so scroll rhythm stays stable.
 */
export default function LazySnap({
  children,
  rootMargin = '220% 0px',
  minHeight = 'var(--app-h, 100svh)',
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (active) return;
    const el = ref.current;
    if (!el) return;
    const root = document.querySelector('main');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { root, rootMargin, threshold: 0.01 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [active, rootMargin]);

  if (active) return <>{children}</>;

  return (
    <div
      ref={ref}
      className="page-snap lazy-snap-placeholder"
      aria-hidden
      style={{
        height: minHeight,
        minHeight,
        maxHeight: minHeight,
        width: '100%',
        flexShrink: 0,
        pointerEvents: 'none',
        background: 'transparent',
      }}
    />
  );
}
