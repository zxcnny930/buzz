// settings.js — Buzz Settings Page (i18n)

// ── i18n System ──

const LANG = {
  'zh-TW': {
    // General UI
    pageTitle: '設定',
    tabSources: '新聞來源',
    tabOutput: 'AI 與通知',
    tabSystem: '系統',
    btnSave: '儲存設定',
    btnReset: '撤銷變更',
    enable: '啟用',
    pollInterval: '更新頻率',
    sec: '秒',
    min: '分鐘',
    show: '顯示',
    hide: '隱藏',
    name: '名稱',
    color: '顏色',

    // Jin10
    jin10Title: '金十快訊',
    hintPollSec: '每隔幾秒檢查一次新消息',
    onlyImportant: '僅重要新聞',
    hintOnlyImportant: '開啟後只推送標記為重要的消息',

    // BlockBeats
    language: '語言',
    langCht: '繁中',
    langEn: 'English',
    langChs: '简中',

    // RSS
    rssTitle: 'RSS 來源',
    addRss: '＋ 新增 RSS 來源',
    newSource: '新來源',
    deleteRssTitle: '刪除此 RSS 來源',
    rssLink: 'RSS 連結',
    hintRssUrl: '新聞來源的 RSS/Atom feed 網址',
    checkFreq: '檢查頻率',
    hintCheckFreq: '多久檢查一次有沒有新文章',

    // 6551 Platform
    platform6551Title: '6551 平台',
    help6551Desc: '6551.io 提供 X 推文監控 + AI 新聞聚合',
    help6551Step1: '到 <a href="https://6551.io/mcp" target="_blank" rel="noopener">6551.io/mcp</a> 註冊帳號',
    help6551Step2: '取得你的 API Token，貼到下方欄位',
    apiServer: 'API 伺服器',
    hintApiServerDefault: '通常不需要修改',
    apiToken: 'API Token',
    hintApiTokenFrom: '從 6551.io 取得',

    // X Monitor
    xMonitorTitle: 'X 推文監控',
    kolAccounts: '追蹤帳號',
    hintKolUsername: '輸入 X 用戶名',
    addKol: '＋ 新增追蹤帳號',
    deleteKolTitle: '移除此帳號',
    username: '用戶名',
    placeholderKol: '例如 elonmusk',

    // OpenNews
    opennewsTitle: 'OpenNews AI 新聞',
    opennewsDesc: '整合 Bloomberg、Reuters、幣安等多來源，附帶 AI 評分與交易信號。',
    minAiScore: '最低 AI 評分',
    hintMinScore: '0-100，只推送 ≥ 此值的新聞',
    tradeSignals: '交易信號',
    hintNoneIsAll: '不勾選 = 全部',
    newsTypes: '新聞類型',
    coinFilter: '幣種過濾',
    placeholderCoins: '例如 BTC, ETH, SOL（留空 = 全部）',

    // Polymarket
    polymarketTitle: 'Polymarket 預測市場',
    marketRefresh: '市場列表刷新',
    hintMarketRefresh: '多久重新載入市場列表',
    minChangeThreshold: '最小變動門檻',
    hintMinChange: '至少幾個百分點才通知（如 5 = 20%→25%）',
    zScoreFilter: 'Z-Score 過濾',
    hintZScore: '統計異常過濾，0 = 停用，建議 2.0~3.0',
    volSpike: '交易量飆升倍數',
    times: '倍',
    hintVolSpike: '超過此倍數觸發警報',
    minLiquidity: '最低流動性門檻',
    hintMinLiquidity: '低於此金額的市場會被忽略',
    analysisWindow: '分析窗口',
    hintAnalysisWindow: '計算價格異動的時間範圍',
    alertCooldown: '警報冷卻時間',
    hintAlertCooldown: '同一市場再次警報的最短間隔',
    trackOnlyTypes: '只追蹤這些類型',
    hintTrackOnly: '不勾選則追蹤所有類型',
    excludeTypes: '排除這些類型',
    hintExcludeTypes: '勾選的類型不會出現在監控中',

    // PM Tags
    tagCrypto: '加密貨幣',
    tagPolitics: '政治',
    tagFinance: '金融',
    tagTech: '科技',
    tagCulture: '文化',
    tagGeopolitics: '地緣政治',
    tagSports: '體育',

    // ON Engines
    engineNews: '新聞',
    engineListing: '上市/上架',
    engineOnchain: '鏈上事件',
    engineMeme: 'Meme',
    engineMarket: '市場數據',

    // ON Signals
    signalLong: '🟢 看漲',
    signalShort: '🔴 看跌',
    signalNeutral: '⚪ 中性',

    // AI Translation
    aiTranslationTitle: 'AI 翻譯',
    translatorEngine: '翻譯引擎',
    translatorGoogle: 'Google 翻譯（免費）',
    translatorAi: 'AI 翻譯（需 API Key）',
    translatorNone: '不翻譯',
    hintTranslatorEngine: '選擇翻譯方式。Google 免費且不需 API Key；AI 需設定下方 API',
    apiKey: 'API 金鑰',
    hintApiKey: '翻譯服務的 API Key（僅 AI 引擎需要）',
    aiModel: 'AI 模型',
    hintAiModel: '從列表選擇，或手動輸入自訂模型名稱',
    hintApiUrl: '支援 OpenAI 相容格式的 API 網址',

    // Discord
    discordTitle: 'Discord 通知',
    connectionMethod: '連接方式',
    webhookSimple: 'Webhook 網址（簡單）',
    botAdvanced: 'Bot 機器人（進階）',
    webhookHelpTitle: '如何設定 Webhook？只要 3 步！',
    webhookStep1: '在電腦上打開 Discord，進入你想收通知的伺服器',
    webhookStep2: '點左上角「伺服器名稱」旁的 ▼ →「伺服器設定」→「整合」→「Webhook」→「新增 Webhook」',
    webhookStep3: '選好頻道後，點「複製 Webhook 網址」，貼到下面的欄位就完成了！',
    webhookTip: '提示：需要用電腦操作，手機版 Discord 無法建立 Webhook。',
    webhookUrl: 'Webhook 網址',
    hintWebhookUrl: '從 Discord 複製的 Webhook 網址',
    botHelpTitle: '如何設定 Discord Bot？',
    botStep1: '到 <a href="https://discord.com/developers/applications" target="_blank" rel="noopener">Discord Developer Portal</a> 建立 Application',
    botStep2: '左側選「Bot」→「Reset Token」複製 Token',
    botStep3: '開啟「MESSAGE CONTENT INTENT」',
    botStep4: '左側選「OAuth2」→ URL Generator → 勾選 <code>bot</code> + <code>Send Messages</code>，用產生的連結邀請到伺服器',
    botStep5: '對目標頻道「右鍵 → 複製頻道 ID」（需先在設定 → 進階 → 開啟開發者模式）',
    botToken: 'Bot Token',
    hintBotToken: 'Discord Bot 的 Token',
    channelId: '頻道 ID',
    placeholderChannelId: '例如 1234567890123456789',
    hintChannelId: '要發送通知的頻道 ID（純數字）',

    // Telegram
    telegramTitle: 'Telegram 通知',
    telegramHelpTitle: '如何設定 Telegram Bot？',
    telegramStep1: '在 Telegram 搜尋 <code>@BotFather</code>，發送 <code>/newbot</code>',
    telegramStep2: '按照指示建立機器人，完成後會收到 Bot Token',
    telegramStep3: '將機器人加入你要接收通知的群組或頻道',
    telegramStep4: '取得 Chat ID：將 <code>@userinfobot</code> 加入群組發送任意訊息，或用 <code>https://api.telegram.org/bot{TOKEN}/getUpdates</code> 查看',
    hintTgToken: '從 @BotFather 取得',
    chatId: 'Chat ID',
    placeholderChatId: '例如 -1001234567890',
    hintChatId: '群組/頻道/個人 Chat ID',

    // Dashboard
    dashboardTitle: 'Dashboard 設定',
    port: '連接埠 (Port)',
    hintPort: '修改後需要重新啟動服務才會生效',
    password: '密碼',
    placeholderPassword: '留空 = 不需要密碼',
    hintPassword: '設定後需在網址加上 ?pw=密碼 才能存取',

    // Dialogs & Messages
    confirmDeleteRss: '確定要刪除此 RSS 來源嗎？',
    confirmDeleteKol: '確定要移除此追蹤帳號嗎？',
    unsavedWarning: '尚有未儲存的設定變更。',
    confirmSave: '確定要儲存這些設定變更嗎？',
    saving: '儲存中...',
    saveSuccess: '設定已儲存，變更已生效',
    saveFailed: '儲存失敗',
    timeoutError: '連線逾時，請確認伺服器是否正常運作',
    connectionError: '無法連線到伺服器',
    confirmReset: '確定要撤銷所有未儲存的變更嗎？',
    resetSuccess: '已還原為上次儲存的設定',
    authError: '密碼錯誤或未提供密碼',
    loadError: '無法連線到伺服器，請檢查網路連線',
    reload: '重新載入',
  },
  en: {
    // General UI
    pageTitle: 'Settings',
    tabSources: 'News Sources',
    tabOutput: 'AI & Notifications',
    tabSystem: 'System',
    btnSave: 'Save Settings',
    btnReset: 'Reset Changes',
    enable: 'Enable',
    pollInterval: 'Poll Interval',
    sec: 'sec',
    min: 'min',
    show: 'Show',
    hide: 'Hide',
    name: 'Name',
    color: 'Color',

    // Jin10
    jin10Title: 'Jin10 Flash',
    hintPollSec: 'Check for new messages every N seconds',
    onlyImportant: 'Important Only',
    hintOnlyImportant: 'Only push messages marked as important',

    // BlockBeats
    language: 'Language',
    langCht: 'Trad. Chinese',
    langEn: 'English',
    langChs: 'Simp. Chinese',

    // RSS
    rssTitle: 'RSS Sources',
    addRss: '+ Add RSS Source',
    newSource: 'New Source',
    deleteRssTitle: 'Delete this RSS source',
    rssLink: 'RSS Link',
    hintRssUrl: 'RSS/Atom feed URL of the news source',
    checkFreq: 'Check Frequency',
    hintCheckFreq: 'How often to check for new articles',

    // 6551 Platform
    platform6551Title: '6551 Platform',
    help6551Desc: '6551.io provides X tweet monitoring + AI news aggregation',
    help6551Step1: 'Sign up at <a href="https://6551.io/mcp" target="_blank" rel="noopener">6551.io/mcp</a>',
    help6551Step2: 'Get your API Token and paste it below',
    apiServer: 'API Server',
    hintApiServerDefault: 'Usually no need to change',
    apiToken: 'API Token',
    hintApiTokenFrom: 'Get from 6551.io',

    // X Monitor
    xMonitorTitle: 'X Tweet Monitor',
    kolAccounts: 'Tracked Accounts',
    hintKolUsername: 'Enter X username',
    addKol: '+ Add Account',
    deleteKolTitle: 'Remove this account',
    username: 'Username',
    placeholderKol: 'e.g. elonmusk',

    // OpenNews
    opennewsTitle: 'OpenNews AI News',
    opennewsDesc: 'Aggregates Bloomberg, Reuters, Binance and more, with AI scores and trading signals.',
    minAiScore: 'Min AI Score',
    hintMinScore: '0-100, only push news with score \u2265 this value',
    tradeSignals: 'Trade Signals',
    hintNoneIsAll: 'None checked = all',
    newsTypes: 'News Types',
    coinFilter: 'Coin Filter',
    placeholderCoins: 'e.g. BTC, ETH, SOL (empty = all)',

    // Polymarket
    polymarketTitle: 'Polymarket Predictions',
    marketRefresh: 'Market List Refresh',
    hintMarketRefresh: 'How often to reload market list',
    minChangeThreshold: 'Min Change Threshold',
    hintMinChange: 'Min percentage points to notify (e.g. 5 = 20%\u219225%)',
    zScoreFilter: 'Z-Score Filter',
    hintZScore: 'Statistical anomaly filter, 0 = off, recommended 2.0~3.0',
    volSpike: 'Volume Spike Multiplier',
    times: 'x',
    hintVolSpike: 'Alert when volume exceeds this multiplier',
    minLiquidity: 'Min Liquidity Threshold',
    hintMinLiquidity: 'Markets below this amount will be ignored',
    analysisWindow: 'Analysis Window',
    hintAnalysisWindow: 'Time range for calculating price changes',
    alertCooldown: 'Alert Cooldown',
    hintAlertCooldown: 'Min interval before re-alerting same market',
    trackOnlyTypes: 'Track Only These Types',
    hintTrackOnly: 'None checked = track all types',
    excludeTypes: 'Exclude These Types',
    hintExcludeTypes: 'Checked types will not be monitored',

    // PM Tags
    tagCrypto: 'Crypto',
    tagPolitics: 'Politics',
    tagFinance: 'Finance',
    tagTech: 'Tech',
    tagCulture: 'Culture',
    tagGeopolitics: 'Geopolitics',
    tagSports: 'Sports',

    // ON Engines
    engineNews: 'News',
    engineListing: 'Listings',
    engineOnchain: 'On-chain',
    engineMeme: 'Meme',
    engineMarket: 'Market Data',

    // ON Signals
    signalLong: '\ud83d\udfe2 Long',
    signalShort: '\ud83d\udd34 Short',
    signalNeutral: '\u26aa Neutral',

    // AI Translation
    aiTranslationTitle: 'AI Translation',
    translatorEngine: 'Translation Engine',
    translatorGoogle: 'Google Translate (Free)',
    translatorAi: 'AI Translation (API Key required)',
    translatorNone: 'No Translation',
    hintTranslatorEngine: 'Choose translation method. Google is free and needs no API Key; AI requires the API settings below',
    apiKey: 'API Key',
    hintApiKey: 'API Key for translation service (AI engine only)',
    aiModel: 'AI Model',
    hintAiModel: 'Select from list or enter custom model name',
    hintApiUrl: 'OpenAI-compatible API endpoint URL',

    // Discord
    discordTitle: 'Discord Notifications',
    connectionMethod: 'Connection Method',
    webhookSimple: 'Webhook URL (Simple)',
    botAdvanced: 'Bot (Advanced)',
    webhookHelpTitle: 'How to set up Webhook? Just 3 steps!',
    webhookStep1: 'Open Discord on desktop and go to the server where you want notifications',
    webhookStep2: 'Click \u25bc next to server name \u2192 Server Settings \u2192 Integrations \u2192 Webhooks \u2192 New Webhook',
    webhookStep3: 'Choose a channel, click "Copy Webhook URL", and paste it below!',
    webhookTip: 'Tip: This must be done on desktop. Mobile Discord cannot create Webhooks.',
    webhookUrl: 'Webhook URL',
    hintWebhookUrl: 'Webhook URL copied from Discord',
    botHelpTitle: 'How to set up Discord Bot?',
    botStep1: 'Go to <a href="https://discord.com/developers/applications" target="_blank" rel="noopener">Discord Developer Portal</a> and create an Application',
    botStep2: 'Select "Bot" on the left \u2192 "Reset Token" and copy the Token',
    botStep3: 'Enable "MESSAGE CONTENT INTENT"',
    botStep4: 'Select "OAuth2" \u2192 URL Generator \u2192 check <code>bot</code> + <code>Send Messages</code>, use the generated link to invite to your server',
    botStep5: 'Right-click the target channel \u2192 "Copy Channel ID" (enable Developer Mode in Settings \u2192 Advanced first)',
    botToken: 'Bot Token',
    hintBotToken: 'Discord Bot Token',
    channelId: 'Channel ID',
    placeholderChannelId: 'e.g. 1234567890123456789',
    hintChannelId: 'Channel ID to send notifications (numbers only)',

    // Telegram
    telegramTitle: 'Telegram Notifications',
    telegramHelpTitle: 'How to set up Telegram Bot?',
    telegramStep1: 'Search for <code>@BotFather</code> on Telegram, send <code>/newbot</code>',
    telegramStep2: 'Follow the instructions to create a bot, you will receive a Bot Token',
    telegramStep3: 'Add the bot to the group or channel where you want notifications',
    telegramStep4: 'Get Chat ID: add <code>@userinfobot</code> to the group and send a message, or use <code>https://api.telegram.org/bot{TOKEN}/getUpdates</code>',
    hintTgToken: 'Get from @BotFather',
    chatId: 'Chat ID',
    placeholderChatId: 'e.g. -1001234567890',
    hintChatId: 'Group/Channel/Personal Chat ID',

    // Dashboard
    dashboardTitle: 'Dashboard Settings',
    port: 'Port',
    hintPort: 'Service restart required after change',
    password: 'Password',
    placeholderPassword: 'Leave empty = no password',
    hintPassword: 'After setting, add ?pw=password to URL to access',

    // Dialogs & Messages
    confirmDeleteRss: 'Delete this RSS source?',
    confirmDeleteKol: 'Remove this tracked account?',
    unsavedWarning: 'You have unsaved changes.',
    confirmSave: 'Save these settings changes?',
    saving: 'Saving...',
    saveSuccess: 'Settings saved and applied',
    saveFailed: 'Save failed',
    timeoutError: 'Connection timed out. Please check if the server is running.',
    connectionError: 'Cannot connect to server',
    confirmReset: 'Reset all unsaved changes?',
    resetSuccess: 'Restored to last saved settings',
    authError: 'Wrong password or no password provided',
    loadError: 'Cannot connect to server. Please check your network.',
    reload: 'Reload',
  }
};

