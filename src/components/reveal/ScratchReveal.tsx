'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { theme } from '@/config/theme';
import { wedding } from '@/config/wedding';
import { Ornament, Card } from '@/components/shared/Ornament';
import { Petals } from '@/components/shared/Petals';
import { ScrollDownHint } from '@/components/shared/ScrollDownHint';
import { t, type Locale } from '@/config/translations';

const pink = {
  main: theme.colors.blush,
  soft: theme.colors.blushSoft,
  deep: theme.colors.blushDeep,
  line: theme.colors.blushLine,
};

// Matches the dove illustration backdrop so the crop has no visible edge.
const backdrop = '#E4E5E0';

const dayKey = {
  Tuesday: 'tuesday',
  Wednesday: 'wednesday',
  Thursday: 'thursday',
  Friday: 'friday',
} as const;

export default function ScratchReveal({ locale }: { locale: Locale }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const isDrawing = useRef(false);
  const hasTriggered = useRef(false);
  const revealedRef = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const isRtl = locale === 'ur';

  const celebrate = useCallback(async () => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;
    revealedRef.current = true;
    setShowHint(false);
    setIsRevealed(true);
    try {
      const confetti = (await import('canvas-confetti')).default;
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
      confetti({
        particleCount: isMobile ? 70 : 120,
        spread: 78,
        origin: { y: 0.62 },
        colors: [pink.main, pink.soft, '#FFFFFF', '#F7E4E7', '#E0C075', pink.deep],
      });
      setTimeout(() => {
        confetti({
          particleCount: isMobile ? 40 : 70,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: [pink.soft, '#FFF8EE', '#E2B6B6'],
        });
        confetti({
          particleCount: isMobile ? 40 : 70,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: [pink.main, '#FFFFFF', pink.deep],
        });
      }, 180);
    } catch {
      // ignore
    }
  }, []);

  const paintFoil = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || revealedRef.current) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    if (width < 2 || height < 2) return;
    canvas.width = width;
    canvas.height = height;

    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#FFF5F6');
    grad.addColorStop(0.32, pink.soft);
    grad.addColorStop(0.68, pink.main);
    grad.addColorStop(1, pink.deep);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255,255,255,0.34)';
    for (let i = 0; i < 34; i++) {
      const x = (i * 47) % width;
      const y = (i * 73) % height;
      ctx.beginPath();
      ctx.arc(x, y, 1.2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = theme.colors.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = isRtl ? 'bold 13px Amiri, serif' : '600 11px "DM Sans", sans-serif';
    ctx.fillText(isRtl ? 'پردہ ہٹا کر تاریخ جانیے' : 'SCRATCH TO REVEAL', width / 2, height / 2 - 4);
    ctx.font = isRtl ? '12px Amiri, serif' : '500 10px "DM Sans", sans-serif';
    ctx.fillStyle = 'rgba(61,52,41,0.72)';
    ctx.fillText(isRtl ? 'یا فوری طور پر ظاہر کریں' : 'or tap Instant Reveal below', width / 2, height / 2 + 16);
  }, [isRtl]);

  useEffect(() => {
    paintFoil();
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;
    let lastW = canvas.offsetWidth;
    let lastH = canvas.offsetHeight;
    const observer = new ResizeObserver(() => {
      const nextW = canvas.offsetWidth;
      const nextH = canvas.offsetHeight;
      if (Math.abs(nextW - lastW) < 2 && Math.abs(nextH - lastH) < 2) return;
      lastW = nextW;
      lastH = nextH;
      paintFoil();
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [paintFoil]);

  const scratchAt = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || revealedRef.current) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(40, Math.min(canvas.width, canvas.height) * 0.18);
    const prev = lastPoint.current;
    ctx.beginPath();
    if (prev) {
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.arc(x, y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    lastPoint.current = { x, y };

    try {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0;
      const sampled = data.length / 16;
      for (let i = 3; i < data.length; i += 16) {
        if (data[i] < 128) clear++;
      }
      if (sampled > 0 && (clear / sampled) * 100 > 26) celebrate();
    } catch {
      // ignore
    }
  }, [celebrate]);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface || isRevealed) return;

    let pausedHere = false;
    const pauseScroll = (paused: boolean) => {
      const main = document.querySelector('main');
      if (!main) return;
      if (paused) {
        pausedHere = !main.classList.contains('snap-paused');
        main.classList.add('snap-paused');
        return;
      }
      if (pausedHere) main.classList.remove('snap-paused');
      pausedHere = false;
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.cancelable) event.preventDefault();
      isDrawing.current = true;
      lastPoint.current = null;
      setShowHint(false);
      pauseScroll(true);
      const touch = event.changedTouches[0];
      if (touch) scratchAt(touch.clientX, touch.clientY);
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!isDrawing.current) return;
      if (event.cancelable) event.preventDefault();
      const touch = event.changedTouches[0];
      if (touch) scratchAt(touch.clientX, touch.clientY);
    };
    const onTouchEnd = () => {
      isDrawing.current = false;
      lastPoint.current = null;
      pauseScroll(false);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      event.preventDefault();
      isDrawing.current = true;
      lastPoint.current = null;
      setShowHint(false);
      scratchAt(event.clientX, event.clientY);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !isDrawing.current) return;
      scratchAt(event.clientX, event.clientY);
    };
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      isDrawing.current = false;
      lastPoint.current = null;
    };

    surface.addEventListener('touchstart', onTouchStart, { passive: false });
    surface.addEventListener('touchmove', onTouchMove, { passive: false });
    surface.addEventListener('touchend', onTouchEnd);
    surface.addEventListener('touchcancel', onTouchEnd);
    surface.addEventListener('pointerdown', onPointerDown);
    surface.addEventListener('pointermove', onPointerMove);
    surface.addEventListener('pointerup', onPointerUp);
    surface.addEventListener('pointercancel', onPointerUp);

    return () => {
      pauseScroll(false);
      surface.removeEventListener('touchstart', onTouchStart);
      surface.removeEventListener('touchmove', onTouchMove);
      surface.removeEventListener('touchend', onTouchEnd);
      surface.removeEventListener('touchcancel', onTouchEnd);
      surface.removeEventListener('pointerdown', onPointerDown);
      surface.removeEventListener('pointermove', onPointerMove);
      surface.removeEventListener('pointerup', onPointerUp);
      surface.removeEventListener('pointercancel', onPointerUp);
    };
  }, [isRevealed, scratchAt]);

  const event = wedding.events[0];
  const eventDate = new Date(`${event.date}T12:00:00`);
  const dayLabel = t(locale, dayKey[event.day as keyof typeof dayKey]);
  const dayNum = eventDate.getDate();

  return (
    <Card
      className="reveal-date-card"
      style={{
        backgroundColor: backdrop,
        backgroundImage: 'url(/images/scratch-reveal-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        borderTop: `1px solid ${pink.line}`,
        borderBottom: `1px solid ${pink.line}`,
        color: theme.colors.ink,
        textAlign: 'center',
        padding: 0,
        position: 'relative',
        overflow: 'hidden',
        justifyContent: 'flex-start',
      }}
    >
      <Petals tone="blush-mix" amount={20} />

      <svg width="0" height="0" aria-hidden style={{ position: 'absolute' }}>
        <defs>
          {/* Soft arched invitation tablet — room for a three-event index */}
          <clipPath id="scratch-card-clip" clipPathUnits="objectBoundingBox">
            <path d="M0.08,0.26 C0.08,0.08 0.26,0.015 0.5,0.015 C0.74,0.015 0.92,0.08 0.92,0.26 L0.92,0.9 Q0.92,0.975 0.8,0.975 L0.2,0.975 Q0.08,0.975 0.08,0.9 Z" />
          </clipPath>
        </defs>
      </svg>

      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        lang={isRtl ? 'ur' : 'en'}
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
          padding: isRtl
            ? 'clamp(56px, 9vh, 88px) 18px max(40px, calc(env(safe-area-inset-bottom, 0px) + 32px))'
            : 'clamp(68px, 11vh, 104px) 24px max(18px, calc(env(safe-area-inset-bottom, 0px) + 12px))',
          transform: 'none',
        }}
      >
        <p
          className="eyebrow"
          style={{
            color: pink.main,
            letterSpacing: isRtl ? '0.1em' : '0.28em',
            marginBottom: 8,
          }}
        >
          {isRtl ? 'محبت و مسرت کا خاص دن' : 'SAVE THE AUSPICIOUS DATE'}
        </p>
        <h2
          style={{
            color: theme.colors.ink,
            margin: '4px 0 8px',
            fontFamily: isRtl ? "'Amiri', serif" : "'Cormorant Garamond', serif",
            lineHeight: isRtl ? 1.65 : 1.12,
            fontSize: isRtl ? 'clamp(22px, 6vw, 28px)' : 'clamp(24px, 6.5vw, 30px)',
            textAlign: 'center',
          }}
        >
          {isRtl ? (
            <>
              تاریخ کی نقاب کشائی
              <em style={{ color: pink.main, display: 'block', fontStyle: 'normal', fontSize: '0.78em', marginTop: 6 }}>
                ولیمہ کا دن
              </em>
            </>
          ) : (
            <>
              Scratch to Reveal
              <em style={{ color: pink.main, display: 'block', fontStyle: 'italic', fontSize: '0.76em', marginTop: 4 }}>
                Our Waleema Date
              </em>
            </>
          )}
        </h2>
        <Ornament color={pink.main} />

        <div
          aria-hidden
          style={{
            width: 'min(132px, 34vw)',
            aspectRatio: '340 / 200',
            margin: '0 auto 2px',
            flexShrink: 0,
            backgroundColor: 'transparent',
            backgroundImage: 'url(/images/floral-frame.png)',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '282.35% auto',
            backgroundPosition: '50% 95.92%',
          }}
        />

        <div style={{ flex: '1 1 auto', minHeight: 8, maxHeight: 36, width: '100%' }} aria-hidden />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flexShrink: 0,
            marginBottom: 'clamp(10px, 2.4vh, 22px)',
            width: '100%',
          }}
        >
          {/* Arched foil tablet. Touches land on this box, not the clipped canvas. */}
          <div
            ref={surfaceRef}
            className="scratch-surface"
            style={{
              position: 'relative',
              width: 'min(196px, 56vw)',
              height: 'min(168px, 34vh)',
              margin: '0 auto 10px',
              flexShrink: 0,
              zIndex: 3,
              touchAction: 'none',
            }}
          >
            <div
              className="scratch-card-visual"
              style={{
                position: 'absolute',
                inset: 0,
                clipPath: 'url(#scratch-card-clip)',
                WebkitClipPath: 'url(#scratch-card-clip)',
                overflow: 'hidden',
                pointerEvents: 'none',
                userSelect: 'none',
                background: 'linear-gradient(165deg, #FFFEFE 0%, #FFF8F9 48%, #F7EBEE 100%)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: isRtl ? '28px 16px 20px' : '30px 16px 18px',
                  pointerEvents: 'none',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: isRtl ? 13 : 11,
                    letterSpacing: isRtl ? '0.04em' : '0.18em',
                    color: theme.events.waleema.accent,
                    fontWeight: 700,
                    fontFamily: isRtl ? "'Amiri', serif" : undefined,
                    textTransform: isRtl ? 'none' : 'uppercase',
                  }}
                >
                  {isRtl ? 'ولیمہ' : 'Waleema'}
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 40,
                    lineHeight: 1,
                    fontWeight: 600,
                    color: theme.colors.ink,
                  }}
                >
                  {dayNum}
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: isRtl ? 13 : 11,
                    letterSpacing: isRtl ? '0.04em' : '0.16em',
                    color: theme.colors.inkSoft,
                    fontWeight: 600,
                    fontFamily: isRtl ? "'Amiri', serif" : undefined,
                  }}
                >
                  {isRtl ? `${dayLabel} · جنوری ۲۰۲۷` : `${dayLabel} · JAN 2027`}
                </p>
                <p
                  style={{
                    margin: '6px 0 0',
                    color: theme.colors.muted,
                    fontSize: isRtl ? 12 : 10,
                    letterSpacing: isRtl ? '0.04em' : '0.18em',
                    fontFamily: isRtl ? "'Amiri', serif" : undefined,
                    fontWeight: 600,
                  }}
                >
                  {isRtl ? 'لاہور' : 'LAHORE'}
                </p>
              </div>

              {!isRevealed && (
                <canvas
                  ref={canvasRef}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 2,
                    pointerEvents: 'none',
                  }}
                />
              )}

              {showHint && !isRevealed && (
                <>
                  <div className="foil-shimmer" />
                  <div className={`scratch-hint${isRtl ? ' is-rtl' : ''}`} aria-hidden>
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                      <path d="M16.4 16.4 L48.6 48.6" stroke="#8A6A2E" strokeWidth="3.4" strokeLinecap="round" />
                      <path d="M16.4 16.4 L48.6 48.6" stroke="#E0C075" strokeWidth="1.55" strokeLinecap="round" />
                      <path d="M45.2 45.2 L50.4 50.4" stroke="#5C4A28" strokeWidth="3.6" strokeLinecap="round" />
                      <path
                        d="M14 6.2 L15.35 11.1 L20.4 11.1 L16.35 14.15 L17.7 19.1 L14 16.05 L10.3 19.1 L11.65 14.15 L7.6 11.1 L12.65 11.1 Z"
                        fill="#FFF8EE"
                        stroke="#C6A15B"
                        strokeWidth="0.9"
                        strokeLinejoin="round"
                      />
                      <circle cx="14" cy="14.2" r="1.1" fill="#C6A15B" />
                    </svg>
                  </div>
                </>
              )}
            </div>
          </div>

          {!isRevealed && (
            <button
              type="button"
              onClick={() => celebrate()}
              style={{
                marginTop: 2,
                marginBottom: 4,
                padding: '11px 20px',
                borderRadius: 999,
                border: `1px solid ${pink.line}`,
                background: 'rgba(255, 245, 246, 0.92)',
                color: theme.colors.ink,
                fontSize: isRtl ? 12 : 11,
                fontWeight: 700,
                letterSpacing: isRtl ? '0.04em' : '0.16em',
                cursor: 'pointer',
                minHeight: 42,
                flexShrink: 0,
                position: 'relative',
                zIndex: 4,
                touchAction: 'manipulation',
                fontFamily: isRtl ? "'Amiri', serif" : undefined,
              }}
            >
              {isRtl ? '✨ فوری طور پر ظاہر کریں' : '✨ Tap to reveal instantly'}
            </button>
          )}
          <ScrollDownHint
            locale={locale}
            placement="afterContent"
            color={pink.main}
            glow="rgba(201, 149, 158, 0.55)"
            style={{ marginTop: isRevealed ? 14 : 10, paddingBottom: 12 }}
          />
        </div>
      </div>
    </Card>
  );
}
