'use client';

import React, { useState } from 'react';
import { theme } from '@/config/theme';
import { wedding } from '@/config/wedding';
import { rsvpService, type RSVPSubmission } from '@/services/rsvp';

const RSVP_INK = theme.rsvp.ink;
const RSVP_MUTED = theme.rsvp.muted;
const RSVP_SOFT = theme.rsvp.inkSoft;
const RSVP_LINE = theme.rsvp.fieldBorder;
const RSVP_FIELD = theme.rsvp.field;
const RSVP_ACCENT = theme.rsvp.accent;

const EVENT_LABELS: Record<string, string> = {
  mehndi: 'Mehndi',
  baraat: 'Baraat',
  waleema: 'Waleema',
};

type AdminView = 'closed' | 'password' | 'list';

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function GuestRow({ item }: { item: RSVPSubmission }) {
  return (
    <li
      style={{
        padding: '10px 0',
        borderBottom: `1px solid ${RSVP_LINE}`,
        textAlign: 'left',
        fontSize: 12,
        lineHeight: 1.45,
        color: RSVP_INK,
      }}
    >
      <div style={{ fontWeight: 600 }}>{item.name}</div>
      {item.response === 'yes' && (
        <div style={{ color: RSVP_SOFT }}>
          {item.guests} guest{item.guests === 1 ? '' : 's'}
          {item.events.length > 0
            ? ` · ${item.events.map((e) => EVENT_LABELS[e] || e).join(', ')}`
            : ''}
        </div>
      )}
      {item.message.trim() ? (
        <div style={{ color: RSVP_MUTED, fontStyle: 'italic', marginTop: 2 }}>&ldquo;{item.message.trim()}&rdquo;</div>
      ) : null}
      <div style={{ color: RSVP_MUTED, fontSize: 11, marginTop: 2 }}>{formatWhen(item.submittedAt)}</div>
    </li>
  );
}

