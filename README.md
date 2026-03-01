# Buzz

<p align="center">
  <a href="./README.md">中文</a> | <a href="./README.en.md">English</a>
</p>

即時新聞聚合 + Discord / Telegram 推送，支援多來源、AI 翻譯、網頁 Dashboard。

## 功能

- **金十快訊** — 中國財經即時快訊
- **BlockBeats** — 區塊鏈快訊（繁中/英/簡中）
- **RSS 來源** — 自訂任意 RSS（一種網站提供的新聞訂閱格式）/Atom feed
- **6551 X 推文監控** — 追蹤 KOL（Key Opinion Leader，意見領袖）推文（透過 6551.io API）
- **6551 OpenNews** — AI 評分新聞聚合（Bloomberg、Reuters、幣安等）
- **Polymarket** — 預測市場價格異動偵測
- **AI 翻譯** — 英文內容自動翻譯為繁體中文（支援 xAI / OpenAI / Anthropic / Google）
- **Discord 推送** — Webhook（Discord 提供的訊息傳送接口）或 Bot 兩種模式
- **Telegram 推送** — Bot API，可與 Discord 同時啟用
- **網頁 Dashboard** — 即時事件流 + 設定頁面，所有設定可熱更新

## 前置條件

- [Node.js](https://nodejs.org/) 18 以上
- [Git](https://git-scm.com/)（用於取得程式碼）

## 快速開始

```bash
git clone https://github.com/zxcnny930/buzz.git
cd buzz
npm install
cp config.example.json config.json  # 編輯設定
npm start
```

開啟瀏覽器 `http://localhost:3848` 進入 Dashboard，`/settings.html` 進入設定頁面。

設定頁面支援中文和英文，點擊頁面上的語言按鈕切換，或使用 `?lang=en` 參數。

## 設定

所有設定都可以從網頁 Dashboard 的設定頁面修改，修改後即時生效（不需重啟）。

也可以直接編輯 `config.json`，格式如下：

```jsonc
{
  "jin10": { "enabled": true, "pollIntervalMs": 15000, "onlyImportant": true },
  // pollIntervalMs 單位為毫秒：15000 = 15 秒，30000 = 30 秒，60000 = 1 分鐘
  "blockbeats": { "enabled": true, "pollIntervalMs": 30000, "onlyImportant": true, "lang": "cht" },
  "rssFeeds": [
    { "enabled": true, "name": "動區", "feedUrl": "https://www.blocktempo.com/feed/", "pollIntervalMs": 300000, "color": 16746496 }
    // pollIntervalMs: 300000 = 5 分鐘
    // color 是 Discord 嵌入訊息的顏色值（十進位整數），可到這裡將十六進位色碼轉換為十進位：https://www.mathsisfun.com/hexadecimal-decimal-colors.html
  ],
  "x6551": { "enabled": true, "apiBase": "https://ai.6551.io", "token": "YOUR_TOKEN", "pollIntervalMs": 3600000, "kols": ["elonmusk"] },
  // pollIntervalMs: 3600000 = 1 小時
  "opennews": { "enabled": false, "pollIntervalMs": 60000, "minScore": 70, "signals": [], "coins": [], "engineTypes": [] },
  // pollIntervalMs: 60000 = 1 分鐘
  "polymarket": {
    "enabled": true, "pollIntervalMs": 180000, "marketRefreshMs": 600000,
    // pollIntervalMs: 180000 = 3 分鐘；marketRefreshMs: 600000 = 10 分鐘
    "minChangePp": 5, "zThreshold": 2.5, "volSpikeThreshold": 2.0,
    "minLiquidity": 10000, "rollingWindowMinutes": 30, "cooldownMs": 900000,
    // cooldownMs: 900000 = 15 分鐘
    "tagIds": [], "excludeTagIds": []
  },
  "grok": { "apiKey": "YOUR_KEY", "model": "grok-4.1-fast", "baseUrl": "https://api.x.ai/v1" },
  "discord": {
    "webhookUrl": "",
    "botToken": "", "channelId": ""
  },
  "telegram": { "enabled": false, "botToken": "", "chatId": "" },
  "dashboard": { "port": 3848, "password": "" }
}
```

### Discord 推送設定

支援兩種模式（擇一）：

**Webhook（簡單）：** 伺服器設定 → 整合 → Webhook → 新增 → 複製網址

**Bot 機器人（進階）：** [Developer Portal](https://discord.com/developers/applications) 建立 Bot → 複製 Token + 頻道 ID

### Telegram 推送設定

1. 在 Telegram 搜尋 `@BotFather`，發送 `/newbot` 建立機器人
2. 複製 Bot Token，貼到設定頁面的「Telegram 通知」區塊
3. 將 Bot 加入你要接收通知的群組或頻道
4. 取得 Chat ID（搜尋 `@userinfobot` 或用 `https://api.telegram.org/bot{TOKEN}/getUpdates`）
5. 在設定頁面填入 Chat ID 並啟用

Discord 和 Telegram 可以同時啟用，通知會平行推送到兩個平台。

### 6551 平台

X 推文監控和 OpenNews 共用同一個 API Token，到 [6551.io/mcp](https://6551.io/mcp) 註冊取得。

也可以透過 ClawHub / Skills 安裝 OpenNews MCP：

```bash
npx clawhub install opennews-mcp
npx skills add https://github.com/zxcnny930/buzz/tree/main/opennews-mcp --skill opennews
```

### Polymarket 參數說明

| 參數 | 說明 | 預設 |
|------|------|------|
| `minChangePp` | 最小變動門檻（百分點），低於此值不通知 | 5 |
| `zThreshold` | Z-Score 統計過濾（統計異常偵測指標，數值越大越嚴格），0 = 停用 | 2.5 |
| `volSpikeThreshold` | 交易量飆升倍數門檻 | 2.0 |
| `minLiquidity` | 最低流動性（$），低於此的市場會被忽略 | 10000 |
| `rollingWindowMinutes` | 分析窗口（分鐘），比較當前 vs N 分鐘前的價格 | 30 |
| `cooldownMs` | 同一市場再次通知的冷卻時間 | 900000 (15min) |
| `tagIds` | 只追蹤的類型 ID（空 = 全部） | [] |
| `excludeTagIds` | 排除的類型 ID | [] |

## 推薦 RSS 來源

以下整理了可直接使用的 RSS feed，在設定頁面的「RSS 來源」新增即可。

### 國際主流媒體（中文版）

| 媒體 | RSS URL |
|------|---------|
| 路透中文 | `https://feedx.net/rss/reuters.xml` |
| 紐約時報中文 | `https://feedx.net/rss/nytimes.xml` |
| FT 金融時報中文 | `https://feedx.net/rss/ft.xml` |
| BBC 中文 | `https://feedx.net/rss/bbc.xml` |
| 法國國際廣播 (RFI) | `https://feedx.net/rss/rfi.xml` |
| 德國之聲 | `https://feedx.net/rss/dw.xml` |
| 日經中文 | `https://feedx.net/rss/nikkei.xml` |
| 朝日新聞 | `https://feedx.net/rss/asahi.xml` |
| 聯合早報 | `https://feedx.net/rss/zaobaotoday.xml` |
| 澎湃新聞 | `https://feedx.net/rss/thepaper.xml` |
| 中央社 | `https://feedx.net/rss/cna.xml` |

### 英文國際媒體

| 媒體 | RSS URL |
|------|---------|
| TIME | `https://time.com/feed/` |
| 南華早報 (SCMP) | `https://www.scmp.com/rss/91/feed` |
| BBC World | `https://feeds.bbci.co.uk/news/world/rss.xml` |
| BBC 中文（繁體） | `https://feeds.bbci.co.uk/zhongwen/trad/rss.xml` |

### 加密貨幣 / 財經

| 媒體 | RSS URL |
|------|---------|
| CoinDesk | `https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml` |
| CoinTelegraph | `https://cointelegraph.com/rss` |
| CryptoSlate | `https://cryptoslate.com/feed/` |
| CryptoPotato | `https://cryptopotato.com/feed/` |
| The Defiant | `https://thedefiant.io/feed/` |
| CNBC | `https://www.cnbc.com/id/10000664/device/rss/rss.html` |
| 動區 BlockTempo | `https://www.blocktempo.com/feed/` |

### 台灣媒體

| 媒體 | RSS URL |
|------|---------|
| 公視新聞 | `https://news.pts.org.tw/xml/newsfeed.xml` |
| 中央社 | `https://www.cna.com.tw/rss/aall.xml` |

> 更多中文 RSS 來源可參考 [awesome-newsCN-feeds](https://github.com/RSS-Renaissance/awesome-newsCN-feeds)

## API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/config` | 取得目前設定 |
| POST | `/api/config` | 更新設定（部分更新，即時生效） |
| GET | `/api/status` | 取得各來源狀態（啟用/停用） |
| POST | `/api/kols` | 管理 KOL（意見領袖）追蹤清單 |

設定了 Dashboard 密碼時，所有端點需加上 `?pw=密碼` 參數。

## 用 OpenClaw 管理

[OpenClaw](https://openclaw.io) 是一個 AI 助手技能平台，安裝 Skill 後，你的 AI 助手就能透過自然語言操作 Buzz。[ClawHub](https://clawhub.ai) 是 OpenClaw 的套件倉庫。

### 方法一：ClawHub 一鍵安裝

```bash
npx clawhub install buzz
```

### 方法二：手動安裝 Skill

```bash
# 從專案複製 Skill 到 OpenClaw 目錄
cp -r openclaw-skill/news-monitor ~/.openclaw/skills/
```

### 安裝後使用

安裝完成後，直接對 AI 助手說：

| 你說 | 它做 |
|------|------|
| "啟用金十快訊" | 開啟 Jin10 新聞來源 |
| "設定 Discord Webhook" | 配置 Discord 通知 |
| "加追蹤 VitalikButerin" | 新增 KOL 到追蹤清單 |
| "把 Polymarket 門檻改成 3%" | 調整 Polymarket 參數 |
| "目前有哪些來源在跑" | 查看所有新聞源狀態 |

> Buzz 伺服器需要先啟動（`npm start`），OpenClaw Skill 透過 REST API 與伺服器溝通。

### 搭配 MCP 使用

如果你同時使用 OpenNews 或 X 的 MCP Server，可以一併安裝：

```bash
# OpenNews MCP — AI 評分新聞
npx clawhub install opennews-mcp
# 或手動：
cp -r /path/to/opennews-mcp/openclaw-skill/opennews ~/.openclaw/skills/

# X MCP — X 帳號數據
npx clawhub install opentwitter-mcp
# 或手動：
cp -r /path/to/opentwitter-mcp/openclaw-skill/opentwitter ~/.openclaw/skills/
```

## 授權

MIT
