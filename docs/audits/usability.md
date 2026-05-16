# Usability & UX audit — meualbum2026 (pre-go-live, 2026-05-15)

Auditor: senior UX/usability review, anonymous-flow only (no auth available).
Scope: production URL `https://www.meualbum2026.app` + source on branch `ci/require-e2e-gate`.
Tools used: `curl` against prod, `@axe-core/cli` 4.11.4 (chrome-headless), static source review. Axe raw output: `docs/audits/_axe-prod.txt`.

## TL;DR

Three problems are eating conversion right now, in priority order: **(1)** the landing-page hero A/B test (`LANDING_HERO_CTA`) cannot actually fire — PostHog only initializes after authenticated consent, so 100% of anonymous visitors see the control copy "Começar grátis" regardless of the experiment configuration in PostHog (id 371946). **(2)** Signup friction is real: the email field on `/login` has no `<label>`, no `autoComplete='email'`, no `inputMode='email'`, and the only alternative — magic-link — forces the user to leave the app and come back. For a Brazilian mobile-first audience this is a measurable drop-off. **(3)** SEO/social is broken at the edges: `robots.txt` and `sitemap.xml` return the SPA HTML (soft-404), `og:image` is **not declared** in `index.html` despite `/og-image.png` existing on the CDN, and the manifest ships `"lang":"en"` to a pt-BR app — WhatsApp link previews and Android A2HS labelling both suffer. Axe also surfaces 15 color-contrast failures concentrated on landing-page secondary copy.

## Friction in the public funnel (highest leverage)

### F1. Landing hero A/B test never assigns a variant — severity: critical, effort: M
- **What**: `src/pages/LandingPage.tsx:19-37` reads `telemetry.variant(FeatureFlag.LANDING_HERO_CTA)` and re-renders on `telemetry.onFeatureFlags(update)`. `null` → falls into else → always renders `'Começar grátis'`.
- **Evidence**: `src/lib/telemetry/index.ts:40-77` — `analyticsImpl` stays `noopAnalytics` unless `consent === 'granted'`. `src/lib/telemetry/posthog.ts:68-104` — `activatePostHogAnalytics(userId)` requires a userId (post-login) and `person_profiles: 'identified_only'`. `noopAnalytics.variant()` returns `null`. The consent banner is only mounted inside `AuthenticatedApp.tsx:94`, never on the landing page (`AppAuthGate.tsx:73` explicitly chooses not to require consent for anonymous).
- **Why it hurts**: the team believes they are running the hero CTA test in PostHog and will read the results as if the experiment had power. It has zero power because the treatment arm is unreachable. Every "conversion improvement" they think they see is noise.
- **Fix options**:
  1. Boot a thin PostHog client for anonymous users **using `localStorage`-only persistence (no cookie)** and `person_profiles: 'identified_only'`, gated behind a banner-less LGPD posture (PostHog supports this and it stays cookie-less when configured). Then `featureFlags` resolve for anon distinct ids.
  2. Or move the experiment to a server-side / build-time split (deterministic per anonymous_id in `localStorage`) and just report exposure via PostHog later after login.
- **Effort**: M. Option 1 is one config flag plus a guarded `posthog.init` in `LandingPage.tsx`; option 2 needs a small bucketing util.

### F2. Email login field has no label, no semantic hints — severity: high, effort: XS
- **What**: `src/components/LoginEmailForm.tsx:57-64` uses `<input type='email'>` with placeholder-only labelling, no `id`, no `<label htmlFor>`, no `autoComplete='email'`, no `inputMode='email'`, no `name`.
- **Why it hurts**: Brazilian Android users on Chrome get no auto-fill suggestion, no email keyboard layout, and screen readers read "edit text" with no prompt. Placeholder text disappears when typing, removing context. WCAG 2.1 SC 3.3.2.
- **Fix**: add `id='login-email'`, `name='email'`, `autoComplete='email'`, `inputMode='email'`, and a visually-hidden `<label htmlFor='login-email'>{t('login.emailLabel')}</label>` above the input. ~5 lines.

