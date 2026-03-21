// poller-registry.js — Manages poller lifecycle with hot-reload support

import { Jin10Poller } from './jin10-poll.js';
import { BlockBeatsPoller } from './blockbeats-poll.js';
import { RssPoller } from './rss-poll.js';
import { XPoller } from './x-poll.js';
import { PolymarketPoller } from './polymarket-poll.js';
import { OpenNewsPoller } from './opennews-poll.js';
import { HkexPoller } from './hkex-poll.js';
import { CcassPoller } from './ccass-poll.js';
import { EconCalendarPoller } from './econ-calendar-poll.js';
import { createTranslator } from './translator.js';
import { Notifier } from './notifier.js';

export class PollerRegistry {
  /**
   * @param {import('./config-manager.js').ConfigManager} cfgMgr
   * @param {{ notifier: Notifier, translator: Translator, bus: import('./event-bus.js').EventBus }} deps
   * @param {object} handlers — handler factories / callbacks
   */
  constructor(cfgMgr, deps, handlers) {
    this._cfgMgr = cfgMgr;
    this._deps = deps;
    this._handlers = handlers;

    /** @type {Map<string, { poller: object, config: object, health: object }>} */
    this._pollers = new Map();

    // Listen for config changes
    this._onConfigChange = this._onConfigChange.bind(this);
    cfgMgr.on('change', this._onConfigChange);
  }

  // ─── Public API ───

  startAll() {
    const config = this._cfgMgr.get();

    // Jin10
    if (this._isEnabled(config.jin10)) {
      this._createAndStart('jin10', () => {
        const poller = new Jin10Poller(config.jin10 || {}, { onBatch: this._handlers.handleJin10Batch });
        return { poller, config: config.jin10 };
      });
    }

    // BlockBeats
    if (this._isEnabled(config.blockbeats)) {
      this._createAndStart('blockbeats', () => {
        const poller = new BlockBeatsPoller(config.blockbeats || {}, { onBatch: this._handlers.handleBlockBeatsBatch });
        return { poller, config: config.blockbeats };
      });
    }

    // Polymarket
    if (this._isEnabled(config.polymarket)) {
      this._createAndStart('polymarket', () => {
        const poller = new PolymarketPoller(config.polymarket || {}, { onSpike: this._handlers.handlePolymarketSpike });
        return { poller, config: config.polymarket };
      });
    }

    // X
    if (this._isEnabled(config.x6551)) {
      this._createAndStart('x6551', () => {
        const poller = new XPoller(config.x6551, {}, { onPost: this._handlers.handleXPost });
        return { poller, config: config.x6551 };
      });
    }

    // OpenNews
    if (this._isEnabled(config.opennews)) {
      this._createAndStart('opennews', () => {
        const fallbackToken = config.x6551?.token || '';
        const poller = new OpenNewsPoller(config.opennews, fallbackToken, { onBatch: this._handlers.handleOpenNewsBatch });
        return { poller, config: config.opennews };
      });
    }

    // HKEX
    if (this._isEnabled(config.hkex)) {
      this._createAndStart('hkex', () => {
        const poller = new HkexPoller(config.hkex || {}, { onBatch: this._handlers.handleHkexBatch });
        return { poller, config: config.hkex };
      });
    }

    // CCASS
    if (this._isEnabled(config.ccass)) {
      this._createAndStart('ccass', () => {
        const poller = new CcassPoller(config.ccass || {}, { onBatch: this._handlers.handleCcassBatch });
        return { poller, config: config.ccass };
      });
    }

    // Economic Calendar
    if (this._isEnabled(config.econCalendar)) {
      this._createAndStart('econCalendar', () => {
        const poller = new EconCalendarPoller(config.econCalendar || {}, { onBatch: this._handlers.handleEconCalendarBatch });
        return { poller, config: config.econCalendar };
      });
    }

    // RSS feeds
    if (Array.isArray(config.rssFeeds)) {
      for (const feed of config.rssFeeds) {
        if (feed.enabled === false) continue;
        const key = `rss:${feed.feedUrl}`;
        this._createAndStart(key, () => {
          const poller = new RssPoller(feed, { onBatch: this._handlers.makeRssHandler(feed.name, feed.color) });
          return { poller, config: feed };
        });
      }
    }
  }

