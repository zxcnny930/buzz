// dashboard/server.js — HTTP + SSE server for news dashboard (zero dependencies)

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

export class DashboardServer {
  constructor(bus, config, cfgMgr, registry) {
    this.bus = bus;
    this.port = config.port || 3848;
    this.password = config.password || '';
    this.cfgMgr = cfgMgr;
    this.registry = registry;
    this._clients = new Set();
    this._server = null;

    // Listen for config changes to update password in real-time
    if (this.cfgMgr) {
      this.cfgMgr.on('change', ({ changedSections }) => {
        if (changedSections.includes('dashboard')) {
          const dashCfg = this.cfgMgr.getSection('dashboard');
          this.password = dashCfg.password || '';
          console.log('[Dashboard] Password updated');
        }
      });
    }
  }

  start() {
    this._server = createServer((req, res) => this._handle(req, res));
    this._server.listen(this.port, () => {
      console.log(`[Dashboard] Listening on http://0.0.0.0:${this.port}`);
    });

    // Subscribe to event bus
    this.bus.on('event', (event) => this._broadcast(event));
  }

  stop() {
    for (const client of this._clients) {
      client.end();
    }
    this._clients.clear();
    if (this._server) this._server.close();
  }

  // ─── Request handler ───

  _handle(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);

    // Handle CORS preflight for /api/*
    if (req.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    // Password check (if configured)
    if (this.password) {
      const pw = url.searchParams.get('pw');
      if (pw !== this.password) {
        // Allow SSE with password in query
        if (url.pathname !== '/sse' || pw !== this.password) {
          // Check if it's a static file request without pw — still allow, password checked on page load
          if (url.pathname === '/sse') {
            res.writeHead(401, { 'Content-Type': 'text/plain' });
            res.end('Unauthorized');
            return;
          }
        }
      }
    }

    // API routes (auth required)
    if (url.pathname.startsWith('/api/')) {
      return this._handleAPI(req, res, url);
    }

    // SSE endpoint
    if (url.pathname === '/sse') {
      return this._handleSSE(req, res, url);
    }

    // Health check
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, clients: this._clients.size, history: this.bus.history.length }));
      return;
    }

    // Static files
    this._serveStatic(url.pathname, res);
  }

  // ─── API handler ───

  async _handleAPI(req, res, url) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Auth check for all /api/* routes
    const pw = url.searchParams.get('pw');
    if (this.password && pw !== this.password) {
      res.writeHead(401, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ ok: false, error: 'Unauthorized' }));
      return;
    }

    // GET /api/config
    if (url.pathname === '/api/config' && req.method === 'GET') {
      if (!this.cfgMgr) {
        res.writeHead(501, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ ok: false, error: 'ConfigManager not available' }));
        return;
      }
      const config = this.cfgMgr.get();
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify(config));
      return;
    }

    // POST /api/config
    if (url.pathname === '/api/config' && req.method === 'POST') {
      if (!this.cfgMgr) {
        res.writeHead(501, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ ok: false, error: 'ConfigManager not available' }));
        return;
      }
      try {
        const body = await this._readBody(req);
        delete body._pw;
        const validation = this._validateConfig(body);
        if (!validation.valid) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ ok: false, errors: validation.errors }));
          return;
        }
        this.cfgMgr.update(body);
        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
      return;
    }

    // GET /api/status
    if (url.pathname === '/api/status' && req.method === 'GET') {
      const status = this.registry ? this.registry.getStatus() : {};
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify(status));
      return;
    }

    // POST /api/kols — KOL management (add/remove/list) for Discord bot integration
    if (url.pathname === '/api/kols' && req.method === 'POST') {
      if (!this.cfgMgr) {
        res.writeHead(501, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ ok: false, error: 'ConfigManager not available' }));
        return;
      }
      try {
        const body = await this._readBody(req);
        const config = this.cfgMgr.get();
        const kols = Array.isArray(config.x6551?.kols) ? [...config.x6551.kols] : [];

        if (body.action === 'list') {
          res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ ok: true, kols }));
          return;
        }

        const username = (body.username || '').trim().replace(/^@/, '');
        if (!username) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ ok: false, error: 'Missing username' }));
          return;
        }

        if (body.action === 'add') {
          if (kols.includes(username)) {
            res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
            res.end(JSON.stringify({ ok: true, message: 'already exists', kols }));
            return;
          }
          kols.push(username);
        } else if (body.action === 'remove') {
          const idx = kols.indexOf(username);
          if (idx === -1) {
            res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
            res.end(JSON.stringify({ ok: false, error: 'not found', kols }));
            return;
          }
          kols.splice(idx, 1);
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ ok: false, error: 'Invalid action. Use: add, remove, list' }));
          return;
        }

        // Update config — triggers hot-reload of X poller
        this.cfgMgr.update({ x6551: { kols } });
        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ ok: true, kols }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
      return;
    }

    // GET /api/source-health — returns health metrics for all pollers
    if (url.pathname === '/api/source-health' && req.method === 'GET') {
      const health = this.registry ? this.registry.getHealth() : {};
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ ok: true, sources: health, timestamp: new Date().toISOString() }));
      return;
    }

    // GET /api/news — return recent news events for AI analysis
    if (url.pathname === '/api/news' && req.method === 'GET') {
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
      const since = parseInt(url.searchParams.get('since') || '0', 10);
      let events = this.bus.getHistory();
      if (since > 0) {
        events = events.filter(e => e.ts > since);
      }
      events = events.slice(-limit);
      // Flatten for AI consumption
      const items = events.map(e => ({
        source: e.source,
        time: new Date(e.ts).toISOString(),
        title: e.data?.title || e.data?.content || '',
        url: e.data?.url || '',
      }));
      res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
      res.end(JSON.stringify({ ok: true, count: items.length, items }));
      return;
    }

    // Unknown API route
    res.writeHead(404, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ ok: false, error: 'Not found' }));
  }

  // ─── Body parser ───

  async _readBody(req) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString()));
        } catch (e) {
          reject(new Error('Invalid JSON'));
        }
      });
      req.on('error', reject);
    });
  }

  // ─── Config validation ───

  _validateConfig(partial) {
    const errors = [];

    const checkMin = (obj, key, min, label) => {
      if (obj[key] !== undefined && obj[key] < min) {
        errors.push(`${label || key} must be >= ${min}`);
      }
    };

    const checkRange = (obj, key, min, max, label) => {
      if (obj[key] !== undefined && (obj[key] < min || obj[key] > max)) {
        errors.push(`${label || key} must be ${min}-${max}`);
      }
    };

    const checkPositive = (obj, key, label) => {
      if (obj[key] !== undefined && obj[key] <= 0) {
        errors.push(`${label || key} must be > 0`);
      }
    };

    const checkUrl = (value, label) => {
      if (value !== undefined && typeof value === 'string' && !value.startsWith('http://') && !value.startsWith('https://')) {
        errors.push(`${label} must start with http:// or https://`);
      }
    };

    // Top-level poll intervals
    for (const section of Object.values(partial)) {
      if (section && typeof section === 'object') {
        if ('pollIntervalMs' in section) checkMin(section, 'pollIntervalMs', 5000, `${Object.keys(partial).find(k => partial[k] === section)}.pollIntervalMs`);
        if ('marketRefreshMs' in section) checkMin(section, 'marketRefreshMs', 60000, `${Object.keys(partial).find(k => partial[k] === section)}.marketRefreshMs`);
        if ('cooldownMs' in section) checkMin(section, 'cooldownMs', 60000, `${Object.keys(partial).find(k => partial[k] === section)}.cooldownMs`);
      }
    }

    // Polymarket specific
    if (partial.polymarket) {
      const pm = partial.polymarket;
      if ('zThreshold' in pm) checkPositive(pm, 'zThreshold', 'polymarket.zThreshold');
      if ('volSpikeThreshold' in pm) checkPositive(pm, 'volSpikeThreshold', 'polymarket.volSpikeThreshold');
      if ('minLiquidity' in pm) checkMin(pm, 'minLiquidity', 0, 'polymarket.minLiquidity');
    }

    // Dashboard port
    if (partial.dashboard && 'port' in partial.dashboard) {
      checkRange(partial.dashboard, 'port', 1024, 65535, 'dashboard.port');
    }

    // URL fields
    for (const [sectionKey, section] of Object.entries(partial)) {
      if (section && typeof section === 'object') {
        for (const [key, value] of Object.entries(section)) {
          if ((key === 'webhookUrl' || key === 'url' || key === 'apiUrl' || key === 'apiBase' || key === 'baseUrl') && typeof value === 'string' && value !== '') {
            checkUrl(value, `${sectionKey}.${key}`);
          }
        }
      }
    }

    // RSS feed URLs (rssFeeds array)
    if (Array.isArray(partial.rssFeeds)) {
      for (let i = 0; i < partial.rssFeeds.length; i++) {
        const feed = partial.rssFeeds[i];
        if (feed && typeof feed === 'object') {
          if (feed.feedUrl && typeof feed.feedUrl === 'string' && feed.feedUrl !== '') {
            checkUrl(feed.feedUrl, `rssFeeds[${i}].feedUrl`);
          }
          if ('pollIntervalMs' in feed) checkMin(feed, 'pollIntervalMs', 5000, `rssFeeds[${i}].pollIntervalMs`);
        }
      }
    }

    return errors.length === 0 ? { valid: true } : { valid: false, errors };
  }

  // ─── SSE handler ───

  _handleSSE(req, res, url) {
    // Password check for SSE
    if (this.password && url.searchParams.get('pw') !== this.password) {
      res.writeHead(401, { 'Content-Type': 'text/plain' });
      res.end('Unauthorized');
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no',
      'Content-Encoding': 'none',
    });

    // Register client BEFORE sending history to avoid race condition
    // (events arriving between history send and registration would be lost)
    this._clients.add(res);
    console.log(`[Dashboard] SSE client connected (${this._clients.size} total)`);

    // Send history (client is already registered, so new events during replay won't be lost)
    const history = this.bus.getHistory();
    for (const event of history) {
      res.write(`id: ${event.id}\ndata: ${JSON.stringify(event)}\n\n`);
    }

    // Heartbeat every 15s (Cloudflare tunnels may drop idle connections)
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 15000);

    req.on('close', () => {
      this._clients.delete(res);
      clearInterval(heartbeat);
      console.log(`[Dashboard] SSE client disconnected (${this._clients.size} remaining)`);
    });
  }

  // ─── Broadcast event to all SSE clients ───

  _broadcast(event) {
    const data = `id: ${event.id}\ndata: ${JSON.stringify(event)}\n\n`;
    for (const client of this._clients) {
      client.write(data);
    }
  }

  // ─── Static file server ───

  _serveStatic(pathname, res) {
    if (pathname === '/') pathname = '/index.html';

    const filePath = resolve(PUBLIC_DIR, pathname.slice(1));

    // Prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    try {
      const content = readFileSync(filePath);
      const ext = extname(filePath);
      const contentType = MIME[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  }
}
