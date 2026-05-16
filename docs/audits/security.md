# Security audit — meualbum2026 (pre-go-live, 2026-05-15)

Auditor: senior web-sec review, branch `ci/require-e2e-gate` (post-merge).
Production URL: <https://www.meualbum2026.app> · Stack: React 18 / Vite 8 / Supabase / Vercel / PWA.

---

## TL;DR

**Verdict: ship with two fast-follows.** The app is in good shape — no remote code execution, no RLS holes that expose other users' albums, no committed secrets, clean `npm audit`, sensible CSP, HTTPS-only with HSTS, and a thoughtful consent-gated telemetry pipeline with PII scrubbing. The two issues that should be fixed inside the first 24–48h of GA are (1) publicly reachable `.js.map` source maps and (2) the `user_challenge_completions` SELECT policy that lets any authenticated user enumerate every other user's UUID. Everything else is hygiene that can wait.

**Top 3 fixes this week**

1. Stop serving `*.js.map` from production (or restrict to Sentry-only). They are reachable with `200 OK` and rebuild your TypeScript source.
2. Tighten the `user_challenge_completions` SELECT policy — currently any authenticated user can `select user_id, challenge_id from public.user_challenge_completions` and dump the global user list.
3. Harden HSTS (`includeSubDomains; preload`) and consider dropping `'unsafe-inline'` from `script-src` once a nonce/hash pipeline is in place.

---

## Critical (block go-live)

**None.** Nothing found is exploitable in a way that justifies holding the launch.

---

## High (fix this week)

### H1 — Source maps publicly served, full source recoverable

**Evidence**

```
$ curl -sI https://www.meualbum2026.app/assets/index-BUh0qUUI.js.map
HTTP/2 200
content-type: application/json; charset=utf-8
cache-control: public, max-age=31536000, immutable
```

The minified bundle still carries the directive:

```
//# sourceMappingURL=index-BUh0qUUI.js.map
```

And the `.map` payload is a real v3 source map (`{"version":3,"mappings":";g2CASa,IAA…`).