  stopAll() {
    for (const [name, entry] of this._pollers) {
      this._stopPoller(name, entry);
    }
    this._pollers.clear();
  }

  getStatus() {
    const status = {};
    for (const [name, entry] of this._pollers) {
      status[name] = {
        active: true,
        interval: entry.config?.pollIntervalMs || 0,
      };
    }
    return status;
  }

  /**
   * Returns health metrics for all pollers.
   * Combines poller-level health (if available) with registry-level tracking.
   */
  getHealth() {
    const now = Date.now();
    const health = {};
    for (const [name, entry] of this._pollers) {
      // Prefer poller's own health tracking (RssPoller has it)
      const ph = entry.poller.health || entry.health || {};
      const lastSuccess = ph.lastSuccess || null;
      const consecutiveFailures = ph.consecutiveFailures || 0;
      const ageMs = lastSuccess ? now - lastSuccess : null;

      // Determine status: ok / degraded / error
      let status = 'ok';
      if (consecutiveFailures >= 5) {
        status = 'error';
      } else if (consecutiveFailures >= 3 || (ageMs && ageMs > (entry.config?.pollIntervalMs || 300000) * 5)) {
        status = 'degraded';
      } else if (lastSuccess === null && ph.totalPolls > 0 && ph.totalErrors > 0) {
        status = 'error'; // polled but never succeeded
      }

      // Classify importance for alert severity
      const importance = this._getSourceImportance(name);

      health[name] = {
        status,
        importance,
        lastSuccess: lastSuccess ? new Date(lastSuccess).toISOString() : null,
        lastError: ph.lastError ? new Date(ph.lastError).toISOString() : null,
        lastErrorMsg: ph.lastErrorMsg || '',
        consecutiveFailures,
        totalPolls: ph.totalPolls || 0,
        totalErrors: ph.totalErrors || 0,
        successRate: ph.totalPolls > 0
          ? ((ph.totalPolls - (ph.totalErrors || 0)) / ph.totalPolls * 100).toFixed(1) + '%'
          : 'N/A',
        interval: entry.config?.pollIntervalMs || 0,
      };
    }
    return health;
  }

  /** Classify source importance for alert severity (P1=critical, P2=normal, P3=low) */
  _getSourceImportance(name) {
    // HK market sources are critical for trading
    if (name === 'jin10' || name === 'hkex' || name === 'ccass') return 'P1';
    if (/格隆汇|gelonghui|华尔街见闻|wallstreetcn/i.test(name)) return 'P1';
    // Core financial feeds
    if (/Investing|MarketWatch|Financial Times|SCMP/i.test(name)) return 'P2';
    if (['blockbeats', 'opennews', 'polymarket', 'econCalendar'].includes(name)) return 'P2';
    // Nice-to-have
    return 'P3';
  }

  // ─── Config change handler ───

  _onConfigChange({ changedSections }) {
    const config = this._cfgMgr.get();

    for (const section of changedSections) {
      try {
        switch (section) {
          case 'jin10':
            this._restartSimple('jin10', config.jin10, (cfg) =>
              new Jin10Poller(cfg, { onBatch: this._handlers.handleJin10Batch }),
            );
            break;

          case 'blockbeats':
            this._restartSimple('blockbeats', config.blockbeats, (cfg) =>
              new BlockBeatsPoller(cfg, { onBatch: this._handlers.handleBlockBeatsBatch }),
            );
            break;

          case 'polymarket':
            this._restartSimple('polymarket', config.polymarket, (cfg) =>
              new PolymarketPoller(cfg, { onSpike: this._handlers.handlePolymarketSpike }),
            );
            break;

          case 'x6551':
            this._restartSimple('x6551', config.x6551, (cfg) =>
              new XPoller(cfg, {}, { onPost: this._handlers.handleXPost }),
            );
            break;

          case 'opennews':
            this._restartSimple('opennews', config.opennews, (cfg) => {
              const fallbackToken = config.x6551?.token || '';
              return new OpenNewsPoller(cfg, fallbackToken, { onBatch: this._handlers.handleOpenNewsBatch });
            });
            break;

          case 'hkex':
            this._restartSimple('hkex', config.hkex, (cfg) =>
              new HkexPoller(cfg, { onBatch: this._handlers.handleHkexBatch }),
            );
            break;

          case 'ccass':
            this._restartSimple('ccass', config.ccass, (cfg) =>
              new CcassPoller(cfg, { onBatch: this._handlers.handleCcassBatch }),
            );
            break;

          case 'econCalendar':
            this._restartSimple('econCalendar', config.econCalendar, (cfg) =>
              new EconCalendarPoller(cfg, { onBatch: this._handlers.handleEconCalendarBatch }),
            );
            break;

          case 'rssFeeds':
            this._reloadRss(config.rssFeeds || []);
            break;

          case 'translator':
          case 'ai':
            console.log('[Registry] Recreating Translator...');
            this._deps.translator = createTranslator(config);
            break;

          case 'discord':
            console.log('[Registry] Recreating Notifier (discord changed)...');
            this._deps.notifier = new Notifier({
              discord: config.discord || {},
              telegram: config.telegram || {},
            });
            break;

          case 'telegram':
            console.log('[Registry] Recreating Notifier (telegram changed)...');
            this._deps.notifier = new Notifier({
              discord: config.discord || {},
              telegram: config.telegram || {},
            });
            break;

          case 'dashboard':
            // Dashboard handles its own reload via cfgMgr listener
            console.log('[Registry] Dashboard config changed (handled by dashboard server)');
            break;

          default:
            console.log(`[Registry] Unknown section changed: ${section}`);
        }
      } catch (err) {
        console.error(`[Registry] Error reloading ${section}:`, err.message);
      }
    }
  }

