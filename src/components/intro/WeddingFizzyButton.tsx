'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '@/config/translations';
import './WeddingFizzyButton.css';

const PARTICLE_COUNT = 42;
const FIZZ_MS = 1180;

type Props = {
  locale?: Locale;
  /** Runs immediately on tap (keep video/music inside the user-gesture window). */
  onTapGesture?: () => void;
  /** Runs after the fizzy burst (~1s) to advance the opening timeline. */
  onBegin?: () => void;
};

export default function WeddingFizzyButton({ locale = 'en', onTapGesture, onBegin }: Props) {
  const [active, setActive] = useState(false);
  const timerRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const usedTouchRef = useRef(false);
  const onTapGestureRef = useRef(onTapGesture);
  const onBeginRef = useRef(onBegin);
  const buttonCleanupRef = useRef<(() => void) | null>(null);
  const isRtl = locale === 'ur';

  useEffect(() => {
    onTapGestureRef.current = onTapGesture;
    onBeginRef.current = onBegin;
  });

  useEffect(() => {
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      buttonCleanupRef.current?.();
    };
  }, []);

  const runFromGesture = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    setActive(true);
    onTapGestureRef.current?.();
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const after = onBeginRef.current;
      if (after) after();
      else window.dispatchEvent(new CustomEvent('wedding:start'));
    }, FIZZ_MS);
  }, []);

  const attachBeginButton = useCallback(
    (node: HTMLButtonElement | null) => {
      buttonCleanupRef.current?.();
      buttonCleanupRef.current = null;
      if (!node) return;

      let startX = 0;
      let startY = 0;

      const onTouchStart = (e: TouchEvent) => {
        const touch = e.changedTouches[0];
        if (!touch) return;
        usedTouchRef.current = true;
        startX = touch.clientX;
        startY = touch.clientY;
      };

      const onTouchEnd = (e: TouchEvent) => {
        const touch = e.changedTouches[0];
        if (!touch) return;
        if (Math.hypot(touch.clientX - startX, touch.clientY - startY) > 18) return;
        // Prevent the synthetic click that would double-fire the fizz.
        e.preventDefault();
        runFromGesture();
      };

      node.addEventListener('touchstart', onTouchStart, { passive: true });
      node.addEventListener('touchend', onTouchEnd, { passive: false });
      buttonCleanupRef.current = () => {
        node.removeEventListener('touchstart', onTouchStart);
        node.removeEventListener('touchend', onTouchEnd);
      };
    },
    [runFromGesture],
  );

  const particles = Array.from({ length: PARTICLE_COUNT });

  return (
    <div className={`wedding-fizzy ${active ? 'is-active' : ''} ${isRtl ? 'is-rtl' : ''}`}>
      <button
        ref={attachBeginButton}
        type="button"
        className="wedding-fizzy__button"
        onClick={() => {
          // Desktop / mouse only — touch already handled (and prevented click).
          if (usedTouchRef.current) {
            usedTouchRef.current = false;
            return;
          }
          runFromGesture();
        }}
        aria-label={isRtl ? 'دعوت شروع کرنے کے لیے تھپتھپائیں' : 'Tap to begin wedding invitation'}
      >
        <span className="wedding-fizzy__shine" />

        <span className="wedding-fizzy__content">
          <span className="wedding-fizzy__spark">✦</span>
          <span className="wedding-fizzy__text">{isRtl ? 'شروع کریں' : 'TAP TO BEGIN'}</span>
          <span className="wedding-fizzy__arrow">→</span>
        </span>

        <span className="wedding-fizzy__success">
          <span>✦</span>
        </span>

        <span className="wedding-fizzy__particles" aria-hidden="true">
          {particles.map((_, index) => {
            const angle = (360 / particles.length) * index;
            const distance = 38 + ((index * 17) % 54);
            const size = 2 + ((index * 7) % 5);
            const delay = ((index * 13) % 25) / 100;

            return (
              <span
                key={index}
                className="wedding-fizzy__particle"
                style={
                  {
                    '--angle': `${angle}deg`,
                    '--distance': `${distance}px`,
                    '--size': `${size}px`,
                    '--delay': `${delay}s`,
                  } as React.CSSProperties
                }
              />
            );
          })}
        </span>
      </button>
    </div>
  );
}
