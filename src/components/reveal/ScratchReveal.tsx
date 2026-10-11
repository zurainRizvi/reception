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
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const isDrawing = useRef(false);
  const hasTriggered = useRef(false);
  const revealedRef = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const lastSampleAt = useRef(0);
  const samplePending = useRef(false);
  const brushWidth = useRef(40);
  const lockedScrollTop = useRef(0);
  const isRtl = locale === 'ur';

  const celebrate = useCallback(async () => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;
    revealedRef.current = true;

    // Pin the scroller before layout changes — otherwise mandatory snap jumps to page 1.
    const main = document.querySelector('main');
    const card = document.getElementById('scratch-reveal');
    const lockedTop = main?.scrollTop ?? 0;
    let priorOverflow = '';
    if (main) {
      priorOverflow = main.style.overflowY;
      main.classList.add('snap-paused');
      main.style.overflowY = 'hidden';
      main.scrollTop = lockedTop;
    }

    setShowHint(false);
    setIsRevealed(true);

    const pin = () => {
      if (!main) return;
      main.scrollTop = lockedTop;
      card?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'auto' });
    };
    pin();
    requestAnimationFrame(() => {
      pin();
      requestAnimationFrame(pin);
    });
    window.setTimeout(pin, 50);
    window.setTimeout(pin, 160);
    window.setTimeout(() => {
      pin();
      if (!main) return;
      main.style.overflowY = priorOverflow;
      main.classList.remove('snap-paused');
      pin();
    }, 420);

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

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    if (!ctxRef.current) {
      ctxRef.current = canvas.getContext('2d', { willReadFrequently: true });
    }
    return ctxRef.current;
  }, []);

  const paintFoil = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || revealedRef.current || isDrawing.current) return;
    const ctx = getCtx();
    if (!ctx) return;

    const width = Math.round(canvas.offsetWidth);
    const height = Math.round(canvas.offsetHeight);
    if (width < 2 || height < 2) return;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#FFF5F6');
    grad.addColorStop(0.32, pink.soft);
    grad.addColorStop(0.68, pink.main);
    grad.addColorStop(1, pink.deep);
    ctx.globalCompositeOperation = 'source-over';
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
    ctx.fillText(isRtl ? 'پردہ ہٹا کر تواریخ جانیے' : 'SCRATCH TO REVEAL', width / 2, height / 2 - 4);
    ctx.font = isRtl ? '12px Amiri, serif' : '500 10px "DM Sans", sans-serif';
    ctx.fillStyle = 'rgba(61,52,41,0.72)';
    ctx.fillText(isRtl ? 'یا فوری طور پر ظاہر کریں' : 'or tap Instant Reveal below', width / 2, height / 2 + 16);

    brushWidth.current = Math.max(40, Math.min(width, height) * 0.18);
  }, [getCtx, isRtl]);

  useEffect(() => {
    paintFoil();
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;
    let lastW = canvas.offsetWidth;
    let lastH = canvas.offsetHeight;
    const observer = new ResizeObserver(() => {
      // Never wipe/redraw foil mid-stroke — that reads as a zoom stutter.
      if (isDrawing.current || revealedRef.current) return;
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

  const sampleReveal = useCallback(() => {
    if (revealedRef.current) return;
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx || canvas.width < 2 || canvas.height < 2) return;
    try {
      // Coarse grid — cheap enough for mobile without forcing GPU→CPU thrash every move.
      const step = 8;
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0;
      let total = 0;
      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          total++;
          if (data[(y * canvas.width + x) * 4 + 3] < 128) clear++;
        }
      }
      if (total > 0 && (clear / total) * 100 > 26) celebrate();
    } catch {
      // ignore
    }
  }, [celebrate, getCtx]);

  const scheduleSample = useCallback(
    (force = false) => {
      if (revealedRef.current) return;
      const now = performance.now();
      if (!force && now - lastSampleAt.current < 160) return;
      if (samplePending.current) return;
      samplePending.current = true;
      requestAnimationFrame(() => {
        samplePending.current = false;
        lastSampleAt.current = performance.now();
        sampleReveal();
      });
    },
    [sampleReveal],
  );

  const scratchAt = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      const ctx = getCtx();
      if (!canvas || !ctx || revealedRef.current) return;

      let rect = rectRef.current;
      if (!rect || rect.width < 1 || rect.height < 1) {
        rect = canvas.getBoundingClientRect();
        rectRef.current = rect;
      }
      if (rect.width < 1 || rect.height < 1) return;

      const x = ((clientX - rect.left) / rect.width) * canvas.width;
      const y = ((clientY - rect.top) / rect.height) * canvas.height;

      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = brushWidth.current;
      const prev = lastPoint.current;
      ctx.beginPath();
      if (prev) {
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.arc(x, y, brushWidth.current / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      lastPoint.current = { x, y };
      scheduleSample(false);
    },
    [getCtx, scheduleSample],
  );

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface || isRevealed) return;

    let pausedHere = false;
    let lockedOverflow = '';
    const pauseScroll = (paused: boolean) => {
      const main = document.querySelector('main');
      if (!main) return;
      if (paused) {
        lockedScrollTop.current = main.scrollTop;
        pausedHere = !main.classList.contains('snap-paused');
        main.classList.add('snap-paused');
        // Freeze the scroller so snap-type changes can't jump/zoom the page.
        lockedOverflow = main.style.overflowY;
        main.style.overflowY = 'hidden';
        main.scrollTop = lockedScrollTop.current;
        return;
      }
      main.style.overflowY = lockedOverflow;
      main.scrollTop = lockedScrollTop.current;
      if (pausedHere) main.classList.remove('snap-paused');
      pausedHere = false;
    };

    const beginStroke = (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || revealedRef.current) return;
      isDrawing.current = true;
      lastPoint.current = null;
      rectRef.current = canvas.getBoundingClientRect();
      brushWidth.current = Math.max(40, Math.min(canvas.width, canvas.height) * 0.18);
      setShowHint(false);
      pauseScroll(true);
      scratchAt(clientX, clientY);
    };

    const endStroke = () => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      lastPoint.current = null;
      rectRef.current = null;
      scheduleSample(true);
      pauseScroll(false);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.cancelable) event.preventDefault();
      const touch = event.changedTouches[0];
      if (touch) beginStroke(touch.clientX, touch.clientY);
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!isDrawing.current) return;
      if (event.cancelable) event.preventDefault();
      const touch = event.changedTouches[0];
      if (touch) scratchAt(touch.clientX, touch.clientY);
    };
    const onTouchEnd = () => endStroke();

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      event.preventDefault();
      try {
        surface.setPointerCapture(event.pointerId);
      } catch {
        // ignore
      }
      beginStroke(event.clientX, event.clientY);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !isDrawing.current) return;
      scratchAt(event.clientX, event.clientY);
    };
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      endStroke();
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
  }, [isRevealed, scheduleSample, scratchAt]);

  const accentFor = (id: (typeof wedding.events)[number]['id']) => theme.events[id].accent;

  return (
    <Card
      id="scratch-reveal"
      className="reveal-date-card"
      style={{
        backgroundColor: backdrop,
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
      {/*
        Flower art lives on a fixed viewport-sized layer — never on the flowing
        content box — so EN↔UR text reflow cannot resample/zoom the backdrop.
      */}
      <div
        aria-hidden
        className="reveal-date-backdrop"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          backgroundColor: backdrop,
          backgroundImage: 'url(/images/scratch-reveal-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          pointerEvents: 'none',
          transform: 'translateZ(0)',
        }}
      />
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
            : 'clamp(68px, 11vh, 104px) 24px max(40px, calc(env(safe-area-inset-bottom, 0px) + 32px))',
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
          {isRtl ? 'محبت و مسرت کے خاص دن' : 'SAVE THE AUSPICIOUS DATES'}
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
              تواریخ کی نقاب کشائی
              <em style={{ color: pink.main, display: 'block', fontStyle: 'normal', fontSize: '0.78em', marginTop: 6 }}>
                تین تقریبات، ایک جشن
              </em>
            </>
          ) : (
            <>
              Scratch to Reveal
              <em style={{ color: pink.main, display: 'block', fontStyle: 'italic', fontSize: '0.76em', marginTop: 4 }}>
                Our Celebration Dates
              </em>
            </>
          )}
        </h2>
        <Ornament color={pink.main} />

        <div
          aria-hidden
          style={{
            width: 'min(170px, 44vw)',
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
              width: 'min(268px, 78vw)',
              // Same footprint in EN/UR so locale swaps don't resize the foil stage.
              height: 'min(280px, 54vh)',
              margin: '0 auto 10px',
              flexShrink: 0,
              zIndex: 3,
              touchAction: 'none',
              overscrollBehavior: 'none',
              contain: 'layout paint',
              WebkitUserSelect: 'none',
              userSelect: 'none',
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
                  padding: isRtl ? '36px 22px 28px' : '52px 28px 34px',
                  boxSizing: 'border-box',
                  pointerEvents: 'none',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: isRtl ? 12 : 10,
                    letterSpacing: isRtl ? '0.06em' : '0.22em',
                    color: pink.main,
                    fontWeight: 700,
                    fontFamily: isRtl ? "'Amiri', serif" : undefined,
                    flexShrink: 0,
                  }}
                >
                  {isRtl ? 'جنوری ۲۰۲۷' : 'JANUARY 2027'}
                </p>
                <div
                  aria-hidden
                  style={{
                    width: 48,
                    height: 1,
                    margin: isRtl ? '6px 0 8px' : '8px 0 10px',
                    background: `linear-gradient(90deg, transparent, ${pink.main}, transparent)`,
                    flexShrink: 0,
                  }}
                />

                <div
                  style={{
                    width: '100%',
                    maxWidth: 210,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isRtl ? 6 : 7,
                    flex: '0 0 auto',
                    justifyContent: 'center',
                  }}
                >
                  {wedding.events.map((event, index) => {
                    const date = new Date(`${event.date}T12:00:00`);
                    const dayLabel = t(locale, dayKey[event.day as keyof typeof dayKey]);
                    const name = t(locale, event.id);
                    const dayNum = date.getDate();
                    const accent = accentFor(event.id);
                    return (
                      <React.Fragment key={event.id}>
                        {index > 0 ? (
                          <div
                            aria-hidden
                            style={{
                              height: 1,
                              margin: '1px 18px',
                              background: 'rgba(201, 149, 158, 0.28)',
                            }}
                          />
                        ) : null}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: isRtl ? 'auto 1fr' : '1fr auto',
                            alignItems: 'center',
                            gap: isRtl ? 12 : 10,
                            textAlign: isRtl ? 'right' : 'left',
                            direction: isRtl ? 'rtl' : 'ltr',
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <p
                              style={{
                                margin: 0,
                                fontFamily: isRtl ? "'Amiri', serif" : "'Cormorant Garamond', serif",
                                fontSize: isRtl ? 17 : 20,
                                lineHeight: 1.15,
                                fontWeight: 600,
                                color: theme.colors.ink,
                              }}
                            >
                              {name}
                            </p>
                            <p
                              style={{
                                margin: isRtl ? '2px 0 0' : '1px 0 0',
                                fontSize: isRtl ? 12 : 10,
                                letterSpacing: isRtl ? '0.02em' : '0.12em',
                                color: accent,
                                fontWeight: 600,
                                fontFamily: isRtl ? "'Amiri', serif" : undefined,
                                textTransform: isRtl ? 'none' : 'uppercase',
                              }}
                            >
                              {dayLabel}
                            </p>
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontFamily: "'Cormorant Garamond', serif",
                              fontSize: isRtl ? 24 : 28,
                              lineHeight: 1,
                              fontWeight: 600,
                              color: theme.colors.ink,
                              letterSpacing: '0.02em',
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'baseline',
                              gap: 6,
                            }}
                          >
                            {isRtl ? (
                              <>
                                <span style={{ fontSize: 14, color: theme.colors.inkSoft }}>جنوری</span>
                                <span>{dayNum}</span>
                              </>
                            ) : (
                              <>
                                {dayNum}
                                <span style={{ fontSize: 13, letterSpacing: '0.1em', color: theme.colors.inkSoft }}>
                                  JAN
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>

                <div
                  aria-hidden
                  style={{
                    width: 48,
                    height: 1,
                    margin: isRtl ? '8px 0 6px' : '12px 0 8px',
                    background: `linear-gradient(90deg, transparent, ${pink.main}, transparent)`,
                    flexShrink: 0,
                  }}
                />
                <p
                  style={{
                    margin: 0,
                    color: theme.colors.muted,
                    fontSize: isRtl ? 12 : 10,
                    letterSpacing: isRtl ? '0.04em' : '0.18em',
                    fontFamily: isRtl ? "'Amiri', serif" : undefined,
                    fontWeight: 600,
                    flexShrink: 0,
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
                    touchAction: 'none',
                    transform: 'translateZ(0)',
                    willChange: 'contents',
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

          {!isRevealed ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.currentTarget.blur();
                void celebrate();
              }}
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
          ) : (
            // Keep the same vertical space so snap doesn't jump to page 1 after reveal.
            <div aria-hidden style={{ height: 50, marginTop: 2, marginBottom: 4, flexShrink: 0 }} />
          )}
        </div>
      </div>

      {/*
        Pin to the page footer — afterContent was clipped by the locked reveal-date-card
        height once tap-to-reveal swapped the button for a spacer.
      */}
      <ScrollDownHint
        locale={locale}
        placement="footer"
        color={pink.main}
        glow="rgba(201, 149, 158, 0.55)"
      />
    </Card>
  );
}
