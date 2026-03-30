// ccass-poll.js — CCASS shareholding change monitor
// Tracks major holder changes for configured HK stocks via HKEX CCASS disclosure

const CCASS_URL = 'https://www3.hkexnews.hk/sdw/search/searchsdw.aspx';

export class CcassPoller {
  constructor(config, { onBatch }) {
    this.onBatch = onBatch;
    this.pollInterval = config.pollIntervalMs || 3600000; // 1 hour default
    this.stockCodes = config.stockCodes || ['00700', '09988', '01810', '02318', '00005'];
    this.minChangePct = config.minChangePct ?? 0.5; // alert if holder changes >= 0.5%
    this.topN = config.topN || 10; // track top N holders

    this._prevData = new Map(); // stockCode -> [{id, name, pct}, ...]
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
    await this._pollAll();
    this._timer = setInterval(() => this._pollAll(), this.pollInterval);
    console.log(`[CCASS] Started — polling every ${this.pollInterval / 1000}s, tracking ${this.stockCodes.length} stocks`);
  }

  stop() {
    this._stopped = true;
    if (this._timer) clearInterval(this._timer);
  }

  async _pollAll() {
    if (this._stopped) return;
    const batch = [];

    try {
      const date = this._getLastTradingDate();

      // Fetch ViewState + cookies ONCE per poll cycle (fix I1: N+1 problem)
      const session = await this._initSession();
      if (!session) {
        throw new Error('Failed to initialize CCASS session');
      }

      for (const code of this.stockCodes) {
        if (this._stopped) break;
        try {
          const holders = await this._fetchCcass(code, date, session);
          if (!holders || holders.length === 0) continue;

          const top = holders.slice(0, this.topN);
          const prevTop = this._prevData.get(code);

          if (this._firstRun) {
            this._prevData.set(code, top);
            continue;
          }

          if (prevTop) {
            const changes = this._findChanges(prevTop, top, code);
            batch.push(...changes);
          }

          this._prevData.set(code, top);

          // Rate limit: 2 second delay between stocks
          await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
          console.error(`[CCASS] Error fetching ${code}:`, e.message);
        }
      }

      if (this._firstRun) {
        console.log(`[CCASS] First run — baseline captured for ${this._prevData.size} stocks`);
        this._firstRun = false;
      } else if (batch.length > 0) {
        this.onBatch(batch);
      }

      this.health.lastSuccess = Date.now();
      this.health.consecutiveFailures = 0;
    } catch (e) {
      this.health.totalErrors++;
      this.health.consecutiveFailures++;
      this.health.lastError = Date.now();
      this.health.lastErrorMsg = e.message;
      console.error(`[CCASS] Error (${this.health.consecutiveFailures}x):`, e.message);
    } finally {
      this.health.totalPolls++;
    }
  }

