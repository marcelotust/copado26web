# Pre-go-live audit follow-ups — backlog for delegation

Snapshot date: 2026-05-16. Source: `docs/audits/{security,performance,usability}.md` (initial audits from same date).

This doc is a **delegation-ready backlog** — each item below is sized for an independent PR. Pick whichever the next agent is most equipped for. Items are roughly ordered by **leverage / effort ratio** within each section; nothing here is a go-live blocker.

---

## Already shipped (do not redo)

| PR | What | Where |
|---|---|---|
| #123 | SEO meta: canonical, og:url, twitter:card upgrade, robots.txt, sitemap.xml | `index.html`, `public/` |
| #124 | Hide sourcemaps from public bundles (`sourcemap: 'hidden'`) | `vite.config.js` |
| #125 | Deterministic client-side A/B bucketing for anon landing | `src/lib/telemetry/anonExperiment.ts`, `src/pages/LandingPage.tsx` |
| #126 | Buffering analytics + backdated replay so anon events reach PostHog | `src/lib/telemetry/queue.ts` (new), `index.ts`, `posthog.ts`, `composite.ts`, `types.ts`, `LandingPage.tsx` |
| migration `20260516_0001_…` | RLS tightening on `user_challenge_completions` (SELECT scoped to `auth.uid()`) | `supabase/migrations/` |
| docs/design/asset-spec.md | Brand spec for the 4 missing PNGs (Figma-ready) | docs |
| docs/audits/{security,performance,usability}.md | The three full audit reports themselves | docs |

**Also already resolved (was in audit but addressed independently):** PR #119 fully i18n'd `LandingPage.tsx`, so usability finding F6 (hardcoded pt-BR landing) is closed.

---

## High-impact perf wins (do these first if you have one afternoon)

### A. Tree-shake Sentry Replay / Feedback / Replay-Canvas — **~110 KB brotli saved, ~700 ms TBT/LCP**

- **Why**: `dist/assets/sentry-*.js` is 463 KB raw / 155 KB brotli but `src/lib/sentry.ts` only registers `Sentry.browserTracingIntegration()`. Replay, Feedback, Replay-Canvas, Profiling-utils are inlined and never used (Lighthouse `unused-javascript` reports 121 KB wasted).
- **How**:
  1. In `vite.config.js`, add `define` flags to strip optional Sentry features:
     ```js
     define: {
       __SENTRY_TRACING__: true,
       __SENTRY_DEBUG__: false,
       __RRWEB_EXCLUDE_IFRAME__: true,
       __RRWEB_EXCLUDE_SHADOW_DOM__: true,
       __SENTRY_EXCLUDE_REPLAY_WORKER__: true,
     }
     ```
  2. On the `sentryVitePlugin({...})` call, add:
     ```js
     bundleSizeOptimizations: {
       excludeReplayCanvas: true,
       excludeReplayShadowDom: true,
       excludeReplayIframe: true,
       excludeReplayWorker: true,
       excludeFeedback: true,
     }
     ```
  3. Rebuild, confirm `dist/assets/sentry-*.js` drops by ~110 KB brotli.
- **Reference**: https://docs.sentry.io/platforms/javascript/configuration/tree-shaking/
- **Effort**: S (config-only).

### B. Self-host Bebas Neue — **~900–1100 ms LCP on mobile**

- **Why**: Google Fonts CSS → gstatic woff2 is a 4-hop chain on the LCP path (Lighthouse `render-blocking-insight` attributes 920 ms to the CSS request alone).
- **How**:
  1. Download the woff2 once (`https://fonts.gstatic.com/.../JTUSjIg69CK48gW7PXoo9WlhyyTh89Y.woff2` is ~8.6 KB).
  2. Drop into `public/fonts/bebas-neue.woff2`.
  3. In `src/index.css` add `@font-face { font-family: 'Bebas Neue'; src: url('/fonts/bebas-neue.woff2') format('woff2'); font-display: swap; }`
  4. In `index.html`, replace the Google Fonts `<link rel=stylesheet>` + the two `preconnect`s with a single `<link rel="preload" as="font" type="font/woff2" href="/fonts/bebas-neue.woff2" crossorigin>`.
  5. Update CSP `font-src` and `style-src` in `vercel.json` to drop the Google Fonts entries.