// Language detection: localStorage > URL param > navigator.language
function detectLanguage() {
  const saved = localStorage.getItem('buzz-lang');
  if (saved && LANG[saved]) return saved;
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang && LANG[urlLang]) return urlLang;
  if (navigator.language && navigator.language.startsWith('zh')) return 'zh-TW';
  return 'en';
}

let currentLang = detectLanguage();

function t(key) {
  return LANG[currentLang][key] || LANG['zh-TW'][key] || key;
}

// ── Init ──

const params = new URLSearchParams(window.location.search);
const pw = params.get('pw') || '';

const $settings = document.getElementById('settings');
const $saveBar = document.getElementById('save-bar');
const $btnSave = document.getElementById('btn-save');
const $btnReset = document.getElementById('btn-reset');

let originalConfig = null;
let statusData = null;

// ── Polymarket tag definitions ──

const PM_TAGS = [
  { id: 21, labelKey: 'tagCrypto', slug: 'crypto' },
  { id: 2, labelKey: 'tagPolitics', slug: 'politics' },
  { id: 120, labelKey: 'tagFinance', slug: 'finance' },
  { id: 1401, labelKey: 'tagTech', slug: 'tech' },
  { id: 596, labelKey: 'tagCulture', slug: 'culture' },
  { id: 100265, labelKey: 'tagGeopolitics', slug: 'geopolitics' },
  { id: 100639, labelKey: 'tagSports', slug: 'sports' },
];

