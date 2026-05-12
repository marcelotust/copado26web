# Meu Álbum 2026

Progressive web app for managing a FIFA World Cup 2026 sticker collection with a signed-in account and cloud sync.

Built with **React + Vite**, **Tailwind CSS**, **Supabase**, **Vercel Analytics**, and **vite-plugin-pwa**.

## Features

- 48 teams plus stadiums and special sections
- Click to add a sticker, right-click to remove
- Missing stickers are greyed out; collected stickers use vibrant gradients; duplicate counts show a badge
- Swaps view for duplicate stickers grouped by team
- Settings for sign-out, CSV export, and album reset
- PWA install on mobile and desktop with cached static assets after first load

Scanner and OCR remain experimental and are outside the current MVP scope.

## Getting started

### Prerequisites

- Node.js 18+
- npm

### Install and run

```bash
npm install
npm run dev
```

Open http://localhost:5173

### Build

```bash
npm run build
npm run preview
```

### Tests

```bash
npm run test:ci
```

## Environment variables

Create `.env.local` for local development:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SENTRY_DSN=...
```

`VITE_SENTRY_DSN` is optional and only needed when Sentry is enabled.

## Deploy to Vercel

1. Import the GitHub repository in Vercel with the Vite preset.
2. Configure the Supabase environment variables for preview and production.
3. Deploy.

## Quality and privacy docs

See [docs/mvp-quality-and-observability.md](docs/mvp-quality-and-observability.md) for the MVP backlog around analytics, logging, errors, LGPD, and tests.

## License

MIT