  /**
   * Initialize session: GET page once to extract ViewState + cookies.
   * Reused for all stocks in the same poll cycle. (fix C3 + I1)
   */
  async _initSession() {
    try {
      const pageRes = await fetch(CCASS_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
      });
      if (!pageRes.ok) throw new Error(`GET HTTP ${pageRes.status}`);

      const html = await pageRes.text();

      const vsMatch = html.match(/name="__VIEWSTATE"[^>]*value="([^"]+)"/);
      const vsgMatch = html.match(/name="__VIEWSTATEGENERATOR"[^>]*value="([^"]+)"/);
      const evMatch = html.match(/name="__EVENTVALIDATION"[^>]*value="([^"]+)"/);
      if (!vsMatch || !vsgMatch) throw new Error('ViewState not found');

      // Fix C3: Use getSetCookie() for proper multi-value cookie handling
      let cookies = '';
      if (typeof pageRes.headers.getSetCookie === 'function') {
        // Node 19+ / undici
        cookies = pageRes.headers.getSetCookie()
          .map(c => c.split(';')[0].trim())
          .filter(Boolean)
          .join('; ');
      } else {
        // Fallback: raw header (less reliable but works for simple cases)
        const raw = pageRes.headers.get('set-cookie') || '';
        cookies = raw.split(/,(?=\s*[A-Za-z_]+=)/)
          .map(c => c.split(';')[0].trim())
          .filter(Boolean)
          .join('; ');
      }

      return {
        viewState: vsMatch[1],
        viewStateGenerator: vsgMatch[1],
        eventValidation: evMatch ? evMatch[1] : null,
        cookies,
      };
    } catch (e) {
      console.error('[CCASS] Session init failed:', e.message);
      return null;
    }
  }

  /**
   * Fetch CCASS data for a single stock using pre-established session.
   */
  async _fetchCcass(stockCode, date, session) {
    const formFields = {
      '__VIEWSTATE': session.viewState,
      '__VIEWSTATEGENERATOR': session.viewStateGenerator,
      'sortBy': 'shareholding',
      'txtShareholdingDate': date,
      'txtStockCode': stockCode,
      'btnSearch': 'Search',
    };

    // Include __EVENTVALIDATION if present (fix C3)
    if (session.eventValidation) {
      formFields['__EVENTVALIDATION'] = session.eventValidation;
    }

    const formData = new URLSearchParams(formFields);

    const postRes = await fetch(CCASS_URL, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': CCASS_URL,
        'Cookie': session.cookies,
      },
      body: formData.toString(),
      redirect: 'follow',
    });
    if (!postRes.ok) throw new Error(`POST HTTP ${postRes.status}`);

    const result = await postRes.text();

    // Check for error page (holiday / no data)
    if (result.includes('No record found') || result.includes('系統繁忙')) {
      return []; // Graceful: no data for this date (holiday, etc.)
    }

    // Parse HTML table
    const tbodyMatch = result.match(/<tbody>([\s\S]*?)<\/tbody>/);
    if (!tbodyMatch) return [];

    const rows = tbodyMatch[1].match(/<tr>[\s\S]*?<\/tr>/g) || [];
    const holders = [];

    for (const row of rows) {
      const cells = [];
      const cellRe = /class="mobile-list-body">([^<]*)</g;
      let m;
      while ((m = cellRe.exec(row)) !== null) {
        cells.push(m[1].trim());
      }

      if (cells.length >= 4) {
        const pctMatch = cells[3].match(/([\d.]+)%/);
        holders.push({
          id: cells[0],
          name: cells[1],
          shares: cells[2].replace(/,/g, ''),
          pct: pctMatch ? parseFloat(pctMatch[1]) : 0,
        });
      }
    }

    return holders;
  }

  _findChanges(prevTop, currTop, stockCode) {
    const changes = [];
    const prevMap = new Map(prevTop.map(h => [h.id, h]));
    const currMap = new Map(currTop.map(h => [h.id, h]));

    for (const curr of currTop) {
      const prev = prevMap.get(curr.id);
      if (prev) {
        const delta = curr.pct - prev.pct;
        if (Math.abs(delta) >= this.minChangePct) {
          changes.push({
            stockCode,
            type: delta > 0 ? 'increase' : 'decrease',
            holderId: curr.id,
            holderName: curr.name,
            prevPct: prev.pct,
            currPct: curr.pct,
            deltaPct: delta,
          });
        }
      } else if (curr.pct >= this.minChangePct) {
        changes.push({
          stockCode,
          type: 'new_entry',
          holderId: curr.id,
          holderName: curr.name,
          prevPct: 0,
          currPct: curr.pct,
          deltaPct: curr.pct,
        });
      }
    }

    for (const prev of prevTop) {
      if (!currMap.has(prev.id) && prev.pct >= this.minChangePct) {
        changes.push({
          stockCode,
          type: 'exit',
          holderId: prev.id,
          holderName: prev.name,
          prevPct: prev.pct,
          currPct: 0,
          deltaPct: -prev.pct,
        });
      }
    }

    return changes;
  }

  /**
   * Get last trading date (yesterday, skip weekends).
   * Note: HK public holidays are NOT handled — CCASS will return empty
   * results on those days, which is handled gracefully in _fetchCcass().
   */
  _getLastTradingDate() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const dow = d.getDay();
    if (dow === 0) d.setDate(d.getDate() - 2);      // Sunday → Friday
    else if (dow === 6) d.setDate(d.getDate() - 1);  // Saturday → Friday
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}/${m}/${day}`;
  }
}