### F3. Magic-link is the default; password-less means leaving the app — severity: high, effort: M
- **What**: `LoginEmailForm` shows Google (good) then magic-link (only option). After submit, the user sees `LoginMagicLinkPanel.tsx` saying "Verifique seu e-mail" — they now have to switch to the mail app, find the message (often in Promotions/Spam for new domains), tap a link that re-opens the browser (possibly outside the PWA context). On mobile this is a known 30-50% drop-off pattern.
- **Why it hurts**: the bottom CTA says "Crie sua conta em segundos com e-mail ou Google" but the email path is **not** seconds — it's an asynchronous round-trip.
- **Fix options**: (a) add OTP code login as the primary email path (Supabase supports `signInWithOtp` with email-OTP token verification). (b) ship `apple-app-site-association`/`assetlinks.json` and ensure deep-link returns to the PWA, not a new browser tab. (c) at minimum, set expectations: warn "verifique a caixa de Promoções/Spam — chega em até 1 min" inside `LoginMagicLinkPanel.tsx:32`.

### F4. Guest album entry buries the value behind a sample — severity: medium, effort: S
- **What**: `/album` (guest) defaults to section `'BRA'` (`GuestAlbumPage.tsx:10`). Any sticker tap fires `openPaywall('sticker_toggle')` (`GuestAlbumPage.tsx:20-26`). Tabs (Home/Faltam/Trocas) also paywall (`GuestTabNav.tsx:21`).
- **Why it hurts**: this is good in principle (let them feel the album, gate on action) but the **first action** triggers the paywall. The user gets one tap of value before being asked to sign up. The "Explorar o álbum" link on landing (line 116) underlines this small. The hero secondary CTA is the discovery path but it's styled like a footnote (`text-xs text-slate-500 hover:text-slate-300 underline`).
- **Fix**: (a) let the guest mark 3-5 stickers before paywall fires (counter in `GuestStickersProvider`), and copy on paywall acknowledges it ("Salve seu progresso — você já marcou 4 figurinhas"). (b) Promote the secondary "Explorar o álbum" CTA visually — same size class as the primary, just outlined.

### F5. ErrorBoundary fallback is a dead end — severity: medium, effort: XS
- **What**: `src/components/AppErrorBoundary.tsx:30-39` shows a heading + paragraph but **no reload button, no contact link, no language fallback**. Strings are hardcoded pt-BR.
- **Why it hurts**: when the boundary fires (rare but real on the long tail of mobile browsers), the user is stranded. They blame the app.
- **Fix**: add `<button onClick={() => window.location.reload()}>{t('errors.reload')}</button>` and a mailto fallback. Use `useI18n()` (but careful — the boundary may catch above the provider; safest to inline en/pt fallbacks).

### F6. Hardcoded pt-BR copy on the landing page — severity: medium, effort: M
- **What**: `LandingPage.tsx` strings ("Complete o maior álbum da história", "Sem cartão · Sem anúncios · 100% grátis", "Pronto pra montar...", etc.) and `src/data/landingContent.ts` (`LANDING_FEATURES`, `LANDING_PRIVACY`, `LANDING_STATS`) are all literal pt-BR. The `LanguageSwitcher` is only rendered inside `LoginPage.tsx:66-79` and inside the authenticated `HeaderMenu`.
- **Why it hurts**: Spanish-speaking visitors landing from US/Mexico searches see pt-BR copy and bounce. The locale files (`pt-BR.json`, `en.json`, `es.json` — 391 lines each, symmetric) prove i18n is already wired; landing just isn't using it.
- **Fix**: move all `LandingPage` strings into `t('landing.*')` keys; add a small language pill at the top-right of the landing header.

## Accessibility findings