- **Effort**: S/M.

### C. Defer Sentry init until consent — **~150 ms bootup, ~120 KB transfer for anon visitors**

- **Why**: `src/main.tsx:28-40` schedules `initSentryClient()` on `requestIdleCallback` for every page including landing, before consent. The chunk is downloaded and parsed even though `beforeSend` drops every event.
- **How**: Move the `import('./lib/sentry')` call out of `main.tsx` and into the consent-grant handler (alongside `activatePostHogAnalytics`). In `AppErrorBoundary.tsx`, on actual `componentDidCatch`, do a lazy `await import('./lib/sentry')` and call `captureException` only if Sentry is loaded — otherwise the error is logged to console.
- **Effort**: S.

### D. Self-host or remove Bebas Neue side effect: tighten CSP

- **Why**: After (B) lands, the CSP `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` and `font-src 'self' https://fonts.gstatic.com` entries become dead weight.
- **How**: Drop the Google Fonts hosts from `vercel.json` CSP entries. Verify with `curl -sI` that the header is leaner. Bonus: consider whether `'unsafe-inline'` on `style-src` is still needed (Tailwind + react-dom runtime styles probably still force it; leave for now).
- **Effort**: XS, but **depends on B**.

### E. `StickerCard` memoization — INP on low-end Android

- **Why**: `src/components/StickerCard.tsx:16` is plain functional; `useStickerActions` returns fresh handlers per render. Tapping any sticker re-renders the whole grid (13–35 cards per section, more for `WAP`/`FWC`/`CC`).
- **How**:
  1. Wrap `StickerCard` in `React.memo` with custom equality comparing `sticker.id`, `sticker.quantity`, `teamCode`, `albumCell`.
  2. Wrap `handleAdd`/`handleRemove` in `useCallback` in `src/hooks/useStickerActions.ts`.
  3. Add a test verifying that bumping one sticker doesn't re-render siblings (use `@testing-library/react` render count).
- **Effort**: S–M.

### F. Service Worker precache scope — save ~600 KB on first install

- **Why**: `vite.config.js` `workbox.globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']` precaches every route chunk + the Sentry chunk on first install. Cold visitor pays ~600 KB brotli they may never need.
- **How**: Restrict the precache to the entry path:
  ```js
  workbox: {
    globPatterns: ['**/*.{css,html,ico,svg,woff2}', 'assets/index-*.js', 'assets/LandingPage-*.js'],
    runtimeCaching: [
      // existing cdn.jsdelivr rule…
      { urlPattern: /\/assets\/.*\.js$/, handler: 'StaleWhileRevalidate', options: { cacheName: 'route-chunks' } },
    ],
  }
  ```
  Test the offline path: load `/`, kill network, navigate to `/album` — should still work after the runtime cache picks up the chunk.
- **Effort**: M (needs offline-path testing).

---

## High-impact UX / a11y wins

### G. Email login input — add label, autocomplete, inputMode

- **Why**: `src/components/LoginEmailForm.tsx:57-64` has only placeholder labelling — no `id`, no `<label htmlFor>`, no `autoComplete='email'`, no `inputMode='email'`, no `name`. Android Chrome doesn't auto-fill, screen readers read "edit text" without prompt. WCAG 2.1 SC 3.3.2 fail.
- **How**: Add `id='login-email'`, `name='email'`, `autoComplete='email'`, `inputMode='email'`, and a visually-hidden `<label htmlFor='login-email'>{t('login.emailLabel')}</label>` above the input. Also wire `aria-describedby='login-email-error'` and an `id='login-email-error'` on the error `<p role='alert'>`.
- **Effort**: XS (~5 lines).

### H. ErrorBoundary fallback — add reload button + i18n fallback

- **Why**: `src/components/AppErrorBoundary.tsx:30-39` shows heading + paragraph but no recovery affordance. Users blame the app.
- **How**: Add `<button onClick={() => window.location.reload()}>{t('errors.reload')}</button>` and a mailto link. Inline en/pt-BR fallback strings since the boundary may catch above the i18n provider.
- **Effort**: XS.

