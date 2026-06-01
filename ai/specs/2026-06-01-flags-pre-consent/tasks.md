# Tasks: Feature flags avaliáveis antes do consentimento de analytics

## Implementation

- [ ] `src/lib/telemetry/types.ts`: extrair `TelemetryFlagsPort` e `TelemetryCapturePort`.
- [ ] `src/lib/telemetry/posthog.ts`: split em `bootstrapPostHogFlags` + `activatePostHogCapture` + `deactivatePostHogCapture`. `opt_out_capturing_by_default: true` no init.
- [ ] `src/lib/telemetry/index.ts`: separar `flagsImpl` / `captureImpl`. Nova `mountTelemetry(userId)`. `syncTelemetryConsent` só mexe em `captureImpl`. `telemetry.flag/variant` chamam `flagsImpl`.
- [ ] `src/AuthenticatedApp.tsx`: chamar `mountTelemetry(userId)` em effect quando `userId` disponível.

## Tests

- [ ] `src/lib/telemetry/posthog.test.ts`: cobrir bootstrap dev/prod + opt_in.
- [ ] `src/lib/telemetry/telemetry-lifecycle.test.ts` (novo): mount → consent={null,granted,declined} → assertions de capture vs flag.
- [ ] Network assertion: mockar fetch e validar que em `null`/`declined` o único POST é a `/flags`.

## Docs and Ops

- [ ] Atualizar `docs/mvp-quality-and-observability.md` (seção privacy ou novo bloco) com base legal LGPD pra `/flags` pré-consent.
- [ ] PR description: chamar `telemetry-privacy-reviewer` explícito.
- [ ] Tracking issue (umbrella): listar follow-ups pós-merge (simplificar `friends_v1`/`social_v1` no PostHog, métrica de exposure, smoke manual).

## Review Checklist

- [ ] Acceptance criteria still match `spec.md`.
- [ ] Privacy and telemetry rules were checked (`telemetry-privacy-reviewer` invoked).
- [ ] i18n was updated for user-facing copy. (N/A — sem mudança de copy)
- [ ] `npm run ai:harness` was run.
- [ ] Verification notes were completed.
