// news-discord-worker — Cloudflare Worker
// Handles Discord slash commands for KOL management
// Forwards /add, /remove, /list to VPS API (POST /api/kols)

const INTERACTION_TYPE = {
  PING: 1,
  APPLICATION_COMMAND: 2,
};
const INTERACTION_CALLBACK_TYPE = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true, ts: Date.now() });
    }

    if (request.method === 'POST' && url.pathname === '/interactions') {
      return handleInteraction(request, env);
    }

    return json({ error: 'Not found' }, 404);
  },
};

// ─── Helpers ───

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Call VPS /api/kols endpoint
async function callKolAPI(env, action, username) {
  const base = env.VPS_API_URL; // e.g. https://your-server.com:3848
  const pw = env.VPS_API_PW || '';
  const apiUrl = `${base}/api/kols${pw ? `?pw=${encodeURIComponent(pw)}` : ''}`;

  const body = { action };
  if (username) body.username = username;

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return res.json();
}

// ─── /interactions — Discord slash commands ───

async function handleInteraction(request, env) {
  // Verify Discord signature
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const rawBody = await request.text();

  const isValid = await verifyDiscordSignature(
    env.DISCORD_PUBLIC_KEY,
    signature,
    timestamp,
    rawBody,
  );
  if (!isValid) {
    return new Response('Bad request signature', { status: 401 });
  }

  const interaction = JSON.parse(rawBody);

  // Handle PING
  if (interaction.type === INTERACTION_TYPE.PING) {
    return json({ type: INTERACTION_CALLBACK_TYPE.PONG });
  }

  // Handle slash commands
  if (interaction.type === INTERACTION_TYPE.APPLICATION_COMMAND) {
    const { name, options } = interaction.data;

    if (name === 'add') {
      const username = options?.[0]?.value?.replace(/^@/, '');
      if (!username) return interactionReply('Please provide a username.');
      try {
        const result = await callKolAPI(env, 'add', username);
        if (!result.ok) return interactionReply(`Error: ${result.error}`);
        if (result.message === 'already exists') {
          return interactionReply(`\`${username}\` is already in the KOL list.`);
        }
        return interactionReply(`Added \`${username}\` to KOL tracking list. (${result.kols.length} total)`);
      } catch (e) {
        return interactionReply(`Failed to add: ${e.message}`);
      }
    }

    if (name === 'remove') {
      const username = options?.[0]?.value?.replace(/^@/, '');
      if (!username) return interactionReply('Please provide a username.');
      try {
        const result = await callKolAPI(env, 'remove', username);
        if (!result.ok) return interactionReply(`\`${username}\` is not in the KOL list.`);
        return interactionReply(`Removed \`${username}\` from KOL tracking list. (${result.kols.length} remaining)`);
      } catch (e) {
        return interactionReply(`Failed to remove: ${e.message}`);
      }
    }

    if (name === 'list') {
      try {
        const result = await callKolAPI(env, 'list');
        const kols = result.kols || [];
        if (kols.length === 0) {
          return interactionReply('KOL tracking list is empty.');
        }
        const list = kols.map((k) => `• \`${k}\``).join('\n');
        return interactionReply(`**KOL Tracking List** (${kols.length}):\n${list}`);
      } catch (e) {
        return interactionReply(`Failed to fetch list: ${e.message}`);
      }
    }

    return interactionReply('Unknown command.');
  }

  return json({ error: 'Unknown interaction type' }, 400);
}

function interactionReply(content) {
  return json({
    type: INTERACTION_CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content },
  });
}

// ─── Discord Ed25519 Signature Verification ───

async function verifyDiscordSignature(publicKeyHex, signature, timestamp, body) {
  if (!publicKeyHex || !signature || !timestamp) return false;
  try {
    const encoder = new TextEncoder();
    const publicKeyBytes = hexToUint8Array(publicKeyHex);
    const signatureBytes = hexToUint8Array(signature);
    const message = encoder.encode(timestamp + body);

    const key = await crypto.subtle.importKey(
      'raw',
      publicKeyBytes,
      { name: 'Ed25519', namedCurve: 'Ed25519' },
      false,
      ['verify'],
    );

    return await crypto.subtle.verify('Ed25519', key, signatureBytes, message);
  } catch (e) {
    console.error('Signature verification error:', e);
    return false;
  }
}

function hexToUint8Array(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
