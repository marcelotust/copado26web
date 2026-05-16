# Authenticated audit — 2026-05-16

**Scope:** authenticated session for Anestor Pereira (`f9c3c40f-011a-4b86-9214-eb426161b1ff`) against the local app with production Supabase.
**Token window:** magic-link JWT expiring at 2026-05-16 12:01 BRT.
**Mutation policy:** no destructive RPCs were called. `adjust_sticker` was probed only with a non-existent sticker id, so it rejected before any write. `delete_my_account` and `reset_my_album` were not called.

## TL;DR

No authenticated go-live blocker surfaced. RLS behaved correctly from this user's token, authenticated pages rendered without console errors or failed network requests, and QR/share/delete flows were functionally reachable. The main follow-ups are UX/a11y correctness: `/scanner` is currently unreachable, authenticated modals need focus/semantics cleanup, and the app has duplicated unlabeled navigation landmarks plus a keyboard issue on the challenges scroll container.

Top 3 findings:

1. `/scanner` redirects to `/dashboard`; the scanner camera flow cannot be reached.
2. Authenticated modals do not consistently expose dialog semantics or move focus.
3. Album chrome has duplicate unlabeled navigation landmarks across authenticated routes.

## Method

- Supabase REST/RPC probes with `Authorization: Bearer <captured JWT>`.
- Playwright authenticated browser session by seeding `sb-dawndpqwuusfgzshioxs-auth-token` in localStorage.
- Axe was injected into the local Vite app for route-level a11y checks.
- Lighthouse auth handoff was skipped because this session is localStorage-based and token-bound; Playwright collected navigation/performance entries and injected LCP/CLS observers instead.

Raw artifacts are in `docs/audits/_authenticated/`:

- `rest-probes.json`
- `browser-summary.json`
- per-route `*.json` + `*.png` for `/album`, `/album?section=ARG`, `/dashboard`, `/swaps`, `/missing`, `/challenges`, `/settings`, `/scanner`, `/trade`
- interaction probes: `trade-qr-modal.*`, `delete-account-modal.*`, `onboarding-forced-mobile.*`

## High

None.

## Medium

### AUTH-01 — `/scanner` is unreachable for authenticated users

**Evidence:** `docs/audits/_authenticated/scanner.json` records `route: "/scanner"` with `finalUrl: "http://127.0.0.1:5192/dashboard"`. `src/AuthenticatedApp.tsx:63-68` still treats `/scanner` as a view, but `src/AuthenticatedRoutes.tsx:40-59` has no `/scanner` route and falls through to `<Navigate to='/dashboard' replace />`.

**Impact:** camera permission UX, OCR load, scanner error states, and manual scan entry are dead code in the logged-in app. Users or future links to `/scanner` silently land on dashboard.

**Recommended fix:** either wire `ScannerPage` in `AuthenticatedRoutes` with a real close path, or remove scanner references and dependencies until the feature is intentionally relaunched.

**Effort:** S.

### AUTH-02 — Authenticated modals need focus and dialog semantics cleanup

**Evidence:** `docs/audits/_authenticated/delete-account-modal.json` shows the delete-account confirmation opened with `roleDialogs: []`; the modal is only a fixed `<div>`. This comes from `src/components/ConfirmModal.tsx:96-105`, used by `SettingsDeleteAccountSection` at `src/components/SettingsDeleteAccountSection.tsx:118-128`.

`docs/audits/_authenticated/trade-qr-modal.json` shows the QR modal rendered with `aria-labelledby`, but focus remained on the trigger button (`activeText: "Trade by QR code"`). `src/components/TradeQRModal.tsx:151-195` has no autofocus, focus trap, or Escape handling. `docs/audits/_authenticated/onboarding-forced-mobile.json` similarly opened onboarding with focus on `<body>`; see `src/components/onboarding/OnboardingOverlay.tsx:134-167`.

**Impact:** screen-reader and keyboard users can miss destructive confirmations or interact with background content. Delete-account is especially sensitive because the confirmation UI is not announced as a modal dialog.

