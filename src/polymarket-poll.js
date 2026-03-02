// polymarket-poll.js — Polymarket spike monitor (price + volume)
// Uses Gamma API for market list, CLOB API for price history

const GAMMA_API = 'https://gamma-api.polymarket.com/markets';
const CLOB_API = 'https://clob.polymarket.com';

export class PolymarketPoller {
  constructor(config, { onSpike }) {
    this.onSpike = onSpike;
    this.pollInterval = config.pollIntervalMs || 180000;       // 3 min
    this.marketRefresh = config.marketRefreshMs || 600000;      // 10 min
    this.zThreshold = config.zThreshold ?? 2.5;
    this.minChangePp = config.minChangePp ?? 5;                  // min 5 percentage points
    this.volSpikeThreshold = config.volSpikeThreshold || 2.0;   // 200%
    this.minLiquidity = config.minLiquidity || 10000;
    this.rollingWindow = config.rollingWindowMinutes || 30;
    this.cooldownMs = config.cooldownMs || 900000;              // 15 min
    this.tagIds = Array.isArray(config.tagIds) ? config.tagIds : [];
    this.excludeTagIds = Array.isArray(config.excludeTagIds) ? config.excludeTagIds : [];

    this.markets = [];           // { id, question, slug, tokens, volume24h }
    this._prevVolumes = new Map(); // tokenId → last known 24h volume
    this._cooldowns = new Map(); // tokenId → last alert timestamp
    this._pollTimer = null;
    this._refreshTimer = null;
    this._stopped = false;
  }

  async start() {
    this._stopped = false;
    await this._refreshMarkets();
    this._refreshTimer = setInterval(() => this._refreshMarkets(), this.marketRefresh);

    // Wait a beat then start price polling
    await this._pollAll();
    this._pollTimer = setInterval(() => this._pollAll(), this.pollInterval);

    console.log(`[Polymarket] Started — ${this.markets.length} markets, polling every ${this.pollInterval / 1000}s`);
  }

  stop() {
    this._stopped = true;
    if (this._pollTimer) clearInterval(this._pollTimer);
    if (this._refreshTimer) clearInterval(this._refreshTimer);
  }

  // ─── Market list refresh via Gamma API ───

