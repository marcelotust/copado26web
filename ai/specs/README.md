# Spec-Driven Development

Specs are required when a change has product ambiguity, touches multiple layers, or could affect
security, privacy, data shape, activation metrics, onboarding, payment/paywall, or release quality.
For narrow bug fixes, use `AGENTS.md` plus `npm run ai:harness` and skip the full spec folder.

## Lifecycle

1. `spec.md`: define the user problem, scope, non-goals, acceptance criteria, data/privacy rules, and open questions.
2. `plan.md`: map the spec to existing files, architecture choices, risks, and verification strategy.
3. `tasks.md`: split implementation into reviewable tasks with owners and gates.
4. `verification.md`: record commands, manual checks, evidence, and residual risk.

This mirrors the useful part of modern SDD workflows: Spec -> Plan -> Tasks -> Implement -> Verify.
The artifacts should be short enough to read during review.

## Naming

Use a dated folder:

```text
ai/specs/2026-05-16-guest-retention-loop/
```

Use lowercase kebab-case slugs. Keep one coherent feature or initiative per folder.

## Definition of Ready

- The user problem and target surface are clear.
- Non-goals are explicit.
- Acceptance criteria are testable.
- Telemetry, privacy, i18n, and migration impact are marked as in scope or not applicable.
- Open questions are either answered or intentionally deferred.

## Definition of Done

- Tasks are checked off with linked files or commit references.
- `npm run ai:harness` output has been considered.
- Required automated gates passed, or skipped gates are explained.
- Manual verification evidence is recorded when UI, analytics, auth, or Supabase behavior changed.
- Follow-up work is listed with owner/context.
