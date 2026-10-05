'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Music2, VolumeX } from 'lucide-react';
import { wedding } from '@/config/wedding';
import { theme } from '@/config/theme';
import { type Locale } from '@/config/translations';
import OpeningStage from '@/components/intro/OpeningStage';
import ScratchReveal from '@/components/reveal/ScratchReveal';
import { Blessing, Countdown, EventCard, EventSchedule } from '@/components/events/EventSections';
import FarewellCard from '@/components/closing/FarewellCard';
import ClosingStage from '@/components/closing/ClosingStage';

/** Loop 0:27 – 1:45 of the invitation track. */
const MUSIC_SEGMENTS = [{ start: 27, end: 105 }] as const;

export default function Invitation() {
  const [locale, setLocale] = useState<Locale>('en');
  const [playing, setPlaying] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const primed = useRef(false);
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
    const onWheel = (e: WheelEvent) => {
      const main = document.querySelector('main');
      if (!main) return;
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

    window.addEventListener('resize', apply);
    window.visualViewport?.addEventListener('resize', apply);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    window.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('gesturestart', blockZoom, { passive: false });
    document.addEventListener('gesturechange', blockZoom, { passive: false });
    document.addEventListener('gestureend', blockZoom, { passive: false });
    document.addEventListener('touchend', blockDoubleTapZoom, { passive: false });
    return () => {
      window.removeEventListener('resize', apply);
      window.visualViewport?.removeEventListener('resize', apply);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('wheel', onWheel);
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
          (node.classList.contains('blessing') && main.getAttribute('data-locale') === 'ur')
        ) {
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
  }, [contentReady, locale]);

  // Warm event intro videos after opening so scroll-to-event rarely hits a cold buffer.
  // Keep the elements alive (don't tear down src) — that preserves the HTTP cache warm.
  useEffect(() => {
    if (!contentReady) return;
    const ids = ['waleema'] as const;
    const warmers: HTMLVideoElement[] = [];
    const timers = ids.map((id, index) =>
      window.setTimeout(() => {
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.src = `${theme.events[id].video}?v=${theme.videos.version}`;
        video.load();
        warmers.push(video);
      }, index * 900),
    );

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      warmers.forEach((video) => {
        video.removeAttribute('src');
        try {
          video.load();
        } catch {
          // ignore
        }
      });
    };
  }, [contentReady]);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;

    const prime = () => {
      if (primed.current) return;
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

    el.preload = 'auto';
    el.load();
    el.addEventListener('loadedmetadata', prime);
    el.addEventListener('canplay', prime);
    if (el.readyState >= 1) prime();

    return () => {
      el.removeEventListener('loadedmetadata', prime);
      el.removeEventListener('canplay', prime);
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

  const startMusic = () => {
    const el = audio.current;
    if (!el) return;
    const seg = MUSIC_SEGMENTS[segmentIndex.current] ?? MUSIC_SEGMENTS[0];
    if (!primed.current || el.currentTime < seg.start - 0.5 || el.currentTime >= seg.end) {
      seekToSegment(0);
    }
    el.play().then(() => setPlaying(true)).catch(() => {});
  };

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
      <audio ref={audio} src={wedding.musicPath} onTimeUpdate={handleAudioTimeUpdate} preload="auto" />

      <OpeningStage
        locale={locale}
        onBegin={startMusic}
        onHeroReady={() => setContentReady(true)}
      />

      {contentReady && (
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
              <EventCard e={e} i={i} locale={locale} />
              <EventSchedule eventId={e.id} locale={locale} />
            </React.Fragment>
          ))}
          <FarewellCard locale={locale} />
          <ClosingStage locale={locale} />
        </div>
      )}
    </main>
  );
}
