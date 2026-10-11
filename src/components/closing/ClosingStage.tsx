'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { theme } from '@/config/theme';
import type { Locale } from '@/config/translations';
import RsvpCard from '@/components/rsvp/RsvpCard';

/** Guests must reach RSVP even if the closing clip stalls on a slow network. */
const RSVP_FAILSAFE_MS = 8500;

export default function ClosingStage({ locale }: { locale: Locale }) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const onPage = useRef(false);
  const failSafeRef = useRef<number | null>(null);
  const [showRsvp, setShowRsvp] = useState(false);
  const [armed, setArmed] = useState(false);

  const videoSrc = `${theme.videos.closing}?v=${theme.videos.version}`;
  const posterSrc = `${theme.videos.closingPoster}?v=${theme.videos.version}`;

  const clearFailSafe = () => {
    if (failSafeRef.current != null) {
      window.clearTimeout(failSafeRef.current);
      failSafeRef.current = null;
    }
  };

  const openRsvp = () => {
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
      if (!video.getAttribute('src')) {
        video.src = videoSrc;
      }
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.preload = 'auto';
      video.playbackRate = 1.2;
    };

    const attemptPlay = (video: HTMLVideoElement, retriesLeft: number) => {
      if (!onPage.current) return;
      prepareVideo(video);
      const pending = video.play();
      void pending
        ?.then(() => {
          video.playbackRate = 1.2;
        })
        .catch(() => {
          if (!onPage.current) return;
          if (retriesLeft <= 0) {
            openRsvp();
            return;
          }
          const retry = () => attemptPlay(video, retriesLeft - 1);
          video.addEventListener('canplay', retry, { once: true });
          video.addEventListener('loadeddata', retry, { once: true });
          window.setTimeout(retry, 350);
        });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const video = videoRef.current;
        if (!entry || !video) return;

        if (entry.isIntersecting) {
          setArmed(true);
          prepareVideo(video);
        }

        // 0.9 was too strict on short mobile viewports (URL bar / safe area).
        if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
          if (onPage.current) return;
          onPage.current = true;
          setShowRsvp(false);
          prepareVideo(video);
          try {
            if (video.readyState >= 1) video.currentTime = 0;
          } catch {
            // ignore seek errors
          }
          armFailSafe();
          attemptPlay(video, 5);
          return;
        }

        if (entry.intersectionRatio < 0.3) {
          onPage.current = false;
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
      { root: document.querySelector('main'), rootMargin: '80% 0px 0px 0px', threshold: [0, 0.3, 0.45, 0.6, 0.9] }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
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
      <img
        src={posterSrc}
        alt=""
        aria-hidden
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
        }}
      />
      <video
        ref={videoRef}
        src={armed ? videoSrc : undefined}
        poster={posterSrc}
        playsInline
        muted
        preload={armed ? 'auto' : 'none'}
        controls={false}
        disablePictureInPicture
        onEnded={openRsvp}
        onError={openRsvp}
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
              background: 'linear-gradient(180deg, rgba(10,4,6,0.28), rgba(10,4,6,0.62))',
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
