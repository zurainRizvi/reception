'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Music2, VolumeX } from 'lucide-react';
import { wedding } from '@/config/wedding';
import { theme } from '@/config/theme';
import { type Locale } from '@/config/translations';
import OpeningStage from '@/components/intro/OpeningStage';
import ScratchReveal from '@/components/reveal/ScratchReveal';
import { Blessing, Countdown, EventCard, EventSchedule } from '@/components/events/EventSections';
import RsvpCard from '@/components/rsvp/RsvpCard';
import ClosingStage from '@/components/closing/ClosingStage';

const MUSIC_SEGMENTS = [
  { start: 115, end: 136 }, // 1:55 – 2:16
  { start: 186, end: 215 }, // 3:06 – 3:35
] as const;

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
    const apply = () => {
      if (typing) return;
      root.style.setProperty('--app-h', `${window.innerHeight}px`);
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

    window.addEventListener('resize', apply);
    window.visualViewport?.addEventListener('resize', apply);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      window.removeEventListener('resize', apply);
      window.visualViewport?.removeEventListener('resize', apply);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

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
    <main dir={locale === 'ur' ? 'rtl' : 'ltr'} style={{ background: theme.colors.page, color: theme.colors.ink }}>
      <audio ref={audio} src={wedding.musicPath} onTimeUpdate={handleAudioTimeUpdate} preload="auto" />

      <OpeningStage
        locale={locale}
        onBegin={() => {
          startMusic();
          // Mount the rest after the opening overlays so mobile stays smooth for 0–6s.
          window.setTimeout(() => setContentReady(true), 6000);
        }}
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
          <RsvpCard locale={locale} />
          <ClosingStage locale={locale} />
        </div>
      )}
    </main>
  );
}
