<p align="center">
  <b>News Discord Worker</b><br>
  Discord Slash Commands for Buzz KOL Management
</p>

<p align="center">
  <a href="./README.md">English</a> | <a href="./README_ZH.md">中文</a>
</p>

---

## What Is This?

A Discord bot that lets you manage [Buzz](https://github.com/zxcnny930/buzz) KOL tracking list with slash commands — no need to open the dashboard.

## Prerequisites

- A running [Buzz](https://github.com/zxcnny930/buzz) server (accessible from the internet, not localhost)
- [Node.js](https://nodejs.org/) 18+
- A free [Cloudflare](https://cloudflare.com) account
- A [Discord](https://discord.com/developers/applications) application with Bot enabled

## Commands

| Command | Description |
|---------|-------------|
| `/add elonmusk` | Add an X account to the tracking list |
| `/remove elonmusk` | Remove an account from the list |
| `/list` | Show all tracked KOLs |

## How It Works

This bot runs on [Cloudflare Workers](https://workers.cloudflare.com/) (a free serverless platform). When you type a slash command in Discord, Cloudflare forwards the request to your Buzz server's API to update the KOL list.

## Get the Code

```bash
git clone https://github.com/zxcnny930/buzz.git
cd buzz/news-discord-worker
```

## Deploy

### 1. Install Wrangler

[Wrangler](https://developers.cloudflare.com/workers/wrangler/) is Cloudflare's CLI tool for deploying Workers.

```bash
npm install -g wrangler
wrangler login          # Opens browser to log in to your Cloudflare account
```

### 2. Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**
2. Go to **General Information** → copy the **Application ID** (this is your `APP_ID`)
3. Copy the **Public Key** (needed for step 3)
4. Go to **Bot** → **Reset Token** → copy the **Bot Token** (this is your `BOT_TOKEN`)
5. Go to **OAuth2** → **URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`
   - Copy the generated URL and open it in your browser to invite the bot to your server

### 3. Configure

Edit `wrangler.toml` and update:

```toml
[vars]
DISCORD_CHANNEL_ID = "your-discord-channel-id"   # Right-click channel → Copy Channel ID
VPS_API_PW = "your-buzz-dashboard-password"       # Leave empty if no password set
```

Set secrets:

```bash
wrangler secret put DISCORD_PUBLIC_KEY   # Paste the Public Key from step 2.3
wrangler secret put VPS_API_URL          # Your Buzz server URL (must be publicly accessible, e.g. https://your-domain.com)
```

> **Note:** `VPS_API_URL` must be a public URL — `http://localhost:3848` will not work. Use a tunnel service like [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) or expose your server with a public IP.

### 4. Deploy

```bash
npm install
wrangler deploy
```

### 5. Register Slash Commands

Run this once to register the `/add`, `/remove`, `/list` commands:

```bash
APP_ID="your-application-id"
BOT_TOKEN="your-bot-token"

curl -X PUT "https://discord.com/api/v10/applications/$APP_ID/commands" \
  -H "Authorization: Bot $BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {"name":"add","description":"Add a KOL to tracking list","options":[{"name":"username","description":"X username","type":3,"required":true}]},
    {"name":"remove","description":"Remove a KOL from tracking list","options":[{"name":"username","description":"X username","type":3,"required":true}]},
    {"name":"list","description":"Show all tracked KOLs"}
  ]'
```

### 6. Set Interactions Endpoint

In [Discord Developer Portal](https://discord.com/developers/applications) → your app → **General Information**, set **Interactions Endpoint URL** to:

```
https://<your-worker>.workers.dev/interactions
```

Discord will send a test ping — if it succeeds, the setup is complete.

## Related

This is a companion to [Buzz](https://github.com/zxcnny930/buzz) news aggregator.

## License

MIT
