'use client';

import React, { useEffect, useState } from 'react';
import { CalendarDays, MapPin } from 'lucide-react';
import { wedding, type WeddingEvent } from '@/config/wedding';
import { theme } from '@/config/theme';
import { t, type Locale } from '@/config/translations';
import { Card, Ornament } from '@/components/shared/Ornament';
import { Petals } from '@/components/shared/Petals';
import { BotanicalClimber, EventCornerOrnament, ScheduleBow, TopCanopyArch } from '@/components/events/Botanicals';
import { schedulesData } from '@/components/events/schedulesData';

function calendar(e: WeddingEvent) {
  const d = e.date.replaceAll('-', '');
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${d}T183000`,
    `DTEND:${d}T220000`,
    `SUMMARY:${e.name} — Zurain & Abeeha`,
    `LOCATION:${e.venue}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${e.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function Blessing({ locale }: { locale: Locale }) {
  const isRtl = locale === 'ur';
  return (
    <Card
      className="ivory blessing"
      style={{
        background: theme.colors.card,
        color: theme.colors.ink,
        borderTop: `1px solid ${theme.colors.goldLine}`,
        padding: '56px 26px',
      }}
    >
      <Petals tone="red-white" amount={22} />
      <p className="eyebrow" style={{ color: theme.colors.gold, letterSpacing: isRtl ? '0.1em' : undefined }}>
        {isRtl ? 'اللہ کے نام سے' : 'IN THE NAME OF ALLAH'}
      </p>
      <p className="arabic" style={{ color: theme.colors.ink, margin: '12px 0', fontSize: 28, lineHeight: 1.9, fontFamily: "'Amiri', serif" }}>
        {wedding.invitation.arabic}
      </p>
      <Ornament />
      <h2 style={{ color: theme.colors.ink, margin: '14px 0 10px', fontFamily: isRtl ? "'Amiri', serif" : "'Cormorant Garamond', serif", lineHeight: isRtl ? 1.65 : undefined }}>
        {isRtl ? 'محبت سے آغاز' : 'With love, we begin.'}
      </h2>
      <p className="copy" style={{ color: theme.colors.inkSoft, maxWidth: 330, margin: '0 auto', fontSize: isRtl ? 16 : 17, lineHeight: isRtl ? 1.9 : 1.7, fontFamily: isRtl ? "'Amiri', serif" : undefined }}>
        {isRtl
          ? 'اللہ کے نام سے ہم آپ کو اپنی ولیمہ کی پُروقار محفل میں شریک ہونے کی دعوت دیتے ہیں۔'
          : 'In the name of Allah, we warmly invite you to celebrate with us at our Waleema reception.'}
      </p>
      <blockquote
        dir="rtl"
        lang="ar"
        style={{
          marginTop: 28,
          fontFamily: "'Amiri', serif",
          fontSize: isRtl ? 22 : 20,
          lineHeight: 2.05,
          color: theme.colors.ink,
          maxWidth: 340,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {wedding.invitation.verseArabic}
      </blockquote>
      <p
        dir={isRtl ? 'rtl' : 'ltr'}
        lang={isRtl ? 'ur' : 'en'}
        style={{
          margin: '12px auto 0',
          maxWidth: 340,
          color: theme.colors.inkSoft,
          fontSize: isRtl ? 16 : 15,
          lineHeight: isRtl ? 1.95 : 1.7,
          fontFamily: isRtl ? "'Amiri', serif" : "'Cormorant Garamond', serif",
          fontStyle: isRtl ? 'normal' : 'italic',
          textAlign: 'center',
          overflowWrap: 'break-word',
          wordBreak: 'normal',
        }}
      >
        {isRtl ? wedding.invitation.verseMeaningUr : wedding.invitation.verseMeaningEn}
      </p>
      <small
        dir={isRtl ? 'rtl' : 'ltr'}
        style={{
          display: 'block',
          marginTop: 12,
          color: theme.colors.muted,
          letterSpacing: isRtl ? '0.04em' : '0.12em',
          fontSize: isRtl ? 12 : 10,
          fontFamily: isRtl ? "'Amiri', serif" : undefined,
          lineHeight: isRtl ? 1.7 : undefined,
        }}
      >
        {isRtl ? wedding.invitation.verseReferenceUr : wedding.invitation.verseReferenceEn}
      </small>
    </Card>
  );
}

export function Countdown({ locale }: { locale: Locale }) {
  const [left, setLeft] = useState(0);
  const isRtl = locale === 'ur';
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, new Date(wedding.countdownTarget).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const labels = isRtl ? ['دن', 'گھنٹے', 'منٹ', 'سیکنڈ'] : ['DAYS', 'HOURS', 'MINUTES', 'SECONDS'];
  const v = [
    Math.floor(left / 86400000),
    Math.floor(left / 3600000) % 24,
    Math.floor(left / 60000) % 60,
    Math.floor(left / 1000) % 60,
  ];
  // Same gray as the illustration sky, so type sits in the open center.
  const backdrop = '#E4E5E0';
  const accent = theme.colors.blush;

  return (
    <Card
      className="count-card"
      style={{
        backgroundColor: backdrop,
        backgroundImage: 'url(/images/countdown-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        color: theme.colors.ink,
        borderTop: `1px solid ${theme.colors.blushLine}`,
        padding: '0',
        overflow: 'hidden',
      }}
    >
      <Petals tone="blush-mix" amount={20} />
      <div
        className="count-overlay"
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100%',
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: isRtl ? 'clamp(78px, 15vh, 124px) 22px 18px' : 'clamp(84px, 14.5vh, 128px) 26px 18px',
        }}
      >
        <p
          className="eyebrow"
          style={{
            color: accent,
            letterSpacing: isRtl ? '0.12em' : '0.28em',
            marginBottom: 8,
          }}
        >
          {isRtl ? 'تاریخ محفوظ رکھیں' : 'SAVE THE DATE'}
        </p>
        <h2
          style={{
            color: theme.colors.ink,
            margin: '6px 0 12px',
            fontFamily: isRtl ? "'Amiri', serif" : "'Cormorant Garamond', serif",
            fontSize: isRtl ? 'clamp(26px, 7vw, 34px)' : undefined,
            lineHeight: isRtl ? 1.65 : 1.15,
          }}
        >
          {isRtl ? (
            <>
              دن گن رہے ہیں۔
              <em style={{ color: accent, display: 'block', fontStyle: 'normal', fontSize: '0.62em', marginTop: 8 }}>
                ولیمہ کی شام تک
              </em>
            </>
          ) : (
            <>
              Counting the days.
              <em style={{ color: accent, display: 'block', fontStyle: 'italic', fontSize: '0.55em', marginTop: 6 }}>
                Until our Waleema reception
              </em>
            </>
          )}
        </h2>
        <Ornament color={accent} />
        <div
          className="count-grid count-grid-merged"
          style={{
            marginTop: 4,
            width: '100%',
            maxWidth: 340,
            background: 'transparent',
          }}
        >
          {v.map((n, i) => (
            <span key={i}>
              <strong style={{ color: accent, fontVariantNumeric: 'tabular-nums' }}>{String(n).padStart(2, '0')}</strong>
              <small style={{ color: theme.colors.muted, letterSpacing: isRtl ? '0.04em' : '0.16em' }}>{labels[i]}</small>
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function EventCard({ e, i, locale }: { e: WeddingEvent; i: number; locale: Locale }) {
  const isRtl = locale === 'ur';
  const n = { mehndi: ['Mehndi', 'مہندی'], baraat: ['Baraat', 'بارات'], waleema: ['Waleema', 'ولیمہ'] }[e.id];
  const s = {
    mehndi: ['an evening of colour', 'رنگوں بھری شام'],
    baraat: ['the royal celebration', 'شاہانہ تقریب'],
    waleema: ['a moonlit gathering', 'چاندنی محفل'],
  }[e.id];
  const date = new Date(e.date + 'T12:00:00');
  const dayName =
    locale === 'ur'
      ? ({ Tuesday: 'منگل', Wednesday: 'بدھ', Thursday: 'جمعرات', Friday: 'جمعہ' } as const)[e.day as 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday']
      : e.day;
  const timeLabel = isRtl ? 'شام ۷:۰۰ – ۱۰:۰۰' : e.time;
  const monthLabel = isRtl
    ? date.toLocaleString('ur-PK', { month: 'long' })
    : date.toLocaleString('en-GB', { month: 'long' }).toUpperCase();
  const ev = theme.events[e.id];

  return (
    <Card
      className={`event ${e.id}`}
      style={{
        background: ev.bg,
        borderTop: `1px solid ${ev.border}`,
        borderBottom: `1px solid ${ev.border}`,
        color: theme.colors.ink,
        position: 'relative',
        overflow: 'hidden',
        padding: isRtl ? '120px 24px 88px' : '136px 28px 84px',
      }}
    >
      <BotanicalClimber type={e.id} />
      <Petals amount={16} tone={e.id} />
      <EventCornerOrnament type={e.id} isRtl={isRtl} />
      <p
        className="eyebrow"
        style={{
          color: theme.colors.gold,
          position: 'relative',
          zIndex: 2,
          letterSpacing: isRtl ? '0.1em' : undefined,
        }}
      >
        0{i + 1} · {isRtl ? n[1] : n[0].toUpperCase()}
      </p>
      <h2
        style={{
          color: theme.colors.ink,
          position: 'relative',
          zIndex: 2,
          margin: '10px 0',
          fontFamily: isRtl ? "'Amiri', serif" : undefined,
          lineHeight: isRtl ? 1.55 : undefined,
        }}
      >
        {isRtl ? n[1] : n[0]}
        <em
          style={{
            color: ev.accent,
            display: 'block',
            fontSize: isRtl ? '0.62em' : '0.55em',
            marginTop: 10,
            fontStyle: isRtl ? 'normal' : 'italic',
            lineHeight: isRtl ? 1.7 : undefined,
          }}
        >
          {isRtl ? s[1] : s[0]}
        </em>
      </h2>
      <Ornament />
      <div className="date" style={{ position: 'relative', zIndex: 2, margin: '28px 0', justifyContent: 'center' }}>
        <strong style={{ color: theme.colors.ink, fontFamily: "'Cormorant Garamond', serif", fontSize: 88, lineHeight: 0.85 }}>
          {date.getDate()}
        </strong>
        <span style={{ textAlign: isRtl ? 'right' : 'left', color: theme.colors.inkSoft }}>
          {dayName}
          <small
            style={{
              display: 'block',
              marginTop: 6,
              letterSpacing: isRtl ? '0.06em' : '0.18em',
              color: theme.colors.gold,
              fontFamily: isRtl ? "'Amiri', serif" : undefined,
              fontSize: isRtl ? 13 : undefined,
            }}
          >
            {monthLabel} · {date.getFullYear()}
          </small>
        </span>
      </div>
      <p
        className="event-time"
        style={{
          color: theme.colors.gold,
          position: 'relative',
          zIndex: 2,
          fontFamily: isRtl ? "'Amiri', serif" : undefined,
          letterSpacing: isRtl ? '0.04em' : undefined,
          lineHeight: isRtl ? 1.7 : undefined,
        }}
      >
        {dayName} · {timeLabel}
      </p>
      <div className="venue" style={{ color: theme.colors.inkSoft, position: 'relative', zIndex: 2 }}>
        <MapPin size={16} color={theme.colors.gold} />
        <span>{e.venue}</span>
      </div>
      <div className="actions" style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
        <a href={e.mapUrl} target="_blank" rel="noreferrer" className="btn soft">
          {t(locale, 'maps')}
        </a>
        <button type="button" className="btn soft" onClick={() => calendar(e)}>
          <CalendarDays size={14} /> {t(locale, 'calendar')}
        </button>
      </div>
    </Card>
  );
}

export function EventSchedule({ eventId, locale }: { eventId: WeddingEvent['id']; locale: Locale }) {
  const data = schedulesData[eventId];
  const isRtl = locale === 'ur';
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const ev = theme.events[eventId];

  return (
    <Card
      className={`event-schedule ${eventId}${isRtl ? ' is-urdu' : ''}`}
      style={{
        background: ev.bg,
        borderTop: `1px solid ${ev.border}`,
        position: 'relative',
        overflow: 'hidden',
        textAlign: isRtl ? 'right' : 'left',
        padding: isRtl ? '108px 22px 180px' : '120px 28px 168px',
        color: theme.colors.ink,
      }}
    >
      <TopCanopyArch type={eventId} />
      <Petals amount={14} tone={eventId} />
      <ScheduleBow id={eventId} isRtl={isRtl} />

      <div style={{ width: '100%', textAlign: 'center', marginBottom: isRtl ? 24 : 28, position: 'relative', zIndex: 2 }}>
        <p
          className="eyebrow"
          style={{
            color: theme.colors.gold,
            letterSpacing: isRtl ? '0.12em' : '0.3em',
            fontFamily: isRtl ? "'Amiri', serif" : undefined,
          }}
        >
          {isRtl ? 'تقریب کا شیڈول' : 'EVENT TIMELINE'}
        </p>
        <h2
          style={{
            color: theme.colors.ink,
            margin: '8px 0 14px',
            fontFamily: isRtl ? "'Amiri', serif" : undefined,
            lineHeight: isRtl ? 1.6 : undefined,
          }}
        >
          {isRtl ? data.nameUr : data.nameEn}
          <em
            style={{
              color: theme.colors.gold,
              fontStyle: isRtl ? 'normal' : 'italic',
              display: 'block',
              fontSize: isRtl ? '0.72em' : '0.65em',
              marginTop: 6,
              lineHeight: isRtl ? 1.7 : undefined,
            }}
          >
            {isRtl ? 'تفصیلی شیڈول' : 'Schedule'}
          </em>
        </h2>
        <Ornament />
      </div>

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 380,
          margin: '0 auto',
          paddingLeft: isRtl ? 8 : 36,
          paddingRight: isRtl ? 36 : 8,
          paddingBottom: 56,
          zIndex: 2,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 12,
            bottom: 40,
            left: isRtl ? 'auto' : 10,
            right: isRtl ? 10 : 'auto',
            width: 2,
            background: `linear-gradient(180deg, ${theme.colors.gold} 0%, rgba(198,161,91,0.2) 100%)`,
          }}
        />
        {data.items.map((item, idx) => {
          const isSelected = selectedIdx === idx;
          return (
            <div
              key={idx}
              onClick={() => setSelectedIdx(selectedIdx === idx ? null : idx)}
              style={{
                position: 'relative',
                marginBottom: idx === data.items.length - 1 ? 40 : 18,
                cursor: 'pointer',
                padding: isRtl ? '12px 14px 14px' : '10px 14px',
                borderRadius: 14,
                background: isSelected ? 'rgba(198,161,91,0.12)' : 'transparent',
                border: isSelected ? `1px solid ${theme.colors.goldLine}` : '1px solid transparent',
                transition: 'background 0.25s ease, border-color 0.25s ease',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 14,
                  left: isRtl ? 'auto' : -33,
                  right: isRtl ? -33 : 'auto',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: isSelected ? theme.colors.gold : theme.colors.cardSolid,
                  border: `2px solid ${theme.colors.gold}`,
                }}
              />
              <span
                style={{
                  display: 'block',
                  fontSize: isRtl ? 13 : 11,
                  fontWeight: 600,
                  letterSpacing: isRtl ? '0.02em' : '0.14em',
                  color: theme.colors.gold,
                  marginBottom: 4,
                  fontFamily: isRtl ? "'Amiri', serif" : undefined,
                  lineHeight: isRtl ? 1.7 : undefined,
                }}
              >
                {isRtl ? item.timeUr : item.timeEn}
              </span>
              <h3
                style={{
                  margin: '0 0 6px',
                  fontSize: isRtl ? 20 : 24,
                  color: theme.colors.ink,
                  fontFamily: isRtl ? "'Amiri', serif" : "'Cormorant Garamond', serif",
                  lineHeight: isRtl ? 1.7 : 1.2,
                  overflowWrap: 'break-word',
                  wordBreak: 'normal',
                }}
              >
                {isRtl ? item.titleUr : item.titleEn}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: isRtl ? 14 : 13,
                  color: theme.colors.inkSoft,
                  lineHeight: isRtl ? 1.85 : 1.45,
                  fontFamily: isRtl ? "'Amiri', serif" : undefined,
                  overflowWrap: 'break-word',
                }}
              >
                {isRtl ? item.descUr : item.descEn}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
