// Grok translation — detects English content and translates to Traditional Chinese

export class Translator {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseUrl = config.baseUrl;
  }

  // Returns true if text is primarily English (>60% ASCII letters/digits)
  isEnglish(text) {
    if (!text) return false;
    const asciiChars = text.match(/[a-zA-Z0-9\s.,!?;:'"()\-\/]/g) || [];
    return asciiChars.length / text.length > 0.6;
  }

  async translate(text) {
    if (!text) return text;
    if (!this.isEnglish(text)) return null; // null = no translation needed

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
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
        console.error('[Translator] Grok API error:', res.status, await res.text());
        return null;
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim() || null;
    } catch (e) {
      console.error('[Translator] Error:', e.message);
      return null;
    }
  }
}
