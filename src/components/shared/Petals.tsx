'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function Petals({ tone = 'white', amount = 18 }: { tone?: string; amount?: number }) {
  const reduce = useReducedMotion();
  return (
    <div className={`petals ${tone}`} aria-hidden>
      {Array.from({ length: amount }, (_, i) => (
        <motion.i
          key={i}
          style={{ left: `${1 + ((i * 3.8) % 100)}%` }}
          animate={
            reduce
              ? undefined
              : { y: [-80, 980], x: [0, i % 2 ? 36 : -28], rotate: [0, 260], opacity: [0, 0.85, 0.65, 0] }
          }
          transition={{ duration: 6.5 + (i % 5), delay: i * 0.22, repeat: Infinity }}
        />
      ))}
    </div>
  );
}