### Axe automated results (raw at `docs/audits/_axe-prod.txt`)
- **16 issues, 2 rule types**.
- `color-contrast` × 15 — concentrated on:
  - Landing sticker mocks: `.text-[8px].font-bold` text inside the floating cards (3rd and 6th cards). Decorative, but axe flags it.
  - Landing copy: `.text-xs.text-slate-500` for tier-2 feature descriptions (`landingContent.ts:43-65` "Visão geral...", "Metas que tornam...", "Cards especiais..."); the privacy section description; the "Sem cartão · Sem anúncios" hint (`LandingPage.tsx:114`); the bottom CTA description (line 249-251); the footer `text-slate-600`/`text-slate-800` strings — 6 of these 15 hits are footer / fine-print using `slate-600`/`slate-800` on `slate-950`. WCAG AA needs 4.5:1 for body text. `slate-500` on `slate-950` is ~5.4:1 (OK by my eye but axe contextually fails on the `bg-slate-900/40` panels where effective bg lightens).
- `definition-list` × 1 — `LandingPage.tsx:126-133` `<dl>` is misused. Fragment is wrapped around `<div>` + `<LandingStatPill>`, so the `<dl>` ends up containing non-`<dt>/<dd>` children. Also `<>...</>` keyed via `key` on parent fragment doesn't propagate React warning-free.

### Manual code review additions
- **Email input has no `<label>`** — `LoginEmailForm.tsx:57-64`. See F2. WCAG 3.3.2 fail.
- **No `aria-describedby` linking email error to the input** — `LoginEmailForm.tsx:65` puts the error in a `<p role='alert'>` but the input isn't aware of it. Screen readers will announce the alert and then nothing when focus returns. Add `aria-describedby='login-email-error'` on the input and `id` on the error.
- **`GuestPaywallModal.tsx:36-86`**: dialog has `role='dialog' aria-modal='true' aria-labelledby='paywall-heading'`, but `paywall-heading` points to a `<p>` (line 59) not an `<h1/h2>`. Some screen readers tolerate it; better to use an `<h2 id='paywall-heading'>`. No focus trap is installed — Tab key escapes the modal into the album behind it. Also no `Escape` key handler.
- **`GuestTabNav.tsx:13-17`**: the "active" Album tab is a `<span>`, the inactive tabs are `<button>`. `nav` lacks `aria-label`. The currently-selected tab should be a `<button aria-current='page' aria-disabled='true'>` (or set `tabIndex={0}`) so keyboard users can land on it.
- **Sidebar / GuestTabNav touch targets**: `px-5 py-1.5` ≈ ~30px tall. Apple HIG / Material baseline is 44×44 px. Increase to `py-2.5` or wrap in 44px hit area via `min-h-[44px]`.
- **Color contrast in team-color overlays**: `teamColors.ts` has white-on-yellow (ENG `#FFFFFF`/`#CF091D`, UKR `#005BBB`/`#FFD500`) and dark text on near-white (CAN `#FFFFFF`, NZL `#FFFFFF`). The album doesn't render text directly on these per `StickerFace.tsx`, but any future overlay should sample both kit colors before choosing text color.
- **Decorative emoji icons** are correctly `aria-hidden='true'` and the wrappers carry `role='img' aria-label`. Good.
- **Skip-to-content** link is present on landing (`LandingPage.tsx:43-48`). Good.
- **Modal close on backdrop click** (`GuestPaywallModal.tsx:45`) — the backdrop has `onClick` but the wrapping `div` is not a `<button>`, so keyboard users can't dismiss except via "Agora não". Add `onKeyDown` for `Escape`.

## Mobile / responsive issues

- **`viewport-fit=cover` is set on `index.html:6` but no `env(safe-area-inset-*)` paddings anywhere** in `src/index.css` or component layouts. On iPhone notch / Dynamic Island in standalone PWA mode, the header and footer content will hide under the system UI. Add `padding-top: env(safe-area-inset-top)` to the landing header (`LandingPage.tsx:51`) and bottom safe-area to `GuestAlbumPage.tsx:37` header.
- **Floating sticker decorations on landing**: `LandingPage.tsx:78-85` uses `hidden md:block`, so they only show on tablet+. Good.
- **`max-w-5xl`/`max-w-4xl`** wrappers throughout — fine. No horizontal-scroll hazards spotted in landing/login.
- **Touch targets**: `GuestTabNav.tsx`, `Sidebar.tsx` items, language pills (`LoginPage.tsx:67-79` `px-3 py-1.5`), the "Voltar" link (`LoginPage.tsx:62-64` plain text, ~14px tall) — all under 44px. Worst offender: `LoginPage.tsx:62` "← Voltar" is `text-xs` ≈ 12px hit area.
- **Iconography on landing**: emoji-based icons (`landingContent.ts` "⚡📤🔄📊🏆🎉") look great on Apple devices, render poorly on Android (less rich glyphs). Consider swapping to inline SVG icons; cheap quality bump on the target market.

