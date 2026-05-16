# Spec: Feedback Widget

Date: 2026-05-16
Owner: Codex
Status: Draft

## Problem

Users need a lightweight way to tell the team what is broken, what is missing, or what they think while they are using the album. The current app has no obvious support surface, so feedback likely leaves the product context or is lost.

## Users and Surfaces

- Primary user: public visitors, guest album users, and authenticated collectors.
- App surfaces: global app shell across public, guest, legal, login, and authenticated routes.
- Locale impact: pt-BR, en, and es copy required.

## Scope

In:

- Bottom-right floating feedback button with an accessible label.
- Small modal with three categories: feature suggestion, bug report, and comment.
- User-initiated `mailto:` submission to support with localized subject/body templates.
- Success/error/info UI through the existing feedback toast pattern.
- Consent-safe analytics events with category and result only; no free-form text, email, user id, route, or raw payload.

Out:

- Scanner/OCR feedback.
- Supabase tables, RLS policies, RPCs, storage, or backend ticket creation.
- Capturing screenshots, browser diagnostics, raw Supabase errors, account email, or hidden metadata.
- Sending free-form feedback to analytics, Sentry, logs, or PostHog properties.

## Acceptance Criteria

- [ ] A floating button is visible at bottom-right without blocking the primary tab nav on mobile.
- [ ] Activating the button opens a modal with the three feedback categories and localized copy.
- [ ] Users can choose a category and submit through a generated `mailto:` URL.
- [ ] Closing the modal works with the close button, backdrop, and Escape key.
- [ ] Analytics, when consent is granted, records only safe event properties: `category` and `result`.
- [ ] With placeholder Supabase env values, public and guest flows still render.

## Product and UX Notes

- The control should feel like a utility affordance, not a marketing block.
- The modal should be compact and avoid nested card layouts.
- Free-form feedback is written in the user's email client, not captured inside the app.
- The button position must account for the authenticated bottom tab bar and toast stack.

## Data, Privacy, and Security

- PII involved: Yes, potentially in whatever the user writes in their email client. The app does not capture free-form text and never sends feedback text to telemetry, logs, Sentry, or Supabase.
- Supabase tables/RPCs affected: None.
- RLS/grants affected: No.
- Analytics events affected: Add `feedback_widget_opened` and `feedback_widget_submitted`.
- Consent impact: Custom events continue to use the existing telemetry layer, which only dispatches after analytics consent.

## Open Questions

- Resolved for this slice: use `hello@copa26web.app`, matching legal copy. A dedicated feedback inbox can be a later ops change.
