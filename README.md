# MLT — Individual Road Expeditions

Premium interactive concept for MLT GmbH. The beta demonstrates the brand direction, four travel collections and the first step of a configurable journey flow.

## Local start

Requirements: Node.js 22+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open the local address shown in the terminal (normally `http://localhost:5173`).

## Production check

```bash
pnpm build
```

The current beta is a front-end concept. Payments, CRM, inventory, CMS content and production booking logic are intentionally outside this demonstration scope.

## Telegram concierge channel

The proposal form works in demo mode without credentials. To deliver real manager alerts, copy `.env.example` to `.env.local` and provide:

- `TELEGRAM_BOT_TOKEN` — token created through BotFather;
- `TELEGRAM_CHAT_ID` — manager, group or channel chat ID.

Never commit `.env.local` or the bot token.
