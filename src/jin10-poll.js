// Jin10 flash news poller — fetches real-time financial news via REST API

import * as OpenCC from 'opencc-js';

const FLASH_API = 'https://flash-api.jin10.com/get_flash_list?channel=-8200&vip=1';
const HEADERS = {
  'x-app-id': 'bVBF4FyRTn5NJF5n',
  'x-version': '1.0.0',
  'User-Agent': 'Mozilla/5.0',
};
const converter = OpenCC.Converter({ from: 'cn', to: 'twp' });

export class Jin10Poller {
  constructor(config, { onBatch }) {
    this.onBatch = onBatch;
    this.pollInterval = config.pollIntervalMs || 15000;
    this.onlyImportant = config.onlyImportant ?? true;

    this.seenIds = new Set();
    this._timer = null;
    this._stopped = false;
  }

  async start() {
    this._stopped = false;
    await this._poll(true);
    this._timer = setInterval(() => this._poll(false), this.pollInterval);
    const mode = this.onlyImportant ? 'important only' : 'all';
    console.log(`[Jin10] Started — polling every ${this.pollInterval / 1000}s (${mode})`);
  }

  stop() {
    this._stopped = true;
    if (this._timer) clearInterval(this._timer);
  }

  async _poll(firstRun) {
    try {
      const res = await fetch(FLASH_API, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const items = json.data || [];

      const batch = [];
      for (const item of items) {
        if (!item.id || this.seenIds.has(item.id)) continue;
        this.seenIds.add(item.id);

        if (firstRun) continue;
        if (this.onlyImportant && !item.important) continue;

        const raw = item.data?.content;
        if (!raw) continue;

        // Convert <br/> to newline first, then strip remaining HTML
        const clean = raw.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();

        // Extract title + body from various formats
        let title = '';
        let body = '';
        const bracketMatch = clean.match(/^【(.+?)】(.+)/s);
        if (bracketMatch) {
          // Format: 【title】body
          title = bracketMatch[1].trim();
          body = bracketMatch[2].trim();
        } else if (!clean.includes('\n')) {
          // Single line: try bold title pattern (title——body)
          const dashMatch = clean.match(/^(.+?)[——]+(.+)/s);
          if (dashMatch && dashMatch[1].length <= 30) {
            title = dashMatch[1].trim();
            body = dashMatch[2].trim();
          } else {
            body = clean;
          }
        } else {
          // Multi-line (summary digest) — keep as-is
          body = clean;
        }

        batch.push({
          id: item.id,
          time: item.time,
          title: converter(title),
          content: converter(body || title),
          important: item.important,
          link: item.data.source_link || '',
        });
      }

      if (firstRun) {
        console.log(`[Jin10] First run — ${this.seenIds.size} existing items marked as seen`);
      } else if (batch.length > 0) {
        this.onBatch(batch);
      }

      if (this.seenIds.size > 5000) {
        const arr = [...this.seenIds];
        this.seenIds = new Set(arr.slice(-3000));
      }
    } catch (e) {
      console.error('[Jin10] Error:', e.message);
    }
  }
}
