<p align="center">
  <b>News Discord Worker</b><br>
  用 Discord 斜線指令管理 Buzz KOL 追蹤清單
</p>

<p align="center">
  <a href="./README.md">English</a> | <a href="./README_ZH.md">中文</a>
</p>

---

## 這是什麼？

一個 Discord 機器人，讓你直接在 Discord 頻道裡用斜線指令管理 [Buzz](https://github.com/zxcnny930/buzz) 的 KOL 追蹤清單，不用開 Dashboard。

## 前置條件

- 一個正在執行的 [Buzz](https://github.com/zxcnny930/buzz) 伺服器（必須可從網際網路存取，不能是 localhost）
- [Node.js](https://nodejs.org/) 18+
- 免費的 [Cloudflare](https://cloudflare.com) 帳號
- 已啟用 Bot 的 [Discord](https://discord.com/developers/applications) 應用程式

## 指令

| 指令 | 說明 |
|------|------|
| `/add elonmusk` | 新增 X 帳號到追蹤清單 |
| `/remove elonmusk` | 從清單移除帳號 |
| `/list` | 顯示所有追蹤中的 KOL |

## 運作方式

此機器人部署在 [Cloudflare Workers](https://workers.cloudflare.com/)（免費的雲端運算平台）。當你在 Discord 輸入斜線指令時，Cloudflare 會將請求轉發到你的 Buzz 伺服器 API，即時更新 KOL 清單。

## 取得程式碼

```bash
git clone https://github.com/zxcnny930/buzz.git
cd buzz/news-discord-worker
```

## 部署

### 1. 安裝 Wrangler

[Wrangler](https://developers.cloudflare.com/workers/wrangler/) 是 Cloudflare 官方的 Workers 部署工具。

```bash
npm install -g wrangler
wrangler login          # 開啟瀏覽器登入你的 Cloudflare 帳號
```

### 2. 建立 Discord 應用程式

1. 前往 [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**
2. 進入 **General Information** → 複製 **Application ID**（即 `APP_ID`）
3. 複製 **Public Key**（步驟 3 需要用到）
4. 進入 **Bot** → **Reset Token** → 複製 **Bot Token**（即 `BOT_TOKEN`）
5. 進入 **OAuth2** → **URL Generator**：
   - Scopes：`bot`、`applications.commands`
   - Bot Permissions：`Send Messages`
   - 複製產生的 URL，在瀏覽器開啟，將機器人邀請到你的伺服器

### 3. 設定參數

編輯 `wrangler.toml`，更新以下內容：

```toml
[vars]
DISCORD_CHANNEL_ID = "your-discord-channel-id"   # 右鍵點擊頻道 → 複製頻道 ID
VPS_API_PW = "your-buzz-dashboard-password"       # 如未設定密碼則留空
```

設定密鑰：

```bash
wrangler secret put DISCORD_PUBLIC_KEY   # 貼上步驟 2.3 取得的 Public Key
wrangler secret put VPS_API_URL          # 你的 Buzz 伺服器網址（必須可公開存取，例如 https://your-domain.com）
```

> **注意：** `VPS_API_URL` 必須是公開網址，`http://localhost:3848` 無法使用。請透過 [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) 或公開 IP 來暴露你的伺服器。

### 4. 部署

```bash
npm install
wrangler deploy
```

### 5. 註冊斜線指令

執行一次，即可註冊 `/add`、`/remove`、`/list` 指令：

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

### 6. 設定 Interactions Endpoint

前往 [Discord Developer Portal](https://discord.com/developers/applications) → 你的應用程式 → **General Information**，將 **Interactions Endpoint URL** 設定為：

```
https://<your-worker>.workers.dev/interactions
```

Discord 會發送測試 ping，成功後即完成設定。

## 搭配使用

此機器人是 [Buzz](https://github.com/zxcnny930/buzz) 新聞聚合器的附屬元件，需搭配 Buzz 伺服器使用。

## 授權

MIT
