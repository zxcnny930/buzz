// app.js — SSE consumer + filtering for news dashboard

const feed = document.getElementById('feed');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const filterBtns = document.querySelectorAll('.filter-btn');

let activeFilter = 'all';
let events = []; // all received events
const seenIds = new Set(); // dedup on reconnect

// ─── Filter handling ───

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.source;
    renderFeed();
  });
});

// ─── SSE connection ───

function connectSSE() {
  const params = new URLSearchParams(window.location.search);
  const pw = params.get('pw');
  const sseUrl = pw ? `/sse?pw=${encodeURIComponent(pw)}` : '/sse';

  const es = new EventSource(sseUrl);

  es.onopen = () => {
    statusDot.classList.add('connected');
    statusText.textContent = 'Connected';
  };

  es.onmessage = (e) => {
    try {
      const event = JSON.parse(e.data);
      // Deduplicate on reconnect (history replay)
      if (seenIds.has(event.id)) return;
      seenIds.add(event.id);
      events.push(event);
      // Keep max 500 in browser memory
      if (events.length > 500) {
        events = events.slice(-500);
        // Trim seenIds to match
        seenIds.clear();
        for (const ev of events) seenIds.add(ev.id);
      }
      prependCard(event);
    } catch { /* ignore parse errors */ }
  };

  es.onerror = () => {
    statusDot.classList.remove('connected');
    statusText.textContent = 'Reconnecting...';
    // EventSource auto-reconnects
  };
}

// ─── Render full feed (after filter change) ───

function renderFeed() {
  feed.innerHTML = '';
  const filtered = activeFilter === 'all'
    ? events
    : events.filter(e => e.source === activeFilter);

  if (filtered.length === 0) {
    feed.innerHTML = '<div class="empty">等待新聞中...</div>';
    return;
  }

  // Show newest first
  for (let i = filtered.length - 1; i >= 0; i--) {
    feed.appendChild(createCard(filtered[i], false));
  }
}

// ─── Prepend single card (new event) ───

function prependCard(event) {
  if (activeFilter !== 'all' && event.source !== activeFilter) return;

  // Remove empty state if present
  const empty = feed.querySelector('.empty');
  if (empty) empty.remove();

  const card = createCard(event, true);
  feed.prepend(card);

  // Trim DOM to 300 cards
  while (feed.children.length > 300) {
    feed.lastChild.remove();
  }
}

// ─── Create card element ───

function createCard(event, animate) {
  const card = document.createElement('div');
  card.className = 'card';
  if (!animate) card.style.animation = 'none';
  card.dataset.source = event.source;

  const d = event.data;

  // Spike-specific classes
  if (event.source === 'polymarket' && d.spikeType) {
    if (d.spikeType === 'price') {
      card.classList.add(d.direction === 'up' ? 'spike-up' : 'spike-down');
    } else if (d.spikeType === 'volume') {
      card.classList.add('spike-vol');
    }
  }

  const time = formatTime(event.ts);
  const sourceLabel = getSourceLabel(event.source, d);

  let titleHtml = '';
  if (d.title) {
    titleHtml = `<div class="card-title">${escapeHtml(d.title)}</div>`;
  }

  let bodyHtml = escapeHtml(d.description || '');
  // Convert markdown-style links [text](url) to <a>
  bodyHtml = bodyHtml.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>'
  );
  // Convert plain URLs to links
  bodyHtml = bodyHtml.replace(
    /(?<![">])(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener">$1</a>'
  );
  // Newlines to <br>
  bodyHtml = bodyHtml.replace(/\n/g, '<br>');

  card.innerHTML = `
    <div class="card-header">
      <span class="card-source" data-source="${event.source}">${sourceLabel}</span>
      <span class="card-time">${time}</span>
    </div>
    ${titleHtml}
    <div class="card-body">${bodyHtml}</div>
  `;

  return card;
}

// ─── Helpers ───

function getSourceLabel(source, data) {
  const labels = {
    jin10: '金十快訊',
    blockbeats: 'BlockBeats',
    x: 'X',
    polymarket: 'Polymarket',
    opennews: 'OpenNews',
  };
  if (source === 'rss' && data.feedName) return data.feedName;
  if (source === 'polymarket' && data.spikeType === 'price') {
    return data.direction === 'up' ? '📈 Polymarket' : '📉 Polymarket';
  }
  if (source === 'polymarket' && data.spikeType === 'volume') {
    return '🔊 Polymarket';
  }
  return labels[source] || source;
}

function formatTime(ts) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');

  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return `${hh}:${mm}:${ss}`;

  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mo}/${dd} ${hh}:${mm}`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Init ───

connectSSE();
feed.innerHTML = '<div class="empty">連線中...</div>';
