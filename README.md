# ⚽ Meu Álbum 2026

A progressive web app for tracking your Panini FIFA World Cup 2026 sticker collection.

Built with **React 18 + Vite**, **Tailwind CSS**, **Supabase** (auth · Postgres · realtime), **Tesseract.js** for camera OCR, and **vite-plugin-pwa** for installable / offline-friendly bundles.

---

## Features

- **All 48 qualified nations** in the printed Panini album order, plus the opening "We Are Panini" section (`FWC 01`–`FWC 08`), the World Cup history closing section (`FWC 09`–`FWC 19`), and the 14 Coca-Cola exclusive stickers.
- **Click a sticker to add it · click again to remove it** (with a confirmation on the last copy).
- **Greyed when missing · vibrant gradient when collected · `+N` badge for duplicates.**
- **Missing view** with a one-tap WhatsApp share that lists every sticker you still need, grouped by team.
- **Swaps view** with all your duplicates grouped by team.
- **OCR scanner** — point the rear camera at a sticker code like `BRA 10` and Tesseract maps it to the catalog. The opening section's printed codes `FWC 1`–`FWC 8` are mapped to the catalog's `WAP-01`–`WAP-08` automatically.
- **Magic-link or Google sign-in** via Supabase Auth. Data is stored server-side and syncs across devices in realtime.
- **PWA** — installable on mobile/desktop. The catalog needs network on the first launch, but is cached afterwards.
- **Three languages** out of the box: 🇧🇷 pt-BR · 🇺🇸 en · 🇪🇸 es.

---

## Architecture

```
src/
├── App.jsx                       – top-level routing, wraps authenticated routes in <StickersProvider>
├── main.jsx                      – React entry point
├── index.css                     – Tailwind directives + global resets
├── lib/
│   └── supabase.js               – Supabase client (anon key)
├── state/
│   └── stickersStore.jsx         – single source of truth: teams + catalog + per-user quantities,
│                                   one realtime channel, optimistic writes via adjust_sticker RPC
├── hooks/
│   ├── useAuth.js                – Supabase session + magic-link/Google sign-in
│   ├── useStickerActions.js      – per-card click handlers with debounced flushes
│   ├── useScannerLog.js          – scanner write path + printed-code → catalog-id mapping
│   └── useOCR.js                 – Tesseract worker management
├── pages/                        – AlbumPage · SwapsPage · MissingPage · SettingsPage · LoginPage · ScannerPage
├── components/                   – Header · Sidebar · TabNav · StickerCard · etc.
└── i18n/
    ├── index.jsx                 – provider + flattened key lookup
    └── locales/                  – pt-BR.json · en.json · es.json
```

The catalog (`teams`, `stickers_catalog`) and per-user state (`user_stickers`) live in Supabase Postgres. Row-level security ties `user_stickers` access to `auth.uid()`, and increments go through a `SECURITY DEFINER` RPC (`adjust_sticker`) so reads-then-writes can never race.

---

## Getting started

### Prerequisites

- Node.js 18+
- npm
- A Supabase project (free tier works) — see [Database setup](#database-setup)

### Install & run

```bash
npm install
cp .env.example .env.local           # fill in your Supabase URL + anon key
npm run dev
```

Open <http://localhost:5173>.

### Production build

```bash
npm run build
npm run preview                       # preview the production build locally
```

---

## Database setup

The Supabase schema is versioned under `supabase/migrations/`. To apply it to your project:

```bash
# Install the Supabase CLI once
npm install -g supabase

# Link your local repo to your Supabase project
supabase link --project-ref <your-project-ref>

# Push every migration in supabase/migrations/ in order
supabase db push
```

The migrations create:

- `teams` — 48 nations + virtual sections (`WAP`, `FWC`, `CC`) in printed Panini order.
- `stickers_catalog` — 994 rows (9 opening + 960 team + 11 history + 14 Coca-Cola) with `player_name` populated for the 864 player stickers.
- `user_stickers` — sparse per-user state, RLS-locked to `auth.uid()`.
- `adjust_sticker(p_sticker_id, p_delta)` RPC for atomic upsert + clamp-at-zero increments.

Sanity checks after applying:

```sql
select count(*) from public.teams;             -- 51
select count(*) from public.stickers_catalog;  -- 994
select * from public.stickers_catalog where id = 'BRA-10';
```

---

## Environment variables

Put these in `.env.local` (see `.env.example`):

| Variable | Required | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL`      | ✅ | Project URL, e.g. `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Public anon key — RLS is the source of truth for security |

Vercel pulls these from project settings; nothing else is required for deploys.

---

## Deploying to Vercel

The repo ships a `vercel.json` and the framework preset is auto-detected as Vite.

```bash
# CLI
npm i -g vercel
vercel login
vercel              # preview
vercel --prod       # production
```

Or import the repo at <https://vercel.com/new> and let GitHub integration handle deploys on every push to `main`.

Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in **Project Settings → Environment Variables** for both Preview and Production.

---

## OCR tips

- Hold the physical sticker **2-5 cm from the camera** in good light.
- The scanner accepts patterns like `BRA 10`, `ESP-03`, `FWC 12`.
- A 2-second cooldown prevents duplicate adds from a single scan.
- The Tesseract worker is initialized once and reused — the first scan takes ~3 seconds.

---

## License

MIT
