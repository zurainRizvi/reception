function digitsOnly(phoneDigits: string) {
  return phoneDigits.replace(/[^\d]/g, '');
}

export function isAndroidDevice() {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
}

export function formatWhatsAppDisplayNumber(phoneDigits: string) {
  const phone = digitsOnly(phoneDigits);
  if (phone.startsWith('92') && phone.length >= 12) {
    return `+${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5)}`;
  }
  return `+${phone}`;
}

/** HTTPS click-to-chat (iOS App Links + desktop). */
export function buildWhatsAppHttpsUrl(phoneDigits: string, message: string) {
  const phone = digitsOnly(phoneDigits);
  const text = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${phone}&text=${text}`;
}

/** Native app scheme. */
export function buildWhatsAppAppUrl(phoneDigits: string, message: string) {
  const phone = digitsOnly(phoneDigits);
  const text = encodeURIComponent(message);
  return `whatsapp://send?phone=${phone}&text=${text}`;
}

/**
 * Chrome Intent for a real <a href> tap (not JS timers / location.assign).
 * Android 16 blocks intent:// started from script; a direct anchor click still works.
 */
export function buildWhatsAppIntentUrl(phoneDigits: string, message: string) {
  const phone = digitsOnly(phoneDigits);
  const text = encodeURIComponent(message);
  const fallback = encodeURIComponent(buildWhatsAppHttpsUrl(phone, message));
  return `intent://send/?phone=${phone}&text=${text}#Intent;scheme=whatsapp;package=com.whatsapp;S.browser_fallback_url=${fallback};end`;
}

/** Href used on the RSVP button. */
export function buildWhatsAppChatUrl(phoneDigits: string, message: string) {
  if (isAndroidDevice()) return buildWhatsAppIntentUrl(phoneDigits, message);
  return buildWhatsAppHttpsUrl(phoneDigits, message);
}

export type WhatsAppOpenResult = 'shared' | 'opened' | 'cancelled' | 'fallback';

/**
 * Android 16+: open the system share sheet (reliable into WhatsApp).
 * iOS/desktop: navigate to HTTPS click-to-chat.
 * Returns `fallback` when Android should use the real <a href> instead.
 */
export async function openWhatsAppChat(
  phoneDigits: string,
  message: string,
): Promise<WhatsAppOpenResult> {
  if (typeof window === 'undefined') return 'fallback';

  const httpsUrl = buildWhatsAppHttpsUrl(phoneDigits, message);

  if (isAndroidDevice()) {
    if (typeof navigator.share === 'function') {
      try {
        const shareData: ShareData = { title: 'Waleema Reception RSVP', text: message };
        if (typeof navigator.canShare === 'function' && !navigator.canShare(shareData)) {
          return 'fallback';
        }
        await navigator.share(shareData);
        return 'shared';
      } catch (err) {
        const name = err instanceof Error ? err.name : '';
        if (name === 'AbortError') return 'cancelled';
        return 'fallback';
      }
    }
    // No Web Share — caller should let the real <a href="intent://..."> navigate.
    return 'fallback';
  }

  window.location.href = httpsUrl;
  return 'opened';
}
