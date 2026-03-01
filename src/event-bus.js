// event-bus.js — Central event bus with history buffer for SSE replay

import { EventEmitter } from 'node:events';

export class EventBus extends EventEmitter {
  constructor(maxHistory = 200) {
    super();
    this.maxHistory = maxHistory;
    this.history = [];
    this._id = 0;
  }

  /**
   * Push a news event to the bus.
   * @param {string} source — e.g. 'jin10', 'blockbeats', 'rss', 'x', 'polymarket'
   * @param {object} data — { title, description, color, url, ... }
   */
  push(source, data) {
    const event = {
      id: ++this._id,
      source,
      ts: Date.now(),
      data,
    };
    this.history.push(event);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
    this.emit('event', event);
  }

  /** Get all buffered history (for SSE initial replay). */
  getHistory() {
    return this.history;
  }
}