### I. Guest paywall: let users feel the album before the first paywall

- **Why**: `GuestAlbumPage.tsx:20-26` triggers `openPaywall('sticker_toggle')` on the **first** sticker tap. The user gets zero value before being asked to sign up.
- **How**: In `GuestStickersProvider`, track a per-session counter. Paywall opens only after 3–5 anonymous taps. Update paywall copy to acknowledge progress: "Salve seu progresso — você já marcou 4 figurinhas". Also: visually promote the secondary "Explorar o álbum" CTA on landing (currently `text-xs text-slate-500 underline` — same-class as fine print).
- **Effort**: S.

### J. Soft-404 catch-all route

- **Why**: `https://www.meualbum2026.app/inexistente` returns 200 with the landing page (SPA rewrite). Google flags as Soft 404. No `<Route path='*'>` in routing tree. `MissingPage` already exists but is a feature page (stickers you're missing), not a 404 — so create a `NotFoundPage.tsx`.
- **How**: Add a `NotFoundPage` component with friendly copy + back-to-landing CTA, wire as `<Route path='*'>` in `src/App.tsx` (public) and `src/AuthenticatedRoutes.tsx` (authed).
- **Effort**: S.

### K. Color-contrast hits from axe (15 of them)

- **Why**: All concentrated on tier-2 fine-print using `text-slate-500/600` or `text-slate-800` on `bg-slate-950` / `bg-slate-900/40` panels. Some are decorative (sticker mock numbers); some are real (privacy section description, footer links, "Sem cartão · Sem anúncios" hint).
- **How**: Bump body / fine-print classes one shade lighter: `text-slate-500` → `text-slate-400`, `text-slate-600` → `text-slate-500`, `text-slate-800` → `text-slate-700`. Verify with the [WebAIM contrast checker](https://webaim.org/resources/contrastchecker/) and re-run `npx @axe-core/cli https://www.meualbum2026.app --exit`.
- **Effort**: S, mostly mechanical.

### L. Definition-list misuse on landing stats

- **Why**: `LandingPage.tsx:126-133` renders `<dl>` containing `<Fragment>` adjacent siblings rather than `<dt>`/`<dd>` pairs. Axe flags `definition-list`. Also React fragment-with-key gymnastics.
- **How**: Refactor to either: a) proper `<dl>` with one `<dt>` (value) and one `<dd>` (label) per stat; or b) drop the `<dl>` for a `<ul>` of pill items. Option (b) is simpler and likely a better match.
- **Effort**: XS.

### M. Modal accessibility: `GuestPaywallModal`

- **Why**: `src/components/GuestPaywallModal.tsx` declares `role='dialog' aria-modal='true'` but `aria-labelledby` points to a `<p>` (should be `<h2>`). No focus trap (Tab escapes into the album behind). No Escape-to-dismiss.
- **How**:
  1. Change the heading element to `<h2 id='paywall-heading'>`.
  2. Add a focus-trap (small custom hook or `@radix-ui/react-dialog` if the team is OK with that dep). Auto-focus the primary CTA on open.
  3. Wire `onKeyDown` with Escape → `onClose()`.
- **Effort**: S (custom hook) or M (radix migration).

### N. Active tab semantics in `GuestTabNav`

- **Why**: Active tab is a `<span>`; inactive tabs are `<button>`. No `aria-label` on the `<nav>`. Keyboard users can't land on the active tab.
- **How**: Make all tabs `<button>` and use `aria-current='page'` plus `aria-disabled='true'` for the active one. Add `aria-label='Navegação principal'` (or i18n key) to `<nav>`. Bump `py-1.5` to `min-h-[44px]` for touch targets.
- **Effort**: S.

### O. Safe-area-inset paddings (iPhone notch in PWA standalone)

- **Why**: `index.html:6` sets `viewport-fit=cover` but no `env(safe-area-inset-*)` paddings anywhere — header/footer content hides under the notch / home indicator in standalone PWA mode.
- **How**: Add to `src/index.css`:
  ```css
  body { padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }
  /* or, on specific containers — header, footer, sticky tabs — to keep transparency right */
  ```
  Test in iOS Safari "Add to Home Screen" preview.
