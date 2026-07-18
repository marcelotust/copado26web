# Plan: Feature flags avaliáveis antes do consentimento de analytics

## Existing Context

- Docs read: `AGENTS.md`, `docs/mvp-quality-and-observability.md`,
  `docs/mvp-activation-retention.md` (referenciados pelo AGENTS),
  `ai/specs/README.md`, posthog-js docs (`opt_out_capturing_by_default`,
  `/flags`).
- Source files read: `src/lib/telemetry/posthog.ts`,
  `src/lib/telemetry/index.ts`, `src/lib/telemetry/events.ts`,
  `src/lib/telemetry/queue.ts` (mencionado em `index.ts`),
  `src/lib/telemetry/userIdentity.ts` (mencionado em `index.ts`),
  `src/lib/telemetry/noop.ts`, `src/lib/telemetry/vercelAdapter.ts`,
  `src/hooks/useAnalyticsConsent.ts`, `src/AuthenticatedApp.tsx`,
  `src/components/ConsentBanner.tsx`.
- Tests read: `src/lib/telemetry/posthog.test.ts`,
  `src/hooks/useAnalyticsConsent.test.ts`.

## Architecture

**Estado atual:**

```
syncTelemetryConsent(consent)
  consent === 'granted'  → activatePostHogAnalytics(id) → posthog.init+identify
                                                       → analyticsImpl = phAdapter
  consent !== 'granted' → analyticsImpl = noopAnalytics
```

`telemetry.flag(key)` chama `analyticsImpl.flag(key)`. Quando `noopAnalytics`,
retorna sempre `false`.

**Estado proposto:**

```
mountTelemetry(userId)
  bootstrap fase 1:
    posthog.init({ ..., opt_out_capturing_by_default: true,
                   bootstrap: { distinctID: userTelemetryId } })
    flagsImpl = phFlagsAdapter   // flag/variant/onFeatureFlags reais
    captureImpl = noopAnalytics  // ou queueing, conforme consent

syncTelemetryConsent(consent)
  consent === 'granted':
    posthog.opt_in_capturing()
    posthog.identify(userTelemetryId)
    captureImpl = phCaptureAdapter
    drainQueuedEvents() pros eventos buferizados
  consent === 'declined':
    posthog.opt_out_capturing() (idempotente)
    captureImpl = noopAnalytics
    drainQueuedEvents() pra descartar
  consent === null:
    captureImpl = queueingAnalytics (mantém buffer)
```

**Decomposição da `telemetry`:**

- `telemetry.flag/variant/onFeatureFlags` → `flagsImpl` (independente de consent).
- `telemetry.track/setUser/error` → `captureImpl` (gateado por consent).
- `telemetry.reset` → desliga ambos e zera bootstrap.

## Implementation Slices

1. **`src/lib/telemetry/posthog.ts`** — split em duas funções:
   - `bootstrapPostHogFlags(userTelemetryId)`: `posthog.init` com
     `opt_out_capturing_by_default: true` e bootstrap do `distinctID`.
     Retorna `TelemetryFlagsPort` (sub-interface de `TelemetryAnalyticsPort`
     contendo só `flag/variant/onFeatureFlags`).
   - `activatePostHogCapture()`: chama `client.opt_in_capturing()` +
     `client.identify(...)`. Retorna `TelemetryCapturePort`
     (sub-interface contendo `track/setUser/reset`).
   - `deactivatePostHogCapture()`: `client.opt_out_capturing()`.
   - Mantém `client` module-level pra reuso.

2. **`src/lib/telemetry/types.ts`** — extrair `TelemetryFlagsPort` e
   `TelemetryCapturePort` de `TelemetryAnalyticsPort`. Manter
   `TelemetryAnalyticsPort = TelemetryFlagsPort & TelemetryCapturePort`
   pra compat.

3. **`src/lib/telemetry/index.ts`** — refactor da máquina:
   - Variáveis: `flagsImpl: TelemetryFlagsPort`, `captureImpl: TelemetryCapturePort`.
   - Nova função `mountTelemetry(userId)` chamada do `AuthenticatedApp` quando
     `userId` resolve (independente de consent). Faz bootstrap.
   - `syncTelemetryConsent` continua existindo mas só mexe em `captureImpl`.
   - `attachFlagBridge` agora subscreve em `flagsImpl`.
   - `telemetry.flag/variant/onFeatureFlags` → `flagsImpl`.
   - `telemetry.track/setUser/error` → `captureImpl`.