const ON_ENGINES = [
  { value: 'news', labelKey: 'engineNews' },
  { value: 'listing', labelKey: 'engineListing' },
  { value: 'onchain', labelKey: 'engineOnchain' },
  { value: 'meme', labelKey: 'engineMeme' },
  { value: 'market', labelKey: 'engineMarket' },
];

const ON_SIGNALS = [
  { value: 'long', labelKey: 'signalLong' },
  { value: 'short', labelKey: 'signalShort' },
  { value: 'neutral', labelKey: 'signalNeutral' },
];

// ── Helpers ──

function msToSec(ms) { return ms != null ? ms / 1000 : ''; }
function secToMs(s) { return s !== '' && s != null ? Number(s) * 1000 : undefined; }
function msToMin(ms) { return ms != null ? ms / 60000 : ''; }
function minToMs(m) { return m !== '' && m != null ? Number(m) * 60000 : undefined; }
function intToHex(n) { return '#' + (n >>> 0).toString(16).padStart(6, '0'); }
function hexToInt(hex) { return parseInt(hex.slice(1), 16); }

function showToast(msg, type) {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

function toggle(checked) {
  return `<label class="toggle"><input type="checkbox" role="switch"${checked ? ' checked' : ''}><span class="slider"></span></label>`;
}

function passwordField(value, id) {
  return `<div class="password-wrapper">
    <input class="form-input" type="password" id="${id}" value="${escapeAttr(value || '')}">
    <button type="button" class="btn-toggle-pw" data-target="${id}">${t('show')}</button>
  </div>`;
}

function numberInput(value, id, attrs) {
  return `<input class="form-input" type="number" id="${id}" value="${escapeAttr(String(value ?? ''))}" ${attrs || ''}>`;
}

function textInput(value, id, placeholder) {
  return `<input class="form-input" type="text" id="${id}" value="${escapeAttr(value || '')}"${placeholder ? ` placeholder="${escapeAttr(placeholder)}"` : ''}>`;
}

function selectInput(options, selectedValue, id) {
  const opts = options.map(o =>
    `<option value="${o.value}"${o.value === selectedValue ? ' selected' : ''}>${o.label}</option>`
  ).join('');
  return `<select class="form-input" id="${id}">${opts}</select>`;
}

function escapeAttr(s) {
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formRow(label, inputHtml, suffix, hint) {
  return `<div class="form-row">
    <span class="form-label">${label}${hint ? `<span class="hint" title="${escapeAttr(hint)}">?</span>` : ''}</span>
    ${inputHtml}
    ${suffix ? `<span class="form-suffix">${suffix}</span>` : ''}
  </div>`;
}

function sectionHtml(key, title, bodyHtml, statusActive) {
  const dotClass = statusActive === true ? 'active' : (statusActive === false ? '' : 'hidden');
  return `<div class="settings-section" data-section="${key}">
    <div class="section-header" data-collapse="${key}">
      <h2><span class="status-indicator${dotClass === 'hidden' ? '' : (dotClass === 'active' ? ' active' : '')}"${dotClass === 'hidden' ? ' style="display:none"' : ''}></span>${title}</h2>
      <span class="chevron">&#9662;</span>
    </div>
    <div class="section-body" id="body-${key}">${bodyHtml}</div>
  </div>`;
}

// ── Section Builders ──

function buildJin10(cfg) {
  const c = cfg.jin10 || {};
  return sectionHtml('jin10', t('jin10Title'),
    formRow(t('enable'), toggle(c.enabled !== false)) +
    formRow(t('pollInterval'), numberInput(msToSec(c.pollIntervalMs), 'jin10-interval', 'min="5" step="1"'), t('sec'), t('hintPollSec')) +
    formRow(t('onlyImportant'), toggle(c.onlyImportant), '', t('hintOnlyImportant')),
    getSourceStatus('jin10')
  );
}

function buildBlockbeats(cfg) {
  const c = cfg.blockbeats || {};
  return sectionHtml('blockbeats', 'BlockBeats',
    formRow(t('enable'), toggle(c.enabled !== false)) +
    formRow(t('pollInterval'), numberInput(msToSec(c.pollIntervalMs), 'bb-interval', 'min="5" step="1"'), t('sec'), t('hintPollSec')) +
    formRow(t('onlyImportant'), toggle(c.onlyImportant), '', t('hintOnlyImportant')) +
    formRow(t('language'), selectInput([
      { value: 'cht', label: t('langCht') },
      { value: 'en', label: t('langEn') },
      { value: 'cn', label: t('langChs') }
    ], c.lang || 'cht', 'bb-lang')),
    getSourceStatus('blockbeats')
  );
}

function buildRss(cfg) {
  const feeds = cfg.rssFeeds || [];
  let html = '';
  feeds.forEach((f, i) => { html += rssItemHtml(f, i); });
  html += `<button type="button" class="btn-add" id="btn-add-rss">${t('addRss')}</button>`;
  return sectionHtml('rss', t('rssTitle'), html, getSourceStatus('rss'));
}

function rssItemHtml(f, i) {
  return `<div class="rss-item" data-rss-index="${i}">
    <div class="rss-header">
      <strong>${escapeAttr(f.name || t('newSource'))}</strong>
      <button type="button" class="btn-delete" data-rss-delete="${i}" title="${t('deleteRssTitle')}">✕</button>
    </div>
    ${formRow(t('enable'), toggle(f.enabled !== false))}
    ${formRow(t('name'), textInput(f.name, 'rss-name-' + i))}
    ${formRow(t('rssLink'), textInput(f.feedUrl, 'rss-url-' + i), '', t('hintRssUrl'))}
    ${formRow(t('checkFreq'), numberInput(msToMin(f.pollIntervalMs), 'rss-interval-' + i, 'min="1" step="1"'), t('min'), t('hintCheckFreq'))}
    ${formRow(t('color'), `<input class="form-input" type="color" id="rss-color-${i}" value="${intToHex(f.color || 0)}">`)}
  </div>`;
}

function build6551(cfg) {
  const xc = cfg.x6551 || {};
  const oc = cfg.opennews || {};
  const kols = Array.isArray(xc.kols) ? xc.kols : [];
  const signals = Array.isArray(oc.signals) ? oc.signals : [];
  const engineTypes = Array.isArray(oc.engineTypes) ? oc.engineTypes : [];
  const coins = Array.isArray(oc.coins) ? oc.coins : [];

  let kolListHtml = '';
  kols.forEach((username, i) => { kolListHtml += kolItemHtml(username, i); });
  kolListHtml += `<button type="button" class="btn-add" id="btn-add-kol">${t('addKol')}</button>`;

  let signalHtml = '<div class="tag-grid">';
  for (const s of ON_SIGNALS) {
    const checked = signals.includes(s.value) ? ' checked' : '';
    signalHtml += `<label class="tag-checkbox"><input type="checkbox" data-on-signal="${s.value}"${checked}><span>${t(s.labelKey)}</span></label>`;
  }
  signalHtml += '</div>';

  let engineHtml = '<div class="tag-grid">';
  for (const e of ON_ENGINES) {
    const checked = engineTypes.includes(e.value) ? ' checked' : '';
    engineHtml += `<label class="tag-checkbox"><input type="checkbox" data-on-engine="${e.value}"${checked}><span>${t(e.labelKey)}</span></label>`;
  }
  engineHtml += '</div>';

  // Status: active if either x or opennews is running
  const xStatus = getSourceStatus('x6551');
  const onStatus = getSourceStatus('opennews');
  const combinedStatus = xStatus === true || onStatus === true ? true : (xStatus === false && onStatus === false ? false : null);

  return sectionHtml('api6551', t('platform6551Title'),
    `<div class="help-box">
      <strong>${t('help6551Desc')}</strong>
      <ol>
        <li>${t('help6551Step1')}</li>
        <li>${t('help6551Step2')}</li>
      </ol>
    </div>` +
    formRow(t('apiServer'), textInput(xc.apiBase, 'x-apibase'), '', t('hintApiServerDefault')) +
    formRow(t('apiToken'), passwordField(xc.token, 'x-token'), '', t('hintApiTokenFrom')) +

    // ── X Monitor sub-section ──
    `<div class="sub-section">
      <h3 class="sub-title">${t('xMonitorTitle')}</h3>` +
    formRow(t('enable'), toggle(xc.enabled !== false)) +
    formRow(t('pollInterval'), numberInput(msToSec(xc.pollIntervalMs), 'x-interval', 'min="5" step="1"'), t('sec')) +
    `<div class="form-row" style="flex-direction:column;align-items:stretch">
      <span class="form-label" style="margin-bottom:8px">${t('kolAccounts')}<span class="hint" title="${escapeAttr(t('hintKolUsername'))}">?</span></span>
      <div id="kol-list">${kolListHtml}</div>
    </div>
    </div>` +

    // ── OpenNews sub-section ──
    `<div class="sub-section">
      <h3 class="sub-title">${t('opennewsTitle')}</h3>
      <p class="sub-desc">${t('opennewsDesc')}</p>` +
    formRow(t('enable'), toggle(oc.enabled !== false)) +
    formRow(t('pollInterval'), numberInput(msToSec(oc.pollIntervalMs), 'on-interval', 'min="10" step="1"'), t('sec')) +
    formRow(t('minAiScore'), numberInput(oc.minScore, 'on-minscore', 'min="0" max="100" step="5"'), '', t('hintMinScore')) +
    `<div class="form-row" style="flex-direction:column;align-items:stretch">
      <span class="form-label" style="margin-bottom:8px">${t('tradeSignals')}<span class="hint" title="${escapeAttr(t('hintNoneIsAll'))}">?</span></span>
      ${signalHtml}
    </div>` +
    `<div class="form-row" style="flex-direction:column;align-items:stretch">
      <span class="form-label" style="margin-bottom:8px">${t('newsTypes')}<span class="hint" title="${escapeAttr(t('hintNoneIsAll'))}">?</span></span>
      ${engineHtml}
    </div>` +
    formRow(t('coinFilter'), textInput(coins.join(', '), 'on-coins', t('placeholderCoins'))) +
    `</div>`,
    combinedStatus
  );
}

function kolItemHtml(username, i) {
  return `<div class="kol-item rss-item" data-kol-index="${i}">
    <div class="rss-header">
      <strong>${escapeAttr(username || '')}</strong>
      <button type="button" class="btn-delete" data-kol-delete="${i}" title="${t('deleteKolTitle')}">✕</button>
    </div>
    ${formRow(t('username'), textInput(username, 'kol-username-' + i, t('placeholderKol')))}
  </div>`;
}

function buildPolymarket(cfg) {
  const c = cfg.polymarket || {};
  const tagIds = Array.isArray(c.tagIds) ? c.tagIds : [];
  const excludeTagIds = Array.isArray(c.excludeTagIds) ? c.excludeTagIds : [];

  // Build tag checkboxes
  let tagHtml = '<div class="tag-grid">';
  for (const tag of PM_TAGS) {
    const checked = tagIds.includes(tag.id) ? ' checked' : '';
    tagHtml += `<label class="tag-checkbox"><input type="checkbox" data-pm-tag="${tag.id}"${checked}><span>${t(tag.labelKey)}</span></label>`;
  }
  tagHtml += '</div>';

  // Build exclude tag checkboxes
  let excludeHtml = '<div class="tag-grid">';
  for (const tag of PM_TAGS) {
    const checked = excludeTagIds.includes(tag.id) ? ' checked' : '';
    excludeHtml += `<label class="tag-checkbox"><input type="checkbox" data-pm-exclude="${tag.id}"${checked}><span>${t(tag.labelKey)}</span></label>`;
  }
  excludeHtml += '</div>';

  return sectionHtml('polymarket', t('polymarketTitle'),
    formRow(t('enable'), toggle(c.enabled !== false)) +
    formRow(t('pollInterval'), numberInput(msToSec(c.pollIntervalMs), 'pm-interval', 'min="5" step="1"'), t('sec')) +
    formRow(t('marketRefresh'), numberInput(msToMin(c.marketRefreshMs), 'pm-refresh', 'min="1" step="1"'), t('min'), t('hintMarketRefresh')) +
    formRow(t('minChangeThreshold'), numberInput(c.minChangePp ?? 5, 'pm-minchange', 'min="1" step="1"'), 'pp', t('hintMinChange')) +
    formRow(t('zScoreFilter'), numberInput(c.zThreshold, 'pm-zscore', 'min="0" step="0.1"'), '', t('hintZScore')) +
    formRow(t('volSpike'), numberInput(c.volSpikeThreshold, 'pm-volspike', 'min="0.1" step="0.1"'), t('times'), t('hintVolSpike')) +
    formRow(t('minLiquidity'), numberInput(c.minLiquidity, 'pm-liquidity', 'min="0" step="100"'), '$', t('hintMinLiquidity')) +
    formRow(t('analysisWindow'), numberInput(c.rollingWindowMinutes, 'pm-window', 'min="1" step="1"'), t('min'), t('hintAnalysisWindow')) +
    formRow(t('alertCooldown'), numberInput(msToMin(c.cooldownMs), 'pm-cooldown', 'min="0" step="1"'), t('min'), t('hintAlertCooldown')) +
    `<div class="form-row" style="flex-direction:column;align-items:stretch">
      <span class="form-label" style="margin-bottom:8px">${t('trackOnlyTypes')}<span class="hint" title="${escapeAttr(t('hintTrackOnly'))}">?</span></span>
      ${tagHtml}
    </div>` +
    `<div class="form-row" style="flex-direction:column;align-items:stretch">
      <span class="form-label" style="margin-bottom:8px">${t('excludeTypes')}<span class="hint" title="${escapeAttr(t('hintExcludeTypes'))}">?</span></span>
      ${excludeHtml}
    </div>`,
    getSourceStatus('polymarket')
  );
}

function buildAiTranslation(cfg) {
  const c = cfg.ai || {};
  const translator = cfg.translator || 'google';
  const models = [
    { value: 'grok-4.1-fast', label: 'Grok 4.1 Fast (xAI)' },
    { value: 'grok-3-mini-fast', label: 'Grok 3 Mini Fast (xAI)' },
    { value: 'grok-3-mini', label: 'Grok 3 Mini (xAI)' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)' },
    { value: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini (OpenAI)' },
    { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (Anthropic)' },
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (Anthropic)' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Google)' },
  ];
  const datalistOpts = models.map(m => `<option value="${m.value}" label="${m.label}">`).join('');
  const modelInput = `<input class="form-input" type="text" id="ai-model" list="model-list" value="${escapeAttr(c.model || '')}"><datalist id="model-list">${datalistOpts}</datalist>`;

  const translatorOpts = [
    { value: 'google', label: t('translatorGoogle') },
    { value: 'ai', label: t('translatorAi') },
    { value: 'none', label: t('translatorNone') },
  ];
  const translatorSelect = `<select class="form-input" id="translator-engine">${translatorOpts.map(o =>
    `<option value="${o.value}"${o.value === translator ? ' selected' : ''}>${o.label}</option>`
  ).join('')}</select>`;

  return sectionHtml('ai', t('aiTranslationTitle'),
    formRow(t('translatorEngine'), translatorSelect, '', t('hintTranslatorEngine')) +
    formRow(t('apiKey'), passwordField(c.apiKey, 'ai-key'), '', t('hintApiKey')) +
    formRow(t('aiModel'), modelInput, '', t('hintAiModel')) +
    formRow(t('apiServer'), textInput(c.baseUrl, 'ai-url'), '', t('hintApiUrl')),
    null
  );
}

function buildDiscord(cfg) {
  const c = cfg.discord || {};
  // Determine which mode is active
  const mode = (c.botToken && c.channelId) ? 'bot' : 'webhook';

  return sectionHtml('discord', t('discordTitle'),
    `<div class="form-row">
      <span class="form-label">${t('connectionMethod')}</span>
      <select class="form-input" id="discord-mode">
        <option value="webhook"${mode === 'webhook' ? ' selected' : ''}>${t('webhookSimple')}</option>
        <option value="bot"${mode === 'bot' ? ' selected' : ''}>${t('botAdvanced')}</option>
      </select>
    </div>` +
    `<div id="discord-webhook-section"${mode === 'bot' ? ' style="display:none"' : ''}>
      <div class="help-box">
        <strong>${t('webhookHelpTitle')}</strong>
        <ol>
          <li>${t('webhookStep1')}</li>
          <li>${t('webhookStep2')}</li>
          <li>${t('webhookStep3')}</li>
        </ol>
        <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">
          ${t('webhookTip')}
        </div>
      </div>
      ${formRow(t('webhookUrl'), textInput(c.webhookUrl, 'discord-webhook', 'https://discord.com/api/webhooks/...'), '', t('hintWebhookUrl'))}
    </div>` +
    `<div id="discord-bot-section"${mode === 'webhook' ? ' style="display:none"' : ''}>
      <div class="help-box">
        <strong>${t('botHelpTitle')}</strong>
        <ol>
          <li>${t('botStep1')}</li>
          <li>${t('botStep2')}</li>
          <li>${t('botStep3')}</li>
          <li>${t('botStep4')}</li>
          <li>${t('botStep5')}</li>
        </ol>
      </div>
      ${formRow(t('botToken'), passwordField(c.botToken, 'discord-bot-token'), '', t('hintBotToken'))}
      ${formRow(t('channelId'), textInput(c.channelId, 'discord-channel-id', t('placeholderChannelId')), '', t('hintChannelId'))}
    </div>`,
    null
  );
}

function buildTelegram(cfg) {
  const c = cfg.telegram || {};
  return sectionHtml('telegram', t('telegramTitle'),
    `<div class="help-box">
      <strong>${t('telegramHelpTitle')}</strong>
      <ol>
        <li>${t('telegramStep1')}</li>
        <li>${t('telegramStep2')}</li>
        <li>${t('telegramStep3')}</li>
        <li>${t('telegramStep4')}</li>
      </ol>
    </div>` +
    formRow(t('enable'), toggle(c.enabled === true)) +
    formRow(t('botToken'), passwordField(c.botToken, 'tg-bot-token'), '', t('hintTgToken')) +
    formRow(t('chatId'), textInput(c.chatId, 'tg-chat-id', t('placeholderChatId')), '', t('hintChatId')),
    null
  );
}

function buildDashboard(cfg) {
  const c = cfg.dashboard || {};
  return sectionHtml('dashboard', t('dashboardTitle'),
    formRow(t('port'), numberInput(c.port, 'dash-port', 'min="1024" max="65535" step="1"'), '', t('hintPort')) +
    formRow(t('password'), textInput(c.password, 'dash-password', t('placeholderPassword')), '', t('hintPassword')),
    null
  );
}

function getSourceStatus(key) {
  if (!statusData) return null;
  const entry = statusData[key];
  if (entry && typeof entry.active === 'boolean') return entry.active;
  if (key === 'rss') {
    for (const k of Object.keys(statusData)) {
      if (k.startsWith('rss:')) return true;
    }
  }
  return null;
}

// ── Normalize config defaults ──

function normalizeConfig(cfg) {
  if (!cfg.x6551) cfg.x6551 = {};
  if (!Array.isArray(cfg.x6551.kols)) cfg.x6551.kols = [];
  if (!cfg.polymarket) cfg.polymarket = {};
  if (!Array.isArray(cfg.polymarket.tagIds)) cfg.polymarket.tagIds = [];
  if (!Array.isArray(cfg.polymarket.excludeTagIds)) cfg.polymarket.excludeTagIds = [];
  if (!cfg.opennews) cfg.opennews = {};
  if (!Array.isArray(cfg.opennews.signals)) cfg.opennews.signals = [];
  if (!Array.isArray(cfg.opennews.coins)) cfg.opennews.coins = [];
  if (!Array.isArray(cfg.opennews.engineTypes)) cfg.opennews.engineTypes = [];
  if (!cfg.discord) cfg.discord = {};
  if (!cfg.discord.webhookUrl) cfg.discord.webhookUrl = '';
  if (!cfg.discord.botToken) cfg.discord.botToken = '';
  if (!cfg.discord.channelId) cfg.discord.channelId = '';
  if (!cfg.telegram) cfg.telegram = {};
  if (!cfg.dashboard) cfg.dashboard = {};
  if (!cfg.dashboard.port) cfg.dashboard.port = 3848;
  if (!cfg.dashboard.password && cfg.dashboard.password !== '') cfg.dashboard.password = '';
}

// ── Render ──

const TAB_GROUPS = {
  sources: cfg => buildJin10(cfg) + buildBlockbeats(cfg) + buildRss(cfg) +
                   build6551(cfg) + buildPolymarket(cfg),
  output:  cfg => buildAiTranslation(cfg) + buildDiscord(cfg) + buildTelegram(cfg),
  system:  cfg => buildDashboard(cfg),
};

function render(cfg) {
  let html = '';
  for (const [key, buildFn] of Object.entries(TAB_GROUPS)) {
    const active = key === currentTab;
    html += `<div class="tab-panel" data-panel="${key}"${active ? '' : ' style="display:none"'}>${buildFn(cfg)}</div>`;
  }
  $settings.innerHTML = html;
  bindEvents();
}

let currentTab = 'sources';

// ── Language switch ──

const TAB_KEYS = { sources: 'tabSources', output: 'tabOutput', system: 'tabSystem' };

function applyStaticLabels() {
  document.title = 'Buzz - ' + t('pageTitle');
  const h1 = document.querySelector('header h1');
  if (h1) h1.textContent = t('pageTitle');
  document.querySelectorAll('.settings-tab').forEach(btn => {
    const key = TAB_KEYS[btn.dataset.tab];
    if (key) btn.textContent = t(key);
  });
  $btnSave.textContent = t('btnSave');
  $btnReset.textContent = t('btnReset');
  document.documentElement.lang = currentLang === 'zh-TW' ? 'zh-Hant' : 'en';
}

function switchLanguage() {
  // Capture current form state before re-rendering
  const currentCfg = originalConfig ? getCurrentConfig() : null;
  currentLang = currentLang === 'zh-TW' ? 'en' : 'zh-TW';
  localStorage.setItem('buzz-lang', currentLang);
  applyStaticLabels();
  if (currentCfg) {
    normalizeConfig(currentCfg);
    render(currentCfg);
    checkChanges();
  }
}

// Language toggle button
const btnLang = document.getElementById('btn-lang');
if (btnLang) {
  btnLang.addEventListener('click', switchLanguage);
}

// Tab switching
document.getElementById('settings-tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.settings-tab');
  if (!btn) return;
  const tab = btn.dataset.tab;
  if (tab === currentTab) return;
  currentTab = tab;

  document.querySelectorAll('.settings-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  document.querySelectorAll('.tab-panel').forEach(p => {
    p.style.display = p.dataset.panel === tab ? '' : 'none';
  });
});

