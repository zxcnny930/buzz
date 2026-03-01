// Generic RSS feed poller — supports RSS 2.0 and Atom feeds

export class RssPoller {
  constructor(config, { onBatch }) {
    this.name = config.name;
    this.feedUrl = config.feedUrl;
    this.pollInterval = config.pollIntervalMs || 300000;
    this.color = config.color || 0x9e9e9e;
    this.onBatch = onBatch;

    this.seenIds = new Set();
    this._timer = null;
    this._stopped = false;
  }

  async start() {
    this._stopped = false;
    await this._poll(true);
    this._timer = setInterval(() => this._poll(false), this.pollInterval);
    console.log(`[${this.name}] Started — polling every ${this.pollInterval / 1000}s`);
  }

  stop() {
    this._stopped = true;
    if (this._timer) clearInterval(this._timer);
  }

  async _poll(firstRun) {
    try {
      const res = await fetch(this.feedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const xml = await res.text();
      const items = this._parse(xml);

      const batch = [];
      for (const item of items) {
        const id = item.link || item.title;
        if (!id || this.seenIds.has(id)) continue;
        this.seenIds.add(id);

        if (firstRun) continue;

        batch.push(item);
      }

      if (firstRun) {
        console.log(`[${this.name}] First run — ${this.seenIds.size} existing items marked as seen`);
      } else if (batch.length > 0) {
        this.onBatch(batch);
      }

      if (this.seenIds.size > 3000) {
        const arr = [...this.seenIds];
        this.seenIds = new Set(arr.slice(-2000));
      }
    } catch (e) {
      console.error(`[${this.name}] Error:`, e.message);
    }
  }

  _parse(xml) {
    // Detect Atom vs RSS
    if (xml.includes('<feed') && xml.includes('<entry>')) {
      return this._parseAtom(xml);
    }
    return this._parseRss(xml);
  }

  _parseRss(xml) {
    const items = [];
    const re = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
      const block = m[1];
      items.push({
        title: this._extractCdata(block, 'title'),
        link: this._extract(block, 'link'),
        description: this._extractCdata(block, 'description'),
        pubDate: this._extract(block, 'pubDate'),
      });
    }
    return items;
  }

  _parseAtom(xml) {
    const items = [];
    const re = /<entry>([\s\S]*?)<\/entry>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
      const block = m[1];
      const linkMatch = block.match(/<link[^>]+href="([^"]+)"/);
      items.push({
        title: this._extractCdata(block, 'title'),
        link: linkMatch ? linkMatch[1] : '',
        description: this._extractCdata(block, 'summary') || this._extractCdata(block, 'content'),
        pubDate: this._extract(block, 'updated') || this._extract(block, 'published'),
      });
    }
    return items;
  }

  _extract(block, tag) {
    const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`);
    const m = block.match(re);
    return m ? m[1].trim() : '';
  }

  _extractCdata(block, tag) {
    // Try CDATA first
    const cdataRe = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`);
    const cm = block.match(cdataRe);
    if (cm) return cm[1].trim();
    // Fall back to plain text
    return this._extract(block, tag);
  }
}
