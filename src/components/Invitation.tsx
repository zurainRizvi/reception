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

const MUSIC_START = 65;
const MUSIC_END = 85;

export default function Invitation() {
  const [locale, setLocale] = useState<Locale>('en');
  const [playing, setPlaying] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const primed = useRef(false);

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
        if (Math.abs(el.currentTime - MUSIC_START) > 0.35) {
          el.currentTime = MUSIC_START;
        }
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

  const startMusic = () => {
    const el = audio.current;
    if (!el) return;
    if (!primed.current || Math.abs(el.currentTime - MUSIC_START) > 1) {
      el.currentTime = MUSIC_START;
      primed.current = true;
    }
    el.play().then(() => setPlaying(true)).catch(() => {});
  };

  const handleAudioTimeUpdate = () => {
    if (!audio.current) return;
    if (audio.current.currentTime >= MUSIC_END || audio.current.currentTime < MUSIC_START) {
      audio.current.currentTime = MUSIC_START;
    }
  };

  const music = () => {
    if (!audio.current) return;
    if (audio.current.paused) {
      if (audio.current.currentTime < MUSIC_START || audio.current.currentTime >= MUSIC_END) {
        audio.current.currentTime = MUSIC_START;
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
          setContentReady(true);
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
