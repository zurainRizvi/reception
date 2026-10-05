'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { theme } from '@/config/theme';
import { Ornament } from '@/components/shared/Ornament';
import { Petals } from '@/components/shared/Petals';
import { Birds } from '@/components/intro/Birds';
import type { Locale } from '@/config/translations';
import { t } from '@/config/translations';
import { ScrollDownHint } from '@/components/shared/ScrollDownHint';
import WeddingFizzyButton from '@/components/intro/WeddingFizzyButton';

type Props = {
  locale: Locale;
  onBegin: () => void;
  /** Fired when the hero card is shown so content below can mount before SWIPE DOWN. */
  onHeroReady?: () => void;
};

type Phase = 'awaitingTap' | 'curtain' | 'hero';

/** Wall-clock overlay schedule (ms after tap) — independent of video buffering. */
const INVITE_IN_MS = 3000; // Mrs. Hameed on the 3rd second
const INVITE_OUT_MS = 7000; // holds through the 7th second (+1s)
const HERO_IN_MS = 8000; // Zurain & Abeeha on the 8th second

export default function OpeningStage({ locale, onBegin, onHeroReady }: Props) {
  const curtainRef = useRef<HTMLVideoElement>(null);
  const beganRef = useRef(false);
  const heroReadyRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const [phase, setPhase] = useState<Phase>('awaitingTap');
  const [showInvite, setShowInvite] = useState(false);
  const [showHeroCard, setShowHeroCard] = useState(false);
  const [videoPainted, setVideoPainted] = useState(false);
  const [scrollCueReady, setScrollCueReady] = useState(false);
  const videoPaintedRef = useRef(false);

  const curtainSrc = `${theme.videos.opening}?v=${theme.videos.version}`;
  const posterSrc = `${theme.videos.openingPoster}?v=${theme.videos.version}`;

  const showTap = phase === 'awaitingTap';
  const showHero = showHeroCard || phase === 'hero';

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  /** Only lift the poster once a real frame is on screen — avoids the black flash. */
  const markVideoPainted = useCallback(() => {
    if (videoPaintedRef.current) return;
    const video = curtainRef.current;
    if (!video || video.paused || video.readyState < 2) return;
    videoPaintedRef.current = true;
    // Two rAFs so the browser commits the first decoded frame before we fade the poster.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setVideoPainted(true));
    });
  }, []);

  const revealHero = () => {
    setShowInvite(false);
    setShowHeroCard(true);
    if (!heroReadyRef.current) {
      heroReadyRef.current = true;
      onHeroReady?.();
    }
  };

  useEffect(() => () => clearTimers(), []);

  const attachCurtain = useCallback((node: HTMLVideoElement | null) => {
    curtainRef.current = node;
    if (!node) return;
    // iOS ignores a muted video that only has the React prop; the DOM property
    // and playsinline attributes must exist before play().
    node.muted = true;
    node.defaultMuted = true;
    node.volume = 0;
    node.playsInline = true;
    node.setAttribute('muted', '');
    node.setAttribute('playsinline', '');
    node.setAttribute('webkit-playsinline', '');
  }, []);

  const playCurtainNow = () => {
    const video = curtainRef.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    // Must run in the tap turn. Awaiting metadata, seeking, or pausing first
    // drops iOS user activation, so play() is rejected and the curtain stays shut.
    const pending = video.play();
    void pending?.catch(() => {
      const retry = () => {
        video.muted = true;
        void video.play().catch(() => {});
      };
      video.addEventListener('canplay', retry, { once: true });
      video.addEventListener('loadeddata', retry, { once: true });
    });
  };

  /** Runs on tap (same turn as user gesture) so iOS allows video + music. */
  const beginFromGesture = () => {
    if (beganRef.current) return;
    beganRef.current = true;

    playCurtainNow();
    try {
      onBegin();
    } catch {
      // A failed music seek must not cancel the curtain.
    }
    setShowInvite(false);
    setShowHeroCard(false);
    clearTimers();

    timersRef.current.push(
      window.setTimeout(() => setShowInvite(true), INVITE_IN_MS),
      window.setTimeout(() => setShowInvite(false), INVITE_OUT_MS),
      window.setTimeout(() => {
        revealHero();
      }, HERO_IN_MS),
      window.setTimeout(() => setScrollCueReady(true), 5000),
    );
  };

  /** After the fizzy burst — clear the tap overlay once the curtain is painting. */
  const beginAfterFizz = () => {
    const finish = () => setPhase('curtain');
    if (videoPaintedRef.current) {
      finish();
      return;
    }
    const video = curtainRef.current;
    if (video) {
      video.addEventListener('playing', finish, { once: true });
      video.addEventListener('timeupdate', finish, { once: true });
    }
    // Fallback so a stalled decode never leaves the seal stuck on screen.
    timersRef.current.push(window.setTimeout(finish, 500));
  };

  const handleCurtainEnded = () => {
    revealHero();
    setPhase('hero');
  };

  return (
    <section
      className="opening-stage page-snap"
      style={{
        position: 'relative',
        width: '100%',
        // Match curtain burgundy so any brief gap never reads as black.
        background: '#3a0a14',
        // Let swipe / wheel reach the scrolling <main>; the video must not capture them.
        touchAction: 'pan-y',
      }}
    >
      <video
        ref={attachCurtain}
        src={curtainSrc}
        poster={posterSrc}
        playsInline
        muted
        preload="auto"
        controls={false}
        disablePictureInPicture
        onPlaying={markVideoPainted}
        onTimeUpdate={markVideoPainted}
        onEnded={handleCurtainEnded}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          pointerEvents: 'none',
          background: '#3a0a14',
        }}
      />

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
          opacity: videoPainted ? 0 : 1,
          transition: videoPainted ? 'opacity 420ms ease' : 'none',
          background: '#3a0a14',
        }}
      />

      <AnimatePresence>
        {showInvite && !showHero && (
          <motion.div
            key="invite"
            className="opening-invite-overlay"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="opening-invite-host">Mrs. Hameed Rizvi</p>
            <p className="opening-invite-body">
              Cordially invites you to the Wedding Ceremony of her beloved Son.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTap && (
          <motion.div
            key="tap"
            className="wedding-opening-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <WeddingFizzyButton
              locale={locale}
              onTapGesture={beginFromGesture}
              onBegin={beginAfterFizz}
            />
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
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            transition={{ duration: 1.25, ease: [0.22, 0.82, 0.28, 1] }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 'max(88px, calc(env(safe-area-inset-bottom, 0px) + 14vh))',
              zIndex: 5,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              padding: '0 22px',
              pointerEvents: 'none',
            }}
          >
            {/*
              Glass stays opacity 1 always — never fade opacity on backdrop-filter
              (that causes the clear→blur glitch). Slide uses transform only.
            */}
            <div
              style={{
                width: '100%',
                maxWidth: '420px',
                background: theme.colors.creamGlass,
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                isolation: 'isolate',
                opacity: 1,
                border: `1px solid ${theme.colors.goldLine}`,
                borderRadius: '24px',
                padding: '28px 22px 24px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
                textAlign: 'center',
                color: theme.colors.ink,
                transform: 'translateZ(0)',
              }}
            >
              <p
                className="eyebrow"
                style={{
                  color: theme.colors.gold,
                  marginBottom: 10,
                  letterSpacing: locale === 'ur' ? '0.04em' : '0.28em',
                  fontSize: locale === 'ur' ? 14 : 11,
                  lineHeight: locale === 'ur' ? 1.75 : undefined,
                  fontFamily: locale === 'ur' ? "'Amiri', serif" : undefined,
                  paddingTop: locale === 'ur' ? 4 : 0,
                }}
              >
                {t(locale, 'families')}
              </p>
              <h1
                dir="ltr"
                lang={locale === 'ur' ? 'ur' : 'en'}
                style={{
                  margin: '4px 0 14px',
                  color: theme.colors.ink,
                  fontFamily: locale === 'ur' ? "'Amiri', serif" : "'Cormorant Garamond', serif",
                  fontWeight: 500,
                  fontSize: locale === 'ur' ? 'clamp(34px, 9.5vw, 46px)' : 'clamp(40px, 11vw, 52px)',
                  lineHeight: locale === 'ur' ? 1.45 : 1.05,
                  paddingTop: locale === 'ur' ? 6 : 0,
                  overflow: 'visible',
                }}
              >
                <motion.em
                  style={{ fontStyle: locale === 'ur' ? 'normal' : 'italic', display: 'inline-block' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.55 }}
                >
                  {locale === 'ur' ? 'زورین' : 'Zurain'}
                </motion.em>
                <motion.b
                  style={{ color: theme.colors.gold, fontWeight: 500, margin: '0 10px', display: 'inline-block' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.4 }}
                >
                  &
                </motion.b>
                <motion.em
                  style={{ fontStyle: locale === 'ur' ? 'normal' : 'italic', display: 'inline-block' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.55 }}
                >
                  {locale === 'ur' ? 'أبيها' : 'Abeeha'}
                </motion.em>
              </h1>
              <Ornament />
              <p
                style={{
                  margin: '10px 0 0',
                  color: theme.colors.inkSoft,
                  fontFamily: locale === 'ur' ? "'Amiri', serif" : "'Cormorant Garamond', serif",
                  fontSize: locale === 'ur' ? 18 : 20,
                  letterSpacing: locale === 'ur' ? 0 : '0.04em',
                  lineHeight: locale === 'ur' ? 1.7 : undefined,
                  paddingTop: locale === 'ur' ? 2 : 0,
                }}
              >
                {locale === 'ur' ? 'شادی کر رہے ہیں' : 'Are Getting Married'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHero && scrollCueReady && (
          <motion.div
            key="scroll-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.55 }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 5,
              pointerEvents: 'none',
            }}
          >
            <ScrollDownHint
              locale={locale}
              color="rgba(255, 248, 232, 0.95)"
              glow="rgba(224, 192, 117, 0.85)"
              style={{ pointerEvents: 'auto' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
