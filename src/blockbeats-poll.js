// BlockBeats flash news poller — free crypto news API, similar to jin10

const FLASH_API = 'https://api.theblockbeats.news/v1/open-api/open-flash';

export class BlockBeatsPoller {
  constructor(config, { onBatch }) {
    this.onBatch = onBatch;
    this.pollInterval = config.pollIntervalMs || 30000;
    this.onlyImportant = config.onlyImportant ?? false;
    this.lang = config.lang || 'cht';

    this.seenIds = new Set();
    this._timer = null;
    this._stopped = false;
  }

  async start() {
    this._stopped = false;
    await this._poll(true);
    this._timer = setInterval(() => this._poll(false), this.pollInterval);
    const mode = this.onlyImportant ? 'important only' : 'all';
    console.log(`[BlockBeats] Started — polling every ${this.pollInterval / 1000}s (${mode}, ${this.lang})`);
  }

  stop() {
    this._stopped = true;
    if (this._timer) clearInterval(this._timer);
  }

  async _poll(firstRun) {
    try {
      const params = new URLSearchParams({
        size: '20',
        page: '1',
        lang: this.lang,
      });
      if (this.onlyImportant) params.set('type', 'push');

      const res = await fetch(`${FLASH_API}?${params}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      if (json.status !== 0) throw new Error(`API status ${json.status}: ${json.message}`);

      const items = json.data?.data || [];

      const batch = [];
      for (const item of items) {
        if (!item.id || this.seenIds.has(item.id)) continue;
        this.seenIds.add(item.id);

        if (firstRun) continue;

        // Strip HTML tags from content
        const content = (item.content || '').replace(/<[^>]+>/g, '').trim();
        if (!content) continue;

        batch.push({
          id: item.id,
          title: item.title || '',
          content,
          link: item.link || '',
          sourceUrl: item.url || '',
          time: item.create_time ? new Date(Number(item.create_time) * 1000) : new Date(),
        });
      }

      if (firstRun) {
        console.log(`[BlockBeats] First run — ${this.seenIds.size} existing items marked as seen`);
      } else if (batch.length > 0) {
        this.onBatch(batch);
      }

      // Trim seen set
      if (this.seenIds.size > 5000) {
        const arr = [...this.seenIds];
        this.seenIds = new Set(arr.slice(-3000));
      }
    } catch (e) {
      console.error('[BlockBeats] Error:', e.message);
    }
  }
}
