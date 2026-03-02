// translator.js — Factory-based translation engine
// Supports: "google" (free), "ai" (OpenAI-compatible API), "none" (passthrough)

import { googleTranslate } from './google-translate.js';

/**
 * Returns true if text is primarily English (>60% ASCII letters/digits)
 */
export function isEnglish(text) {
  if (!text) return false;
  const asciiChars = text.match(/[a-zA-Z0-9\s.,!?;:'"()\-\/]/g) || [];
  return asciiChars.length / text.length > 0.6;
}

/**
 * Create a translator object based on config.
 * @param {{ translator?: string, ai?: { apiKey: string, model: string, baseUrl: string } }} config
 * @returns {{ translate(text: string): Promise<string|null>, isEnglish(text: string): boolean }}
 */
export function createTranslator(config) {
  const engine = config.translator || 'google';

  const obj = { isEnglish };

  if (engine === 'none') {
    obj.translate = async () => null;
    console.log('[Translator] Engine: none (no translation)');
    return obj;
  }

  if (engine === 'ai') {
    const ai = config.ai || {};
    if (!ai.apiKey) {
      console.warn('[Translator] Engine "ai" selected but ai.apiKey is empty — falling back to none');
      obj.translate = async () => null;
      return obj;
    }
    obj.translate = (text) => aiTranslate(text, ai);
    console.log(`[Translator] Engine: ai (${ai.model || 'unknown'} @ ${ai.baseUrl || 'unknown'})`);
    return obj;
  }

  // Default: google
  obj.translate = (text) => {
    if (!text || !isEnglish(text)) return Promise.resolve(null);
    return googleTranslate(text);
  };
  console.log('[Translator] Engine: google (free)');
  return obj;
}

/**
 * AI translation via OpenAI-compatible API (Grok, GPT, Claude, DeepSeek, etc.)
 */
async function aiTranslate(text, ai) {
  if (!text) return text;
  if (!isEnglish(text)) return null;

  try {
    const res = await fetch(`${ai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ai.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ai.model,
        messages: [
          {
            role: 'system',
            content:
              '將以下加密貨幣新聞/推文翻譯成繁體中文，保留幣種名稱、數字、專有名詞和 @username。簡潔翻譯，不要加解釋。',
          },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      console.error('[Translator] AI API error:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error('[Translator] Error:', e.message);
    return null;
  }
}

// Legacy export for backward compatibility
export class Translator {
  constructor(config) {
    const t = createTranslator({ translator: 'ai', ai: config });
    this.isEnglish = t.isEnglish;
    this.translate = t.translate;
  }
}
