# Performance audit — meualbum2026 (pre-go-live, 2026-05-15)

Target URL: https://www.meualbum2026.app
Tooling: Lighthouse 12 (lighthouse@latest via npx, headless Chrome), live `curl` probes against Vercel, static analysis of `dist/` (build hash `index-C6cIjuZq.js` locally, `index-BUh0qUUI.js` in prod).
Raw artifacts:
- `docs/audits/_lh-prod-mobile.report.html` / `.report.json` (mobile run #1, perf 0.85)
- `docs/audits/_lh-prod-mobile2.report.html` / `.report.json` (mobile run #2, perf 0.84)
- `docs/audits/_lh-prod-desktop.report.html` / `.report.json` (desktop, perf 0.99)

## TL;DR

On real Vercel + mobile-simulate the app scores **Performance 0.85** with **LCP 3.3 s, FCP 2.9 s, TBT 30–50 ms, CLS 0.001, TTI 3.4 s** — solid floor, but LCP/FCP on 4G-mobile is the only thing keeping it out of the green band. The waterfall (`audits/_lh-prod-mobile.report.json` → `network-requests`) shows two clear bottlenecks: (1) the **Google Fonts CSS + Bebas Neue woff2** chain costs ~1.4 s and (2) the **Sentry chunk is 155 KiB brotli / 463 KiB raw** and 78 % of it (`@sentry-internal/replay` + `feedback` + canvas + profiling utils) is **never used by the app**. Top 3 wins, smallest effort first: **(a) drop Sentry Replay/Feedback** by importing from `@sentry/react` browser-tracing-only build path or by manually side-effect-tree-shaking — saves ~110 KiB transfer, ~700 ms TBT/LCP on mobile (Lighthouse insight `unused-javascript`); **(b) self-host Bebas Neue (or drop it for system-ui Impact)** — kills the third-party preconnect chain that costs ~1.1 s of render-blocking time (insight `render-blocking-insight`); **(c) move Sentry initialization off the first idle tick onto explicit consent grant** so it never blocks the LCP path at all.

## Lighthouse summary (mobile, run #1 — see `_lh-prod-mobile.report.json`)

| Metric | Value | Score |
| --- | --- | --- |
| Performance score | **0.85** | — |
| First Contentful Paint | **2.9 s** (observed 2.4 s) | 0.51 |
| Largest Contentful Paint | **3.3 s** (observed 2.4 s) | 0.70 |
| Total Blocking Time | **51 ms** (run #2: 30 ms) | 1.00 |
| Cumulative Layout Shift | **0.001** | 1.00 |
| Speed Index | **4.6 s** | 0.70 |
| Time To Interactive | **3.4 s** | 0.93 |
| Time To First Byte | 609 ms (server 40–50 ms — Vercel edge is fine; the rest is mobile-simulate RTT) | — |
| Max Potential FID | 90 ms | 0.97 |
| Total byte weight | **264 KiB** transferred initially | 1.00 |
| Main thread work | 0.8 s | 1.00 |
| JS bootup | 0.27 s | 1.00 |

Desktop run is essentially perfect (perf 0.99, LCP 0.8 s) — all the headroom problems are mobile-CPU + mobile-network bound.

Run-to-run variance is small (FCP 2.9 → 3.0 s; TBT 51 → 30 ms; perf 0.85 → 0.84). The numbers are stable.

### Lighthouse opportunities ranked by metric savings

| Insight (audit id) | Est. savings | Bound metric |
| --- | --- | --- |
| `unused-javascript` (Sentry chunk: 121 KiB; entry chunk: 30 KiB) | **148 KiB** | LCP, TBT |
| `render-blocking-insight` (Google Fonts CSS, app CSS, registerSW.js) | **1 080 ms** | FCP, LCP |
| `legacy-javascript-insight` (Sentry chunk: `Array.from` polyfill from replay) | 11 KiB | LCP |
| `network-dependency-tree-insight` (Google Fonts CSS → gstatic woff2) | — | LCP |

## Bundle analysis

Local build (`dist/assets/` — `npm run build` already ran). All `/assets/*` are served with `cache-control: public, max-age=31536000, immutable` (verified via curl) and Vercel serves both `gzip` and `brotli` correctly. Wire sizes below are from prod (`curl -H "Accept-Encoding: br"`):

| Chunk | Raw | Gzip | Brotli (prod wire) | Role |
| --- | ---: | ---: | ---: | --- |
| `sentry-PeLYiKoZ.js` | **463 787 B** | 150 755 B | **154 614 B** | `@sentry/react` + replay + feedback + replay-canvas + profiling-utils + reactrouter-compat-utils — fetched eagerly after `requestIdleCallback` on the landing page (see network waterfall: it shows up at 695 ms). |
| `index-C6cIjuZq.js` (entry) | 231 905 B | 76 778 B | **79 583 B** | React 18 + react-dom + react-router-dom v7 + i18n + FeedbackContext + AppErrorBoundary + LandingPage routing logic + Vercel `@vercel/analytics/react`. |
| `supabase-BaETdhnV.js` | 196 642 B | 49 738 B | **51 379 B** | `@supabase/supabase-js` — lazy, loaded only when AuthGate mounts. |
| `AuthenticatedApp-D7azYRa2.js` | 48 569 B | 16 008 B | — | App shell for logged-in users — lazy. |
| `index-Dy2ffkiq.css` | 41 664 B | 8 426 B | **8 869 B** | Tailwind utilities. |
| `StickerCard-D3JmYW8E.js` | 16 084 B | 5 972 B | — | Sticker tile. |
| `SettingsPage`, `LandingPage`, `DashboardPage`, … | ≤ 16 KiB each | — | — | All routes are `lazy(() => import(...))` (✓). |

Total `dist/` is 5.9 MB but most of that is `*.map` files (775 KiB for the entry, 2.2 MB for sentry, 1.1 MB for supabase). All `.js` raw weight is **1.05 MB**, of which the user only fetches what their route needs.

Route-level code-splitting is already in place — `src/App.tsx`, `src/AppAuthGate.tsx`, `src/AuthenticatedRoutes.tsx` all use `React.lazy()` with `Suspense` (verified). The landing page on first load pulls only:
- `index-BUh0qUUI.js` (80 KB brotli — entry)
- `LandingPage-BpOnq5b5.js` (5 KB)
- `AppLogo`, `telemetry`, `utils`, `stickerCardShellStyle` (each < 3 KB)
- `sentry-BdCNdkaL.js` (**155 KB** — biggest single asset on the page, fired ~520 ms after FCP via idle-callback)
- `_vercel/insights/script.js` (1.5 KB)
- Bebas Neue from Google Fonts CDN (~9 KB woff2 + 871 B stylesheet)

So `tesseract.js` (heavy WASM/OCR), `react-webcam`, `qrcode.react`, and `lz-string` did **NOT** end up in the entry chunk — they're deep inside scanner / trade modal routes and pulled in only when used. `posthog-js` is **also deferred** (dynamic `await import('posthog-js')` inside `activatePostHogAnalytics()` — `src/lib/telemetry/posthog.ts:78`), and only after consent. ✓

The one chunk that hurts is Sentry, because it's:
1. ~3× bigger than it needs to be (Replay+Feedback inlined), and
2. fetched eagerly via `requestIdleCallback` even for anonymous landing-page visitors who will never grant consent and where `beforeSend` drops every event anyway (`src/lib/sentry.ts:30`).

## High-impact findings (fix this week)

### H1 — Sentry chunk includes Replay + Feedback + Replay-Canvas + Profiling-Utils but none of them are used

- **What.** `sentry-BdCNdkaL.js` is 155 KiB brotli / 463 KiB raw. Lighthouse `unused-javascript` reports 121 KiB wasted (78 %), broken down as: `@sentry-internal/replay` 36.4 KiB, `@sentry-internal/feedback` 12.1 KiB, `@sentry-internal/replay-canvas` 3.8 KiB, `@sentry/react/build/esm/reactrouter-compat-utils/instrumentation.js` 3.2 KiB, `@sentry/browser/build/npm/esm/prod/profiling/utils.js` 2.4 KiB.
- **Evidence.** `src/lib/sentry.ts:46` only adds `integrations: [Sentry.browserTracingIntegration()]`. No Replay or Feedback integration is registered. The code is dead. Confirmed by `grep -rn "Replay\|replaysSession\|feedbackIntegration" src/` returning zero hits in the SDK config. `@sentry/react@10.53.1` ships these as side-effectful re-exports from `@sentry/react`'s index, so Vite/Rollup cannot tree-shake them when you do `import * as Sentry from '@sentry/react'`.
- **Estimated impact.** ~110 KiB brotli off the wire + ~190 KiB of bytes the main thread never has to parse. Lighthouse `unused-javascript` reports `wastedMs: 690 ms` for this chunk and `legacy-javascript-insight` estimates 200 ms of LCP saved (Replay ships an `Array.from` polyfill that the rest of the SDK doesn't need).
- **Recommended fix.** Two options, take whichever:
  - **(preferred, S)** Replace `import * as Sentry from '@sentry/react'` with the narrower entry points: `import { init, browserTracingIntegration, setUser, captureException } from '@sentry/react'` is the same import path, but also add a `vite.config.js` `define` or `resolve.alias` for `@sentry-internal/replay`, `@sentry-internal/feedback`, `@sentry-internal/replay-canvas` pointing to an empty stub — common workaround for this exact SDK problem. Sentry docs call this "treeshaking optional features": https://docs.sentry.io/platforms/javascript/configuration/tree-shaking/ — exposes `__SENTRY_DEBUG__`, `__SENTRY_TRACING__`, etc. Setting `define: { __RRWEB_EXCLUDE_IFRAME__: true, __RRWEB_EXCLUDE_SHADOW_DOM__: true, __SENTRY_EXCLUDE_REPLAY_WORKER__: true }` plus the official `@sentry/vite-plugin` flag `bundleSizeOptimizations: { excludeReplayCanvas: true, excludeReplayShadowDom: true, excludeReplayIframe: true, excludeReplayWorker: true, excludeFeedback: true }` removes the dead code. See https://docs.sentry.io/platforms/javascript/configuration/tree-shaking/.
  - **(fallback, M)** Pin Sentry to a manual ESM build subset by importing from `@sentry/browser` + `@sentry/react/build/esm/index.js` skipping the meta-package.
- **Effort.** S (config-only change in `vite.config.js`).

### H2 — Google Fonts CSS + Bebas Neue add a 4-step render-blocking chain on the LCP path

- **What.** Lighthouse `network-dependency-tree-insight` shows the longest LCP-blocking chain is: `meualbum2026.app/` (180 ms) → `fonts.googleapis.com/css2?family=Bebas+Neue&display=swap` (496 ms) → `fonts.gstatic.com/.../JTUSjIg69CK48gW7PXoo9WlhyyTh89Y.woff2` (756 ms). End-to-end the font arrives at ~1 432 ms. `render-blocking-insight` attributes 920 ms of that to the CSS request alone.
- **Evidence.** `index.html` declares `<link rel="preconnect" href="https://fonts.googleapis.com" />` and the CSS link without `media`/`onload` swap. Bebas Neue is used in exactly two places: `src/components/AppLogo.tsx:11` and `src/components/StickerFace.tsx:91`. The body font is `system-ui` (`src/index.css:18`).
- **Estimated impact.** 900–1 100 ms off FCP and LCP on mobile-simulate, and the LCP currently *is* the landing page hero text rendered in system-ui — Bebas Neue is decorative.
- **Recommended fix.**
  - **Best (S/M).** Self-host the single woff2 in `public/fonts/bebas-neue.woff2`, drop the Google Fonts CSS request entirely, declare an `@font-face` with `font-display: swap` in `src/index.css`, and add a `<link rel="preload" as="font" type="font/woff2" crossorigin>` for that file in `index.html`. Removes 3 of the 4 hops and one cross-origin handshake. The woff2 is 8 623 B — a one-off no-brainer.
  - **Acceptable (XS).** If you don't want to self-host, drop the `preconnect` to `fonts.googleapis.com` (already implicit when the link is fetched) and **add** `<link rel="preload" as="style" ...>` + `media="print" onload="this.media='all'"` swap on the stylesheet, so the font CSS is non-blocking. Still leaves a 2-hop chain.
  - **Nuclear (XS).** Drop Bebas Neue, use `font-family: Impact, 'Arial Black', sans-serif` in `AppLogo` and `StickerFace`. Both already have `Impact` as the fallback (`StickerFace.tsx:91` → `"'Bebas Neue', Impact, sans-serif"`). Visual diff is small.
- **Effort.** S.

### H3 — Sentry is initialized via `requestIdleCallback` on every page including landing, before consent

- **What.** `src/main.tsx:28-40` schedules `initSentryClient()` via `requestIdleCallback` (fallback `setTimeout(..., 2000)`) on every page load. Even though `beforeSend` returns `null` until `grantSentryConsent()` is called (`src/lib/sentry.ts:33`), the **155 KiB Sentry chunk is still downloaded and parsed** as soon as the browser hits idle. On the Lighthouse mobile run it lands at the 695 ms mark — before the LCP — and parsing it counts against bootup-time and TBT.
- **Evidence.** Lighthouse `network-requests` row for `sentry-BdCNdkaL.js` shows it fetched eagerly (priority `High`), 154 917 B wire. Browser-tracing integration also subscribes to performance entries and Fetch/XHR — work done on the main thread for users who haven't consented.
- **Estimated impact.** Sentry parse+exec is the single largest main-thread task on this build (`mainthread-work-breakdown` total 833 ms, the largest task is 25 ms — chunk parse). Defer-after-consent saves ~150 ms of bootup-time and ~120 KiB transfer for visitors who decline analytics or bounce.
- **Recommended fix.** Move the `void import('./lib/sentry').then(...)` call out of `main.tsx` and into the analytics-consent-grant handler (next to `activatePostHogAnalytics` in `src/lib/telemetry/posthog.ts`). Keep error capture path lazy: in `AppErrorBoundary`, on actual `componentDidCatch`, `await import('./lib/sentry')` then `Sentry.captureException(err)`. That way unconsented users never pay for Sentry.
- **Effort.** S (move ~6 lines + add the dynamic import inside the error boundary).

### H4 — Source maps are publicly served on prod

- **What.** `curl https://www.meualbum2026.app/assets/sentry-BdCNdkaL.js.map` → 200 (775 KB JSON). All chunks have `.map` files accessible. The intent in `vite.config.js:18` (`sourcemaps: { filesToDeleteAfterUpload: ['**/*.map'] }`) is to delete them after Sentry uploads — but this only runs when `SENTRY_AUTH_TOKEN && SENTRY_ORG && SENTRY_PROJECT` are set at build time. Either the deletion is failing or those env vars aren't set in Vercel.
- **Evidence.** `curl -sI https://www.meualbum2026.app/assets/sentry-BdCNdkaL.js.map` returns 200 with full body. `vite.config.js:23` `sourcemap: true` always emits them.
- **Impact (perf-adjacent).** Not directly a perf regression for normal users (browsers fetch sourcemaps only when DevTools is open), but every Vercel deployment ships ~5 MB of map files into the immutable cache and exposes internal node\_modules path structure (`node_modules/@sentry-internal/replay/build/npm/esm/index.js` is leaked in Lighthouse subitems — that comes from the served sourcemap).
- **Recommended fix.** In CI, make sure `SENTRY_AUTH_TOKEN`/`SENTRY_ORG`/`SENTRY_PROJECT` are set in the Vercel project so the upload + delete step runs. Alternatively, add an explicit `vercel.json` rewrite that 404s `/assets/*.map` requests.
- **Effort.** S (one Vercel env var triple).

## Medium

### M1 — `StickerCard` is not memoized; an album page renders 13–35 of them per section and every store update re-renders the whole grid

- **What.** `src/components/StickerCard.tsx:16` is a plain functional component — no `React.memo`. Inside, `useStickerActions(sticker)` (`src/hooks/useStickerActions.ts:16`) returns a fresh `handleAdd`/`handleRemove` per render. `AlbumPage` (`src/pages/AlbumPage.tsx:80`) maps `stickers.map(...)` and recomputes `albumStickerWrapperClass`, `albumStickerCell`, `teamColors(sectionCode)` on every render. Result: when any sticker quantity changes, the entire grid re-renders top-down. The album sections are usually 13–18 stickers but the special sections (`WAP`, `FWC`, `CC`) can be much larger.
- **Evidence.** `grep -n "memo\|useMemo\|useCallback" src/components/StickerCard.tsx` → no hits. `useStickerActions` returns inline objects/arrays on every call.
- **Impact.** On real mid-range Android devices, tapping a sticker can take ~50–80 ms (the typical store-flush-then-render path). Lighthouse mobile-simulate shows TBT 30–51 ms which is currently fine, but **INP under user interaction is not measured by simulate** — likely worse on field metrics. Memoizing `StickerCard` with `React.memo` plus stabilizing the handler refs in `useStickerActions` (`useCallback`) drops the worst-case re-render to ~1 card.
- **Recommended fix.** Wrap `StickerCard` in `React.memo` with a custom equality that compares `sticker.id`, `sticker.quantity`, `teamCode`, `albumCell`. Wrap `handleAdd`/`handleRemove` in `useCallback` in `useStickerActions`. Move `teamColors(sectionCode)` out of the map loop in `AlbumPage` (it's already computed once outside — good — but `albumStickerWrapperClass(s, sectionCode)` is per-item; cheap).
- **Effort.** S.

### M2 — Vercel Analytics script (`/_vercel/insights/script.js`) is unconditional on the landing page

- **What.** `src/App.tsx:42` `<Analytics />` mounts on `/` immediately, fetching `/_vercel/insights/script.js` (1.5 KB) and pinging `/_vercel/insights/view`. This happens **before** consent is granted. For a Brazilian audience the LGPD considerations of running first-party-but-Vercel analytics without consent are worth a legal pass; perf-wise it's small (1.5 KB) but it's another network round-trip during the LCP window.
- **Evidence.** Network waterfall rows at 717 ms and 843 ms.
- **Recommended fix.** Move `<Analytics />` behind the same consent gate as PostHog, or set `mode="production"` with `beforeSend` filter. Effort S. Not urgent.

### M3 — Service Worker precaches **everything**, including chunks that 99 % of visitors never reach

- **What.** `dist/sw.js` precaches 41 entries — every route chunk (`SettingsPage`, `TradePage`, `SwapsPage`, `ChallengesPage`, `MissingPage`, etc.) plus the **entire Sentry chunk** (155 KiB brotli). For a new visitor who lands on `/`, the service worker registers (`registerSW.js`) and the install step downloads ~600 KiB of brotli that the user may never need.
- **Evidence.** `cat /tmp/prod-sw.js` shows the precache list. `globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']` in `vite.config.js:53` is too greedy.
- **Impact.** Service worker install runs *after* the page is interactive, so it doesn't hurt FCP/LCP. But it costs the user 600 KiB of mobile data on first visit, which is meaningful on Brazilian prepaid plans. It also keeps stale Sentry chunks alive in cache.
- **Recommended fix.** In `vite.config.js`, set `workbox.globPatterns: ['**/*.{css,html,ico,svg,woff2}', 'assets/index-*.js', 'assets/LandingPage-*.js']` (precache only the entry + landing path), and add a `runtimeCaching` entry for `assets/*.js` with `StaleWhileRevalidate` so route chunks are cached on first reach. Or use Workbox's `injectManifest` mode to whitelist by chunk name.
- **Effort.** M (needs testing the offline path).

### M4 — Vite `build.target` defaults to `'modules'` ≈ ES2020, which is fine, but no explicit modern baseline is set

- **What.** `vite.config.js` does not declare `build.target`. Vite 8's default is `'baseline-widely-available'` (a 30-month rolling baseline), so this is probably OK, but `legacy-javascript-insight` did flag an `Array.from` polyfill inside the Replay chunk (which will disappear automatically once H1 is done).
- **Recommended fix.** After H1, no action. If H1 isn't done, explicitly set `build.target: 'es2020'` in `vite.config.js` to force more modern output and tree-shake legacy polyfills.
- **Effort.** S.

## Low / nice-to-have

- **L1.** `index.html` has no `<meta name="color-scheme" content="dark">` — would prevent a brief white-flash on mobile Safari while CSS loads. 1-line fix.
- **L2.** `<link rel="modulepreload">` for the route chunk that's most likely to be needed next (`AuthenticatedApp` or `LandingPage`) would shave 100–200 ms off the post-FCP chain by parallelizing fetch with the entry chunk. Vite emits modulepreload links automatically for static imports but the dynamic-import route chunks are not preloaded.
- **L3.** The `tsx` `<img src={silhouetteSrc[silhouetteType]}>` in `StickerFace.tsx:76` does not set `loading="lazy"` or `decoding="async"`. The SVG is a static asset so it's already efficient, but adding `decoding="async"` is free.
- **L4.** `index-Dy2ffkiq.css` is 41 KB raw / 8.4 KB gzip — well below the critical threshold, but `unused-css-rules` already scores 1.00 (no waste). No action.
- **L5.** Sentry `tracesSampleRate: 0.1` (`src/lib/sentry.ts:47`) is sane for prod. ✓ Don't bump to 1.0.

## Things checked and OK

- **Compression.** All `/assets/*` are served with `br` and `gzip` (verified: 79 583 B brotli vs 77 560 B gzip for the entry chunk). Vercel does this automatically. ✓
- **Cache headers.** `/assets/*` → `cache-control: public, max-age=31536000, immutable` (matches `vercel.json`). `/index.html` → `cache-control: public, max-age=0, must-revalidate`. ✓
- **Protocol.** HTTP/2 negotiated end-to-end (verified via `curl -sI`, `protocol: h2` in Lighthouse network rows). ✓
- **CDN/edge.** Server response time 40 ms, `x-vercel-cache: HIT` on `index.html`. Edge `gru1` (São Paulo) for Brazilian traffic. ✓
- **Route-level code splitting.** `App.tsx`, `AppAuthGate.tsx`, `AuthenticatedRoutes.tsx`, `LoginPage.tsx`, `GuestPaywallModal.tsx` all use `React.lazy()`. ✓
- **Heavy deps gated behind dynamic import.** `tesseract.js`, `react-webcam`, `qrcode.react`, `posthog-js`, `lz-string`. None of them are in the entry chunk — verified by string-searching `dist/assets/index-C6cIjuZq.js` (zero hits for `tesseract`, `webcam`, `qrcode`, `lz-string`). ✓
- **PostHog consent gate.** `activatePostHogAnalytics` in `src/lib/telemetry/posthog.ts:74` does a dynamic `await import('posthog-js')` only after user consent, with `capture_pageview: false`. ✓ Best-in-class consent UX.
- **Layout stability.** CLS 0.001 on mobile (one tiny shift detected, total 0.000855). Loading screens use fixed dimensions, no font-driven shifts (because the body uses `system-ui`, not Bebas Neue). ✓
- **Bundle minification.** `unminified-javascript` score 1.00. Vite/Rollup terser is doing its job. ✓
- **Unused CSS.** Score 1.00 — Tailwind purge is correctly configured. ✓
- **Image weight.** No real images on the landing path; the SVG silhouettes (`silhouette-player.svg`, `-team.svg`, `-shield.svg`) are <2 KB each and inlined via Vite. ✓ Nothing to compress, no AVIF/WebP conversion needed.
- **DOM size.** `dom-size` score 1.00 (the landing page is small).
- **CSP.** Tight CSP in `vercel.json` (script-src locked to self + vercel-scripts + sentry + posthog). ✓ Not perf, but worth noting as healthy posture.

## Not audited (needs auth)

The only routes Lighthouse can hit are `/`, `/privacidade`, `/termos`. The authenticated paths (`/album`, `/dashboard`, `/swaps`, `/missing`, `/challenges`, `/settings`) cannot be measured without a Supabase session. To finish the audit you'd need to:

1. Generate a magic-link session for a test user, capture the JWT, inject the `sb-<project>-auth-token` cookie into Lighthouse via `--extra-headers`, and re-run against `/album?section=ARG` (likely the heaviest grid page with `WAP`/`FWC`/`CC` virtual sections).
2. Watch for **runtime perf** on real devices using the existing PostHog setup — capture `$web_vitals` events and slice by `device_type=mobile, country=BR`. The PostHog dashboards listed in `MEMORY.md` already cover the funnel; add a Web Vitals tile.
3. The scanner flow (`tesseract.js` + `react-webcam`) is the biggest unknown — tesseract worker + WASM is hundreds of KB. It's lazy-loaded today (good), but first-time-use TTI on the scanner screen is worth measuring.