// ── Events ──

function bindEvents() {
  // Collapse/expand
  document.querySelectorAll('.section-header').forEach(h => {
    h.addEventListener('click', () => {
      const key = h.dataset.collapse;
      const body = document.getElementById('body-' + key);
      h.classList.toggle('collapsed');
      body.classList.toggle('hidden');
    });
  });

  // Password show/hide
  document.querySelectorAll('.btn-toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = t('hide');
      } else {
        input.type = 'password';
        btn.textContent = t('show');
      }
    });
  });

  // RSS delete (with confirmation)
  document.querySelectorAll('.btn-delete[data-rss-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm(t('confirmDeleteRss'))) return;
      btn.closest('.rss-item').remove();
      reindexRss();
      checkChanges();
    });
  });

  // RSS add
  const addRssBtn = document.getElementById('btn-add-rss');
  if (addRssBtn) {
    addRssBtn.addEventListener('click', () => {
      const idx = document.querySelectorAll('[data-rss-index]').length;
      const newFeed = { enabled: true, name: '', feedUrl: '', pollIntervalMs: 300000, color: 3447003 };
      const tmp = document.createElement('div');
      tmp.innerHTML = rssItemHtml(newFeed, idx);
      addRssBtn.before(tmp.firstElementChild);
      bindEvents();
      checkChanges();
    });
  }

  // KOL delete (with confirmation)
  document.querySelectorAll('.btn-delete[data-kol-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm(t('confirmDeleteKol'))) return;
      btn.closest('.kol-item').remove();
      reindexKols();
      checkChanges();
    });
  });

  // KOL add
  const addKolBtn = document.getElementById('btn-add-kol');
  if (addKolBtn) {
    addKolBtn.addEventListener('click', () => {
      const idx = document.querySelectorAll('[data-kol-index]').length;
      const tmp = document.createElement('div');
      tmp.innerHTML = kolItemHtml('', idx);
      addKolBtn.before(tmp.firstElementChild);
      bindEvents();
      checkChanges();
    });
  }

  // Discord mode toggle
  const discordModeSelect = document.getElementById('discord-mode');
  if (discordModeSelect) {
    discordModeSelect.addEventListener('change', () => {
      const webhookSec = document.getElementById('discord-webhook-section');
      const botSec = document.getElementById('discord-bot-section');
      if (discordModeSelect.value === 'webhook') {
        webhookSec.style.display = '';
        botSec.style.display = 'none';
      } else {
        webhookSec.style.display = 'none';
        botSec.style.display = '';
      }
      checkChanges();
    });
  }

  // Change detection on all inputs
  $settings.addEventListener('input', checkChanges);
  $settings.addEventListener('change', checkChanges);
}