- **Effort**: XS–S.

### P. Magic-link friction — at minimum, warn about spam folder

- **Why**: `LoginMagicLinkPanel.tsx` shows "Verifique seu e-mail" but doesn't set expectations. For a fresh domain, magic-link emails often land in Promotions/Spam → 30–50% drop-off.
- **How**: Add copy "Chega em até 1 min · Verifique a aba 'Promoções' ou 'Spam' se não aparecer." Lower-effort version of OTP-codes (which is the right long-term fix but a much bigger change in Supabase config + Auth UI).
- **Effort**: XS for the copy. M for switching to email-OTP via `signInWithOtp({ email, options: { shouldCreateUser: true } })` and a code-entry form.

---

## Security hygiene (do whenever — not blocking)

### Q. HSTS: `includeSubDomains; preload`

- **Why**: Current header is `strict-transport-security: max-age=63072000` — good `max-age` (2 years) but no subdomain coverage. `staging.meualbum2026.app` would be downgrade-attackable.
- **How**: In `vercel.json` headers block:
  ```json
  { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
  ```
  After deploy, verify all subdomains do HTTPS, then submit at https://hstspreload.org.
- **Effort**: XS.

### R. `audit_events.action` length cap + per-user rate limit

- **Why**: `supabase/migrations/20260515_0002_audit_events.sql:36-58` — `log_audit_event` RPC trims action but doesn't bound length. `metadata` is unbounded `jsonb`. Any authenticated user can blow storage.
- **How**: New migration:
  ```sql
  create or replace function public.log_audit_event(...) returns ... as $$
    begin
      if length(p_action) > 64 then raise exception 'action too long'; end if;
      if octet_length(p_metadata::text) > 4096 then raise exception 'metadata too large'; end if;
      -- … existing logic …
    end;
  $$;
  ```
  Add a rate-limit guard: count `audit_events where user_id = auth.uid() and created_at > now() - interval '1 minute'` and reject above e.g. 60.
- **Effort**: S.

### S. Pin `connect-src` to specific Supabase project

- **Why**: CSP allows `https://*.supabase.co` and `wss://*.supabase.co`. Once the project ref is final (`dawndpqwuusfgzshioxs.supabase.co`), pin it so XSS can't reach a sibling Supabase tenant.
- **How**: Replace `https://*.supabase.co` with `https://dawndpqwuusfgzshioxs.supabase.co` in `vercel.json`. Same for the wss entry.
- **Effort**: XS.

### T. Explicit `noopener,noreferrer` on `window.open`

- **Why**: `src/components/StickerShareActions.tsx:37,44` and `src/components/ChallengeCompletedModal.tsx:32` call `window.open(whatsapp_url, '_blank')`. Modern browsers default to `noopener` with `target=_blank`, but defense in depth is cheap.
- **How**: Replace with `window.open(url, '_blank', 'noopener,noreferrer')`.
- **Effort**: XS.

### U. Disable FLoC / Topics for stronger LGPD posture

- **Why**: `Permissions-Policy: camera=(self), microphone=(), geolocation=()` is good. Adding `browsing-topics=(), interest-cohort=()` explicitly opts out of Google's interest-based ad cohorts.
- **How**: Append to `vercel.json` permissions-policy header value.
- **Effort**: XS.

---

## Manifest + meta tags (depends on the 4 PNGs landing first)

### V. Once `docs/design/asset-spec.md` is delivered: wire the assets

- **Pre-req**: `public/pwa-192.png`, `pwa-512.png`, `apple-touch-icon.png`, `og-image.png` exist (Rafael is handling design).
- **What**:
  1. **`index.html`**: append inside `<head>`:
     ```html
     <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
     <meta property="og:image"        content="https://www.meualbum2026.app/og-image.png" />
     <meta property="og:image:width"  content="1200" />
     <meta property="og:image:height" content="630" />
     <meta property="og:image:alt"    content="Meu Álbum 2026 — álbum digital de figurinhas da Copa 2026" />
     <meta name="twitter:image"       content="https://www.meualbum2026.app/og-image.png" />
     ```
  2. **`vite.config.js`** PWA manifest:
     - `name: 'Meu Álbum 2026'` (was `'Meu Album 2026'`, missing accent)
     - `lang: 'pt-BR'` (was `'en'` — wrong for the audience)
     - Optionally add `categories: ['sports', 'games', 'utilities']`
  3. After deploy: `curl -sI https://www.meualbum2026.app/pwa-192.png` should return `content-type: image/png`, not `text/html`. Same for the other three.
