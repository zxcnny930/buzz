// econ-calendar-poll.js — Economic calendar monitor
// Fetches high-impact economic events from FairEconomy (Forex Factory data)

const CALENDAR_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';

export class EconCalendarPoller {
  constructor(config, { onBatch }) {
    this.onBatch = onBatch;
    this.pollInterval = config.pollIntervalMs || 1800000; // 30 min default
    this.minImpact = config.minImpact || 'High'; // 'High', 'Medium', 'Low'
    this.countries = config.countries || ['USD', 'CNY', 'HKD', 'EUR', 'JPY', 'GBP', 'AUD'];
    this.alertBeforeMinutes = config.alertBeforeMinutes || 60; // alert N min before event

    this._seenAlerts = new Set(); // event IDs we've already alerted
    this._timer = null;
    this._stopped = false;
    this._lastEvents = [];

    this.health = {
      lastSuccess: null, lastError: null, lastErrorMsg: '',
      consecutiveFailures: 0, totalPolls: 0, totalErrors: 0,
    };
  }

  async start() {
    this._stopped = false;
    await this._poll();
    this._timer = setInterval(() => this._poll(), this.pollInterval);
    console.log(`[EconCal] Started — polling every ${this.pollInterval / 1000}s, impact>=${this.minImpact}`);
  }

  stop() {
    this._stopped = true;
    if (this._timer) clearInterval(this._timer);
  }

  async _poll() {
    if (this._stopped) return;
    try {
      const res = await fetch(CALENDAR_URL, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const events = await res.json();
      if (!Array.isArray(events)) throw new Error('Invalid response format');

      // Filter by impact and country
      const impactOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const minLevel = impactOrder[this.minImpact] || 3;

      const filtered = events.filter(e => {
        const level = impactOrder[e.impact] || 0;
        if (level < minLevel) return false;
        if (this.countries.length > 0 && !this.countries.includes(e.country)) return false;
        return true;
      });

      this._lastEvents = filtered;

      // Find upcoming events within alert window
      const now = Date.now();
      const alertWindow = this.alertBeforeMinutes * 60 * 1000;
      const batch = [];

      for (const event of filtered) {
        const eventTime = new Date(event.date).getTime();
        if (isNaN(eventTime)) continue;

        const timeUntil = eventTime - now;
        const eventId = `${event.date}_${event.country}_${event.title}`;

        // Alert if event is within alert window and hasn't been alerted
        if (timeUntil > 0 && timeUntil <= alertWindow && !this._seenAlerts.has(eventId)) {
          this._seenAlerts.add(eventId);
          batch.push({
            title: event.title,
            country: event.country,
            impact: event.impact,
            date: event.date,
            forecast: event.forecast || '',
            previous: event.previous || '',
            minutesUntil: Math.round(timeUntil / 60000),
          });
        }

        // Also alert when actual data is released (event just passed, has actual)
        if (timeUntil < 0 && timeUntil > -this.pollInterval && event.actual) {
          const actualId = `actual_${eventId}`;
          if (!this._seenAlerts.has(actualId)) {
            this._seenAlerts.add(actualId);
            batch.push({
              title: event.title,
              country: event.country,
              impact: event.impact,
              date: event.date,
              forecast: event.forecast || '',
              previous: event.previous || '',
              actual: event.actual,
              minutesUntil: 0,
              isRelease: true,
            });
          }
        }
      }

      // Trim seen set — keep recent half to avoid re-alerting
      if (this._seenAlerts.size > 500) {
        const arr = [...this._seenAlerts];
        this._seenAlerts = new Set(arr.slice(-250));
      }

      if (batch.length > 0) {
        this.onBatch(batch);
      }

      this.health.lastSuccess = Date.now();
      this.health.consecutiveFailures = 0;
    } catch (e) {
      this.health.totalErrors++;
      this.health.consecutiveFailures++;
      this.health.lastError = Date.now();
      this.health.lastErrorMsg = e.message;
      console.error(`[EconCal] Error (${this.health.consecutiveFailures}x):`, e.message);
    } finally {
      this.health.totalPolls++;
    }
  }

  /** Get upcoming high-impact events (for external queries) */
  getUpcoming(hours = 24) {
    const now = Date.now();
    const window = hours * 3600000;
    return this._lastEvents.filter(e => {
      const t = new Date(e.date).getTime();
      return t > now && t < now + window;
    });
  }
}
