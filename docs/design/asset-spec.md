# Asset spec — meualbum2026 PWA & social images

Output: PNG files dropped into `public/`. Vite copies `public/*` verbatim into the build root, so file names below must match exactly. Once they're in `public/`, the existing references in `vite.config.js` (PWA manifest) and the follow-up tweaks to `index.html` start working without further code changes.

---

## Brand foundations (derived from the live app)

| Token | Value | Where it shows up |
|---|---|---|
| Background | `#0F172A` (slate-950) | Body bg, theme-color, PWA splash bg |
| Logo blue | `#3B82F6` (sky-500) | "Meu" word, primary gradient start, focus rings |
| Logo rose | `#F43F5E` (rose-500) | "Álbum" word, hero radial accent |
| Logo emerald | `#10B981` (emerald-500) | "2026" word, primary gradient end |
| Hero gradient | `linear-gradient(135deg, #3B82F6 0%, #10B981 100%)` | Primary CTA button on landing |
| Hero radial | `radial-gradient(#3B82F6 0%, #F43F5E 35%, #10B981 65%, transparent 80%)` at 8% opacity | Behind hero |
| Headline font | Bebas Neue (Google Fonts) | Logo wordmark, hero h1, sticker numbers |
| Body font | system-ui | Everything else |
| Mascot motif | ⚽ soccer ball — clean white circle with black pentagons. Optional but consistent with current favicon | Logo lockup, og-image, splash |

**Mood**: dark, vivid, punchy, sports-arena-at-night. Pixel-perfect. Avoid faux-3D / gloss / shadows beyond what the gradients already provide. The product is a digital sticker album for the FIFA World Cup 2026 (Brazilian Portuguese audience, mobile-first).

**Hard "do nots"**
- No FIFA / Panini / World Cup official branding (trademark exposure — footer literally says "Não afiliado").
- No specific team flags or kit colors in marketing-level assets.
- No photo of real players (rights).

---

## Critical assets (ship these four to unblock launch)

### 1. `pwa-192.png` — Android PWA icon (192×192)

- **Canvas**: 192×192 px, exported as PNG-24 with transparency **off** (solid background).
- **Background**: `#0F172A` filling the full square. No rounded corners — the OS rounds.
- **Foreground**: a single high-contrast glyph centered. Either:
  - Option A (recommended): a 110×110 px soccer ball (white circle, black pentagons, no shadow).
  - Option B: monogram "M2" or "MA" in Bebas Neue, 96 px cap-height, in the blue→emerald gradient.
- **Padding**: at least 24 px of clearspace on all sides (≈12.5% inset) so the icon survives launcher cropping.
- **Export**: PNG-24, no compression artifacts, strip metadata. Final weight should be < 6 KB.

### 2. `pwa-512.png` — Android PWA icon (512×512, `purpose: 'any maskable'`)

The manifest currently declares this with `purpose: 'any maskable'`, which means it must work *both* as a normal icon and as a masked icon (Android crops it to circle/squircle/teardrop). To handle both, the design must respect a **maskable safe zone**:

- **Canvas**: 512×512 px.
- **Background**: solid `#0F172A` filling the full square (must extend to the edges — masked icons crop the corners).
- **Safe zone**: place all meaningful content inside the **center 320×320 px** circle (40% radius from center). Anything outside that zone may be clipped on Android launchers using aggressive shapes.
- **Foreground**: same glyph as `pwa-192.png` but scaled to ~290 px wide, centered.
- **Export**: PNG-24, < 20 KB.
- **Validation**: drop into [maskable.app/editor](https://maskable.app/editor) and verify all shapes (circle, square, rounded square, squircle) crop cleanly.

> *Stretch goal (nice-to-have, not blocking):* once the maskable version is solid, also export a separate `pwa-512-any.png` with edge-to-edge artwork (no safe zone) and split the manifest into two icon entries — one `purpose: 'any'` and one `purpose: 'maskable'`. Cleaner result, but requires a manifest edit. Skip for v1.

### 3. `apple-touch-icon.png` — iOS A2HS icon (180×180)

iOS does not mask — what you draw is what shows on the home screen.

- **Canvas**: 180×180 px.
- **Background**: solid `#0F172A` with **8 px rounded corners** baked in (iOS used to auto-round but newer versions don't always; baking the corner is safer).
- **Foreground**: the same soccer-ball glyph at ~125×125 px centered, OR — and this looks excellent on iOS — the three-color "M·A·26" monogram stacked, Bebas Neue, with the blue/rose/emerald letter coloring from `AppLogo.tsx`. Keep it readable at 60×60 px (Settings list view).
- **Padding**: 16 px on all sides.
- **Export**: PNG-24, < 8 KB.

### 4. `og-image.png` — Social preview (WhatsApp / iMessage / X / Facebook)

This is the single highest-leverage asset for viral acquisition — every time someone pastes the link in WhatsApp, this is what shows.

- **Canvas**: 1200×630 px (Facebook/WhatsApp spec).
- **Safe zone**: keep meaningful text inside the center 1080×566 area (5% inset) — Twitter and some clients crop edges on smaller previews.
- **Background**: `#0F172A` with the hero radial gradient at 12% opacity behind the focal element (recenter the gradient so it lights the right third of the canvas).
- **Composition** (left-aligned, hero stack):
  - **Logo lockup** at top-left, 48 px from edges: "Meu Álbum 2026" wordmark — Bebas Neue, ~64 px, three-color (#3B82F6 / #F43F5E / #10B981, matching `AppLogo.tsx`).
  - **Headline** below, 60% width: "Complete o maior álbum da história" — Bebas Neue, ~110 px line-height, white, with the same gradient applied to "maior álbum" (clip-path text). Mirrors `LandingPage.tsx` hero copy.
  - **Sub-headline** below, slate-300, system-ui semi-bold, 36 px: "994 figurinhas · 48 seleções · grátis · no celular".
  - **Right third**: a cluster of 3-4 sticker mockups (use `LandingStickerCard.tsx` rendered as PNG, or recreate the same look in Figma — gradient panel + team code + sticker number). Slight rotation (-10°/+5°/+9°) and overlap, no shadows.
- **URL footer** (small, slate-500, bottom-right): `meualbum2026.app`.
- **No emoji** — Android/Apple renderers diverge on emoji glyphs in preview crops.
- **Export**: PNG-24, target < 200 KB after `pngcrush` / `oxipng`. Verify in [opengraph.xyz](https://www.opengraph.xyz/) and the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) — both should pull the image and render no warnings.

---

## After delivering the PNGs — what changes in code

Once the four files are in `public/`, please do (or ask me to do) this in a small follow-up PR:

1. **Reference them in `index.html`** (currently missing):
   ```html
   <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
   <meta property="og:image"        content="https://www.meualbum2026.app/og-image.png" />
   <meta property="og:image:width"  content="1200" />
   <meta property="og:image:height" content="630" />
   <meta property="og:image:alt"    content="Meu Álbum 2026 — álbum digital de figurinhas da Copa 2026" />
   <meta name="twitter:image"       content="https://www.meualbum2026.app/og-image.png" />
   ```
2. **Manifest tweaks in `vite.config.js`** (also pre-go-live audit hits):
   - `lang: 'pt-BR'` instead of `'en'`
   - `name: 'Meu Álbum 2026'` (with the accent)
   - Optional: add `categories: ['sports', 'games', 'utilities']` and a `screenshots: [...]` array if/when those are produced
3. **Verify the build copies them**: after `npm run build`, `ls dist/` should show `pwa-192.png`, `pwa-512.png`, `apple-touch-icon.png`, `og-image.png` at the root.

---

## Lower-priority follow-ups (do later, not blocking)

| Asset | Size | Where it helps |
|---|---|---|
| `favicon.ico` | 16×16 + 32×32 multi-resolution | Legacy browser tabs (current `favicon.svg` already handles modern) |
| `screenshot-narrow.png` | 720×1280 | Android Chrome install dialog ("rich install") — shows a phone preview of the landing |
| `screenshot-wide.png` | 1280×720 | Same dialog, desktop variant |
| iOS splash screens | 8 variants (iPhone SE → iPad Pro 12.9) | Replaces blank flash during PWA cold start on iOS — overkill for v1 but possible later |

---

## Naming & export checklist

- [ ] All filenames lowercase, hyphens not underscores, exact match to this spec.
- [ ] Drop into `public/` at the repo root (NOT `src/assets/`, NOT `dist/`).
- [ ] PNG-24, color profile sRGB, no embedded thumbnails or EXIF.
- [ ] Re-compress with `oxipng -o 4 --strip safe public/*.png` (or any lossless PNG optimizer) before committing.
- [ ] After committing, the prod URL `https://www.meualbum2026.app/pwa-192.png` (etc.) should return `content-type: image/png`, not `text/html`. If it returns HTML, the `public/` copy isn't working — ping me.