## Copy & i18n

- **Locale files are symmetric** (`en.json`, `pt-BR.json`, `es.json` all 391 lines, 335 quoted strings). Good baseline.
- **LandingPage** is **100% hardcoded pt-BR** (see F6) — even though the codebase uses `useI18n` everywhere else. This is the single biggest i18n gap.
- **`AppErrorBoundary.tsx:33-35`** has hardcoded "Algo deu errado" / "Erro inesperado..." — acceptable as a hard fallback but should at least cover en + es one-liners.
- **Tone**: casual/friendly pt-BR ("Chega de planilha", "Pronto pra montar o álbum mais épico", "Cole aqui") — matches the Brazilian football audience well. No tonal inconsistencies spotted.
- **`LoadingScreen.tsx:1-8`** uses `t('loading')` — good, but a soccer-ball emoji as the only visual works on iOS, less so on older Android. Consider a tailwind-animated SVG ball.
- **`LandingPage.tsx:127-132`**: `<>...</>` fragment inside `.map()` without `key` on the fragment itself (the `key` is on the child `<LandingStatPill>` and the sibling `<div>`) — React will warn about adjacent children needing keys, AND the `<dl>` semantics are wrong (see axe `definition-list`). Refactor: render a single `<div>` per stat with `<dt>` for value and `<dd>` for label, or drop `<dl>` for `<ul>` with semantic labelling.

## SEO & social preview

- **`robots.txt` returns the SPA HTML (200, but body is `<!DOCTYPE html>`)** — Google will treat the site as having no robots.txt, fine, but it's misleading. Same for `sitemap.xml` — soft-404. **Add real `public/robots.txt`** (allow all, point to sitemap) and a generated `public/sitemap.xml` (just `/`, `/login`, `/album`, `/privacidade`, `/termos` to start). Crucial because the rewrite in `vercel.json:3` swallows all paths.
- **`og:image` and `og:url` are missing** from `index.html`. `/og-image.png` exists (200 OK) but is never referenced. **WhatsApp previews will render a generic card without an image** — this is the #1 acquisition surface for the target market. Add:
  ```html
  <meta property="og:image" content="https://www.meualbum2026.app/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="https://www.meualbum2026.app/" />
  <meta name="twitter:image" content="https://www.meualbum2026.app/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  ```
  Current `twitter:card` is `summary` (small square) — `summary_large_image` is what you want.
- **No `<link rel="canonical">`** — add `<link rel="canonical" href="https://www.meualbum2026.app/" />` on `index.html`.
- **No `<link rel="alternate" hreflang>`** despite supporting pt-BR / en / es. Since locale is client-side only (one URL), this is academic, but consider `?lang=` query routes for indexable variants if you want to rank in en/es markets.
- **Soft-404 for unknown paths**: there is no `<Route path='*'>` in `App.tsx` / `AppAuthGate.tsx`. `https://www.meualbum2026.app/inexistente` returns 200 + the landing page (rewrite in `vercel.json:3`). Google may flag this as "Soft 404". Add a `MissingPage` route catch-all (the file `src/pages/MissingPage.tsx` already exists — wire it).
- **Title length**: "Meu Álbum 2026 — Álbum de Figurinhas Copa do Mundo FIFA" is 56 chars, fine.
- **`<title>` uses FIFA** — independent project, line 286 of landing says "Não afiliado com FIFA™". Trademark exposure: consider "Copa 2026" instead of "Copa do Mundo FIFA" in title to reduce risk.

## PWA install / share UX

