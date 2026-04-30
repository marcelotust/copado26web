# ⚽ WC 2026 Sticker Album

A progressive web app for managing your FIFA World Cup 2026 sticker collection.  
Built with **React + Vite**, **Tailwind CSS**, **Dexie.js** (IndexedDB), **Tesseract.js** OCR, and **vite-plugin-pwa**.

---

## Features

- **48 teams** (all confederations) + Stadiums + Specials sections
- **Click** a sticker to add it; **right-click** to remove
- **Greyed out** when missing · **Vibrant gradient** when collected · **+N badge** for duplicates
- **OCR Scanner** — point your rear camera at a sticker code like `BRA 10` to auto-add it
- **Swaps view** — see all duplicate stickers grouped by team
- **PWA** — install on mobile/desktop, works fully offline after first load
- All data stored locally in IndexedDB (no account needed)

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Install & Run

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173

### Build

```bash
npm run build
npm run preview   # preview the production build locally
```

---

## Deploy to Vercel

### Option A — Vercel CLI

```bash
# Install CLI globally (once)
npm i -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy to production
vercel --prod
```

### Option B — GitHub integration (recommended)

1. Push to GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<your-user>/wc2026-album.git
git push -u origin main
```

2. Go to https://vercel.com/new → Import the repository  
3. Framework preset: **Vite** (auto-detected)  
4. Leave Build & Output Settings as defaults  
5. Click **Deploy** — done!

### Environment variables

This app has no required env vars. All data is stored in the user's browser (IndexedDB).

---

## Project Structure

```
src/
├── components/
│   ├── Header.jsx        – global header with progress bar & actions
│   ├── Sidebar.jsx       – team navigation (fixed, collapsible on mobile)
│   ├── StickerGrid.jsx   – responsive sticker grid for a section
│   ├── StickerCard.jsx   – individual sticker tile with animations
│   ├── OcrScanner.jsx    – live camera + Tesseract OCR overlay
│   └── SwapsView.jsx     – list of duplicate stickers to trade
├── db/
│   ├── index.js          – Dexie database + first-run seeding
│   └── seed.js           – 48-team dataset + special sections
├── hooks/
│   ├── useStickers.js    – reactive CRUD hooks (dexie-react-hooks)
│   └── useOCR.js         – Tesseract worker management + scan logic
├── utils.js              – deterministic per-team colour palette
├── App.jsx               – root layout + view router
├── main.jsx              – React entry point
└── index.css             – Tailwind directives + global resets
```

---

## OCR Tips

- Hold the physical sticker **2-5 cm from the camera** in good light
- The scanner looks for patterns like `BRA 10`, `ESP 03`, `STD 07`
- A 2-second cooldown prevents duplicate additions from a single scan
- Tesseract is initialised once and reused — first scan takes ~3 s

---

## License

MIT
