// polymarket-zh.js — Fetch Polymarket official Chinese translations
// Tries /zh/ page → scrape <title> or og:title → OpenCC simplified→traditional → cache

import * as OpenCC from 'opencc-js';

const converter = OpenCC.Converter({ from: 'cn', to: 'twp' });

// In-memory cache: slug → { zh, ts }
const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour

/**
 * Try to fetch the official Chinese title for a Polymarket event.
 * @param {string} eventSlug — e.g. "next-supreme-leader-of-iran"
 * @returns {Promise<string|null>} Traditional Chinese title, or null
 */
export async function fetchPolymarketZh(eventSlug) {
  if (!eventSlug) return null;

  // Check cache
  const cached = cache.get(eventSlug);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.zh;

  try {
    const url = `https://polymarket.com/zh/event/${encodeURIComponent(eventSlug)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow',
    });
    if (!res.ok) return null;

    const html = await res.text();

    // Try og:title first (more reliable), then <title>
    let zhTitle = null;

    const ogMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
      || html.match(/<meta\s+content="([^"]+)"\s+property="og:title"/i);
    if (ogMatch) {
      zhTitle = ogMatch[1].trim();
    }

    if (!zhTitle) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        // Remove " | Polymarket" suffix if present
        zhTitle = titleMatch[1].replace(/\s*[|–—]\s*Polymarket\s*$/i, '').trim();
      }
    }

    if (!zhTitle) return null;

    // If it's still English (same as slug-based), skip
    const asciiRatio = (zhTitle.match(/[a-zA-Z0-9\s.,!?;:'"()\-/]/g) || []).length / zhTitle.length;
    if (asciiRatio > 0.8) return null;

    // OpenCC: simplified → traditional
    const traditional = converter(zhTitle);

    cache.set(eventSlug, { zh: traditional, ts: Date.now() });
    return traditional;
  } catch (e) {
    console.error('[PolymarketZh] Error fetching', eventSlug, e.message);
    return null;
  }
}
