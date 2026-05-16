# Plan: Feedback Widget

## Existing Context

- Docs read: `README.md`, `AGENTS.md`, `ai/specs/README.md`, `docs/mvp-quality-and-observability.md`, `docs/mvp-activation-retention.md`.
- Source files read: `src/App.tsx`, `src/AuthenticatedApp.tsx`, `src/main.tsx`, `src/components/SimpleDialog.tsx`, `src/components/ConfirmModal.tsx`, `src/components/FeedbackToast.tsx`, `src/contexts/FeedbackContext.tsx`, `src/lib/telemetry/events.ts`, `src/lib/telemetry/index.ts`, `src/i18n/*`.
- Tests read: `src/test/renderWithProviders.tsx`, existing component tests, public/authenticated E2E listing.

## Architecture

- Add a global `FeedbackWidget` component mounted above route content through `App`, so public, guest, login, legal, and authenticated screens share one support surface.
- Reuse the existing i18n provider and feedback toast provider.
- Use localized `mailto:` links instead of Supabase persistence or in-app text capture to avoid new data storage and RLS scope.
- Extend the telemetry event enum and documentation taxonomies with safe event names and properties.

## Implementation Slices

1. Build `FeedbackWidget` with accessible button, compact modal, category links, `mailto:` URL generation, and Escape/backdrop close.
2. Add locale keys for pt-BR, en, and es.
3. Add safe telemetry event constants and docs taxonomy entries.
4. Add focused RTL tests for open/category/submit/close behavior.

## Risks

| Risk | Mitigation |
| --- | --- |
| Free-form text leaks into analytics or logs | Do not collect text in the app; do not include subject/body, route, email, or identifiers in telemetry props. |
| Floating button overlaps mobile navigation or toasts | Position above bottom nav on small screens and below toast z-index. |
| `mailto:` may be blocked or unavailable | Use normal links so the browser/email client handles the intent. |
| Public E2E breaks with placeholder Supabase env | Mount the widget independently of Supabase state and avoid auth/session assumptions. |

## Verification Strategy

- Unit/component: RTL test for modal open/close, option links, and `mailto:` hrefs.
- E2E: rely on harness recommendation; add public smoke only if harness flags it as needed.
- Manual: browser check at mobile and desktop widths for placement and modal usability.
- Observability: verify event names and properties contain no free-form data.
- Supabase/security: no database changes; RLS review not required unless scope changes.

## Rollout Notes

- This is a client-only support surface. A future backend intake can reuse the category taxonomy but must go through a separate Supabase/privacy spec.
