// google-translate.js — Free Google Translate wrapper (no API key needed)

import { translate } from '@vitalets/google-translate-api';

/**
 * Translate text to Traditional Chinese using Google Translate.
 * @param {string} text
 * @returns {Promise<string|null>} translated text, or null on failure
 */
export async function googleTranslate(text) {
  if (!text) return null;
  try {
    const res = await translate(text, { to: 'zh-TW' });
    return res.text || null;
  } catch (e) {
    console.error('[GoogleTranslate] Error:', e.message);
    return null;
  }
}
