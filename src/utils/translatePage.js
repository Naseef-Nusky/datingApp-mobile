/**
 * Whole-page translation using Google Cloud Translation API.
 * On load, when language is not English: collect text from DOM elements,
 * POST to /api/translate, replace with translations.
 * Use with: save language in localStorage → reload → this runs after paint.
 */

const SELECTORS =
  'h1, h2, h3, h4, h5, h6, p, a, span, button, li, label, td, th, option, div';

/** Skip elements that should not be translated (scripts, SVGs, inputs, etc.). */
function shouldSkip(el) {
  if (!el || typeof el.closest !== 'function') return true;
  if (el.closest('script, style, noscript, [data-no-translate]')) return true;
  if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return true;
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return true;
  return false;
}

/** Return only "leaf" elements that don't contain any other selected element (avoids double translation). */
function getLeafTextElements(root = document.body) {
  const all = Array.from(root.querySelectorAll(SELECTORS));
  return all.filter((el) => {
    if (shouldSkip(el)) return false;
    const text = (el.innerText || '').trim();
    if (!text) return false;
    const nested = el.querySelectorAll(SELECTORS);
    return nested.length <= 1 && (!nested.length || nested[0] === el);
  });
}

export async function translatePage(targetLang) {
  if (!targetLang || targetLang === 'en' || targetLang === 'en-uk') return;

  const elements = getLeafTextElements();
  if (elements.length === 0) return;

  const texts = elements.map((el) => el.innerText.trim()).filter(Boolean);
  if (texts.length === 0) return;

  const apiUrl = import.meta.env.VITE_API_URL || '';
  try {
    const res = await fetch(`${apiUrl}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, target: targetLang }),
    });
    if (!res.ok) throw new Error(`Translate: ${res.status}`);
    const data = await res.json();
    const translations = data.translations || [];
    elements.forEach((el, i) => {
      if (translations[i] != null) el.innerText = translations[i];
    });
  } catch (err) {
    console.warn('Page translation failed:', err?.message);
  }
}
