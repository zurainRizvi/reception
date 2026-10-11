'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Music2, VolumeX } from 'lucide-react';
import { wedding } from '@/config/wedding';
import { theme } from '@/config/theme';
import { type Locale } from '@/config/translations';
import OpeningStage from '@/components/intro/OpeningStage';
import ScratchReveal from '@/components/reveal/ScratchReveal';
import { Blessing, Countdown, EventCard, EventSchedule } from '@/components/events/EventSections';
import FarewellCard from '@/components/closing/FarewellCard';
import ClosingStage from '@/components/closing/ClosingStage';
import LazySnap from '@/components/shared/LazySnap';

/** Loop 0:27 – 1:45 of the invitation track. */
const MUSIC_SEGMENTS = [{ start: 27, end: 105 }] as const;

export default function Invitation() {
  const [locale, setLocale] = useState<Locale>('en');
  const [playing, setPlaying] = useState(false);
  /** Light pages (no event/closing videos) — safe once the curtain is painting. */
  const [storyReady, setStoryReady] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const primed = useRef(false);
  const wantMusic = useRef(false);
  const segmentIndex = useRef(0);

  useEffect(() => {
    const root = document.documentElement;
    let typing = false;
    let lastWidth = window.innerWidth;
    const apply = () => {
      if (typing) return;
      const next = window.innerHeight;
      const width = window.innerWidth;
      const prev = Number.parseFloat(root.style.getPropertyValue('--app-h')) || 0;
      const widthChanged = Math.abs(width - lastWidth) > 30;
      lastWidth = width;
      // Toolbar and keyboard change innerHeight. Shrinking --app-h collapses the RSVP and closing pages.
      if (!widthChanged && prev && next < prev - 1) return;
      root.style.setProperty('--app-h', `${next}px`);
    };
    apply();

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) typing = true;
    };
    const onFocusOut = () => {
      window.setTimeout(() => {
        const active = document.activeElement;
        if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
        typing = false;
        apply();
      }, 450);
    };

    /** Block pinch / gesture zoom (iOS often ignores viewport user-scalable). */
    const blockZoom = (e: Event) => {
      e.preventDefault();
    };
    let lastTouchEnd = 0;
    const blockDoubleTapZoom = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 280) e.preventDefault();
      lastTouchEnd = now;
    };

    /** Laptop: beige side margins are outside <main>; forward wheel so guests can still scroll. */
    let wheelLockUntil = 0;
    let openingPinRaf = 0;
    const mainEl = document.querySelector('main');
    const pinOpeningScroll = () => {
      const main = document.querySelector('main');
      if (!main?.classList.contains('opening-locked')) return;
      if (main.scrollTop !== 0) main.scrollTop = 0;
    };
    const stopOpeningPinLoop = () => {
      if (openingPinRaf) {
        window.cancelAnimationFrame(openingPinRaf);
        openingPinRaf = 0;
      }
    };
    const startOpeningPinLoop = () => {
      stopOpeningPinLoop();
      const tick = () => {
        const main = document.querySelector('main');
        if (!main?.classList.contains('opening-locked')) {
          openingPinRaf = 0;
          return;
        }
        if (main.scrollTop !== 0) main.scrollTop = 0;
        openingPinRaf = window.requestAnimationFrame(tick);
      };
      openingPinRaf = window.requestAnimationFrame(tick);
    };
    const onWheel = (e: WheelEvent) => {
      const main = document.querySelector('main');
      if (!main) return;
      // Opening curtain pins scroll until Zurain & Abeeha appear (no overflow:hidden).
      if (main.classList.contains('opening-locked')) {
        e.preventDefault();
        pinOpeningScroll();
        startOpeningPinLoop();
        return;
      }
      const target = e.target;
      if (target instanceof Node && main.contains(target)) return;
      if (e.deltaY === 0) return;
      e.preventDefault();
      const now = Date.now();
      if (now < wheelLockUntil) return;
      wheelLockUntil = now + 420;
      // Page-sized steps so mandatory snap doesn't bounce tiny deltas back.
      const dir = e.deltaY > 0 ? 1 : -1;
      main.scrollBy({ top: dir * main.clientHeight, behavior: 'smooth' });
    };
    const onTouchMove = (e: TouchEvent) => {
      const main = document.querySelector('main');
      if (!main?.classList.contains('opening-locked')) return;
      // Block the swipe without toggling overflow (overflow:hidden mid-gesture freezes WebKit).
      e.preventDefault();
      pinOpeningScroll();
      startOpeningPinLoop();
    };
    const onScroll = () => {
      pinOpeningScroll();
      if (document.querySelector('main')?.classList.contains('opening-locked')) {
        startOpeningPinLoop();
      } else {
        stopOpeningPinLoop();
      }
    };
    const onOpeningLockClass = () => {
      if (document.querySelector('main')?.classList.contains('opening-locked')) {
        startOpeningPinLoop();
      } else {
        stopOpeningPinLoop();
      }
    };
    const lockWatcher =
      mainEl &&
      new MutationObserver(onOpeningLockClass);
    if (mainEl && lockWatcher) {
      lockWatcher.observe(mainEl, { attributes: true, attributeFilter: ['class'] });
    }

    window.addEventListener('resize', apply);
    window.visualViewport?.addEventListener('resize', apply);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    window.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    // Listen on main — scroll does not bubble to document reliably.
    mainEl?.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('gesturestart', blockZoom, { passive: false });
    document.addEventListener('gesturechange', blockZoom, { passive: false });
    document.addEventListener('gestureend', blockZoom, { passive: false });
    document.addEventListener('touchend', blockDoubleTapZoom, { passive: false });
    return () => {
      stopOpeningPinLoop();
      lockWatcher?.disconnect();
      window.removeEventListener('resize', apply);
      window.visualViewport?.removeEventListener('resize', apply);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('wheel', onWheel);
      document.removeEventListener('touchmove', onTouchMove);
      mainEl?.removeEventListener('scroll', onScroll);
      document.removeEventListener('gesturestart', blockZoom);
      document.removeEventListener('gesturechange', blockZoom);
      document.removeEventListener('gestureend', blockZoom);
      document.removeEventListener('touchend', blockDoubleTapZoom);
    };
  }, []);

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;

    // Cards that fit the screen must not be nested scrollports. Android cancels
    // the click when an overflow:auto page can scroll by even a pixel.
    const releaseTightScrollers = () => {
      main.querySelectorAll('.card.page-snap').forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (
          node.classList.contains('event-schedule') ||
          node.classList.contains('rsvp') ||
          node.classList.contains('farewell') ||
          // Growing these cards on EN↔UR reflow makes background-size:cover look like a zoom.
          node.classList.contains('reveal-date-card') ||
          node.classList.contains('count-card') ||
          (node.classList.contains('blessing') && main.getAttribute('data-locale') === 'ur')
        ) {
          if (node.classList.contains('reveal-date-card') || node.classList.contains('count-card')) {
            // Undo any prior auto-grow from an earlier locale pass.
            node.style.height = '';
            node.style.minHeight = '';
            node.style.maxHeight = '';
            node.style.overflowY = 'hidden';
          }
          return;
        }
        // Event intro pages must never become nested scrollports — that traps
        // swipe after media effects (e.g. Waleema picture zoom).
        if (node.classList.contains('event')) {
          node.style.overflowY = 'hidden';
          return;
        }
        // Urdu / dense pages: grow the snap card so <main> keeps the swipe,
        // instead of nesting a scrollport that eats touch and blocks scrolling.
        const overflows = node.scrollHeight > node.clientHeight + 4;
        if (overflows) {
          node.style.height = 'auto';
          node.style.minHeight = 'var(--app-h, 100svh)';
          node.style.maxHeight = 'none';
          node.style.overflowY = 'visible';
        } else {
          node.style.height = '';
          node.style.minHeight = '';
          node.style.maxHeight = '';
          node.style.overflowY = 'hidden';
        }
      });
    };
    releaseTightScrollers();
    const layoutTimers = [250, 900, 2500].map((ms) => window.setTimeout(releaseTightScrollers, ms));
    window.addEventListener('resize', releaseTightScrollers);
    void document.fonts?.ready.then(releaseTightScrollers);

    return () => {
      layoutTimers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener('resize', releaseTightScrollers);
    };
  }, [storyReady, locale]);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;

    const prime = () => {
      if (primed.current || wantMusic.current) return;
      try {
        const start = MUSIC_SEGMENTS[0].start;
        if (Math.abs(el.currentTime - start) > 0.35) {
          el.currentTime = start;
        }
        segmentIndex.current = 0;
        primed.current = true;
      } catch {
        // ignore seek until more data is available
      }
    };

    el.addEventListener('loadedmetadata', prime);
    el.addEventListener('canplay', prime);
    if (el.readyState >= 1) prime();

    // Warm metadata after first paint so cold first taps aren't racing preload=none.
    const warm = () => {
      if (wantMusic.current || !audio.current) return;
      audio.current.preload = 'metadata';
    };
    const warmTimer = window.setTimeout(warm, 900);
    const idleId =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(warm, { timeout: 2200 })
        : null;

    return () => {
      el.removeEventListener('loadedmetadata', prime);
      el.removeEventListener('canplay', prime);
      window.clearTimeout(warmTimer);
      if (idleId != null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
    };
  }, []);

  // Cold first load: if play() lost the gesture race, resume on the next user gesture.
  useEffect(() => {
    const resumeIfNeeded = () => {
      const el = audio.current;
      if (!wantMusic.current || !el || !el.paused) return;
      el.preload = 'auto';
      void el
        .play()
        .then(() => {
          setPlaying(true);
          try {
            const seg = MUSIC_SEGMENTS[0];
            if (el.readyState >= 1 && (el.currentTime < seg.start - 0.5 || el.currentTime >= seg.end)) {
              el.currentTime = seg.start;
              segmentIndex.current = 0;
              primed.current = true;
            }
          } catch {
            // ignore
          }
        })
        .catch(() => {});
    };
    window.addEventListener('pointerdown', resumeIfNeeded, { passive: true });
    window.addEventListener('touchstart', resumeIfNeeded, { passive: true });
    window.addEventListener('keydown', resumeIfNeeded);
    return () => {
      window.removeEventListener('pointerdown', resumeIfNeeded);
      window.removeEventListener('touchstart', resumeIfNeeded);
      window.removeEventListener('keydown', resumeIfNeeded);
    };
  }, []);

  const seekToSegment = (index: number) => {
    const el = audio.current;
    if (!el) return;
    const next = ((index % MUSIC_SEGMENTS.length) + MUSIC_SEGMENTS.length) % MUSIC_SEGMENTS.length;
    segmentIndex.current = next;
    el.currentTime = MUSIC_SEGMENTS[next].start;
    primed.current = true;
  };

  const startMusic = useCallback(() => {
    const el = audio.current;
    if (!el) return;
    wantMusic.current = true;
    el.preload = 'auto';

    const seekIntoSegmentIfReady = () => {
      try {
        if (el.readyState < 1) return;
        const seg = MUSIC_SEGMENTS[segmentIndex.current] ?? MUSIC_SEGMENTS[0];
        if (el.currentTime < seg.start - 0.5 || el.currentTime >= seg.end) {
          el.currentTime = seg.start;
          segmentIndex.current = 0;
          primed.current = true;
        }
      } catch {
        // Seeking before audio has data must never block the curtain timeline.
      }
    };

    const attemptPlay = () => {
      if (!wantMusic.current) return;
      // Play first inside the tap gesture — seeking a cold element cancels iOS play().
      void el
        .play()
        .then(() => {
          setPlaying(true);
          seekIntoSegmentIfReady();
        })
        .catch(() => {
          try {
            el.load();
          } catch {
            // ignore
          }
        });
    };

    attemptPlay();
    const onReady = () => {
      if (!wantMusic.current) return;
      if (!el.paused) {
        seekIntoSegmentIfReady();
        return;
      }
      attemptPlay();
    };
    el.addEventListener('canplay', onReady);
    el.addEventListener('canplaythrough', onReady);
    el.addEventListener('loadeddata', onReady);
    el.addEventListener('loadedmetadata', onReady);
    window.setTimeout(() => {
      el.removeEventListener('canplay', onReady);
      el.removeEventListener('canplaythrough', onReady);
      el.removeEventListener('loadeddata', onReady);
      el.removeEventListener('loadedmetadata', onReady);
      if (wantMusic.current && el.paused) attemptPlay();
    }, 12000);
  }, []);

  const markStoryReady = useCallback(() => setStoryReady(true), []);

  const handleAudioTimeUpdate = () => {
    const el = audio.current;
    if (!el) return;
    const seg = MUSIC_SEGMENTS[segmentIndex.current] ?? MUSIC_SEGMENTS[0];
    if (el.currentTime >= seg.end) {
      seekToSegment(segmentIndex.current + 1);
    } else if (el.currentTime < seg.start - 0.5) {
      el.currentTime = seg.start;
    }
  };

  const music = () => {
    if (!audio.current) return;
    if (audio.current.paused) {
      audio.current.preload = 'auto';
      const seg = MUSIC_SEGMENTS[segmentIndex.current] ?? MUSIC_SEGMENTS[0];
      if (audio.current.currentTime < seg.start || audio.current.currentTime >= seg.end) {
        seekToSegment(segmentIndex.current);
      }
      audio.current.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      audio.current.pause();
      setPlaying(false);
    }
  };

  return (
    <main
      dir="ltr"
      lang={locale === 'ur' ? 'ur' : 'en'}
      data-locale={locale}
      style={{ background: theme.colors.page, color: theme.colors.ink }}
    >
      <audio ref={audio} src={wedding.musicPath} onTimeUpdate={handleAudioTimeUpdate} preload="metadata" />

      <OpeningStage
        locale={locale}
        onBegin={startMusic}
        onCurtainPlaying={markStoryReady}
        onHeroReady={markStoryReady}
      />

      {storyReady && (
        <div style={{ position: 'relative', zIndex: 2, width: '100%', background: theme.colors.page }}>
          <div className="controls">
            <button type="button" onClick={music} aria-label={playing ? 'Mute music' : 'Play music'}>
              {playing ? <Music2 /> : <VolumeX />}
            </button>
            <button type="button" onClick={() => setLocale(locale === 'en' ? 'ur' : 'en')}>
              {locale === 'en' ? 'اردو' : 'EN'}
            </button>
          </div>

          <Blessing locale={locale} />
          <ScratchReveal locale={locale} />
          <Countdown locale={locale} />

          {wedding.events.map((e, i) => (
            <React.Fragment key={e.id}>
              {/* Event intros mount with story so videos can buffer before the guest arrives. */}
              <EventCard e={e} i={i} locale={locale} />
              <LazySnap>
                <EventSchedule eventId={e.id} locale={locale} />
              </LazySnap>
            </React.Fragment>
          ))}
          <LazySnap>
            <FarewellCard locale={locale} />
          </LazySnap>
          {/* Closing video must be mounted early too — LazySnap left it cold and unplayable. */}
          <ClosingStage locale={locale} />
        </div>
      )}
    </main>
  );
}
