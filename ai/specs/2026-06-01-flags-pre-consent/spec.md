# Spec: Feature flags avaliáveis antes do consentimento de analytics

Date: 2026-06-01
Owner: rafael
Status: Draft

## Problem

Hoje, `src/lib/telemetry/index.ts:48` mantém `analyticsImpl = noopAnalytics`
até que `consent === 'granted'`. `telemetry.flag()` chama o adapter, então
**qualquer feature flag retorna `false`** para:

- usuários que ainda não responderam ao banner de consentimento;
- usuários que recusaram analytics.

Resultado prático observado em 2026-06-01:
features `friends_v1` e `social_v1` ficam invisíveis em prod mesmo para
contas explicitamente alvo. Confirmado por SQL no PostHog: em 30 dias só
31 eventos de `consent_analytics_updated` (30 grant, 1 decline) — todo o
resto da audiência fica em fase pré-consent, sem flag-eval. As decisões de
produto que dependem de feature flags ficam acopladas a uma decisão de
privacidade que é independente.

PostHog suporta os dois modos separadamente:
[`opt_out_capturing_by_default`](https://posthog.com/docs/libraries/js#config)
permite carregar a SDK, fazer flag-eval via `/flags`, e *não* enviar
`capture`/`identify` enquanto opt-out estiver ativo. `opt_in_capturing()`
liga a parte de analytics depois.

## Users and Surfaces

- Primary user: qualquer usuário autenticado que vê flags (`friends_v1`,
  `social_v1`, `landing_hero_cta`, `onboarding_v1`). Inclui usuários guest
  na landing que veem o A/B `landing_hero_cta`.
- App surfaces: `src/AuthenticatedApp.tsx`, `src/components/Header.tsx`,
  `src/pages/{Dashboard,Settings,Missing,Swaps}Page.tsx`, qualquer
  futuro callsite de `telemetry.flag(...)`.
- Locale impact: nenhum. Sem mudança de copy.

## Scope

In:

- Refactor `src/lib/telemetry/posthog.ts` em duas fases:
  fase 1 (`bootstrapPostHogFlags`) carrega a SDK com captura opt-out por
  padrão e roda `/flags`; fase 2 (`activatePostHogAnalytics`) faz
  `opt_in_capturing()` + `identify(userTelemetryId)`.
- Refactor `src/lib/telemetry/index.ts` pra separar o ciclo de vida de
  flags do ciclo de vida de captura. `telemetry.flag()` sempre delega pra
  um adapter de flags real (não-noop) quando a SDK estiver carregada,
  independente do estado de consent.
- `syncTelemetryConsent` dispara bootstrap em qualquer estado de consent
  (`null`, `granted`, `declined`), mas só ativa captura quando `granted`.
- Cleanup no `telemetry.reset()` correto pros dois modos.
- Garantia: `decline` continua bloqueando captura/identify; sem regressão
  no comportamento atual de quem recusou.
- Atualizar `src/lib/telemetry/posthog.test.ts`,
  `src/hooks/useAnalyticsConsent.test.ts` e adicionar testes novos pro
  estado intermediário "SDK carregada, captura off".
- Atualizar `docs/privacy.md` (ou criar bloco em `docs/mvp-quality-and-observability.md`)
  documentando a chamada `/flags` pré-consent.

Out:

- Mudança no banner de consent ou no fluxo do `useAnalyticsConsent`.
- Mudança na taxonomia de eventos (`events.ts`).
- Mudança nas flags do PostHog (continuam targetadas por `distinct_id`
  até o refactor landar; pós-merge, podem voltar a `rollout 100%` simples).
- Bootstrap antes do `userId` estar disponível (mantém o gate atual: só
  inicializa depois do `useAuth` resolver, pra distinct_id ser estável).

## Acceptance Criteria

- [ ] Em prod, com `consent === null` (não decidiu), `telemetry.flag('friends_v1')`
  retorna `true` para os distinct_ids configurados na flag PostHog.
- [ ] Em prod, com `consent === 'declined'`, `telemetry.flag('friends_v1')`
  ainda retorna `true` para os distinct_ids alvo; **nenhum** `capture` é
  enviado; **nenhum** `identify` é enviado.
- [ ] Em prod, com `consent === 'granted'`, comportamento atual mantido:
  captura ativa, identify do `userTelemetryId`, flags resolvem.
- [ ] `consent_analytics_updated { granted: false }` continua sendo o
  *único* evento que sai com `decline` (ele já é enviado antes do switch
  pro noop hoje; deve continuar igual).
- [ ] Network: com `decline`, o único POST esperado para `*.posthog.com`
  é o `/flags`. Sem `/e/` (capture) nem `/engage/` (identify).
- [ ] Os fallbacks `import.meta.env.DEV || telemetry.flag(...)` nas
  páginas continuam funcionando sem mudança.
- [ ] Tests atualizados/novos cobrem: bootstrap-sem-consent, grant-após-bootstrap,
  decline-após-bootstrap, e reset.

## Product and UX Notes

- Nenhuma mudança visual. O usuário não percebe diferença na UI.
- Side effect positivo: features novas podem ser entregues a 100% dos
  usuários elegíveis, não apenas aos que aceitaram analytics. Métrica de
  feature-flag exposure deve crescer.

## Data, Privacy, and Security

- **PII envolvida:** Não. `distinct_id` é um hash opaco
  (`telemetryUserId(userId)` produz string não-reversível em
  `src/lib/telemetry/userIdentity.ts`). Não vai email, nome, nickname.
- **Supabase tables/RPCs afetados:** nenhum.
- **RLS/grants:** nenhum.
- **Analytics events:** nenhum novo evento. Apenas muda *quando* o
  PostHog é inicializado.
- **Consent impact:** **isto é o ponto sensível.** A SDK do PostHog vai
  enviar um POST para `/flags` *antes* do usuário decidir consent. Esse
  request carrega `distinct_id` (opaco) e o `api_key` público.
  - Defesa LGPD: a chamada existe pra entregar a feature correta ao
    usuário (operação necessária pra prestação do serviço, base legal
    "execução de contrato" Art. 7º V). Não é analytics — não há
    aggregação, não há analytics-style tracking, não há person property
    sendo populada.
  - Defesa técnica: `opt_out_capturing_by_default: true` garante que
    nada de captura/identify sai antes do grant.
  - Documentação: `docs/privacy.md` precisa ganhar um parágrafo
    explicando que avaliação de feature flag é feita antes do
    consentimento, e o que isso implica em termos de dado trafegado.
  - **Requer revisão de `telemetry-privacy-reviewer` no PR.**

## Open Questions

- Devemos enviar `consent_analytics_updated { granted: true }` no flush
  pós-grant mesmo se o usuário já tinha recebido flags pré-grant? Resposta
  proposta: sim, mantém comportamento atual; é o sinal de início da fase
  de captura. Confirmar com `telemetry-privacy-reviewer`.
- Vale parametrizar `bootstrap_flags_pre_consent: boolean` para permitir
  desligar via env? Resposta proposta: não nesta primeira versão; podemos
  adicionar se LGPD reviewer pedir.
- `posthog.reset()` no `telemetry.reset()` (signout): deve voltar ao modo
  bootstrap-only ou ao noop? Proposta: bootstrap-only se houver `userId`
  novo no fluxo (re-login); noop se for um signout genuíno sem novo
  contexto. Implementação fica em `index.ts` checando `userId` antes de
  re-bootstrappar.
