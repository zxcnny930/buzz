// Buzz — Main entry point
// Jin10 + BlockBeats + RSS + X + Polymarket → Discord + Dashboard

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { ConfigManager } from './config-manager.js';
import { PollerRegistry } from './poller-registry.js';
import { createTranslator } from './translator.js';
import { fetchPolymarketZh } from './polymarket-zh.js';
import { Notifier } from './notifier.js';
import { EventBus } from './event-bus.js';
import { DashboardServer } from './dashboard/server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load .env manually (no dotenv dependency needed)
const envPath = resolve(__dirname, '..', '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}
const configPath = resolve(__dirname, '..', 'config.json');

// 1. Load config (secrets can be overridden via env vars)
const cfgMgr = new ConfigManager(configPath);
// Override secrets from environment variables (mutate internal config, skip file write)
if (process.env.BUZZ_DEEPSEEK_API_KEY) cfgMgr._config.ai = { ...cfgMgr._config.ai, apiKey: process.env.BUZZ_DEEPSEEK_API_KEY };
if (process.env.BUZZ_TELEGRAM_BOT_TOKEN) cfgMgr._config.telegram = { ...cfgMgr._config.telegram, botToken: process.env.BUZZ_TELEGRAM_BOT_TOKEN };
if (process.env.BUZZ_6551_TOKEN) cfgMgr._config.x6551 = { ...cfgMgr._config.x6551, token: process.env.BUZZ_6551_TOKEN };
if (process.env.BUZZ_DASHBOARD_PASSWORD) cfgMgr._config.dashboard = { ...cfgMgr._config.dashboard, password: process.env.BUZZ_DASHBOARD_PASSWORD };
const config = cfgMgr.get();

const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf8'));
console.log(`=== Buzz v${pkg.version} Starting ===`);

// 2. Shared deps (mutable — registry can replace notifier/translator on config change)
const deps = {
  translator: createTranslator(config),
  notifier: new Notifier({ discord: config.discord || {}, telegram: config.telegram || {} }),
  bus: new EventBus(200),
};

// 3. Handler factories — read from deps object, NOT closed-over variables.
//    When the registry replaces deps.notifier/translator, all handlers automatically use the new one.

function formatNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(Math.round(n));
}

