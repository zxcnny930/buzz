// X (Twitter) KOL poller — polls 6551 API for KOL posts, syncs KOL list from Worker

export class XPoller {
  constructor(xConfig, workerConfig, { onPost }) {
    this.apiBase = xConfig.apiBase;
    this.token = xConfig.token;
    this.pollInterval = xConfig.pollIntervalMs;
    this.kolSyncInterval = xConfig.kolSyncIntervalMs;
    this.workerUrl = workerConfig.url;
    this.onPost = onPost;

    // Use config KOL list if provided, otherwise fallback to worker sync
    this.configKols = Array.isArray(xConfig.kols) && xConfig.kols.length > 0 ? xConfig.kols : null;
    this.kols = this.configKols ? [...this.configKols] : ['_FORAB'];
    this.seenPosts = new Set();
    this._pollTimer = null;
    this._syncTimer = null;
    this._stopped = false;

    this.health = {
      lastSuccess: null, lastError: null, lastErrorMsg: '',
      consecutiveFailures: 0, totalPolls: 0, totalErrors: 0,
    };
  }

  async start() {
    this._stopped = false;

    if (this.configKols) {
      // Use config-provided KOL list (no worker sync needed)
      this.kols = [...this.configKols];
      console.log(`[X] Using config KOL list: [${this.kols.join(', ')}]`);
    } else {
      // Fallback: sync from worker
      await this._syncKols();
    }

    // Initial poll
    await this._pollAll();
    // Start intervals
    this._pollTimer = setInterval(() => this._pollAll(), this.pollInterval);

    // Only start KOL sync if not using config list
    if (!this.configKols) {
      this._syncTimer = setInterval(() => this._syncKols(), this.kolSyncInterval);
    }

    console.log(`[X] Started — polling ${this.kols.length} KOLs every ${this.pollInterval / 1000}s`);
  }

  stop() {
    this._stopped = true;
    if (this._pollTimer) clearInterval(this._pollTimer);
    if (this._syncTimer) clearInterval(this._syncTimer);
  }

  async _syncKols() {
    try {
      const res = await fetch(`${this.workerUrl}/kols`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.kols) && data.kols.length > 0) {
        this.kols = data.kols;
        console.log(`[X] Synced KOL list: [${this.kols.join(', ')}]`);
      }
    } catch (e) {
      console.error('[X] KOL sync failed:', e.message);
    }
  }

  async _pollAll() {
    let anySuccess = false;
    for (const kol of this.kols) {
      if (this._stopped) return;
      try {
        await this._pollKol(kol);
        anySuccess = true;
      } catch (e) {
        this.health.totalErrors++;
        this.health.lastError = Date.now();
        this.health.lastErrorMsg = `@${kol}: ${e.message}`;
        console.error(`[X] Error polling @${kol}:`, e.message);
      }
    }
    this.health.totalPolls++;
    if (anySuccess) {
      this.health.lastSuccess = Date.now();
      this.health.consecutiveFailures = 0;
    } else if (this.kols.length > 0) {
      this.health.consecutiveFailures++;
    }
  }

  async _pollKol(username) {
    const res = await fetch(`${this.apiBase}/open/twitter_user_tweets`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        maxResults: 10,
        product: 'Latest',
        includeReplies: false,
        includeRetweets: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const result = await res.json();
    const posts = result.data || [];

    for (const post of posts) {
      const postId = post.id || post.tweetId || post.rest_id;
      if (!postId) continue;

      if (this.seenPosts.has(postId)) continue;
      this.seenPosts.add(postId);

      // On first run, mark as seen but don't notify (avoid flood)
      if (this.seenPosts._firstRun) continue;

      this.onPost({ username, post });
    }

    // After first poll of all KOLs, clear first-run flag
    if (!this.seenPosts._initialized) {
      this.seenPosts._initialized = true;
    }
  }
}

// Patch: track first run to avoid initial flood
const origStart = XPoller.prototype.start;
XPoller.prototype.start = async function () {
  this.seenPosts._firstRun = true;
  await origStart.call(this);
  this.seenPosts._firstRun = false;
  console.log(`[X] First run complete — ${this.seenPosts.size} existing posts marked as seen`);
};