4. **`src/AuthenticatedApp.tsx`** — chamar `mountTelemetry(userId)` em
   `useEffect` quando `userId` muda. Manter `syncTelemetryConsent` no
   effect existente de consent.

5. **Testes:**
   - `posthog.test.ts`: testes pra `bootstrapPostHogFlags` (dev retorna
     null, prod inicializa com `opt_out_capturing_by_default`),
     `activatePostHogCapture` (chama opt_in + identify).
   - Novo `telemetry-lifecycle.test.ts`: simula sequence
     mount → consent=null (queue), consent=granted (flush + capture on),
     consent=declined (drain + capture off, flags ainda funcionam).
   - `useAnalyticsConsent.test.ts`: sem mudança (não toca o hook).

6. **`docs/mvp-quality-and-observability.md` ou `docs/privacy.md`** —
   parágrafo: "Feature flags são avaliadas antes do consentimento de
   analytics. Isso implica um POST a `posthog.com/flags` carregando o
   `distinct_id` opaco e o `api_key` público; nenhum dado de comportamento,
   nenhuma person property, nenhum identifier reversível. Base legal:
   execução de contrato (Art. 7º V LGPD). Captura de eventos e identify
   continuam gateados por grant explícito do banner."

## Risks

| Risk | Mitigation |
| --- | --- |
| LGPD reviewer rejeitar flag-eval pré-consent | Doc explícita na privacy + revisão obrigatória `telemetry-privacy-reviewer` antes do merge. Fallback: parametrizar via env var (default: on em prod, off em dev). |
| Regressão silenciosa: capture sai pré-consent | Network assertion em test (mock fetch, verificar que durante fase null/declined, único endpoint chamado é `/flags`). Manual smoke em prod com DevTools Network filtro `posthog.com`. |
| `posthog.identify` ser chamado duplicado (bootstrap + opt-in) | Bootstrap usa `bootstrap: { distinctID }` (não chama identify). Identify só em `activatePostHogCapture`. |
| Sentry inicializar antes do consent | Fora de escopo. Sentry segue gate atual (`activateSentryErrors` só em grant). |
| `posthog.reset()` em signout perder o distinct_id e re-bootstrap criar outro | `userTelemetryId(userId)` é determinístico por `userId`; novo login → mesmo hash. Não há geração aleatória. |
| Queue drain duplicado se consent oscilar | Já existe `generation++` em `index.ts:46`; reaproveitar. |

## Verification Strategy

- **Unit/component:** vitest pros novos splits + lifecycle. Mockar
  `posthog-js`. Assertar `opt_out_capturing_by_default: true` no init.
- **E2E:** *não* necessário pra esta camada (lógica pura de adapter).
  Smoke manual em `e2e/public/landing.spec.ts` continua passando se nada
  mudar visualmente.
- **Manual em dev:**
  - Toggle banner pra "decline" → DevTools Network → confirmar 1 POST a
    `/flags`, zero a `/e/` ou `/engage/`. Confirmar `telemetry.flag(...)` em
    React DevTools retorna `true` pros distinct_ids alvo.
  - Toggle "grant" → confirmar identify + drain de eventos buferizados.
- **Observability:** depois do merge, query no PostHog
  `SELECT count() FROM events WHERE event = '$feature_flag_called' AND
   timestamp >= deploy_time GROUP BY day`. Deve crescer.
- **Supabase/security:** N/A — sem mudança em Supabase.

## Rollout Notes

- Deploy normal (Vercel main → prod). Sem migrations.
- Pós-deploy: validar com os 2 distinct_ids configurados nas flags. Se
  funcionar, simplificar as flags `friends_v1`/`social_v1` voltando ao
  cohort/rollout 100% original (tarefa de cleanup, não bloqueante).
- Rollback: revert do PR. Comportamento volta ao gate consent-only.