function createHandlers(deps) {
  return {
    handleJin10Batch: async (items) => {
      console.log(`[Jin10] ${items.length} new items`);
      for (const item of items) {
        const t = item.time?.split(' ')[1]?.slice(0, 5) || '';
        let desc = item.title
          ? `### ${item.title}\n${item.content}`
          : item.content;
        if (item.link) desc += `\n[🔗 原文連結](${item.link})`;
        const embed = {
          description: desc,
          color: item.important ? 0xff9800 : 0x9e9e9e,
          author: { name: `金十快訊 · ${t}` },
          footer: { text: item.important ? '⚡ 重要' : '金十數據' },
        };
        const ok = await deps.notifier.send('news', embed);
        if (ok) console.log(`[Jin10] Sent: ${(item.title || item.content).slice(0, 60)}`);
        deps.bus.push('jin10', {
          title: item.title || '',
          description: item.content,
          important: item.important,
        });
      }
    },

    handleBlockBeatsBatch: async (items) => {
      console.log(`[BlockBeats] ${items.length} new items`);
      for (const item of items) {
        const t = item.time instanceof Date
          ? `${String(item.time.getHours()).padStart(2, '0')}:${String(item.time.getMinutes()).padStart(2, '0')}`
          : '';
        let desc = `### ${item.title}`;
        const link = item.link || item.sourceUrl;
        if (link) desc += `\n[🔗 原文連結](${link})`;
        const embed = {
          description: desc,
          color: 0x00bcd4,
          author: { name: `BlockBeats · ${t}` },
          footer: { text: '區塊律動' },
        };
        const ok = await deps.notifier.send('news', embed);
        if (ok) console.log(`[BlockBeats] Sent: ${item.title.slice(0, 60)}`);
        deps.bus.push('blockbeats', {
          title: item.title,
          description: item.content || '',
          url: link || '',
        });
      }
    },

    makeRssHandler: (feedName, color) => {
      return async (items) => {
        console.log(`[${feedName}] ${items.length} new items`);
        for (const item of items) {
          let desc = `### ${item.title}`;
          const summary = item.description ? item.description.replace(/<[^>]+>/g, '').trim() : '';
          if (summary) desc += `\n${summary}`;
          if (item.link) desc += `\n[🔗 原文連結](${item.link})`;
          const embed = {
            description: desc,
            color,
            author: { name: feedName },
            footer: { text: feedName },
          };
          const ok = await deps.notifier.send('news', embed);
          if (ok) console.log(`[${feedName}] Sent: ${item.title.slice(0, 60)}`);
          deps.bus.push('rss', {
            title: item.title,
            description: summary,
            url: item.link || '',
            feedName,
          });
        }
      };
    },

    handleXPost: async ({ username, post }) => {
      const text = post.full_text || post.text || post.legacy?.full_text || '';
      console.log(`[X] @${username}: ${text.slice(0, 80)}`);
      let display = text;
      if (deps.translator.isEnglish(text)) {
        display = (await deps.translator.translate(text)) || text;
      }
      const embed = deps.notifier.buildTweetEmbed(username, post, display);
      const ok = await deps.notifier.send('tweet', embed);
      if (ok) console.log('[X] Sent to Discord');
      deps.bus.push('x', {
        title: `@${username}`,
        description: display,
      });
    },

    handleCcassBatch: async (items) => {
      console.log(`[CCASS] ${items.length} shareholding changes detected`);
      for (const item of items) {
        const arrow = item.deltaPct > 0 ? '📈' : '📉';
        const sign = item.deltaPct > 0 ? '+' : '';
        const typeLabel = item.type === 'new_entry' ? '🆕 新进' :
          item.type === 'exit' ? '🚪 退出' :
          item.deltaPct > 0 ? '增持' : '减持';

        const desc = [
          `**${item.stockCode}.HK** — ${typeLabel}`,
          `**持仓人**: ${item.holderName} (${item.holderId})`,
          `**变动**: ${item.prevPct.toFixed(2)}% → ${item.currPct.toFixed(2)}% (${sign}${item.deltaPct.toFixed(2)}%)`,
        ].join('\n');

        const color = item.deltaPct > 0 ? 0x00c853 : 0xff1744;
        const embed = {
          title: `${arrow} CCASS 持仓变动 · ${item.stockCode}.HK`,
          description: desc,
          color,
          footer: { text: 'HKEX CCASS Disclosure' },
        };
        const ok = await deps.notifier.send('news', embed);
        if (ok) console.log(`[CCASS] Sent: ${item.stockCode} ${item.holderName} ${sign}${item.deltaPct.toFixed(2)}%`);
        deps.bus.push('ccass', {
          title: `CCASS ${item.stockCode}.HK ${typeLabel}`,
          description: `${item.holderName} ${sign}${item.deltaPct.toFixed(2)}%`,
          stockCode: item.stockCode,
        });
      }
    },

    handleEconCalendarBatch: async (items) => {
      console.log(`[EconCal] ${items.length} economic events`);
      for (const item of items) {
        const impactIcon = item.impact === 'High' ? '🔴' : item.impact === 'Medium' ? '🟡' : '⚪';
        const isRelease = item.isRelease;

        let desc;
        if (isRelease) {
          // Data released
          const surprise = item.actual && item.forecast &&
            item.actual.replace(/[%KMB]/g, '') !== item.forecast.replace(/[%KMB]/g, '')
            ? ' ⚡ 超预期' : '';
          desc = [
            `${impactIcon} **${item.country}** · ${item.impact}`,
            `**实际值**: ${item.actual}${surprise}`,
            `**预期**: ${item.forecast || '—'} · **前值**: ${item.previous || '—'}`,
          ].join('\n');
        } else {
          // Upcoming event
          desc = [
            `${impactIcon} **${item.country}** · ${item.impact}`,
            `⏰ ${item.minutesUntil} 分钟后发布`,
            `**预期**: ${item.forecast || '—'} · **前值**: ${item.previous || '—'}`,
          ].join('\n');
        }

        const color = isRelease ? 0x2196f3 : (item.impact === 'High' ? 0xff9800 : 0x9e9e9e);
        const embed = {
          title: `📅 ${item.title}`,
          description: desc,
          color,
          footer: { text: isRelease ? '经济数据发布' : '经济日历预告' },
          timestamp: new Date(item.date).toISOString(),
        };
        const ok = await deps.notifier.send('news', embed);
        if (ok) console.log(`[EconCal] Sent: ${item.country} ${item.title}`);
        deps.bus.push('econCalendar', {
          title: `${item.country} ${item.title}`,
          description: desc,
          impact: item.impact,
          isRelease: !!isRelease,
        });
      }
    },

    handleHkexBatch: async (items) => {
      console.log(`[HKEX] ${items.length} new announcements`);
      for (const item of items) {
        const stockLabel = item.stockCode ? `${item.stockCode}.HK ${item.stockName}` : '';
        let desc = `### ${item.title}`;
        if (stockLabel) desc = `**${stockLabel}**\n${desc}`;
        if (item.category) desc += `\n📋 ${item.category.replace(/<[^>]+>/g, '')}`;
        if (item.fileLink) desc += `\n[📄 查看公告](https://www1.hkexnews.hk${item.fileLink})`;

        // Color by category: Inside Info = red, Results = blue, others = grey
        const cat = (item.category || '').toLowerCase();
        let color = 0x9e9e9e;
        if (cat.includes('inside information') || cat.includes('suspension')) color = 0xff1744;
        else if (cat.includes('results')) color = 0x2196f3;
        else if (cat.includes('buy-back') || cat.includes('placing') || cat.includes('rights')) color = 0xff9800;

        const embed = {
          description: desc,
          color,
          author: { name: `HKEX · ${item.dateTime}` },
          footer: { text: '港交所公告' },
        };
        const ok = await deps.notifier.send('news', embed);
        if (ok) console.log(`[HKEX] Sent: ${stockLabel} ${item.title.slice(0, 50)}`);
        deps.bus.push('hkex', {
          title: `${stockLabel} ${item.title}`,
          description: item.category,
          stockCode: item.stockCode,
          url: item.fileLink ? `https://www1.hkexnews.hk${item.fileLink}` : '',
        });
      }
    },

    handleOpenNewsBatch: async (items) => {
      console.log(`[OpenNews] ${items.length} new high-score articles`);
      for (const item of items) {
        const rating = item.aiRating || {};
        const score = rating.score ?? 0;
        const grade = rating.grade || '';
        const signal = rating.signal || '';
        const title = item.text || '';
        const summary = rating.summary || rating.enSummary || '';
        const source = item.newsType || item.engineType || '';
        const coins = (item.coins || []).map(c => c.symbol).join(', ');

        const signalIcon = signal === 'long' ? '🟢' : signal === 'short' ? '🔴' : '⚪';
        const signalText = signal === 'long' ? '看漲' : signal === 'short' ? '看跌' : '中性';

        let desc = `**AI 評分**: ${score} (${grade}) ${signalIcon} ${signalText}`;
        if (coins) desc += `\n**相關幣種**: ${coins}`;
        if (summary) desc += `\n${summary}`;
        if (item.link) desc += `\n[🔗 原文連結](${item.link})`;

        const color = signal === 'long' ? 0x00c853 : signal === 'short' ? 0xff1744 : 0x9e9e9e;
        const embed = {
          title: title.slice(0, 256),
          description: desc.slice(0, 4000),
          color,
          author: { name: `OpenNews · ${source}` },
          footer: { text: `AI Score ${score} · ${grade}` },
          timestamp: item.ts ? new Date(item.ts).toISOString() : new Date().toISOString(),
        };

        const ok = await deps.notifier.send('news', embed);
        if (ok) console.log(`[OpenNews] Sent: ${title.slice(0, 60)}`);
        deps.bus.push('opennews', {
          title,
          description: summary || desc,
          score,
          signal,
          coins,
          url: item.link || '',
        });
      }
    },

    handlePolymarketSpike: async (spike) => {
      const market = spike.market;
      const eventSlug = market.eventSlug || market.slug;
      const marketUrl = `https://polymarket.com/event/${eventSlug}`;
      const ogImageUrl = `https://polymarket.com/api/og?eslug=${encodeURIComponent(eventSlug)}&tid=${Date.now()}`;

      // Helper: translate market question — try Polymarket /zh/ first, then translator engine
      async function translateTitle(text) {
        // 1. Try official Polymarket Chinese
        const zh = await fetchPolymarketZh(eventSlug);
        if (zh) return zh;
        // 2. Fallback to configured translator
        if (deps.translator.isEnglish(text)) {
          return (await deps.translator.translate(text)) || text;
        }
        return text;
      }

      // Helper: translate outcome — show "中文 (English)" when translated
      async function translateOutcome(original) {
        if (!original || !deps.translator.isEnglish(original)) return original;
        const zh = await deps.translator.translate(original);
        if (zh && zh !== original) return `${zh} (${original})`;
        return original;
      }

      let embed;
      if (spike.type === 'price') {
        const icon = spike.direction === 'up' ? '📈' : '📉';
        const color = spike.direction === 'up' ? 0x00c853 : 0xff1744;
        const sign = spike.changePp > 0 ? '+' : '';
        const title = await translateTitle(market.question);
        const outcomeName = await translateOutcome(spike.outcome);
        embed = {
          title: `${icon} ${title}`,
          description: [
            `**選項**: ${outcomeName}`,
            `**變動**: ${(spike.prevPrice * 100).toFixed(1)}% → ${(spike.currentPrice * 100).toFixed(1)}%（${sign}${spike.changePp}pp）`,
            `[🔗 Polymarket](${marketUrl})`,
          ].join('\n'),
          color,
          image: { url: ogImageUrl },
          footer: { text: 'Polymarket' },
          timestamp: new Date().toISOString(),
        };
      } else if (spike.type === 'volume') {
        const title = await translateTitle(market.question);
        let outcomeLine = '';
        if (market.groupItemTitle) {
          const outcomeName = await translateOutcome(market.groupItemTitle);
          outcomeLine = `**選項**: ${outcomeName}\n`;
        }
        embed = {
          title: `🔊 ${title}`,
          description: [
            outcomeLine ? outcomeLine.trim() : null,
            `**24h 交易量**: $${formatNum(spike.currentVolume)}`,
            `**前次交易量**: $${formatNum(spike.prevVolume)}`,
            `**增幅**: ${spike.ratio}x`,
            `[🔗 Polymarket](${marketUrl})`,
          ].filter(Boolean).join('\n'),
          color: 0xff6b35,
          image: { url: ogImageUrl },
          footer: { text: 'Polymarket Volume Alert' },
          timestamp: new Date().toISOString(),
        };
      }
      if (embed) {
        const ok = await deps.notifier.send('news', embed);
        if (ok) console.log(`[Polymarket] Sent spike: ${market.question.slice(0, 60)}`);
        deps.bus.push('polymarket', {
          title: embed.title,
          description: embed.description,
          spikeType: spike.type,
          direction: spike.direction,
          url: marketUrl,
          ogImageUrl,
        });
      }
    },
  };
}

// 4. Create registry and start
const handlers = createHandlers(deps);
const registry = new PollerRegistry(cfgMgr, deps, handlers);

// 5. Dashboard (pass cfgMgr and registry for future API routes)
const dashboard = new DashboardServer(deps.bus, config.dashboard || {}, cfgMgr, registry);
dashboard.start();

// 6. Start all pollers
registry.startAll();

// 7. Graceful shutdown
function shutdown(sig) {
  console.log(`\n[Main] ${sig}, shutting down...`);
  registry.stopAll();
  dashboard.stop();
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