  async _refreshMarkets() {
    try {
      // If tagIds specified, fetch each tag separately and merge
      if (this.tagIds.length > 0) {
        const allMarkets = new Map();
        for (const tagId of this.tagIds) {
          let url = `${GAMMA_API}?closed=false&active=true&limit=100&order=liquidityNum&ascending=false&tag_id=${tagId}`;
          const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (!res.ok) { console.error(`[Polymarket] Gamma tag ${tagId} HTTP ${res.status}`); continue; }
          const data = await res.json();
          for (const m of (data || [])) allMarkets.set(m.id, m);
          await sleep(50);
        }
        this._processMarkets(Array.from(allMarkets.values()));
      } else {
        let url = `${GAMMA_API}?closed=false&active=true&limit=100&order=liquidityNum&ascending=false`;
        for (const exId of this.excludeTagIds) url += `&exclude_tag_id=${exId}`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) throw new Error(`Gamma HTTP ${res.status}`);
        const data = await res.json();
        this._processMarkets(data || []);
      }

      console.log(`[Polymarket] Refreshed markets — ${this.markets.length} active (min liq $${this.minLiquidity})`);
    } catch (e) {
      console.error('[Polymarket] Market refresh error:', e.message);
    }
  }

  _processMarkets(data) {
    this.markets = data
      .filter(m => {
        const liq = Number(m.liquidityNum || m.liquidity || 0);
        return liq >= this.minLiquidity && m.clobTokenIds;
      })
      .map(m => {
        const tokenIds = typeof m.clobTokenIds === 'string'
          ? JSON.parse(m.clobTokenIds) : m.clobTokenIds || [];
        let outcomes = [];
        try { outcomes = typeof m.outcomes === 'string' ? JSON.parse(m.outcomes) : m.outcomes || []; } catch {}
        return {
          id: m.id,
          question: m.question || m.title || '',
          slug: m.slug || '',
          eventSlug: m.events?.[0]?.slug || m.slug || '',
          eventTitle: m.events?.[0]?.title || '',
          groupItemTitle: m.groupItemTitle || '',
          clobTokenIds: tokenIds,
          outcomes,
          volume24h: Number(m.volume24hr || 0),
          liquidity: Number(m.liquidityNum || m.liquidity || 0),
        };
      });
  }

  // ─── Poll all markets for price spikes ───

  async _pollAll() {
    if (this._stopped || this.markets.length === 0) return;

    let checked = 0;
    let spikeCount = 0;

    for (const market of this.markets) {
      if (this._stopped) break;

      for (let ti = 0; ti < market.clobTokenIds.length; ti++) {
        const tokenId = market.clobTokenIds[ti];
        try {
          const spike = await this._checkToken(market, tokenId, ti);
          if (spike) spikeCount++;
          checked++;
        } catch (e) {
          // Silently skip individual token errors
        }

        // Small delay to stay within rate limits (~20ms between requests)
        await sleep(20);
      }

      // Check volume spike
      this._checkVolume(market);
    }

    if (spikeCount > 0) {
      console.log(`[Polymarket] Poll done — ${checked} tokens checked, ${spikeCount} spikes detected`);
    }
  }

  // ─── Check single token for price spike ───

  async _checkToken(market, tokenId, tokenIndex) {
    // Check cooldown
    const lastAlert = this._cooldowns.get(tokenId) || 0;
    if (Date.now() - lastAlert < this.cooldownMs) return false;

    // Fetch 1-hour price history (1-min resolution)
    const endTs = Math.floor(Date.now() / 1000);
    const startTs = endTs - 3600; // 1 hour ago

    const url = `${CLOB_API}/prices-history?market=${tokenId}&startTs=${startTs}&endTs=${endTs}&fidelity=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return false;

    const data = await res.json();
    const history = data.history || [];

    if (history.length < this.rollingWindow + 2) return false;

    const prices = history.map(h => Number(h.p));
    const currentPrice = prices[prices.length - 1];

    // Compare to price at start of rolling window (e.g. 30 min ago)
    const lookbackIdx = Math.max(0, prices.length - 1 - this.rollingWindow);
    const basePrice = prices[lookbackIdx];

    if (basePrice <= 0 || currentPrice <= 0) return false;

    // Absolute change in percentage points (prices are 0-1 probabilities)
    const changePp = (currentPrice - basePrice) * 100;

    // Must exceed minimum percentage-point threshold
    if (Math.abs(changePp) < this.minChangePp) return false;

    // Optional z-score filter (skip if zThreshold is 0)
    let zScore = 0;
    if (this.zThreshold > 0) {
      const returns = [];
      for (let i = 1; i < prices.length; i++) {
        if (prices[i - 1] <= 0) continue;
        returns.push(Math.log(prices[i] / prices[i - 1]));
      }
      if (returns.length < this.rollingWindow + 1) return false;

      const windowReturns = returns.slice(-this.rollingWindow);
      const mean = windowReturns.reduce((a, b) => a + b, 0) / windowReturns.length;
      const variance = windowReturns.reduce((a, r) => a + (r - mean) ** 2, 0) / windowReturns.length;
      const stddev = Math.sqrt(variance);

      if (stddev < 0.001) return false;

      const latestReturn = returns[returns.length - 1];
      zScore = (latestReturn - mean) / stddev;

      if (Math.abs(zScore) < this.zThreshold) return false;
    }

    this._cooldowns.set(tokenId, Date.now());

    const ogImageUrl = `https://polymarket.com/api/og?eslug=${encodeURIComponent(market.eventSlug)}&tid=${Date.now()}`;
    const direction = changePp > 0 ? 'up' : 'down';
    const outcome = market.outcomes[tokenIndex] || `Token ${tokenIndex}`;

    const spike = {
      type: 'price',
      market,
      tokenId,
      outcome,
      currentPrice,
      prevPrice: basePrice,
      changePp: Number(changePp.toFixed(1)),
      changePct: Number(((currentPrice - basePrice) / basePrice * 100).toFixed(1)),
      zScore: Number(zScore.toFixed(2)),
      direction,
      ogImageUrl,
    };
    this.onSpike(spike);
    return true;
  }

  // ─── Check volume spike ───

  _checkVolume(market) {
    const key = market.id;
    const prev = this._prevVolumes.get(key);
    const current = market.volume24h;

    this._prevVolumes.set(key, current);

    if (prev == null || prev <= 0) return;

    const ratio = current / prev;
    if (ratio >= this.volSpikeThreshold) {
      // Check cooldown (use market id as key)
      const cooldownKey = `vol_${key}`;
      const lastAlert = this._cooldowns.get(cooldownKey) || 0;
      if (Date.now() - lastAlert < this.cooldownMs) return;

      this._cooldowns.set(cooldownKey, Date.now());

      this.onSpike({
        type: 'volume',
        market,
        prevVolume: prev,
        currentVolume: current,
        ratio: Number(ratio.toFixed(2)),
      });
    }
  }

}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
