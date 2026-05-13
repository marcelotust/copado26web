# ⚽ Meu Álbum 2026

Progressive web app for tracking your Panini FIFA World Cup 2026 sticker collection with a signed-in account and cloud sync.

Built with **React + Vite**, **Tailwind CSS**, **Supabase** (auth · Postgres · realtime), **Vercel Analytics**, **Tesseract.js** for camera OCR, and **vite-plugin-pwa** for installable bundles.

## Features

- **All 48 qualified nations** in the printed Panini album order, plus the opening "We Are Panini" section (`FWC 01`–`FWC 08`), the World Cup history closing section (`FWC 09`–`FWC 19`), and the 14 Coca-Cola exclusive stickers.
- **Click a sticker to add it · click again to remove it** (with a confirmation on the last copy).
- **Greyed when missing · vibrant gradient when collected · `+N` badge for duplicates.**
- **Missing view** with a one-tap WhatsApp share that lists every sticker you still need, grouped by team.
- **Swaps view** with all your duplicates grouped by team.
- **OCR scanner** — point the rear camera at a sticker code like `BRA 10` and Tesseract maps it to the catalog. The opening section's printed codes `FWC 1`–`FWC 8` are mapped to the catalog's `WAP-01`–`WAP-08` automatically.
- **Magic-link or Google sign-in** via Supabase Auth. Data is stored server-side and syncs across devices in realtime.
- **Settings** for sign-out, CSV export, and album reset.
- **PWA** — installable on mobile/desktop. The catalog needs network on the first launch, but is cached afterwards.
- **Three languages** out of the box: 🇧🇷 pt-BR · 🇺🇸 en · 🇪🇸 es.

Scanner and OCR remain experimental and are outside the current MVP scope.

## Architecture

```
src/
├── App.tsx                       – session gate: login vs <StickersProvider>
├── AuthenticatedApp.tsx          – authenticated shell, tab routes, legal pages
├── main.tsx                      – React entry point
├── index.css                     – Tailwind directives + global resets
├── lib/
│   └── supabase.ts               – Supabase client (anon key)
├── state/
│   ├── StickersProvider.tsx      – wraps authenticated app + loads catalog
│   ├── stickersStore.tsx         – teams + catalog + per-user quantities,
│   │                               realtime, optimistic writes via adjust_sticker RPC
│   └── …                         – reducers, selectors, load/realtime hooks
├── hooks/
│   ├── useAuth.ts                – Supabase session + magic-link / Google sign-in
│   ├── useStickerActions.ts      – per-card click handlers with debounced flushes
│   ├── useScannerLog.ts          – scanner write path + printed-code → catalog-id mapping
│   └── useOCR.ts                 – Tesseract worker management
├── pages/                        – AlbumPage · SwapsPage · MissingPage · SettingsPage · LoginPage · ScannerPage · LegalPage
├── components/                   – Header · Sidebar · TabNav · StickerCard · etc.
└── i18n/
    ├── index.tsx                 – provider + flattened key lookup
    └── locales/                  – pt-BR.json · en.json · es.json
```

The catalog (`teams`, `stickers_catalog`) and per-user state (`user_stickers`) live in Supabase Postgres. Row-level security ties `user_stickers` access to `auth.uid()`, and increments go through a `SECURITY DEFINER` RPC (`adjust_sticker`) so reads-then-writes can never race.

## Getting started

### Prerequisites

- Node.js 18+
- npm
- A Supabase project (free tier works) — see [Database setup](#database-setup)

### Install and run

```bash
npm install
cp .env.example .env.local           # fill in your Supabase URL + anon key
npm run dev
```

Open <http://localhost:5173>.

### Production build

```bash
npm run build
npm run preview
```

### Tests

```bash
npm run test:ci
```

## Environment variables

Create `.env.local` for local development (see `.env.example`):

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SENTRY_DSN=...
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | ✅ | Project URL, e.g. `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Public anon key — RLS is the source of truth for security |
| `VITE_SENTRY_DSN` | optional | Only when Sentry error reporting is enabled |

Vercel pulls these from project settings for preview and production.

## Database setup

The Supabase schema is versioned under `supabase/migrations/`. To apply it to your project:

```bash
npm install -g supabase
supabase link --project-ref <your-project-ref>
supabase db push
```

The migrations create:

- `teams` — 48 nations + virtual sections (`WAP`, `FWC`, `CC`) in printed Panini order.
- `stickers_catalog` — 994 rows (9 opening + 960 team + 11 history + 14 Coca-Cola) with `player_name` populated for the 864 player stickers.
- `user_stickers` — sparse per-user state, RLS-locked to `auth.uid()`.
- `adjust_sticker(p_sticker_id, p_delta)` RPC for atomic upsert + clamp-at-zero increments.

Later migrations may drop deprecated objects (for example the legacy `public.stickers` table) once every client uses the new data path — read each migration’s comments before applying.

Sanity checks after applying:

```sql
select count(*) from public.teams;             -- 51
select count(*) from public.stickers_catalog;  -- 994
select * from public.stickers_catalog where id = 'BRA-10';
```

## Deploy to Vercel

1. Import the GitHub repository in Vercel with the Vite preset.
2. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (and optional `VITE_SENTRY_DSN`) for preview and production.
3. Deploy.

The repo ships a `vercel.json`; the framework preset is auto-detected as Vite. Alternatively:

```bash
npm i -g vercel
vercel login
vercel              # preview
vercel --prod       # production
```

## Quality and privacy docs

See [docs/mvp-quality-and-observability.md](docs/mvp-quality-and-observability.md) for the MVP backlog around analytics, logging, errors, LGPD, and tests.

## OCR tips

- Hold the physical sticker **2–5 cm from the camera** in good light.
- The scanner accepts patterns like `BRA 10`, `ESP-03`, `FWC 12`.
- A 2-second cooldown prevents duplicate adds from a single scan.
- The Tesseract worker is initialized once and reused — the first scan takes ~3 seconds.

## License

MIT