In `vite.config.js:24` the build sets `sourcemap: true`, and the Sentry plugin's `filesToDeleteAfterUpload: ['**/*.map']` only runs when `SENTRY_AUTH_TOKEN && SENTRY_ORG && SENTRY_PROJECT` are all set at build time (`vite.config.js:11-21`). If any of those build-env vars is missing on a Vercel build, the maps survive into `dist/` and are served at the immutable asset path.

**Exploit / impact**

Anyone can rebuild your full TypeScript source (Supabase RPC names, telemetry event taxonomy, feature flag keys, the OCR regex, the trade-payload schema, business logic in `lib/`). Helpful for an attacker preparing a targeted abuse of public RPCs (e.g., `adjust_sticker`, `log_audit_event`). For a public sticker album the marginal impact is *not* secrets, but it removes the cost of reconnaissance.

**Fix**

Pick one of:

- Verify all three Sentry vars are present on every Vercel production build (recommended — you get Sentry symbolication and the maps are auto-deleted).
- Or set `build.sourcemap: 'hidden'` in `vite.config.js` so the bundle has no `sourceMappingURL` comment and the map files are not emitted.
- Or add a Vercel route rule that returns `404` for `*.map`.

### H2 — `user_challenge_completions` allows enumeration of all user UUIDs

**Evidence** — `supabase/migrations/20260513_0003_challenge_completions.sql:14-18`

```sql
create policy "challenge_completions_select"
  on public.user_challenge_completions
  for select
  using (auth.role() = 'authenticated');
```

The policy's comment explains the intent ("needed for global aggregation"), but it grants row-level read access to *every column including `user_id`* to every authenticated user.

**Exploit**

Any logged-in user runs:

```sql
select distinct user_id from public.user_challenge_completions;
```

…and gets every user UUID that has ever completed a challenge. UUIDs are not directly PII, but they enable correlation with future leaks and let a curious user "trade graph" the whole population. Also breaks the implicit assumption that user data is private.

**Fix**

Use a `security definer` aggregation function or a view with `security_invoker = off` that only exposes `(challenge_id, completions, completion_pct)`, then revoke direct SELECT on the base table. The existing `public.challenge_completion_rates` view is the right shape — just lock down the base table:

```sql
drop policy "challenge_completions_select" on public.user_challenge_completions;
create policy "challenge_completions_select_own"
  on public.user_challenge_completions for select to authenticated
  using (auth.uid() = user_id);
grant select on public.challenge_completion_rates to authenticated;
```

---

## Medium (fix this sprint)

### M1 — `script-src 'unsafe-inline'` in CSP

**Evidence** — `vercel.json:37` and `curl -sI https://www.meualbum2026.app` confirms in the live `content-security-policy` header.

`'unsafe-inline'` on `script-src` defeats CSP as an XSS mitigation. The codebase has no `dangerouslySetInnerHTML`, no `innerHTML`, no `eval`, and no `document.write` (grep returns zero hits in `src/`), so today there's no concrete sink to exploit. But the moment a future regression introduces one, the CSP will not catch it.

**Fix**

Migrate to nonce-based CSP (Vite supports nonce injection via plugin) or hash-based. As an interim, audit any future addition that emits inline scripts.

### M2 — HSTS missing `includeSubDomains` and `preload`

**Evidence**

```
strict-transport-security: max-age=63072000
```

…on every response. `max-age` is good (2 years), but there's no `includeSubDomains` and no `preload`. Vercel sets it automatically on the apex / wildcard, but `meualbum2026.app` subdomains (e.g., a future `staging.`) would be downgrade-attackable.

**Fix**

Add to `vercel.json` headers (after confirming all subdomains are HTTPS):

```json
{ "key": "Strict-Transport-Security",
  "value": "max-age=63072000; includeSubDomains; preload" }
```

Then submit to <https://hstspreload.org>.

### M3 — `audit_events.action` has no length cap

**Evidence** — `supabase/migrations/20260515_0002_audit_events.sql:36-58`

The `log_audit_event` RPC trims the action but never bounds its length, and `metadata` is unbounded `jsonb`. Any authenticated user can send `log_audit_event(repeat('x', 10_000_000), …)` repeatedly to bloat the table.

**Exploit**

DB-bloat / cost-amplification attack. Not data exfiltration — but Postgres storage and Supabase egress are billed.

**Fix**

```sql
if length(p_action) > 64 then raise exception 'action too long'; end if;
if octet_length(p_metadata::text) > 4096 then raise exception 'metadata too large'; end if;
```

…and consider a per-user rate limit (e.g., a `created_at`-windowed insert count check).

### M4 — `'unsafe-inline'` on `style-src`

Same CSP, `style-src 'self' 'unsafe-inline'`. Tailwind-emitted inline styles plus react-dom's runtime styles realistically force this today. Lower risk than script-side unsafe-inline (style XSS = exfil via CSS selectors, not RCE), but worth tracking.

---

## Low / hygiene

### L1 — `window.open(...)` without explicit `'noopener,noreferrer'`

`src/components/StickerShareActions.tsx:37,44` and `src/components/ChallengeCompletedModal.tsx:32` call `window.open(whatsapp_url, '_blank')`. Modern browsers default to `noopener` when target=_blank, so reverse-tabnabbing is mitigated automatically. Still — add the explicit windowFeatures string `'noopener,noreferrer'` for defense in depth.

### L2 — `connect-src https://*.supabase.co` is broader than needed

The CSP allows connection to any `*.supabase.co` hostname. Once the project ref is final, pin to your specific subdomain (`https://<ref>.supabase.co`) so a stolen anon key can't be reused from your origin to another project, and XSS can't reach a sibling Supabase tenant.

### L3 — `worker-src https://cdn.jsdelivr.net` for Tesseract.js

Expected — tesseract.js loads its WASM/JS from jsDelivr by default (`src/hooks/useOCR.ts:22`). Two consequences worth noting:

- Supply-chain dependency on jsDelivr. The runtime cache strategy in `vite.config.js:51-61` uses StaleWhileRevalidate (good — re-checks the CDN every request rather than blindly serving a 30-day-old artifact), and there's a clear `#52` reference indicating you already thought about this.
- Subresource Integrity (SRI) is not pinned on the Tesseract worker. tesseract.js does not natively support SRI for its dynamic workers; flagging as accepted risk.

### L4 — `X-Frame-Options: SAMEORIGIN` instead of `frame-ancestors` in CSP

`vercel.json:30` sets `X-Frame-Options: SAMEORIGIN`. CSP doesn't carry an explicit `frame-ancestors`, so `default-src 'self'` does the work. Either approach is fine; consolidating into `frame-ancestors 'self'` is the modern equivalent.

### L5 — `public.challenge_completion_rates` view inherits owner privileges

Postgres views default to running as their owner and bypass RLS. The view only exposes aggregates (`completions`, `completion_pct`) so it's not a leak, but consider declaring `with (security_invoker = on)` (PG 15+) so the view runs with the caller's RLS.

### L6 — Magic-link / OAuth `redirectTo: window.location.origin`

`src/hooks/useAuth.ts:89,109`. This is benign because Supabase validates redirect URLs server-side against your project's allow-list. Make sure the Supabase project's Auth → URL Configuration only includes `https://www.meualbum2026.app` (and `http://localhost:5173` for dev). If `*.vercel.app` preview hosts are wildcarded, anyone who can deploy a preview can phish your tokens.

### L7 — No Permissions-Policy entry for `interest-cohort`, `browsing-topics`, `payment`

```
permissions-policy: camera=(self), microphone=(), geolocation=()
```

Good — camera scoped to self, mic/geo off. Consider explicitly disabling FLoC/Topics for LGPD posture: `browsing-topics=(), interest-cohort=()`.

### L8 — `console.error/warn` in production code paths

`src/hooks/useOCR.ts:65`, `src/hooks/useScannerLog.ts:36`. Neither logs tokens or PII; they pass error objects only. Acceptable.

---

## Things checked and OK (one-liner each)

- **No committed secrets.** `.env.local`, `.env`, `.env.*.local` are in `.gitignore`; full-history `git log -G "service_role|sk_live|sntrys_"` only matches docs/comments warning against committing them.
- **No XSS sinks in source.** `grep -rn "dangerouslySetInnerHTML|innerHTML|eval\(|new Function|document.write" src/` returns zero results.
- **CSRF.** Supabase auth uses bearer tokens in headers (not cookies) and the same-origin SPA does not accept third-party POST navigations. No CSRF surface.
- **RLS on user_stickers.** `supabase/migrations/20260512_0001_create_catalog_schema.sql:50-72` — SELECT/INSERT/UPDATE/DELETE all scoped to `auth.uid() = user_id`. Verified.
- **`adjust_sticker` RPC**: `security definer`, sets `search_path = public`, fails closed on `auth.uid() is null`, revoke-all + grant-to-authenticated. Textbook.
- **`delete_my_account` RPC**: `security definer`, audits the deletion to `audit_events` before the cascade, then deletes from `auth.users`. LGPD right-to-erasure honored.
- **`reset_my_album` RPC**: same hardening; deletes only `where user_id = v_user`.
- **Anon key is the anon key.** Bundle inspection (`curl https://.../assets/...js`) shows no `service_role` JWT; the publicly embedded credential is the publishable anon key as Supabase intends.
- **Catalog anon-read policy.** `20260515_0001_catalog_anon_read.sql` only grants `select` on `public.teams` and `public.stickers_catalog` (static, immutable reference data) to anon. `user_stickers` stays authenticated-only.
- **Sentry consent gating.** `src/lib/sentry.ts:31-48` — `beforeSend` returns `null` until `captureAllowed=true` (granted in `grantSentryConsent`). `sendDefaultPii: false`. Breadcrumbs also drop until consent.
- **Sentry PII scrubbing.** `src/lib/sentry/sanitize.ts` redacts keys matching `email|password|token|authorization|secret|api[_-]?key|access[_-]?token|refresh|session|cookie|bearer|otp|magic` and JWT-shaped strings, and forces `event.user` down to `{ id }`.
- **PostHog consent gating.** `src/lib/telemetry/posthog.ts:68` — `activatePostHogAnalytics` only runs after the consent state machine in `src/lib/telemetry/index.ts:40-77` reaches `granted`. `person_profiles: 'identified_only'` and `capture_pageview: false`.
- **PostHog event sanitization.** `src/lib/telemetry/events.ts:56-72` drops any prop whose key matches `email|password|name|message|text|label|player` and strips non-scalar values.
- **No SDK keys logged.** Neither `console.log(import.meta.env...)` nor analytics calls include env vars.
- **HTTPS-only.** No `http://` fetches in `src/`; all third-party hosts in CSP `connect-src` are HTTPS.
- **`X-Content-Type-Options: nosniff`**, **`Referrer-Policy: strict-origin-when-cross-origin`**, **`Permissions-Policy: camera=(self), microphone=(), geolocation=()`** all set both in `vercel.json` and confirmed live.
- **HSTS present** (`strict-transport-security: max-age=63072000` — 2 years).
- **Service worker.** `dist/sw.js` (3 lines, workbox-generated) precaches static JS/CSS/HTML/manifest only — no secrets, no API responses, no auth state. `cleanupOutdatedCaches()` is called and the `cdn.jsdelivr.net` rule is `StaleWhileRevalidate`, not `CacheFirst` (good).
- **`vite-plugin-pwa` config** (`vite.config.js:30-65`): `globPatterns` only globs `js,css,html,ico,png,svg,woff2` — no `.env`, no `.map` precached.
- **Tesseract.js / camera flow.** Images are processed locally in a Web Worker; `react-webcam` is `audio={false}`; `getScreenshot()` output stays in-memory; nothing is POSTed.
- **localStorage usage.** Album CSV backups (`src/lib/albumBackupStorage.ts`), milestone events, challenge completions, analytics consent flag, and PostHog's own persistence. No tokens, no PII written by app code (Supabase's own `sb-*-auth-token` is unavoidable client-state but flagged session storage — see *Not audited*).
- **OAuth/magic-link flow.** Supabase client SDK handles PKCE; redirect URL whitelist enforced server-side.
- **Trade payload.** lz-string compressed JSON in URL params. `decodeTradePayload` validates structure (`Array.isArray(swaps)`, every item is `string`) before use — no prototype-pollution opportunity. URLs do not carry tokens.
- **`/.env`, `/.git/config`, `/.well-known/*`**: all 200 because of the SPA rewrite (`vercel.json:2-4` rewrites everything to `/index.html`), so they serve the SPA shell, not actual secrets. False-positive; behavior is fine.
- **`robots.txt`** doesn't exist (returns SPA HTML). `<meta name="robots" content="index, follow">` is set in `index.html:9`. Acceptable for a marketing-public app.
- **`npm audit --audit-level=low`** → `found 0 vulnerabilities`.
- **Dependency surface.** All runtime deps are mainstream and currently maintained: `@sentry/react@^10.53`, `@supabase/supabase-js@^2.105`, `posthog-js@^1.373`, `react@^18.3`, `react-router-dom@^7.14`, `tesseract.js@^5.1`, `react-webcam@^7.2`, `lz-string@^1.5`. No `left-pad`-class risks.
- **Vite dev server binding.** `server: { host: '127.0.0.1' }` in `vite.config.js:23` — defense in depth for the Vite 8 default change.
- **Dev-only error rendering guarded.** `src/components/AppErrorBoundary.tsx:35` and `src/components/CatalogErrorScreen.tsx:23` only show raw `error.message` when `import.meta.env.DEV` / not `.PROD`.
- **e2e service-role usage.** `e2e/helpers/supabase-auth.ts:26` reads `E2E_SUPABASE_SERVICE_ROLE_KEY` from `process.env` (CI-only); never appears in any `VITE_*` variable, never bundled.

---

## Not audited (needs auth or follow-up)

- **Supabase Auth → URL Configuration.** Verify the allow-list contains only `https://www.meualbum2026.app` (+ `http://localhost:5173`) and does *not* wildcard `*.vercel.app` preview deployments. Requires Supabase dashboard access — pair with L6.
- **Supabase Auth email templates.** Confirm magic-link emails don't expose internal IDs and the rate limits are set sanely (default is generous).
- **Sentry project DSN scope.** Confirm the DSN in `VITE_SENTRY_DSN` is the **client/browser** DSN with `inbound-data-filters` enabled, not a server DSN with broader scope.
- **PostHog project session-recording defaults.** Code doesn't set `session_recording` explicitly in `posthog.init(...)`, so it inherits the project default. Verify in PostHog UI that recording is **off** until consent flags it on, and that input masking + URL masking are enabled (memory says yes; not visible from code alone).
- **Vercel deployment protection.** Preview deployments should require auth (Vercel Authentication) to keep pre-production code, source maps, and feature flags off the public internet.
- **Rate limits on `adjust_sticker`, `log_audit_event`.** Supabase has project-level limits, but authenticated abuse (e.g., billion `adjust_sticker(...,1)` calls) is not bounded at the function level. Consider DB-level rate limiting if abuse appears.
- **LGPD posture review.** A formal mapping of the privacy policy text against actual data flows (audit_events, milestone events in localStorage, share-link URLs) is out of scope for a security audit but worth a separate pass.
- **Authenticated penetration test.** This review is read-only static + headers. A dynamic test with a real authenticated user (sign up, exercise every RPC, fuzz the trade payload deserializer with malformed lz-string) would surface things static analysis can't.

---

*End of report.*