export default function RsvpAdmin() {
  const [view, setView] = useState<AdminView>('closed');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [entries, setEntries] = useState<RSVPSubmission[]>([]);

  const expectedPassword =
    process.env.NEXT_PUBLIC_ADMIN_PASSWORD?.trim() || wedding.rsvp.adminPassword || '';

  async function loadEntries() {
    setLoading(true);
    setError('');
    try {
      const all = await rsvpService.getAll();
      setEntries(all);
      setView('list');
    } catch {
      setError('Could not load responses. Check Supabase setup.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetList() {
    if (entries.length === 0) return;
    const confirmed = window.confirm(
      `Clear all ${entries.length} RSVP response${entries.length === 1 ? '' : 's'}? This cannot be undone.`,
    );
    if (!confirmed) return;

    setResetting(true);
    setError('');
    try {
      await rsvpService.clearAll();
      setEntries([]);
    } catch {
      setError('Could not reset the list. Check Supabase delete policy.');
    } finally {
      setResetting(false);
    }
  }

  async function handleUnlock(ev: React.FormEvent) {
    ev.preventDefault();
    if (!expectedPassword) {
      setError('Admin password is not configured.');
      return;
    }
    if (password !== expectedPassword) {
      setError('Incorrect password.');
      return;
    }
    setPassword('');
    await loadEntries();
  }

  const attending = entries.filter((e) => e.response === 'yes');
  const declining = entries.filter((e) => e.response === 'no');
  const guestHeadcount = attending.reduce((sum, e) => sum + (Number(e.guests) || 0), 0);

  return (
    <div style={{ marginTop: 18, position: 'relative', minHeight: 20 }}>
      {view === 'closed' && (
        <button
          type="button"
          onClick={() => {
            setError('');
            setPassword('');
            setView('password');
          }}
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            background: 'transparent',
            border: 'none',
            padding: '4px 2px',
            fontSize: 10,
            letterSpacing: '0.04em',
            color: 'rgba(90, 78, 64, 0.28)',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
          aria-label="admin"
        >
          admin
        </button>
      )}

      {view === 'password' && (
        <form
          onSubmit={handleUnlock}
          style={{
            marginTop: 4,
            padding: 12,
            borderRadius: 14,
            border: `1px solid ${RSVP_LINE}`,
            background: RSVP_FIELD,
            textAlign: 'left',
          }}
        >
          <label
            style={{
              display: 'block',
              fontSize: 10,
              letterSpacing: '0.14em',
              color: RSVP_MUTED,
              marginBottom: 6,
            }}
          >
            ADMIN PASSWORD
          </label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${RSVP_LINE}`,
              background: '#fff',
              color: RSVP_INK,
              fontSize: 14,
            }}
          />
          {error ? (
            <p style={{ margin: '8px 0 0', color: '#9a4a4a', fontSize: 12 }}>{error}</p>
          ) : null}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              type="submit"
              disabled={loading || !password}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 999,
                border: 'none',
                background: RSVP_ACCENT,
                color: '#2C261F',
                fontWeight: 600,
                fontSize: 12,
                cursor: loading || !password ? 'not-allowed' : 'pointer',
                opacity: loading || !password ? 0.6 : 1,
              }}
            >
              {loading ? 'Loading…' : 'Open'}
            </button>
            <button
              type="button"
              onClick={() => {
                setView('closed');
                setPassword('');
                setError('');
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: `1px solid ${RSVP_LINE}`,
                background: 'transparent',
                color: RSVP_SOFT,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {view === 'list' && (
        <div
          style={{
            marginTop: 4,
            padding: 12,
            borderRadius: 14,
            border: `1px solid ${RSVP_LINE}`,
            background: RSVP_FIELD,
            textAlign: 'left',
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.16em', color: RSVP_ACCENT, fontWeight: 600 }}>
              RSVP ADMIN
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => loadEntries()}
                disabled={loading || resetting}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: RSVP_SOFT,
                  fontSize: 11,
                  cursor: loading || resetting ? 'not-allowed' : 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => void handleResetList()}
                disabled={loading || resetting || entries.length === 0}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: entries.length === 0 ? RSVP_MUTED : '#9a4a4a',
                  fontSize: 11,
                  cursor: loading || resetting || entries.length === 0 ? 'not-allowed' : 'pointer',
                  textDecoration: 'underline',
                }}
              >
                {resetting ? 'Resetting…' : 'Reset list'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('closed');
                  setEntries([]);
                  setError('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: RSVP_SOFT,
                  fontSize: 11,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Close
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8,
              marginTop: 12,
              marginBottom: 8,
            }}
          >
            {[
              { label: 'Attending', value: String(attending.length) },
              { label: 'Declining', value: String(declining.length) },
              { label: 'Guests', value: String(guestHeadcount) },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  textAlign: 'center',
                  padding: '8px 4px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.55)',
                  border: `1px solid ${RSVP_LINE}`,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700, color: RSVP_INK, lineHeight: 1.1 }}>{stat.value}</div>
                <div style={{ fontSize: 9, letterSpacing: '0.08em', color: RSVP_MUTED, marginTop: 2 }}>
                  {stat.label.toUpperCase()}
                </div>
              </div>
            ))}
          </div>

          {error ? (
            <p style={{ margin: '8px 0 0', color: '#9a4a4a', fontSize: 12 }}>{error}</p>
          ) : null}

          {loading && entries.length === 0 ? (
            <p style={{ margin: '12px 0 0', color: RSVP_SOFT, fontSize: 12 }}>Loading…</p>
          ) : entries.length === 0 ? (
            <p style={{ margin: '12px 0 0', color: RSVP_SOFT, fontSize: 12 }}>No responses yet.</p>
          ) : (
            <>
              <h3 style={{ margin: '14px 0 4px', fontSize: 12, color: RSVP_INK }}>Attending ({attending.length})</h3>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {attending.length === 0 ? (
                  <li style={{ color: RSVP_MUTED, fontSize: 12, padding: '6px 0' }}>None yet</li>
                ) : (
                  attending.map((item) => <GuestRow key={item.id || `${item.name}-${item.submittedAt}`} item={item} />)
                )}
              </ul>

              <h3 style={{ margin: '14px 0 4px', fontSize: 12, color: RSVP_INK }}>Declining ({declining.length})</h3>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {declining.length === 0 ? (
                  <li style={{ color: RSVP_MUTED, fontSize: 12, padding: '6px 0' }}>None yet</li>
                ) : (
                  declining.map((item) => <GuestRow key={item.id || `${item.name}-${item.submittedAt}`} item={item} />)
                )}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
