// Notifier — Send embeds to Discord + Telegram

const DISCORD_API = 'https://discord.com/api/v10';
const TG_API = 'https://api.telegram.org';

export class Notifier {
  constructor(config) {
    // Discord (backward compatible: accept { webhookUrl, botToken } or { discord, telegram })
    const dc = config.discord || config;
    this.webhookUrl = dc.webhookUrl || '';
    this.botToken = dc.botToken || '';
    this.channelId = dc.channelId || '';

    // Telegram
    const tg = config.telegram || {};
    this.tgEnabled = tg.enabled !== false && !!(tg.botToken && tg.chatId);
    this.tgBotToken = tg.botToken || '';
    this.tgChatId = tg.chatId || '';
  }

  get isConfigured() {
    return !!(this.webhookUrl || (this.botToken && this.channelId) || this.tgEnabled);
  }

  _isDiscordConfigured() {
    return !!(this.webhookUrl || (this.botToken && this.channelId));
  }

  async send(type, embed, options) {
    const tasks = [];
    if (this._isDiscordConfigured()) tasks.push(this._sendDiscord(embed, options));
    if (this.tgEnabled) tasks.push(this._sendTelegram(embed));
    if (tasks.length === 0) return false;
    const results = await Promise.allSettled(tasks);
    return results.some(r => r.status === 'fulfilled' && r.value === true);
  }

  // ─── Discord ───

  async _sendDiscord(embed, options) {
    const payload = { embeds: [embed] };
    if (options?.content) payload.content = options.content;

    try {
      let url, headers;

      if (this.webhookUrl) {
        url = this.webhookUrl;
        headers = { 'Content-Type': 'application/json' };
      } else {
        url = `${DISCORD_API}/channels/${this.channelId}/messages`;
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bot ${this.botToken}`,
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.status === 204 || res.ok) return true;

      const text = await res.text().catch(() => '');
      console.error(`[Notifier] Discord returned ${res.status}:`, text);

      if (res.status === 429) {
        try {
          const data = JSON.parse(text);
          console.error(`[Notifier] Rate limited, retry after ${data.retry_after}s`);
        } catch {}
      }
      return false;
    } catch (e) {
      console.error('[Notifier] Discord error:', e.message);
      return false;
    }
  }

  // ─── Telegram ───

  async _sendTelegram(embed) {
    try {
      const html = this._embedToTelegram(embed);
      const hasImage = embed.image?.url;

      if (hasImage) {
        // sendPhoto — caption limit 1024 chars
        const caption = html.slice(0, 1024);
        const res = await fetch(`${TG_API}/bot${this.tgBotToken}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: this.tgChatId,
            photo: embed.image.url,
            caption,
            parse_mode: 'HTML',
          }),
        });
        if (res.ok) return true;
        const text = await res.text().catch(() => '');
        console.error(`[Notifier] Telegram sendPhoto returned ${res.status}:`, text);
        return false;
      }

      // sendMessage — text limit 4096 chars
      const text = html.slice(0, 4096);
      const res = await fetch(`${TG_API}/bot${this.tgBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.tgChatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: false,
        }),
      });
      if (res.ok) return true;
      const errText = await res.text().catch(() => '');
      console.error(`[Notifier] Telegram sendMessage returned ${res.status}:`, errText);
      return false;
    } catch (e) {
      console.error('[Notifier] Telegram error:', e.message);
      return false;
    }
  }

  _embedToTelegram(embed) {
    const parts = [];

    if (embed.author?.name) parts.push(this._escHtml(embed.author.name));
    if (embed.title) {
      const titleText = this._escHtml(embed.title);
      parts.push(embed.url ? `<b><a href="${this._escHtml(embed.url)}">${titleText}</a></b>` : `<b>${titleText}</b>`);
    }
    if (embed.description) {
      // Convert Markdown subset to HTML
      let desc = embed.description;
      desc = desc.replace(/### (.+)/g, '<b>$1</b>');
      desc = desc.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
      desc = desc.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
      // Escape remaining HTML-sensitive chars (but not the tags we just created)
      desc = desc.replace(/&(?!amp;|lt;|gt;|quot;)/g, '&amp;')
                 .replace(/<(?!\/?(?:b|a|i|code|pre)\b)/g, '&lt;');
      parts.push(desc);
    }
    if (embed.footer?.text) parts.push(`<i>${this._escHtml(embed.footer.text)}</i>`);

    return parts.join('\n');
  }

  _escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Build Discord embed for tweet
  buildTweetEmbed(username, tweet, translatedText) {
    const text = tweet.full_text || tweet.text || tweet.legacy?.full_text || '';
    const displayText = translatedText || text;

    const likes = tweet.favorite_count ?? tweet.legacy?.favorite_count ?? 0;
    const retweets = tweet.retweet_count ?? tweet.legacy?.retweet_count ?? 0;
    const replies = tweet.reply_count ?? tweet.legacy?.reply_count ?? 0;

    const formatCount = (n) => {
      if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
      return String(n);
    };

    const tweetId = tweet.id || tweet.tweetId || tweet.rest_id || '';
    const tweetUrl = tweetId ? `https://x.com/${username}/status/${tweetId}` : undefined;

    return {
      author: { name: `@${username}`, url: `https://x.com/${username}` },
      description: displayText.slice(0, 4000),
      color: 0x1da1f2,
      footer: {
        text: `❤️ ${formatCount(likes)} | RT ${formatCount(retweets)} | 💬 ${formatCount(replies)}`,
      },
      url: tweetUrl,
      timestamp: tweet.created_at
        ? new Date(tweet.created_at).toISOString()
        : new Date().toISOString(),
    };
  }
}