function reindexRss() {
  document.querySelectorAll('.rss-item:not(.kol-item)').forEach((item, i) => {
    item.dataset.rssIndex = i;
    const del = item.querySelector('.btn-delete[data-rss-delete]');
    if (del) del.dataset.rssDelete = i;
    item.querySelectorAll('.form-input').forEach(inp => {
      if (inp.id && inp.id.startsWith('rss-')) {
        inp.id = inp.id.replace(/-\d+$/, '-' + i);
      }
    });
  });
}

function reindexKols() {
  document.querySelectorAll('.kol-item').forEach((item, i) => {
    item.dataset.kolIndex = i;
    const del = item.querySelector('.btn-delete[data-kol-delete]');
    if (del) del.dataset.kolDelete = i;
    item.querySelectorAll('.form-input').forEach(inp => {
      if (inp.id && inp.id.startsWith('kol-')) {
        inp.id = inp.id.replace(/-\d+$/, '-' + i);
      }
    });
    // Update header display
    const strong = item.querySelector('.rss-header strong');
    const input = item.querySelector(`[id^="kol-username-"]`);
    if (strong && input) strong.textContent = input.value || '';
  });
}

// ── Unsaved changes warning ──

window.addEventListener('beforeunload', (e) => {
  if (!originalConfig) return;
  const current = getCurrentConfig();
  const changed = getChangedSections(current);
  if (Object.keys(changed).length > 0) {
    e.preventDefault();
    e.returnValue = t('unsavedWarning');
  }
});

