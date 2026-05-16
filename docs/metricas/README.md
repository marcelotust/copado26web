# Métricas de produto (PostHog → GitHub)

Check automatizado de ativação, retenção e digest diário de engajamento.

## O que roda

| Saída | Quando |
|-------|--------|
| **GitHub Issues** | Ativação ou retenção D1/D7 abaixo do limiar em `checks.mjs` (com amostra mínima) |
| **`docs/metricas/YYYY-MM-DD.md`** | Snapshot diário: top abas, eventos, challenges, sinais de churn |

Espelha o padrão de `scripts/sentry-triage.mjs`.

## Secrets (GitHub Actions)

| Secret | Onde obter |
|--------|------------|
| `POSTHOG_PERSONAL_API_KEY` | PostHog → Settings → [Personal API keys](https://us.posthog.com/settings/user-api-keys) (scope **Query Read**) |
| `POSTHOG_PROJECT_ID` | PostHog → Project Settings → Project ID |
| `POSTHOG_HOST` | **Repository variable** — API host, ex. `https://us.posthog.com` (não o ingest `us.i.posthog.com`) |

`GITHUB_TOKEN` é injetado pelo workflow.

## Local

```bash
export POSTHOG_PERSONAL_API_KEY=phx_...
export POSTHOG_PROJECT_ID=12345
export POSTHOG_HOST=https://us.posthog.com
export GITHUB_REPOSITORY=owner/copado26web
export GITHUB_TOKEN=ghp_...

npm run posthog:metrics-check -- --dry-run
npm run posthog:metrics-check
```

Flags:

- `--dry-run` — não cria issues nem commita digest
- `--digest-only` — só gera o markdown
- `--alerts-only` — só avalia limiares

## Ajustar limiares

Edite `docs/metricas/checks.mjs` (`min`, `minSample`, `activationDays`).

Com pouco tráfego, o script **ignora alertas** quando a amostra fica abaixo de `minSample` (evita issues falsos).

## LGPD

Métricas refletem apenas usuários que aceitaram analytics. O digest inclui essa nota.

## Referências

- `docs/mvp-activation-retention.md`
- `src/lib/telemetry/events.ts`
- `.github/workflows/posthog-metrics-check.yml`
