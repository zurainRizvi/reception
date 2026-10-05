'use client';

import React from 'react';
import { theme } from '@/config/theme';

export function Ornament({ color = theme.colors.gold }: { color?: string }) {
  return (
    <div
      className="ornament"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '12px auto',
        gap: '12px',
        color,
        width: '100%',
        maxWidth: '180px',
      }}
    >
      <span className="ornament-line" style={{ flex: 1, borderTop: `1px solid ${color}`, opacity: 0.75 }} />
      <span className="ornament-diamond" style={{ fontSize: '14px', lineHeight: 1, color, border: 'none', width: 'auto' }}>
        ◇
      </span>
      <span className="ornament-line" style={{ flex: 1, borderTop: `1px solid ${color}`, opacity: 0.75 }} />
    </div>
  );
}

export function Card({
  className = '',
  id,
  style,
  children,
}: {
  className?: string;
  id?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  // Plain section — never animate the page shell. Decorative motion
  // (petals, climbers, bows, scratch hint) lives on child elements only.
  return (
    <section
      id={id}
      style={{ width: '100%', margin: 0, borderRadius: 0, transform: 'none', ...style }}
      className={`card page-snap ${className}`}
    >
      {children}
    </section>
  );
}
