// Register Discord slash commands for the bot
// Run once: node register-commands.js

const DISCORD_API = 'https://discord.com/api/v10';

// Fill these in before running
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const APP_ID = process.env.DISCORD_APP_ID || '';

const commands = [
  {
    name: 'add',
    description: 'Add a KOL to the tracking list',
    options: [
      {
        name: 'username',
        description: 'X username',
        type: 3, // STRING
        required: true,
      },
    ],
  },
  {
    name: 'remove',
    description: 'Remove a KOL from the tracking list',
    options: [
      {
        name: 'username',
        description: 'X username',
        type: 3, // STRING
        required: true,
      },
    ],
  },
  {
    name: 'list',
    description: 'Show the current KOL tracking list',
  },
];

async function register() {
  const url = `${DISCORD_API}/applications/${APP_ID}/commands`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });

  if (!res.ok) {
    console.error('Failed:', res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  console.log(`Registered ${data.length} commands:`);
  data.forEach((cmd) => console.log(`  /${cmd.name} — ${cmd.description}`));
}

register();
