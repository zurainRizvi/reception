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
  /** Fired once the curtain is actually painting — safe to mount light below-fold pages. */
  onCurtainPlaying?: () => void;
  /** Fired when the hero card is shown so content below can mount before SWIPE DOWN. */
  onHeroReady?: () => void;
};

type Phase = 'awaitingTap' | 'curtain' | 'hero';

/**
 * Overlay schedule (ms) — armed from the first painted curtain frame at t≈0,
 * not from the tap. Wall-clock-from-tap desynced after reload when decode lagged.
 */
const INVITE_IN_MS = 3000; // Mrs. Hameed on the 3rd second of curtain
const INVITE_OUT_MS = 7000; // holds through the 7th second (+1s)
const HERO_IN_MS = 8000; // Zurain & Abeeha on the 8th second of curtain
/** Must match WeddingFizzyButton FIZZ_MS — OpeningStage owns the phase advance. */
const SEAL_LIFT_MS = 1180;

export default function OpeningStage({ locale, onBegin, onCurtainPlaying, onHeroReady }: Props) {
  const curtainRef = useRef<HTMLVideoElement>(null);
  const beganRef = useRef(false);
  const heroReadyRef = useRef(false);
  const curtainPlayingNotified = useRef(false);
  const overlaysScheduledRef = useRef(false);
  const phaseRef = useRef<Phase>('awaitingTap');
  const timersRef = useRef<number[]>([]);
  const playRetryTimerRef = useRef<number | null>(null);
  const onBeginRef = useRef(onBegin);
  const onCurtainPlayingRef = useRef(onCurtainPlaying);
  const onHeroReadyRef = useRef(onHeroReady);
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

  useEffect(() => {
    onBeginRef.current = onBegin;
    onCurtainPlayingRef.current = onCurtainPlaying;
    onHeroReadyRef.current = onHeroReady;
  });

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const setOpeningScrollLocked = (locked: boolean) => {
    const main = document.querySelector('main');
    if (!main) return;
    main.classList.toggle('opening-locked', locked);
    if (locked) {
      main.scrollTop = 0;
    }
  };

  const notifyCurtainPlaying = useCallback(() => {
    if (curtainPlayingNotified.current) return;
    curtainPlayingNotified.current = true;
    onCurtainPlayingRef.current?.();
  }, []);

  const advanceToCurtain = useCallback(() => {
    if (phaseRef.current !== 'awaitingTap') {
      notifyCurtainPlaying();
      return;
    }
    phaseRef.current = 'curtain';
    setPhase('curtain');
    notifyCurtainPlaying();
  }, [notifyCurtainPlaying]);

  const revealHero = useCallback(() => {
    setShowInvite(false);
    setShowHeroCard(true);
    phaseRef.current = 'hero';
    setPhase('hero');
    // Names are up — allow scroll + show the cue.
    setScrollCueReady(true);
    setOpeningScrollLocked(false);
    if (!heroReadyRef.current) {
      heroReadyRef.current = true;
      onHeroReadyRef.current?.();
    }
  }, []);

  /** Arm Mrs. Hameed / names from first real open frame so reload can't desync overlays. */
  const scheduleOverlaysFromPaint = useCallback(() => {
    if (overlaysScheduledRef.current) return;
    overlaysScheduledRef.current = true;
    timersRef.current.push(
      window.setTimeout(() => setShowInvite(true), INVITE_IN_MS),
      window.setTimeout(() => setShowInvite(false), INVITE_OUT_MS),
      window.setTimeout(() => revealHero(), HERO_IN_MS),
    );
  }, [revealHero]);

  /** Only lift the poster once a real frame near t=0 is on screen — avoids the black flash. */
  const markVideoPainted = useCallback(() => {
    if (videoPaintedRef.current) return;
    const video = curtainRef.current;
    if (!video || video.readyState < 2) return;
    // Ignore a cached last-frame paint after reload — wait until we're near the start.
    if (video.ended) return;
    if (Number.isFinite(video.duration) && video.duration > 1 && video.currentTime > 0.85) return;

    videoPaintedRef.current = true;
    if (playRetryTimerRef.current != null) {
      window.clearTimeout(playRetryTimerRef.current);
      playRetryTimerRef.current = null;
    }
    notifyCurtainPlaying();
    scheduleOverlaysFromPaint();
    // Two rAFs so the browser commits the first decoded frame before we fade the poster.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setVideoPainted(true));
    });
  }, [notifyCurtainPlaying, scheduleOverlaysFromPaint]);

  useEffect(
    () => () => {
      clearTimers();
      if (playRetryTimerRef.current != null) window.clearTimeout(playRetryTimerRef.current);
      setOpeningScrollLocked(false);
    },
    [],
  );

  const prepareCurtain = (video: HTMLVideoElement) => {
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
  };

  const attachCurtain = useCallback((node: HTMLVideoElement | null) => {
    curtainRef.current = node;
    if (!node) return;
    // iOS ignores a muted video that only has the React prop; the DOM property
    // and playsinline attributes must exist before play().
    prepareCurtain(node);
  }, []);

  const playCurtainNow = () => {
    const video = curtainRef.current;
    if (!video) return;
    prepareCurtain(video);

    // Must run in the tap turn. Keep retrying until a frame paints — early taps
    // and post-reload cached media often reject the first play() or resume at ended.
    let tries = 0;
    const runPlay = () => {
      if (videoPaintedRef.current || !beganRef.current) return;
      prepareCurtain(video);
      const pending = video.play();
      void pending
        ?.then(() => {
          // If we somehow started mid/end clip, rewind then wait for a start frame.
          try {
            if (
              video.ended ||
              (Number.isFinite(video.duration) &&
                video.duration > 0 &&
                video.currentTime >= Math.min(0.85, Math.max(0.2, video.duration * 0.15)))
            ) {
              video.currentTime = 0;
              void video.play()?.catch(() => {});
              return;
            }
          } catch {
            // ignore seek errors
          }
          markVideoPainted();
          if (!videoPaintedRef.current && tries < 30) {
            tries += 1;
            if (playRetryTimerRef.current != null) window.clearTimeout(playRetryTimerRef.current);
            playRetryTimerRef.current = window.setTimeout(runPlay, 280);
          }
        })
        .catch(() => {
          tries += 1;
          if (tries > 30) return;
          const retry = () => attemptFromStart();
          video.addEventListener('canplay', retry, { once: true });
          video.addEventListener('loadeddata', retry, { once: true });
          if (playRetryTimerRef.current != null) window.clearTimeout(playRetryTimerRef.current);
          playRetryTimerRef.current = window.setTimeout(retry, 280);
        });
    };

    const attemptFromStart = () => {
      if (videoPaintedRef.current || !beganRef.current) return;
      prepareCurtain(video);
      // Always open from t=0 after reload — cached "ended" state was desyncing overlays.
      let needsSeek = false;
      try {
        if (video.readyState >= 1 && (video.ended || video.currentTime > 0.04)) {
          needsSeek = true;
          video.pause();
          video.currentTime = 0;
        }
      } catch {
        needsSeek = false;
      }
      if (needsSeek) {
        const afterSeek = () => {
          video.removeEventListener('seeked', afterSeek);
          runPlay();
        };
        video.addEventListener('seeked', afterSeek);
        window.setTimeout(afterSeek, 380);
        return;
      }
      runPlay();
    };

    attemptFromStart();
  };

  /**
   * Lift the seal when the curtain is painting (synced), with a short failsafe
   * so a stalled decode after reload can never leave guests stuck on TAP.
   */
  const advanceToCurtainWhenReady = useCallback(() => {
    if (phaseRef.current !== 'awaitingTap') {
      notifyCurtainPlaying();
      return;
    }
    if (videoPaintedRef.current) {
      advanceToCurtain();
      return;
    }
    const video = curtainRef.current;
    const finish = () => advanceToCurtain();
    if (video) {
      video.addEventListener('playing', finish, { once: true });
      video.addEventListener('timeupdate', finish, { once: true });
    }
    timersRef.current.push(window.setTimeout(finish, 900));
  }, [advanceToCurtain, notifyCurtainPlaying]);

  /** Runs on tap (same turn as user gesture) so iOS allows video + music. */
  const beginFromGesture = () => {
    if (beganRef.current) return;
    beganRef.current = true;

    // Guests stay on the opening page until Zurain & Abeeha appear.
    setOpeningScrollLocked(true);
    playCurtainNow();
    try {
      onBeginRef.current();
    } catch {
      // A failed music seek must not cancel the curtain.
    }
    setShowInvite(false);
    setShowHeroCard(false);
    setScrollCueReady(false);
    overlaysScheduledRef.current = false;
    clearTimers();

    // Seal failsafe only — invite/hero timers arm from markVideoPainted.
    timersRef.current.push(window.setTimeout(() => advanceToCurtain(), SEAL_LIFT_MS + 1200));
  };

  /** After the fizzy burst — lift seal as soon as the curtain is painting. */
  const beginAfterFizz = () => {
    advanceToCurtainWhenReady();
  };

  const handleCurtainEnded = () => {
    if (!beganRef.current) return;
    revealHero();
  };

  return (
    <section
      className="opening-stage page-snap"
      style={{
        position: 'relative',
        width: '100%',
        // Match curtain burgundy so any brief gap never reads as black.
        background: '#3a0a14',
        // Block page scroll until names appear; after hero, pan-y reaches <main>.
        touchAction: showHero ? 'pan-y' : 'none',
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