### Manifest (`dist/manifest.webmanifest`, served verbatim at prod)
```json
{"name":"Meu Album 2026","short_name":"MeuAlbum","description":"...","start_url":"/","display":"standalone","background_color":"#0f172a","theme_color":"#0f172a","lang":"en","scope":"/","orientation":"portrait","icons":[{"src":"pwa-192.png","sizes":"192x192"},{"src":"pwa-512.png","sizes":"512x512","purpose":"any maskable"}]}
```
- **`lang: "en"` is wrong** for a pt-BR-first app. Add `lang: 'pt-BR'` to the manifest block in `vite.config.js:33-45`.
- **`name` drops the `Á` (accent)** — "Meu Album 2026" vs the rebranded "Meu Álbum 2026" everywhere else. Inconsistent.
- **Missing fields hurting install UX on Android**: `categories: ['sports','games','utilities']`, `screenshots` (with `form_factor: 'narrow'`/`'wide'`) — Chrome shows these in the new install dialog. Adding them noticeably boosts install conversion. Also `display_override: ['standalone','minimal-ui']` is best practice.
- **Icons**: only two PNG sizes, both `purpose: 'any maskable'` on the same icon → Android may letterbox or crop badly. Provide a dedicated maskable version (with safe zone) separate from `any`. Add 144, 256, 384 sizes for older devices.
- **No `apple-touch-icon` link** in `index.html`. `https://www.meualbum2026.app/apple-touch-icon.png` returns 200, but the HTML doesn't reference it, so iOS Safari falls back to a screenshot for "Add to Home Screen". Add `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />` and ideally a 180×180 version.
- **No iOS A2HS prompt**: iOS doesn't fire `beforeinstallprompt`. Consider a one-time bottom-sheet hint on `/album` for iOS Safari users ("Toque ⬆ e 'Adicionar à Tela de Início' para instalar").
- **No `beforeinstallprompt` capture anywhere**. The Android install banner shows automatically (because manifest + SW are present) but you can't time it. Capturing the event and showing your own install CTA after first sticker tap would lift install rate substantially.

### Share UX
- `src/components/StickerShareActions.tsx:19-44` and `ChallengeCompletedModal.tsx:20-32` use `navigator.share` → fall back to clipboard → fall back to `wa.me/?text=...`. Solid pattern.
- `MissingShareButtons.tsx`, `SwapsShareButtons.tsx`, `StickerShareActions.tsx` — all guest-gated (`/album` shows none, paywall on tabs). Consider letting guests share a teaser: "Estou usando o Meu Álbum 2026 pra completar a Copa — entra aí: meualbum2026.app" — turns guests into viral nodes pre-conversion.

## Things checked and OK

