/** Same rules as backend `backend/routes/messages.js` — keep in sync. */
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_LIKE_RE = /(?:\+?\d[\d\s().-]{6,}\d)/g;

export const CONTACT_INFO_WARNING =
  'For your safety, you cannot share phone numbers or email addresses in chat. Please keep the conversation on the app.';

/**
 * @param {string} text
 * @returns {boolean}
 */
export function hasBlockedContactInfo(text) {
  const input = String(text || '');
  if (!input.trim()) return false;

  if (EMAIL_RE.test(input)) return true;

  const phoneMatches = input.match(PHONE_LIKE_RE) || [];
  for (const raw of phoneMatches) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length >= 8) return true;
  }

  return false;
}
