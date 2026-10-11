'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { theme } from '@/config/theme';
import type { Locale } from '@/config/translations';
import RsvpCard from '@/components/rsvp/RsvpCard';

/** Keep the intentional ~1.2× close — do not slow this back to 1.0. */
const CLOSING_RATE = 1.2;
/**
 * Pop RSVP while curtains are mid-close (media seconds), not after the clip ends.
 * Closing clip is ~10s; curtains darken hard through ~0–5s — 2.8s is mid-motion.
 */
const RSVP_AT_MEDIA_S = 4.2;
/** Guests must reach RSVP even if the closing clip stalls on a slow network. */
const RSVP_FAILSAFE_MS = 5500;

export default function ClosingStage({ locale }: { locale: Locale }) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const onPage = useRef(false);
  const rsvpOpened = useRef(false);
  const failSafeRef = useRef<number | null>(null);
  const [showRsvp, setShowRsvp] = useState(false);

  const videoSrc = `${theme.videos.closing}?v=${theme.videos.version}`;
  const posterSrc = `${theme.videos.closingPoster}?v=${theme.videos.version}`;

  const clearFailSafe = () => {
    if (failSafeRef.current != null) {
      window.clearTimeout(failSafeRef.current);
      failSafeRef.current = null;
    }
  };

  const openRsvp = () => {
    if (rsvpOpened.current) return;
    rsvpOpened.current = true;
    clearFailSafe();
    setShowRsvp(true);
  };

  const armFailSafe = () => {
    clearFailSafe();
    failSafeRef.current = window.setTimeout(() => {
      if (onPage.current) openRsvp();
    }, RSVP_FAILSAFE_MS);
  };

  useEffect(() => () => clearFailSafe(), []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const prepareVideo = (video: HTMLVideoElement) => {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.preload = 'auto';
      video.playbackRate = CLOSING_RATE;
      video.defaultPlaybackRate = CLOSING_RATE;
    };

    const holdRate = (video: HTMLVideoElement) => {
      if (Math.abs(video.playbackRate - CLOSING_RATE) > 0.01) {
        video.playbackRate = CLOSING_RATE;
      }
    };

    const attemptPlay = (video: HTMLVideoElement, retriesLeft: number) => {
      if (!onPage.current) return;
      prepareVideo(video);
      const pending = video.play();
      void pending
        ?.then(() => {
          holdRate(video);
        })
        .catch(() => {
          if (!onPage.current) return;
          if (retriesLeft <= 0) {
            // Keep trying softly — do not abandon the clip after one cold buffer.
            window.setTimeout(() => {
              if (onPage.current && video.paused) attemptPlay(video, 4);
            }, 800);
            return;
          }
          const retry = () => attemptPlay(video, retriesLeft - 1);
          video.addEventListener('canplay', retry, { once: true });
          video.addEventListener('loadeddata', retry, { once: true });
          window.setTimeout(retry, 350);
        });
    };

    const startClosing = () => {
      const video = videoRef.current;
      if (!video || onPage.current) return;
      onPage.current = true;
      rsvpOpened.current = false;
      setShowRsvp(false);
      prepareVideo(video);
      try {
        if (video.readyState >= 1 && video.currentTime > 0.05) video.currentTime = 0;
      } catch {
        // ignore seek errors
      }
      armFailSafe();
      attemptPlay(video, 8);
    };

    const videoEl = videoRef.current;
    const onPlaying = () => {
      if (videoEl) holdRate(videoEl);
    };
    const onRateChange = () => {
      if (videoEl) holdRate(videoEl);
    };
    // Mid-curtain: open RSVP while the close keeps playing behind the form.
    const onTimeUpdate = () => {
      if (!videoEl || !onPage.current || rsvpOpened.current) return;
      if (videoEl.currentTime >= RSVP_AT_MEDIA_S) openRsvp();
    };
    videoEl?.addEventListener('playing', onPlaying);
    videoEl?.addEventListener('ratechange', onRateChange);
    videoEl?.addEventListener('timeupdate', onTimeUpdate);

    const warmObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const video = videoRef.current;
        if (!entry?.isIntersecting || !video || onPage.current) return;
        prepareVideo(video);
      },
      { root: null, rootMargin: '140% 0px', threshold: 0 }
    );
    warmObserver.observe(el);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const video = videoRef.current;
        if (!entry || !video) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
          startClosing();
          return;
        }

        if (!entry.isIntersecting || entry.intersectionRatio < 0.12) {
          if (!onPage.current) return;
          onPage.current = false;
          rsvpOpened.current = false;
          clearFailSafe();
          video.pause();
          try {
            if (video.readyState >= 1) video.currentTime = 0;
          } catch {
            // ignore
          }
          setShowRsvp(false);
        }
      },
      { root: null, rootMargin: '35% 0px', threshold: [0, 0.12, 0.2, 0.35, 0.5, 0.7] }
    );

    observer.observe(el);

    const boot = () => {
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight;
      if (rect.top < viewH * 0.9 && rect.bottom > viewH * 0.1) startClosing();
    };
    boot();
    window.requestAnimationFrame(boot);
    window.setTimeout(boot, 150);

    return () => {
      warmObserver.disconnect();
      observer.disconnect();
      videoEl?.removeEventListener('playing', onPlaying);
      videoEl?.removeEventListener('ratechange', onRateChange);
      videoEl?.removeEventListener('timeupdate', onTimeUpdate);
      clearFailSafe();
    };
  }, [videoSrc]);

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
        preload="auto"
        controls={false}
        disablePictureInPicture
        onError={() => {
          // Retry once on media error, then still offer RSVP.
          const video = videoRef.current;
          if (video && onPage.current) {
            window.setTimeout(() => {
              void video.play()?.catch(() => openRsvp());
            }, 400);
            return;
          }
          openRsvp();
        }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
        }}
      />

      <AnimatePresence>
        {showRsvp && (
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'max(14px, env(safe-area-inset-top, 0px)) 14px max(14px, env(safe-area-inset-bottom, 0px))',
              // Light enough that the curtains keep reading while they finish closing.
              background: 'linear-gradient(180deg, rgba(10,4,6,0.18), rgba(10,4,6,0.48))',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <RsvpCard locale={locale} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