  // ─── Internal helpers ───

  _isEnabled(sectionConfig) {
    if (!sectionConfig) return false;
    return sectionConfig.enabled !== false;
  }

  _createAndStart(name, factory) {
    try {
      const entry = factory();
      // Ensure every poller entry has a health object for registry-level tracking
      if (!entry.poller.health) {
        entry.health = {
          lastSuccess: null,
          lastError: null,
          lastErrorMsg: '',
          consecutiveFailures: 0,
          totalPolls: 0,
          totalErrors: 0,
        };
      }
      this._pollers.set(name, entry);
      entry.poller.start().catch((e) => console.error(`[${name}] Failed to start:`, e.message));
      console.log(`[Registry] Started: ${name}`);
    } catch (err) {
      console.error(`[Registry] Failed to create ${name}:`, err.message);
    }
  }

  _stopPoller(name, entry) {
    try {
      entry.poller.stop();
      console.log(`[Registry] Stopped: ${name}`);
    } catch (err) {
      console.error(`[Registry] Error stopping ${name}:`, err.message);
    }
  }

  _restartSimple(name, sectionConfig, factory) {
    // Stop existing
    const existing = this._pollers.get(name);
    if (existing) {
      this._stopPoller(name, existing);
      this._pollers.delete(name);
    }

    // Only restart if enabled
    if (!this._isEnabled(sectionConfig)) {
      console.log(`[Registry] ${name} is disabled, not restarting`);
      return;
    }

    this._createAndStart(name, () => {
      const poller = factory(sectionConfig);
      return { poller, config: sectionConfig };
    });
  }

  _reloadRss(feeds) {
    // Collect current RSS poller keys
    const currentKeys = new Set();
    for (const key of this._pollers.keys()) {
      if (key.startsWith('rss:')) currentKeys.add(key);
    }

    // Desired keys from new config
    const desiredKeys = new Set();
    for (const feed of feeds) {
      if (feed.enabled === false) continue;
      desiredKeys.add(`rss:${feed.feedUrl}`);
    }

    // Stop removed feeds
    for (const key of currentKeys) {
      if (!desiredKeys.has(key)) {
        const entry = this._pollers.get(key);
        if (entry) this._stopPoller(key, entry);
        this._pollers.delete(key);
      }
    }

    // Create or restart feeds
    for (const feed of feeds) {
      if (feed.enabled === false) continue;
      const key = `rss:${feed.feedUrl}`;

      if (currentKeys.has(key)) {
        // Existing feed — restart with new config
        const entry = this._pollers.get(key);
        if (entry) this._stopPoller(key, entry);
        this._pollers.delete(key);
      }

      this._createAndStart(key, () => {
        const poller = new RssPoller(feed, { onBatch: this._handlers.makeRssHandler(feed.name, feed.color) });
        return { poller, config: feed };
      });
    }
  }
}
