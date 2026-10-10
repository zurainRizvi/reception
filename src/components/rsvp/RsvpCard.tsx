'use client';

import React, { useEffect, useRef, useState } from 'react';
import { theme } from '@/config/theme';
import { rsvpService } from '@/services/rsvp';
import { type Locale } from '@/config/translations';
import { Ornament } from '@/components/shared/Ornament';
import RsvpAdmin from '@/components/rsvp/RsvpAdmin';

const RSVP_INK = theme.rsvp.ink;
const RSVP_MUTED = theme.rsvp.muted;
const RSVP_SOFT = theme.rsvp.inkSoft;
const RSVP_LINE = theme.rsvp.fieldBorder;
const RSVP_FIELD = theme.rsvp.field;
const RSVP_ACCENT = theme.rsvp.accent;
const RSVP_ACCENT_SOFT = theme.rsvp.accentSoft;

export default function RsvpCard({ locale }: { locale: Locale }) {
  const isRtl = locale === 'ur';
  const savedScroll = useRef<number | null>(null);
  const resumeTimer = useRef<number | null>(null);
  const pinUntil = useRef(0);
  const focusedInRsvp = useRef(false);
  const [response, setResponse] = useState<'yes' | 'no' | null>(null);
  const [guestCount, setGuestCount] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['waleema']);
  const [guestName, setGuestName] = useState('');
  const [guestMessage, setGuestMessage] = useState('');
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    response: 'yes' | 'no';
    guests: string;
    events: string[];
    message: string;
    submittedAt: string;
  } | null>(null);
  const [cloudSaveError, setCloudSaveError] = useState(false);

  const getMain = () => document.querySelector('main');

  const setSnapEnabled = (enabled: boolean) => {
    const main = getMain();
    if (!main) return;
    main.classList.toggle('snap-paused', !enabled);
  };

  const captureScrollAnchor = () => {
    const main = getMain();
    if (!main) return;
    // Prefer anchoring to the RSVP page itself — autofill often jumps after focus.
    if (savedScroll.current == null) savedScroll.current = main.scrollTop;
  };

  const pauseSnapForTyping = () => {
    const main = getMain();
    if (!main) return;
    if (resumeTimer.current != null) {
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
    focusedInRsvp.current = true;
    captureScrollAnchor();
    setSnapEnabled(false);
  };

  const resumeSnapSoon = () => {
    if (resumeTimer.current != null) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => {
      const section = document.getElementById('rsvp-section');
      const active = document.activeElement;
      if (
        section &&
        (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) &&
        section.contains(active)
      ) {
        return;
      }
      focusedInRsvp.current = false;
      savedScroll.current = null;
      pinUntil.current = 0;
      setSnapEnabled(true);
      resumeTimer.current = null;
    }, 400);
  };

  /** Autofill / keyboard often yank scroll toward the closing page. */
  const correctAutofillJump = () => {
    const main = getMain();
    if (!main || savedScroll.current == null) return;
    if (Math.abs(main.scrollTop - savedScroll.current) > 2) main.scrollTop = savedScroll.current;
  };

  const pinScroll = (ms = 1400) => {
    pinUntil.current = Date.now() + ms;
    setSnapEnabled(false);
    correctAutofillJump();
    requestAnimationFrame(correctAutofillJump);
    window.setTimeout(correctAutofillJump, 16);
    window.setTimeout(correctAutofillJump, 50);
    window.setTimeout(correctAutofillJump, 120);
    window.setTimeout(correctAutofillJump, 280);
    window.setTimeout(correctAutofillJump, 600);
    window.setTimeout(correctAutofillJump, 1000);
  };

  useEffect(() => {
    const section = document.getElementById('rsvp-section');
    const main = getMain();
    if (!section || !main) return;

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
      // Capture before the browser scrolls the focused field / snap neighbor into view.
      if (savedScroll.current == null) savedScroll.current = main.scrollTop;
      pauseSnapForTyping();
      pinScroll(900);
    };

    const onFocusOut = () => resumeSnapSoon();

    const shouldPinName = (e: Event) => {
      const target = e.target;
      if (!(target instanceof HTMLInputElement) || target.name !== 'name') return false;
      if (e instanceof InputEvent) {
        const burst = (e.data?.length ?? 0) > 1;
        const replacement =
          e.inputType === 'insertReplacementText' ||
          e.inputType === 'insertFromAutocomplete' ||
          e.inputType === 'insertFromPaste';
        if (burst || replacement) return true;
      }
      // Browser autofill often fires a plain change with the full name.
      return e.type === 'change' && target.value.trim().length > 1;
    };

    const onAnyEdit = (e: Event) => {
      pauseSnapForTyping();
      if (shouldPinName(e)) pinScroll(1600);
    };

    const onAutoFill = (e: AnimationEvent) => {
      if (e.animationName !== 'rsvp-autofill-start') return;
      pauseSnapForTyping();
      pinScroll(1600);
    };

    const onScroll = () => {
      if (!focusedInRsvp.current && Date.now() >= pinUntil.current) return;
      // While typing or during autofill, never let scroll leave the RSVP page.
      if (savedScroll.current != null && main.scrollTop > savedScroll.current + 8) {
        main.scrollTop = savedScroll.current;
        return;
      }
      if (Date.now() < pinUntil.current) {
        correctAutofillJump();
      }
    };

    section.addEventListener('focusin', onFocusIn);
    section.addEventListener('focusout', onFocusOut);
    section.addEventListener('input', onAnyEdit, true);
    section.addEventListener('change', onAnyEdit, true);
    section.addEventListener('animationstart', onAutoFill, true);
    main.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      section.removeEventListener('focusin', onFocusIn);
      section.removeEventListener('focusout', onFocusOut);
      section.removeEventListener('input', onAnyEdit, true);
      section.removeEventListener('change', onAnyEdit, true);
      section.removeEventListener('animationstart', onAutoFill, true);
      main.removeEventListener('scroll', onScroll);
      if (resumeTimer.current != null) window.clearTimeout(resumeTimer.current);
      focusedInRsvp.current = false;
      savedScroll.current = null;
      pinUntil.current = 0;
      setSnapEnabled(true);
    };
  }, []);

  const chooseAttendance = (val: 'yes' | 'no') => {
    savedScroll.current = null;
    pinUntil.current = 0;
    setSnapEnabled(true);
    setResponse(val);
  };

  const toggleEvent = (id: string) => {
    savedScroll.current = null;
    setSnapEnabled(true);
    if (selectedEvents.includes(id)) {
      if (selectedEvents.length > 1) setSelectedEvents(selectedEvents.filter((e) => e !== id));
    } else {
      setSelectedEvents([...selectedEvents, id]);
    }
  };

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!response || !guestName.trim()) return;
    const payload = {
      name: guestName.trim(),
      response,
      guests: response === 'yes' ? guestCount || '1' : '0',
      events: response === 'yes' ? selectedEvents : [],
      message: guestMessage.trim(),
      submittedAt: new Date().toISOString(),
    };
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    savedScroll.current = null;
    pinUntil.current = 0;
    setSnapEnabled(true);
    setCloudSaveError(false);
    setSubmittedData(payload);
    try {
      await rsvpService.submit({ ...payload, guests: Number(payload.guests) });
    } catch {
      // Still show the confirmation, but surface that cloud sync failed.
      setCloudSaveError(true);
    }
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 100,
        spread: 75,
        origin: { y: 0.65 },
        colors: [theme.colors.gold, '#FFF2CE', theme.colors.goldSoft],
      });
    } catch {
      // ignore
    }
  }

  const eventsList = [
    { id: 'waleema', labelEn: 'Waleema — 14 Jan', labelUr: 'ولیمہ — ۱۴ جنوری', color: theme.events.waleema.accent },
  ];

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 14,
    border: `1px solid ${RSVP_LINE}`,
    background: RSVP_FIELD,
    color: RSVP_INK,
    textAlign: 'center',
    fontSize: 16,
    outline: 'none',
    WebkitAppearance: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: isRtl ? 13 : 11,
    letterSpacing: isRtl ? '0.04em' : '0.14em',
    textTransform: isRtl ? 'none' : 'uppercase',
    color: RSVP_ACCENT,
    marginBottom: isRtl ? 4 : 6,
    fontWeight: 600,
    fontFamily: isRtl ? "'Amiri', serif" : undefined,
    lineHeight: isRtl ? 1.35 : undefined,
    textAlign: 'center',
  };

  const eventBtnStyle = (on: boolean, color: string): React.CSSProperties => ({
    padding: '11px 12px',
    borderRadius: 12,
    border: on ? `1.5px solid ${color}` : `1px solid ${RSVP_LINE}`,
    background: on ? `${color}33` : RSVP_FIELD,
    color: RSVP_INK,
    textAlign: 'center',
    cursor: 'pointer',
    fontSize: isRtl ? 13 : 13,
    minHeight: 42,
    fontFamily: isRtl ? "'Amiri', serif" : undefined,
  });

  return (
    <div
      className="rsvp rsvp-overlay"
      id="rsvp-section"
      style={{
        width: '100%',
        maxWidth: 400,
        maxHeight: 'min(92vh, 760px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        background: theme.rsvp.bg,
        border: `1px solid ${theme.rsvp.border}`,
        borderRadius: 22,
        boxShadow: '0 24px 56px rgba(61, 52, 41, 0.22)',
        padding: '28px 20px max(28px, calc(env(safe-area-inset-bottom, 0px) + 18px))',
        color: RSVP_INK,
        overflowAnchor: 'none',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 360, margin: '0 auto' }}>
        <p
          className="eyebrow"
          style={{
            color: RSVP_ACCENT,
            letterSpacing: isRtl ? '0.1em' : '0.28em',
            marginBottom: 8,
            fontFamily: isRtl ? "'Amiri', serif" : undefined,
          }}
        >
          {isRtl ? 'آپ کی تشریف آوری' : 'R.S.V.P.'}
        </p>
        <h2
          style={{
            color: RSVP_INK,
            margin: '6px 0 10px',
            lineHeight: isRtl ? 1.7 : 1.15,
            fontFamily: isRtl ? "'Amiri', serif" : "'Cormorant Garamond', serif",
          }}
        >
          {submittedData
            ? isRtl
              ? (
                <>
                  شکریہ، عزیز مہمان
                  <em style={{ color: RSVP_ACCENT, display: 'block', fontStyle: 'normal', fontSize: '0.78em', marginTop: 6 }}>
                    آپ کا جواب محفوظ ہو گیا
                  </em>
                </>
              )
              : (
                <>
                  Thank you, dear guest
                  <em style={{ color: RSVP_ACCENT, display: 'block', fontStyle: 'italic', fontSize: '0.78em', marginTop: 4 }}>
                    Your response is saved
                  </em>
                </>
              )
            : isRtl
              ? (
                <>
                  کیا آپ تشریف لائیں گے؟
                  <em style={{ color: RSVP_ACCENT, display: 'block', fontStyle: 'normal', fontSize: '0.78em', marginTop: 6 }}>
                    براہِ کرم اپنا جواب بھیجیں
                  </em>
                </>
              )
              : (
                <>
                  Will you join us?
                  <em style={{ color: RSVP_ACCENT, display: 'block', fontStyle: 'italic', fontSize: '0.78em', marginTop: 4 }}>
                    A moment to confirm your presence
                  </em>
                </>
              )}
        </h2>
        <Ornament color={RSVP_ACCENT} />

        {!submittedData ? (
          <form
            onSubmit={handleSubmit}
            autoComplete="on"
            style={{
              width: '100%',
              margin: '12px auto 0',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              textAlign: 'center',
              overflowAnchor: 'none',
            }}
          >
            <div>
              <label style={labelStyle}>{isRtl ? 'نام یا خاندانی نام' : 'YOUR NAME'} *</label>
              <input
                name="name"
                autoComplete="name"
                required
                value={guestName}
                onFocus={() => pauseSnapForTyping()}
                onChange={(e) => {
                  const next = e.target.value;
                  const burst = Math.abs(next.length - guestName.length) > 1;
                  pauseSnapForTyping();
                  setGuestName(next);
                  if (burst) pinScroll(1600);
                }}
                placeholder={isRtl ? 'اپنا نام...' : 'Enter your name...'}
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>{isRtl ? 'شرکت کی تصدیق' : 'WILL YOU ATTEND?'} *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {(['yes', 'no'] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => chooseAttendance(val)}
                    style={{
                      padding: '12px 12px',
                      borderRadius: 14,
                      border:
                        response === val
                          ? `1.5px solid ${RSVP_ACCENT}`
                          : `1px solid ${RSVP_LINE}`,
                      background:
                        response === val
                          ? val === 'yes'
                            ? `linear-gradient(135deg, ${RSVP_ACCENT_SOFT}, ${RSVP_ACCENT})`
                            : 'rgba(184,116,116,0.22)'
                          : RSVP_FIELD,
                      color: response === val && val === 'yes' ? '#2C261F' : RSVP_INK,
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: 'pointer',
                      minHeight: 46,
                      fontFamily: isRtl ? "'Amiri', serif" : undefined,
                    }}
                  >
                    {val === 'yes'
                      ? isRtl
                        ? '✓ خوشی سے شرکت'
                        : '✓ Joyfully Attend'
                      : isRtl
                        ? '✕ معذرت'
                        : '✕ Regretfully Decline'}
                  </button>
                ))}
              </div>
            </div>

            {response === 'yes' && (
              <>
                <div>
                  <label style={labelStyle}>{isRtl ? 'مہمانوں کی تعداد' : 'NUMBER OF GUESTS'}</label>
                  <input
                    type="number"
                    name="guests"
                    inputMode="numeric"
                    autoComplete="off"
                    value={guestCount}
                    onFocus={() => pauseSnapForTyping()}
                    onChange={(e) => {
                      pauseSnapForTyping();
                      setGuestCount(e.target.value);
                    }}
                    placeholder="1"
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, marginBottom: 8 }}>{isRtl ? 'تقریب' : 'EVENT'}</label>
                  <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    {eventsList.map((ev) => {
                      const on = selectedEvents.includes(ev.id);
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => toggleEvent(ev.id)}
                          style={{ ...eventBtnStyle(on, ev.color), width: '100%', maxWidth: 220 }}
                        >
                          {isRtl ? ev.labelUr : ev.labelEn}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ ...labelStyle, marginBottom: isRtl ? 2 : 4 }}>
                {isRtl ? 'پیغام (اختیاری)' : 'A NOTE FOR THE COUPLE'}
              </label>
              <textarea
                name="message"
                autoComplete="off"
                value={guestMessage}
                onFocus={() => pauseSnapForTyping()}
                onChange={(e) => {
                  pauseSnapForTyping();
                  setGuestMessage(e.target.value);
                }}
                rows={1}
                placeholder={isRtl ? 'دعائیں یا پیغام...' : 'Optional dua or wishes...'}
                style={{
                  ...fieldStyle,
                  resize: 'none',
                  margin: 0,
                  lineHeight: isRtl ? 1.45 : 1.35,
                  minHeight: 0,
                  padding: '10px 16px',
                }}
              />
            </div>

            <p style={{ margin: '2px 0 0', color: RSVP_SOFT, fontSize: 12, lineHeight: 1.5 }}>
              {isRtl
                ? 'تصدیق پر آپ کا جواب محفوظ ہو جائے گا'
                : 'Your reply will be saved once you confirm.'}
            </p>

            <button
              type="submit"
              className="rsvp-submit"
              disabled={!response || !guestName.trim()}
              style={{
                marginTop: 4,
                marginBottom: 8,
                padding: '14px 20px',
                borderRadius: 999,
                border: 'none',
                background:
                  !response || !guestName.trim()
                    ? 'rgba(198, 161, 91, 0.22)'
                    : `linear-gradient(135deg, ${RSVP_ACCENT_SOFT}, ${RSVP_ACCENT})`,
                color: !response || !guestName.trim() ? RSVP_MUTED : '#2C261F',
                fontWeight: 700,
                letterSpacing: '0.12em',
                cursor: !response || !guestName.trim() ? 'not-allowed' : 'pointer',
                minHeight: 48,
                boxShadow: '0 8px 22px rgba(61, 52, 41, 0.16)',
                fontFamily: isRtl ? "'Amiri', serif" : undefined,
              }}
            >
              {isRtl ? 'جواب محفوظ کریں' : 'Confirm RSVP'}
            </button>
          </form>
        ) : (
          <div style={{ margin: '14px auto 0', textAlign: 'center' }}>
            <p style={{ color: RSVP_SOFT, fontSize: 15, lineHeight: 1.7, marginTop: 4 }}>
              {isRtl
                ? 'آپ کا جواب محفوظ ہو گیا ہے۔ ہم آپ سے ملاقات کے منتظر ہیں۔'
                : 'Your response has been saved. We look forward to the pleasure of your company.'}
            </p>
            {cloudSaveError ? (
              <p style={{ color: '#9a4a4a', fontSize: 12, lineHeight: 1.5, marginTop: 8 }}>
                {isRtl
                  ? 'کلاؤڈ پر محفوظ نہیں ہو سکا — براہِ کرم کچھ دیر بعد دوبارہ کوشش کریں'
                  : 'Could not sync to the host list — please try again shortly'}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => setSubmittedData(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: RSVP_ACCENT,
                fontSize: 11,
                letterSpacing: '0.12em',
                textDecoration: 'underline',
                cursor: 'pointer',
                marginTop: 16,
              }}
            >
              {isRtl ? 'جواب میں تبدیلی کریں' : 'Edit response'}
            </button>
          </div>
        )}

        <RsvpAdmin />
      </div>
    </div>
  );
}
