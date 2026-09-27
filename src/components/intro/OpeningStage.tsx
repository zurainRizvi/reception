'use client';

import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { theme } from '@/config/theme';
import { Ornament } from '@/components/shared/Ornament';
import { Petals } from '@/components/shared/Petals';
import { Birds } from '@/components/intro/Birds';
import type { Locale } from '@/config/translations';
import { t } from '@/config/translations';

type Props = {
  locale: Locale;
  onBegin: () => void;
};

export default function OpeningStage({ locale, onBegin }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const beganRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [showHero, setShowHero] = useState(false);

  const videoSrc = `${theme.videos.opening}?v=${theme.videos.version}`;
  const posterSrc = `${theme.videos.openingPoster}?v=${theme.videos.version}`;

  const begin = (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (beganRef.current) return;
    beganRef.current = true;
    setPlaying(true);
    onBegin();

    const video = videoRef.current;
    if (!video) {
      setShowHero(true);
      return;
    }

    video.currentTime = 0;
    video.muted = true;
    video.play().catch(() => setShowHero(true));
  };

  const handleEnded = () => {
    setShowHero(true);
  };

  return (
    <section
      className="opening-stage page-snap"
      style={{
        position: 'relative',
        width: '100%',
        background: '#1a0508',
      }}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        poster={posterSrc}
        playsInline
        muted
        preload="auto"
        onEnded={handleEnded}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      />

      {/* Poster fallback while idle */}
      {!playing && (
        <img
          src={posterSrc}
          alt=""
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}

      <AnimatePresence>
        {!playing && (
          <motion.div
            key="tap"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.45 }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 'max(72px, calc(env(safe-area-inset-bottom, 0px) + 11vh))',
              zIndex: 5,
              display: 'flex',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <button
              type="button"
              className="tap-begin"
              onClick={begin}
              style={{
                pointerEvents: 'auto',
                width: 'min(78%, 280px)',
                padding: '14px 22px',
                borderRadius: '999px',
                border: '1.5px solid rgba(212, 175, 87, 0.85)',
                background: 'rgba(16, 10, 12, 0.72)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.28em',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                WebkitTapHighlightColor: 'transparent',
                boxShadow: '0 10px 28px rgba(0,0,0,0.45)',
                touchAction: 'manipulation',
                minHeight: 48,
              }}
            >
              TAP TO BEGIN
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHero && (
          <motion.div
            key="sky"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}
          >
            <Petals tone="red-white" amount={28} />
            <Birds />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHero && (
          <motion.div
            key="hero"
            initial={{ opacity: 0, y: '48%' }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 'max(88px, calc(env(safe-area-inset-bottom, 0px) + 14vh))',
              zIndex: 4,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              padding: '0 22px',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '420px',
                background: theme.colors.creamGlass,
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: `1px solid ${theme.colors.goldLine}`,
                borderRadius: '24px',
                padding: '28px 22px 24px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
                textAlign: 'center',
                color: theme.colors.ink,
              }}
            >
              <p
                className="eyebrow"
                style={{
                  color: theme.colors.gold,
                  marginBottom: 10,
                  letterSpacing: '0.28em',
                  fontSize: 11,
                }}
              >
                {t(locale, 'families')}
              </p>
              <h1
                style={{
                  margin: '4px 0 14px',
                  color: theme.colors.ink,
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 500,
                  fontSize: 'clamp(40px, 11vw, 52px)',
                  lineHeight: 1.05,
                }}
              >
                <em style={{ fontStyle: 'italic' }}>Abeeha</em>
                <b style={{ color: theme.colors.gold, fontWeight: 500, margin: '0 10px' }}>&</b>
                <em style={{ fontStyle: 'italic' }}>Zurain</em>
              </h1>
              <Ornament />
              <p
                style={{
                  margin: '10px 0 0',
                  color: theme.colors.inkSoft,
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 20,
                  letterSpacing: '0.04em',
                }}
              >
                {locale === 'ur' ? 'آپ کو ولیمہ کی دعوت دیتے ہیں' : 'Invite You to Their Waleema'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHero && (
          <motion.div
            key="scroll-hint"
            className="scroll-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 'max(18px, calc(env(safe-area-inset-bottom, 0px) + 10px))',
              zIndex: 5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              pointerEvents: 'none',
            }}
          >
            <span className="scroll-hint-label">
              {locale === 'ur' ? 'نیچے سوائپ کریں' : 'SWIPE DOWN'}
            </span>
            <span className="scroll-hint-chevron" />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