- `index.html` has `lang='pt-BR'`, viewport correct (with `viewport-fit=cover`), description, theme-color, apple-mobile-web-app meta, OG `og:type/og:locale/og:title/og:description/og:site_name`, Twitter title/description.
- Skip-to-content link on landing (`LandingPage.tsx:43-48`).
- Focus-visible ring (`FOCUS_RING` constant) applied consistently to all landing CTAs and footer links.
- Privacy/LGPD section on landing with explicit "sem venda de dados", links to /privacidade and /termos.
- Telemetry properly gated by consent (`syncTelemetryConsent` in `src/lib/telemetry/index.ts:40-77`) — no PII leaks on anonymous landing.
- ConsentBanner has `role='dialog' aria-label`, buttons with `type='button'`, link to privacy.
- ErrorBoundary captures to Sentry with componentStack (`AppErrorBoundary.tsx:18-27`).
- CSP is tight (`vercel.json:43-46`) — script-src self + Vercel + Sentry + PostHog; no inline-script except hashed registerSW.
- Security headers all present: nosniff, frame-options, referrer-policy, permissions-policy (camera scoped to self).
- React-router v7 with `BrowserRouter` and `lazy()` for every page chunk — fast first paint.
- Vercel cache headers: assets immutable 1y, index.html `max-age=0, must-revalidate` (`vercel.json:6-23`). Correct.
- pt-BR/en/es locale files are symmetric (391 lines each, 335 strings each).
- Sticker silhouette `<img>` correctly uses `aria-hidden alt=''` (`StickerFace.tsx:76-85`).
- Guest paywall fires meaningful events: `GUEST_STICKER_TAPPED`, `PAYWALL_SHOWN { reason }`, `PAYWALL_DISMISSED` — funnel instrumentation is in place (just won't have variant data, see F1).

## Needs authenticated review (the user will revisit)

- **Onboarding flow after first login** — `AuthenticatedApp.tsx:97` mounts `OnboardingGate`. Need to audit time-to-first-sticker, whether a tour is forced, abandonment exits.
- **Scanner UX** (`ScannerPage.tsx`, `ScannerCamera.tsx`, `CameraErrorView.tsx`) — camera permission prompt, denial UX, OCR confidence handling, retry affordance.
- **Trade flow** (`pages/TradePage.tsx`, `pages/trade/`, `TradeQRModal.tsx`) — QR code generation, share/copy QR, redeem path, expiry handling.
- **Real-time sync** — Supabase realtime conflict resolution, optimistic UI rollback when offline.
- **Settings → delete account / export** (`SettingsDeleteAccountSection.tsx`, `SettingsExportSection.tsx`) — LGPD article 18 flow.
- **Magic-link return path** — confirm `isSupabaseAuthCallback` in `App.tsx:11-15` doesn't strip the locale/preferred destination on iOS Mail in-app browser.
- **Sidebar / album scroll perf** on a 994-item collection on a low-end Android.
- **Consent banner appearance**: only authenticated users see it — verify the post-login first-paint doesn't hide content under the banner on small screens (`ConsentBanner.tsx:21-24` is `fixed bottom-0` with no body padding compensation).
- **Challenges & milestones modal a11y** — focus trap, dismiss on Escape, on-screen-reader announcement of milestone unlock.
- **Color contrast on team-colored backgrounds** for any text inside the authenticated `StickerFace` / `StickerCard` (sticker number on team gradient).

## Priority cheat-sheet for go-live

| Severity | Item | Effort | Touches |
|---|---|---|---|
| Critical | F1 — Hero A/B test unreachable for anon | M | `telemetry/posthog.ts`, `LandingPage.tsx` |
| Critical | og:image / og:url / canonical missing in `index.html` | XS | `index.html` |
| Critical | `robots.txt` / `sitemap.xml` soft-404 | S | `public/robots.txt`, `public/sitemap.xml` |
| High | F2 — email input has no label / autocomplete | XS | `LoginEmailForm.tsx:57-64` |
| High | Manifest `lang: "en"`, name accent, missing screenshots/categories | XS | `vite.config.js:33-45` |
| High | No `apple-touch-icon` link in HTML | XS | `index.html` |
| High | F3 — magic-link UX (warn about spam folder, ideally OTP) | M | `LoginMagicLinkPanel.tsx`, supabase config |
| High | F6 — LandingPage hardcoded pt-BR | M | `LandingPage.tsx`, `landingContent.ts`, locale files |
| Medium | Soft-404 catch-all route (`MissingPage.tsx` exists but unwired) | XS | `App.tsx` |
| Medium | F4 — first guest tap paywalls immediately | S | `GuestStickersProvider`, `GuestAlbumPage.tsx` |
| Medium | F5 — ErrorBoundary needs reload button + i18n | XS | `AppErrorBoundary.tsx` |
| Medium | Safe-area-inset paddings (PWA standalone on iPhone notch) | XS | `index.css`, landing/guest headers |
| Medium | Touch targets <44px on tabs, language pills, "Voltar" link | S | `GuestTabNav.tsx`, `LoginPage.tsx` |
| Medium | Modal focus trap + Escape (`GuestPaywallModal`) | S | `GuestPaywallModal.tsx` |
| Low | Axe color-contrast x15 on `slate-500/600/800` fine print | S | landing CSS classes |
| Low | `<dl>` definition-list misuse on stats pill | XS | `LandingPage.tsx:126-133` |
| Low | `twitter:card = summary_large_image` | XS | `index.html` |
