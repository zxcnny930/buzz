// hkex-poll.js — HKEX announcement poller
// Fetches structured announcements from HKEX titleSearchServlet JSON API

const HKEX_API = 'https://www1.hkexnews.hk/search/titleSearchServlet.do';

export class HkexPoller {
  constructor(config, { onBatch }) {
    this.onBatch = onBatch;
    this.pollInterval = config.pollIntervalMs || 300000; // 5 min
    this.categories = config.categories || []; // empty = all
    this.market = config.market || 'MAINBOARD';

    this._seenIds = new Set();
    this._timer = null;
    this._stopped = false;
    this._firstRun = true;

    this.health = {
      lastSuccess: null, lastError: null, lastErrorMsg: '',
      consecutiveFailures: 0, totalPolls: 0, totalErrors: 0,
    };
  }

  async start() {
    this._stopped = false;
    await this._poll();
    this._timer = setInterval(() => this._poll(), this.pollInterval);
    console.log(`[HKEX] Started — polling every ${this.pollInterval / 1000}s, market=${this.market}`);
  }

  stop() {
    this._stopped = true;
    if (this._timer) clearInterval(this._timer);
  }

  async _poll() {
    if (this._stopped) return;
    try {
      const now = new Date();
      const toDate = this._formatDate(now);
      // Look back 2 days to catch after-hours filings
      const from = new Date(now.getTime() - 2 * 86400000);
      const fromDate = this._formatDate(from);

      const params = new URLSearchParams({
        sortDir: '0',
        sortByOptions: 'DateTime',
        category: '0', // 0 = all categories
        market: this.market,
        stockId: '-1',
        fromDate,
        toDate,
        tier: '',
        title: '',
        searchType: '0',
        lang: 'EN',
        t: 'en',
      });

      const res = await fetch(`${HKEX_API}?${params}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      let results = data.result || [];
      if (typeof results === 'string') results = JSON.parse(results);

      const batch = [];
      for (const item of results) {
        const id = item.NEWS_ID;
        if (!id || this._seenIds.has(id)) continue;
        this._seenIds.add(id);

        if (this._firstRun) continue;

        // Filter by category keywords if configured
        const longText = (item.LONG_TEXT || '').toLowerCase();
        if (this.categories.length > 0) {
          const match = this.categories.some(cat => longText.includes(cat.toLowerCase()));
          if (!match) continue;
        }

        batch.push({
          id,
          stockCode: item.STOCK_CODE || '',
          stockName: item.STOCK_NAME || '',
          title: item.TITLE || '',
          category: item.LONG_TEXT || item.SHORT_TEXT || '',
          dateTime: item.DATE_TIME || '',
          fileType: item.FILE_TYPE || '',
          fileLink: item.FILE_LINK || '',
        });
      }

      if (this._firstRun) {
        console.log(`[HKEX] First run — ${this._seenIds.size} existing announcements marked as seen`);
        this._firstRun = false;
      } else if (batch.length > 0) {
        this.onBatch(batch);
      }

      // Trim seen set
      if (this._seenIds.size > 5000) {
        const arr = [...this._seenIds];
        this._seenIds = new Set(arr.slice(-3000));
      }

      this.health.lastSuccess = Date.now();
      this.health.consecutiveFailures = 0;
    } catch (e) {
      this.health.totalErrors++;
      this.health.consecutiveFailures++;
      this.health.lastError = Date.now();
      this.health.lastErrorMsg = e.message;
      console.error(`[HKEX] Error (${this.health.consecutiveFailures}x):`, e.message);
    } finally {
      this.health.totalPolls++;
    }
  }

  _formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }
}
