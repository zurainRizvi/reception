'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { theme } from '@/config/theme';
import { Ornament } from '@/components/shared/Ornament';
import type { Locale } from '@/config/translations';

export default function ClosingStage({ locale }: { locale: Locale }) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const onPage = useRef(false);
  const [showCopy, setShowCopy] = useState(false);

  const videoSrc = `${theme.videos.closing}?v=${theme.videos.version}`;
  const posterSrc = `${theme.videos.closingPoster}?v=${theme.videos.version}`;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const video = videoRef.current;
        if (!entry || !video) return;

        if (entry.intersectionRatio >= 0.9) {
          if (onPage.current) return;
          onPage.current = true;
          setShowCopy(false);
          video.muted = true;
          video.playsInline = true;
          if (video.readyState >= 1) video.currentTime = 0;
          video.play().catch(() => {
            if (onPage.current) setShowCopy(true);
          });
          return;
        }

        if (entry.intersectionRatio < 0.5) {
          onPage.current = false;
          video.pause();
          if (video.readyState >= 1) video.currentTime = 0;
          setShowCopy(false);
        }
      },
      { threshold: [0, 0.5, 0.9] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="closing-stage page-snap"
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        background: '#14060a',
      }}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        poster={posterSrc}
        playsInline
        muted
        preload="metadata"
        onEnded={() => setShowCopy(true)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      <AnimatePresence>
        {showCopy && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 3,
              display: 'grid',
              placeItems: 'center',
              padding: 24,
              background: 'linear-gradient(180deg, rgba(10,4,6,0.25), rgba(10,4,6,0.55))',
            }}
          >
            <div
              style={{
                maxWidth: 380,
                width: '100%',
                textAlign: 'center',
                padding: '36px 26px',
                borderRadius: 20,
                background: theme.colors.creamGlass,
                border: `1px solid ${theme.colors.goldLine}`,
                boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
                color: theme.colors.ink,
              }}
            >
              <p
                className="arabic"
                style={{
                  fontSize: 26,
                  lineHeight: 2,
                  color: theme.colors.ink,
                  margin: '0 0 10px',
                  fontFamily: "'Amiri', serif",
                }}
              >
                بَارَكَ اللَّهُ لَكُمَا وَبَارَكَ عَلَيْكُمَا وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ
              </p>
              <Ornament />
              <h2
                style={{
                  fontSize: 34,
                  lineHeight: 1.25,
                  margin: '12px 0 0',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 500,
                }}
              >
                {locale === 'ur' ? (
                  <>
                    <span>آپ کی آمد، </span>
                    <em style={{ color: theme.colors.gold, fontStyle: 'normal' }}>ہماری خوشی۔</em>
                  </>
                ) : (
                  <>
                    <span>Your presence, </span>
                    <em style={{ color: theme.colors.gold, fontStyle: 'italic' }}>our joy.</em>
                  </>
                )}
              </h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