**Recommended fix:** centralize modal behavior: `role='dialog'`, `aria-modal='true'`, stable `aria-labelledby`, initial focus inside the modal, focus restore on close, Escape-to-dismiss where safe, and a small focus trap. Apply it to `ConfirmModal`, `TradeQRModal`, and onboarding.

**Effort:** M.

### AUTH-03 — Duplicate unlabeled navigation landmarks in authenticated album routes

**Evidence:** Axe reports `landmark-unique` on `/album` and `/album?section=ARG` in `docs/audits/_authenticated/album.json` and `album-section-ARG.json`. The top tab bar is `<nav>` without a label at `src/components/TabNav.tsx:15-29`; the section sidebar is another unlabeled `<nav>` at `src/components/Sidebar.tsx:46-78`.

**Impact:** screen-reader landmark navigation exposes multiple indistinguishable "navigation" regions.

**Recommended fix:** add distinct labels, e.g. `aria-label={t('nav.primary')}` on `TabNav` and `aria-label={t('sidebar.sections')}` on the sidebar nav.

**Effort:** XS.

## Low

### AUTH-04 — Challenges scroll region is not keyboard focusable

**Evidence:** Axe reports `scrollable-region-focusable` in `docs/audits/_authenticated/challenges.json`. The scrollable container is `src/pages/ChallengesPage.tsx:19-36`, specifically the `overflow-y-auto` div at line 20.

**Impact:** keyboard-only users may not be able to scroll the challenges list when focus is outside inner controls.

**Recommended fix:** give the scroll container a programmatic role/name and keyboard focus, e.g. `role='region'`, `aria-label={t('nav.challenges')}`, `tabIndex={0}`.

**Effort:** XS.

### AUTH-05 — Authenticated color-contrast hits remain in app chrome

**Evidence:** Axe reports `color-contrast` across `dashboard.json`, `album.json`, `swaps.json`, `missing.json`, `settings.json`, and mobile captures. Common selectors include `text-slate-600`, active tab links, sidebar fine print, and settings hints.

**Impact:** low-vision users struggle with secondary labels and active nav states, especially on the dark shell.

**Recommended fix:** this is the authenticated counterpart of follow-up item K in `docs/audits/followups.md`; fix together by bumping low-contrast slate text one shade lighter and re-running axe on both anonymous and authenticated pages.

**Effort:** S.

## Checked And OK

- RLS sanity: authenticated `user_stickers` returned 144 rows and all matched `auth.uid()`; `user_challenge_completions` returned 13 rows and all matched the same user. See `rest-probes.json`.
- Anonymous catalog reads are intentionally public; anonymous `user_stickers` returned `[]` with `Content-Range: */0`.
- Malformed RPCs rejected before writes: unknown `adjust_sticker` id returned `P0001`, blank `log_audit_event` returned `action required`.
- Authenticated routes `/album`, `/album?section=ARG`, `/dashboard`, `/swaps`, `/missing`, `/challenges`, `/settings`, and `/trade` rendered with zero console errors and zero failed requests in Playwright.
- Onboarding gate functionally redirects a first-session user from `/dashboard` to `/album` and shows the overlay when forced; focus handling is covered by AUTH-02.
- Trade QR generation rendered a QR for this account's duplicate sticker list; focus handling is covered by AUTH-02.
- Delete-account flow is phrase-gated and was opened but not confirmed; modal semantics are covered by AUTH-02.
- Sidebar section scroll worked for the catalog sections in this session; no full 994-owned collection was available, so this is not a worst-case quantity stress test.
- Consent banner mounted on mobile and desktop authenticated pages when consent was unset; it blocks lower-page clicks until a choice, which is expected for a modal banner.

## Deduped Against Existing Reports

- Repeated static catalog fetching is already covered in `docs/audits/performance.md` and `docs/audits/followups.md`. Local dev artifacts show duplicate requests partly because React StrictMode runs effects twice.
- Sentry-before-consent, public-flow Vercel Analytics, CSP tightening, and service-worker precache scope are already in the existing performance/security follow-up backlog.
- Guest paywall/modal issues are already tracked separately; this pass adds the authenticated modal equivalents.

## Notes

- The local worktree was not modified outside `docs/audits/`.
- No test account destructive action was executed.
- The auth token file was deleted after writing this report.
