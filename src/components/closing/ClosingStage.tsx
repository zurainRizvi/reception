'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { theme } from '@/config/theme';
import { Ornament } from '@/components/shared/Ornament';
import type { Locale } from '@/config/translations';

export default function ClosingStage({ locale }: { locale: Locale }) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const onPage = useRef(false);
  const [showCopy, setShowCopy] = useState(false);
  const isRtl = locale === 'ur';

  const videoSrc = `${theme.videos.closing}?v=${theme.videos.version}`;
  const posterSrc = `${theme.videos.closingPoster}?v=${theme.videos.version}`;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const video = videoRef.current;
        if (!entry || !video) return;

        if (entry.intersectionRatio >= 0.9) {
          if (onPage.current) return;
          onPage.current = true;
          setShowCopy(false);
          video.muted = true;
          video.defaultMuted = true;
          video.playsInline = true;
          video.setAttribute('muted', '');
          video.setAttribute('playsinline', '');
          video.setAttribute('webkit-playsinline', '');
          if (video.readyState >= 1) video.currentTime = 0;
          const pending = video.play();
          void pending?.catch(() => {
            if (onPage.current) setShowCopy(true);
          });
          return;
        }

        if (entry.intersectionRatio < 0.5) {
          onPage.current = false;
          video.pause();
          if (video.readyState >= 1) video.currentTime = 0;
          setShowCopy(false);
        }
      },
      { threshold: [0, 0.5, 0.9] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
        preload="metadata"
        controls={false}
        disablePictureInPicture
        onEnded={() => setShowCopy(true)}
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
        {showCopy && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 3,
              display: 'grid',
              placeItems: 'center',
              padding: 22,
              background: 'linear-gradient(180deg, rgba(10,4,6,0.25), rgba(10,4,6,0.55))',
            }}
          >
            <div
              style={{
                maxWidth: 380,
                width: '100%',
                textAlign: 'center',
                padding: isRtl ? '28px 22px 30px' : '30px 24px 28px',
                borderRadius: 20,
                background: theme.colors.creamGlass,
                border: `1px solid ${theme.colors.goldLine}`,
                boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
                color: theme.colors.ink,
              }}
            >
              <p
                className="arabic"
                style={{
                  fontSize: 'clamp(22px, 5.8vw, 26px)',
                  lineHeight: 2,
                  color: theme.colors.ink,
                  margin: '0 0 8px',
                  fontFamily: "'Amiri', serif",
                }}
              >
                بَارَكَ اللَّهُ لَكُمَا وَبَارَكَ عَلَيْكُمَا وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ
              </p>
              <Ornament />
              <h2
                style={{
                  fontSize: isRtl ? 'clamp(26px, 7vw, 32px)' : 'clamp(28px, 7.5vw, 34px)',
                  lineHeight: isRtl ? 1.55 : 1.2,
                  margin: '10px 0 0',
                  fontFamily: isRtl ? "'Amiri', serif" : "'Cormorant Garamond', serif",
                  fontWeight: 500,
                }}
              >
                {isRtl ? (
                  <>
                    <span>آپ کی آمد، </span>
                    <em
                      style={{
                        color: theme.colors.gold,
                        fontStyle: 'normal',
                        fontWeight: 700,
                        fontFamily: "'Amiri', serif",
                      }}
                    >
                      ہماری خوشی۔
                    </em>
                  </>
                ) : (
                  <>
                    <span>Your presence, </span>
                    <em
                      style={{
                        color: theme.colors.gold,
                        fontStyle: 'italic',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      our joy.
                    </em>
                  </>
                )}
              </h2>
              <p
                style={{
                  margin: isRtl ? '12px 0 0' : '14px 0 0',
                  fontSize: isRtl ? 15 : 14,
                  lineHeight: isRtl ? 1.85 : 1.55,
                  color: theme.colors.inkSoft,
                  fontFamily: isRtl ? "'Amiri', serif" : "'DM Sans', sans-serif",
                  fontWeight: isRtl ? 400 : 500,
                  maxWidth: 320,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                {isRtl
                  ? 'ہم اپنے تمام عزیز خاندان اور پیاروں کی آمد کے منتظر ہیں تاکہ ہمارا جشن مکمل ہو۔'
                  : 'Awaiting the presence of all our beloved family members and loved ones to make our celebration complete.'}
              </p>
              <p
                className="eyebrow"
                style={{
                  margin: isRtl ? '18px 0 6px' : '20px 0 8px',
                  color: theme.colors.gold,
                  letterSpacing: isRtl ? '0.12em' : '0.28em',
                  fontFamily: isRtl ? "'Amiri', serif" : undefined,
                  fontSize: isRtl ? 13 : 11,
                  fontWeight: 700,
                }}
              >
                {isRtl ? 'جوابِ دعوت' : 'R.S.V.P.'}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: isRtl ? 17 : 16,
                  lineHeight: isRtl ? 1.7 : 1.35,
                  fontFamily: isRtl ? "'Amiri', serif" : "'Cormorant Garamond', serif",
                  fontWeight: 600,
                  color: theme.colors.ink,
                  letterSpacing: isRtl ? 0 : '0.02em',
                }}
              >
                {isRtl ? 'رضوی و نقوی خاندان' : 'The Rizvi & Naqvi Families'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