- **Effort**: XS.

---

## Lower priority / nice-to-haves

| Item | Why | Effort |
|---|---|---|
| `Vercel <Analytics />` consent gate | Currently mounted on `/` before consent. Tiny perf + better LGPD posture. | XS |
| Vite `build.target: 'es2020'` | After (A) lands, polyfills will be gone naturally; if not, explicit modern target removes legacy. | XS |
| `<meta name="color-scheme" content="dark">` | Prevents brief white flash on iOS Safari before CSS loads. | XS |
| `modulepreload` for `AuthenticatedApp` chunk | Shaves 100–200 ms post-FCP on the post-login transition. | XS |
| `decoding="async"` on the silhouette `<img>` in `StickerFace.tsx:76` | Free hint, no real measurable impact. | XS |
| `beforeinstallprompt` capture for a custom Android install CTA | Bigger install conversion; currently the browser shows its own banner whenever it wants. | S |
| iOS A2HS hint bottom-sheet | iOS doesn't fire `beforeinstallprompt`; a one-time hint on `/album` for iOS Safari users would help install rate. | S |
| `frame-ancestors 'self'` in CSP (consolidate `X-Frame-Options: SAMEORIGIN`) | Modern equivalent. | XS |
| Title trademark hygiene | `<title>` mentions "Copa do Mundo FIFA" — footer says "Não afiliado". Consider "Copa 2026" instead. | XS |
| LandingPage `text-xs text-slate-600` "Sem cartão · Sem anúncios" decorative; ensure it's not load-bearing UX | XS |
| Drop `console.warn/error` from prod via Vite `terserOptions` if any leak through | XS |
| `secure_invoker = on` on `challenge_completion_rates` view (PG 15+) | View runs with caller's RLS — defense in depth. Aggregates only so not exploitable today. | XS |

---

## Items still requiring an authenticated audit pass

These are intentionally not in this backlog because they need a real session to validate. I (or whoever does the next pass) will produce a `docs/audits/authenticated.md` with concrete findings. Expected coverage:

- Onboarding flow after first login (`OnboardingGate`)
- Scanner UX (`tesseract.js` + `react-webcam`)
- Trade flow + QR generation + redeem path + expiry handling
- Real-time sync conflict resolution + offline optimistic rollback
- Delete account / export (LGPD article 18)
- Sidebar / album scroll perf on a 994-item collection
- ConsentBanner first-paint behavior on small screens
- Challenges & milestones modal a11y
- Color contrast on team-colored sticker backgrounds
- A full Lighthouse run on `/album?section=ARG` and the scanner page

---

## Suggested batch ordering for the next agent

If picking one PR per day, aim:

1. **Day 1 (perf, biggest leverage)**: A — Sentry tree-shake
2. **Day 2 (perf, biggest leverage)**: B — Self-host Bebas Neue. Bundle D into the same PR or the next day.
3. **Day 3 (UX correctness)**: G + L (input labels + dl misuse — both XS, can be combined)
4. **Day 4 (UX recovery paths)**: H + J (ErrorBoundary reload + 404 catch-all)
5. **Day 5 (perf, conservative)**: C — Defer Sentry init after consent
6. **Day 6 (security hygiene)**: Q + S + T + U — HSTS, CSP pin, noopener, permissions-policy (all XS, combine)
7. **Day 7+**: pick from the rest by ROI.

Each PR should be small, behind tests where applicable, and not bundle unrelated changes.

---

**Owner notes**: Rafael wants PRs opened against `marcelotust/copado26web` `main`. Reviewer is also Rafael. The repo uses husky + lint-staged + the CI smoke check is a required status. Builds run via Vercel; preview deployments are public — don't commit anything sensitive.
