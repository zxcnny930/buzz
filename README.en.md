# Buzz

<p align="center">
  <a href="./README.md">中文</a> | <a href="./README.en.md">English</a>
</p>

Real-time news aggregator with Discord / Telegram push notifications. Supports multiple sources, AI translation, and a web Dashboard.

## Features

- **Jin10 Flash** — Chinese financial flash news
- **BlockBeats** — Blockchain flash news (Trad. Chinese / English / Simp. Chinese)
- **RSS Sources** — Custom RSS (a web feed format for subscribing to news updates) / Atom feeds
- **6551 X Tweet Monitor** — Track KOL (Key Opinion Leader) tweets (via 6551.io API)
- **6551 OpenNews** — AI-scored news aggregation (Bloomberg, Reuters, Binance, etc.)
- **Polymarket** — Prediction market price movement detection
- **AI Translation** — Auto-translate English content to Traditional Chinese (supports xAI / OpenAI / Anthropic / Google)
- **Discord Push** — Webhook (an HTTP callback URL for sending messages) or Bot modes
- **Telegram Push** — Bot API, can run alongside Discord
- **Web Dashboard** — Live event stream + settings page, all settings hot-reloadable

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or above
- [Git](https://git-scm.com/) (to clone the repository)

## Quick Start

```bash
git clone https://github.com/zxcnny930/buzz.git
cd buzz
npm install
cp config.example.json config.json  # Edit configuration
npm start
```

Open your browser at `http://localhost:3848` for the Dashboard, and `/settings.html` for the Settings page.

The settings page supports English and Traditional Chinese — switch with the language button or use `?lang=en`.

## Configuration

All settings can be modified from the web Dashboard settings page. Changes take effect immediately (no restart needed).

You can also directly edit `config.json`:

```jsonc
{
  "jin10": { "enabled": true, "pollIntervalMs": 15000, "onlyImportant": true },
  // pollIntervalMs is in milliseconds: 15000 = 15 seconds, 30000 = 30 seconds, 60000 = 1 minute
  "blockbeats": { "enabled": true, "pollIntervalMs": 30000, "onlyImportant": true, "lang": "cht" },
  "rssFeeds": [
    { "enabled": true, "name": "BlockTempo", "feedUrl": "https://www.blocktempo.com/feed/", "pollIntervalMs": 300000, "color": 16746496 }
    // pollIntervalMs: 300000 = 5 minutes
    // color is the Discord embed color as a decimal integer. Convert hex color codes at: https://www.mathsisfun.com/hexadecimal-decimal-colors.html
  ],
  "x6551": { "enabled": true, "apiBase": "https://ai.6551.io", "token": "YOUR_TOKEN", "pollIntervalMs": 3600000, "kols": ["elonmusk"] },
  // pollIntervalMs: 3600000 = 1 hour
  "opennews": { "enabled": false, "pollIntervalMs": 60000, "minScore": 70, "signals": [], "coins": [], "engineTypes": [] },
  // pollIntervalMs: 60000 = 1 minute
  "polymarket": {
    "enabled": true, "pollIntervalMs": 180000, "marketRefreshMs": 600000,
    // pollIntervalMs: 180000 = 3 minutes; marketRefreshMs: 600000 = 10 minutes
    "minChangePp": 5, "zThreshold": 2.5, "volSpikeThreshold": 2.0,
    "minLiquidity": 10000, "rollingWindowMinutes": 30, "cooldownMs": 900000,
    // cooldownMs: 900000 = 15 minutes
    "tagIds": [], "excludeTagIds": []
  },
  "translator": "google",  // Translation engine: "google" (free default), "ai" (needs API Key), "none" (no translation)
  "ai": { "apiKey": "YOUR_KEY", "model": "grok-4.1-fast", "baseUrl": "https://api.x.ai/v1" },
  "discord": {
    "webhookUrl": "",
    "botToken": "", "channelId": ""
  },
  "telegram": { "enabled": false, "botToken": "", "chatId": "" },
  "dashboard": { "port": 3848, "password": "" }
}
```

### Discord Setup

Two modes are supported (pick one):

**Webhook (Simple):** Server Settings → Integrations → Webhooks → New Webhook → Copy URL

**Bot (Advanced):** [Developer Portal](https://discord.com/developers/applications) → Create Bot → Copy Token + Channel ID

### Telegram Setup

1. Search for `@BotFather` on Telegram and send `/newbot` to create a bot
2. Copy the Bot Token and paste it into the Telegram section on the settings page
3. Add the bot to the group or channel where you want notifications
4. Get the Chat ID (search `@userinfobot` or use `https://api.telegram.org/bot{TOKEN}/getUpdates`)
5. Enter the Chat ID on the settings page and enable Telegram

Discord and Telegram can run simultaneously — notifications are pushed to both platforms in parallel.

### 6551 Platform

X tweet monitoring and OpenNews share the same API Token. Sign up at [6551.io/mcp](https://6551.io/mcp) to get one.

You can also install the OpenNews MCP via ClawHub / Skills:

```bash
npx clawhub install opennews-mcp
npx skills add https://github.com/zxcnny930/buzz/tree/main/opennews-mcp --skill opennews
```

### Polymarket Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `minChangePp` | Min change threshold (percentage points) | 5 |
| `zThreshold` | Z-Score statistical filter (anomaly detection metric — higher values are more strict), 0 = off | 2.5 |
| `volSpikeThreshold` | Volume spike multiplier threshold | 2.0 |
| `minLiquidity` | Min liquidity ($), markets below this are ignored | 10000 |
| `rollingWindowMinutes` | Analysis window (minutes), compare current vs N minutes ago | 30 |
| `cooldownMs` | Cooldown before re-alerting the same market | 900000 (15min) |
| `tagIds` | Only track these tag IDs (empty = all) | [] |
| `excludeTagIds` | Exclude these tag IDs | [] |

## Recommended RSS Sources

These RSS feeds can be added directly in the "RSS Sources" section of the settings page.

### World News

| Media | RSS URL |
|-------|---------|
| Reuters | `https://www.reutersagency.com/feed/` |
| BBC World | `https://feeds.bbci.co.uk/news/world/rss.xml` |
| BBC Business | `https://feeds.bbci.co.uk/news/business/rss.xml` |
| NPR News | `https://feeds.npr.org/1001/rss.xml` |
| Al Jazeera | `https://www.aljazeera.com/xml/rss/all.xml` |
| TIME | `https://time.com/feed/` |
| SCMP | `https://www.scmp.com/rss/91/feed` |
| The Guardian | `https://www.theguardian.com/world/rss` |
| AP News | `https://apnews.com/index.rss` |

### Finance

| Media | RSS URL |
|-------|---------|
| CNBC | `https://www.cnbc.com/id/10000664/device/rss/rss.html` |
| CNBC Finance | `https://www.cnbc.com/id/10000115/device/rss/rss.html` |
| MarketWatch | `https://feeds.marketwatch.com/marketwatch/topstories/` |
| Bloomberg (via Google News) | `https://news.google.com/rss/search?q=site:bloomberg.com&hl=en` |

### Crypto

| Media | RSS URL |
|-------|---------|
| CoinDesk | `https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml` |
| CoinTelegraph | `https://cointelegraph.com/rss` |
| CryptoSlate | `https://cryptoslate.com/feed/` |
| CryptoPotato | `https://cryptopotato.com/feed/` |
| The Defiant | `https://thedefiant.io/feed/` |
| Decrypt | `https://decrypt.co/feed` |
| The Block | `https://www.theblock.co/rss.xml` |

### Tech

| Media | RSS URL |
|-------|---------|
| TechCrunch | `https://techcrunch.com/feed/` |
| Ars Technica | `https://feeds.arstechnica.com/arstechnica/index` |
| The Verge | `https://www.theverge.com/rss/index.xml` |
| Hacker News | `https://hnrss.org/frontpage` |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config` | Get current configuration |
| POST | `/api/config` | Update configuration (partial, hot-reload) |
| GET | `/api/status` | Get source status (active/inactive) |
| POST | `/api/kols` | Update KOL tracking list |

All endpoints support `?pw=PASSWORD` for authentication when dashboard password is set.

## Manage with OpenClaw

[OpenClaw](https://openclaw.io) is an AI assistant skills platform — once a Skill is installed, your AI assistant can manage Buzz through natural language. [ClawHub](https://clawhub.ai) is the OpenClaw package registry.

### Option 1: One-click via ClawHub

```bash
npx clawhub install buzz
```

### Option 2: Manual Skill Install

```bash
# Copy the Skill to your OpenClaw directory
cp -r openclaw-skill/news-monitor ~/.openclaw/skills/
```

### After Installation

Just tell your AI assistant:

| You Say | It Does |
|---------|---------|
| "Enable Jin10 flash news" | Turn on Jin10 source |
| "Set up Discord webhook" | Configure Discord notifications |
| "Track VitalikButerin" | Add a KOL to the tracking list |
| "Change Polymarket threshold to 3%" | Adjust Polymarket parameters |
| "What sources are running?" | Check all source status |

> Buzz server must be running (`npm start`). The OpenClaw Skill communicates with it via REST API.

### Use with MCP Servers

If you also use the OpenNews or X MCP servers, install their skills too:

```bash
# OpenNews MCP — AI-scored news
npx clawhub install opennews-mcp
# Or manually:
cp -r /path/to/opennews-mcp/openclaw-skill/opennews ~/.openclaw/skills/

# X MCP — X account data
npx clawhub install opentwitter-mcp
# Or manually:
cp -r /path/to/opentwitter-mcp/openclaw-skill/opentwitter ~/.openclaw/skills/
```

## License

MIT
