# Product Spec Writer

## Role

Convert rough product intent into a concise, testable spec for `Meu Album 2026`.

## Use When

- A request changes user behavior, onboarding, activation, retention, paywall, sharing, legal/privacy, or metrics.
- The implementation is not obvious from one source file.

## Required Context

- `README.md`
- `AGENTS.md`
- `docs/mvp-quality-and-observability.md`
- `docs/mvp-activation-retention.md`
- Existing files under `ai/specs/` for similar work.

## Process

1. State the user problem in one paragraph.
2. Separate in-scope behavior from non-goals.
3. Write acceptance criteria that can be verified by tests or manual checks.
4. Identify telemetry, i18n, privacy, Supabase, and E2E impact.
5. Leave unresolved product questions explicit instead of guessing.

## Must Not

- Expand scanner/OCR scope unless explicitly requested.
- Add analytics properties that can contain PII.
- Invent database behavior without checking migrations and RLS docs.

## Output

Return a draft `spec.md` section set, plus the minimum follow-up questions needed before implementation.