// ── Change Detection ──

function getCurrentConfig() {
  const cfg = {};

  const jin10Toggles = getSectionToggles('jin10');
  cfg.jin10 = {
    enabled: jin10Toggles[0] ?? true,
    pollIntervalMs: secToMs(getVal('jin10-interval')),
    onlyImportant: jin10Toggles[1] ?? true
  };

  const bbToggles = getSectionToggles('blockbeats');
  cfg.blockbeats = {
    enabled: bbToggles[0] ?? true,
    pollIntervalMs: secToMs(getVal('bb-interval')),
    onlyImportant: bbToggles[1] ?? true,
    lang: getVal('bb-lang')
  };

  cfg.rssFeeds = [];
  document.querySelectorAll('.rss-item:not(.kol-item)').forEach((item, i) => {
    const toggles = item.querySelectorAll('.toggle input');
    cfg.rssFeeds.push({
      enabled: toggles[0] ? toggles[0].checked : true,
      name: getVal('rss-name-' + i),
      feedUrl: getVal('rss-url-' + i),
      pollIntervalMs: minToMs(getVal('rss-interval-' + i)),
      color: hexToInt(getVal('rss-color-' + i) || '#000000')
    });
  });

  // 6551 platform (X + OpenNews share token)
  const api6551Toggles = getSectionToggles('api6551');
  const kols = [];
  document.querySelectorAll('.kol-item').forEach((item, i) => {
    const username = getVal('kol-username-' + i).trim().replace(/^@/, '');
    if (username) kols.push(username);
  });
  cfg.x6551 = {
    enabled: api6551Toggles[0] ?? true,
    apiBase: getVal('x-apibase'),
    token: getVal('x-token'),
    pollIntervalMs: secToMs(getVal('x-interval')),
    kols
  };

  // Polymarket with tags
  const pmToggles = getSectionToggles('polymarket');
  const tagIds = [];
  document.querySelectorAll('[data-pm-tag]').forEach(cb => {
    if (cb.checked) tagIds.push(Number(cb.dataset.pmTag));
  });
  const excludeTagIds = [];
  document.querySelectorAll('[data-pm-exclude]').forEach(cb => {
    if (cb.checked) excludeTagIds.push(Number(cb.dataset.pmExclude));
  });
  cfg.polymarket = {
    enabled: pmToggles[0] ?? true,
    pollIntervalMs: secToMs(getVal('pm-interval')),
    marketRefreshMs: minToMs(getVal('pm-refresh')),
    minChangePp: parseInt(getVal('pm-minchange')) || 5,
    zThreshold: parseFloat(getVal('pm-zscore')) || 0,
    volSpikeThreshold: parseFloat(getVal('pm-volspike')) || 0,
    minLiquidity: parseInt(getVal('pm-liquidity')) || 0,
    rollingWindowMinutes: parseInt(getVal('pm-window')) || 0,
    cooldownMs: minToMs(getVal('pm-cooldown')),
    tagIds,
    excludeTagIds
  };

  // OpenNews (inside api6551, 2nd toggle)
  const onSignals = [];
  document.querySelectorAll('[data-on-signal]').forEach(cb => {
    if (cb.checked) onSignals.push(cb.dataset.onSignal);
  });
  const onEngines = [];
  document.querySelectorAll('[data-on-engine]').forEach(cb => {
    if (cb.checked) onEngines.push(cb.dataset.onEngine);
  });
  const onCoinsRaw = getVal('on-coins').trim();
  const onCoins = onCoinsRaw ? onCoinsRaw.split(/[,，\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean) : [];
  cfg.opennews = {
    enabled: api6551Toggles[1] ?? false,
    pollIntervalMs: secToMs(getVal('on-interval')),
    minScore: parseInt(getVal('on-minscore')) || 0,
    signals: onSignals,
    coins: onCoins,
    engineTypes: onEngines,
  };

  cfg.translator = getVal('translator-engine') || 'google';
  cfg.ai = {
    apiKey: getVal('ai-key'),
    model: getVal('ai-model'),
    baseUrl: getVal('ai-url')
  };

  const discordMode = getVal('discord-mode');
  cfg.discord = {
    webhookUrl: discordMode === 'webhook' ? getVal('discord-webhook') : '',
    botToken: discordMode === 'bot' ? getVal('discord-bot-token') : '',
    channelId: discordMode === 'bot' ? getVal('discord-channel-id') : '',
  };

  const tgToggles = getSectionToggles('telegram');
  cfg.telegram = {
    enabled: tgToggles[0] ?? false,
    botToken: getVal('tg-bot-token'),
    chatId: getVal('tg-chat-id'),
  };

  cfg.dashboard = {
    port: parseInt(getVal('dash-port')) || 3848,
    password: getVal('dash-password'),
  };

  return cfg;
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function getSectionToggles(sectionKey) {
  const section = document.querySelector(`[data-section="${sectionKey}"]`);
  if (!section) return [];
  return Array.from(section.querySelectorAll('.toggle input')).map(cb => cb.checked);
}

function getChangedSections(current) {
  const changed = {};
  const sections = ['jin10', 'blockbeats', 'rssFeeds', 'x6551', 'polymarket', 'opennews', 'translator', 'ai', 'discord', 'telegram', 'dashboard'];
  for (const key of sections) {
    if (JSON.stringify(current[key]) !== JSON.stringify(originalConfig[key])) {
      changed[key] = current[key];
    }
  }
  return changed;
}

function checkChanges() {
  if (!originalConfig) return;
  const current = getCurrentConfig();
  const changed = getChangedSections(current);
  const hasChanges = Object.keys(changed).length > 0;
  $btnSave.disabled = !hasChanges;
  if (hasChanges) {
    $saveBar.classList.add('visible');
  } else {
    $saveBar.classList.remove('visible');
  }
}

// ── Save ──

$btnSave.addEventListener('click', async () => {
  const current = getCurrentConfig();
  const changed = getChangedSections(current);
  if (Object.keys(changed).length === 0) return;

  if (!confirm(t('confirmSave'))) return;

  $btnSave.disabled = true;
  $btnSave.textContent = t('saving');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`/api/config?pw=${encodeURIComponent(pw)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changed),
      signal: controller.signal
    });
    clearTimeout(timeout);

    const data = await res.json();
    if (data.ok) {
      showToast(t('saveSuccess'), 'success');
      await loadConfig();
    } else {
      const msg = data.error || (Array.isArray(data.errors) ? data.errors.join('\n') : t('saveFailed'));
      showToast(msg, 'error');
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      showToast(t('timeoutError'), 'error');
    } else {
      showToast(t('connectionError'), 'error');
    }
  } finally {
    $btnSave.textContent = t('btnSave');
    checkChanges();
  }
});

// ── Reset ──

if ($btnReset) {
  $btnReset.addEventListener('click', () => {
    if (!originalConfig) return;
    if (!confirm(t('confirmReset'))) return;
    render(originalConfig);
    checkChanges();
    showToast(t('resetSuccess'), 'success');
  });
}

// ── Load ──

async function loadConfig() {
  try {
    const [cfgRes, statusRes] = await Promise.all([
      fetch(`/api/config?pw=${encodeURIComponent(pw)}`),
      fetch(`/api/status?pw=${encodeURIComponent(pw)}`)
    ]);
    if (!cfgRes.ok) {
      throw new Error(cfgRes.status === 401 ? t('authError') : `Server error (${cfgRes.status})`);
    }
    const cfg = await cfgRes.json();
    statusData = await statusRes.json().catch(() => null);
    normalizeConfig(cfg);
    originalConfig = JSON.parse(JSON.stringify(cfg));
    render(cfg);
  } catch (e) {
    const msg = e.message.includes('Failed to fetch')
      ? t('loadError')
      : e.message;
    $settings.innerHTML = `<div class="empty">${escapeAttr(msg)}<br><button onclick="location.reload()" style="margin-top:12px;padding:8px 16px;cursor:pointer">${t('reload')}</button></div>`;
  }
}

// ── Init ──

applyStaticLabels();
loadConfig();
