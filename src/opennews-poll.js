// opennews-poll.js — 6551 OpenNews API poller
// Fetches AI-rated news from ai.6551.io

export class OpenNewsPoller {
  constructor(config, fallbackToken, { onBatch }) {
    this.apiBase = config.apiBase || 'https://ai.6551.io';
    this.token = config.token || fallbackToken || '';
    this.pollInterval = config.pollIntervalMs || 60000;
    this.minScore = config.minScore ?? 70;
    this.signals = Array.isArray(config.signals) ? config.signals : [];
    this.coins = Array.isArray(config.coins) ? config.coins : [];
    this.engineTypes = Array.isArray(config.engineTypes) ? config.engineTypes : [];
    this.onBatch = onBatch;

    this._seen = new Set();
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
    if (!this.token) {
      console.error('[OpenNews] No token configured, cannot start');
      return;
    }
    await this._poll();
    this._timer = setInterval(() => this._poll(), this.pollInterval);
    console.log(`[OpenNews] Started — polling every ${this.pollInterval / 1000}s, minScore=${this.minScore}`);
  }

  stop() {
    this._stopped = true;
    if (this._timer) clearInterval(this._timer);
  }

  async _poll() {
    if (this._stopped) return;
    try {
      const body = {
        limit: 30,
        page: 1,
      };
      if (this.coins.length > 0) {
        body.coins = this.coins;
        body.has_coin = true;
      }
      if (this.engineTypes.length > 0) {
        // Format: { "news": [], "listing": [] } — empty array = all subtypes
        const etMap = {};
        for (const et of this.engineTypes) etMap[et] = [];
        body.engine_types = etMap;
      }

      const res = await fetch(`${this.apiBase}/open/news_search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const result = await res.json();
      const articles = result.data || result.items || [];

      // Filter by AI score and signal
      const filtered = articles.filter(a => {
        const rating = a.aiRating || {};
        const score = rating.score ?? 0;
        const signal = rating.signal || '';

        if (score < this.minScore) return false;
        if (this.signals.length > 0 && !this.signals.includes(signal)) return false;
        if (rating.status !== 'done') return false;
        return true;
      });

      // Deduplicate
      const newItems = [];
      for (const a of filtered) {
        const id = a.id || a._id;
        if (!id || this._seen.has(id)) continue;
        this._seen.add(id);
        if (!this._firstRun) newItems.push(a);
      }

      // Cap seen set
      if (this._seen.size > 2000) {
        const arr = [...this._seen];
        this._seen = new Set(arr.slice(-1000));
      }

      if (this._firstRun) {
        console.log(`[OpenNews] First run — ${this._seen.size} existing articles marked as seen`);
        this._firstRun = false;
        return;
      }

      if (newItems.length > 0) {
        this.onBatch(newItems);
      }
      this.health.lastSuccess = Date.now();
      this.health.consecutiveFailures = 0;
    } catch (e) {
      this.health.totalErrors++;
      this.health.consecutiveFailures++;
      this.health.lastError = Date.now();
      this.health.lastErrorMsg = e.message;
      console.error(`[OpenNews] Error (${this.health.consecutiveFailures}x):`, e.message);
    } finally {
      this.health.totalPolls++;
    }
  }
}
