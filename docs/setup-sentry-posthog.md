# Setup: Sentry + PostHog

Guia para criar as contas e configurar as variáveis de ambiente no Vercel.
O código já está pronto (branch em PR) — só falta você preencher as chaves.

---

## Sentry (monitoramento de erros)

### 1. Criar conta e projeto

1. Acesse https://sentry.io e crie conta (ou use GitHub OAuth)
2. Crie uma nova **Organization** (ex: `copado26`)
3. Em **Projects → Create Project**, escolha:
   - Platform: **React**
   - Alert frequency: **Alert me on every new issue**
   - Project name: `meualbum2026`

### 2. Obter o DSN

Após criar o projeto, o DSN aparece na tela de setup. Formato:
```
https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@oXXXXXX.ingest.sentry.io/XXXXXXX
```

Você também encontra em: **Project Settings → Client Keys (DSN)**

### 3. Configurar no Vercel

1. Acesse https://vercel.com → seu projeto → **Settings → Environment Variables**
2. Adicione:
   | Nome | Valor | Environments |
   |------|-------|-------------|
   | `VITE_SENTRY_DSN` | `https://xxx@oXXX.ingest.sentry.io/XXX` | Production, Preview |

3. Faça um redeploy para a variável ter efeito

### 4. Source maps (stack traces legíveis)

O build usa `@sentry/vite-plugin` quando estas variáveis existem no **Vercel (Build)**:

| Nome | Onde obter |
|------|------------|
| `SENTRY_AUTH_TOKEN` | Sentry → **Settings → Auth Tokens** (scope: `project:releases`) |
| `SENTRY_ORG` | Slug da organization (ex: `copado26`) |
| `SENTRY_PROJECT` | `meualbum2026` |

O `release` é o commit SHA (`VERCEL_GIT_COMMIT_SHA`) ou `VITE_SENTRY_RELEASE` se definido.

### 5. Verificar em preview/produção

1. Faça login e **aceite o banner de analytics** (Sentry só envia após consentimento).
2. No console do browser:
```js
const { Sentry } = await import('/src/lib/sentry.ts')
Sentry.captureException(new Error('teste sentry preview'))
```
3. Confira em **Sentry → Issues** (filtre por `environment: preview` ou `production`).

PII (e-mail, tokens, JWT) é redigido em `src/lib/sentry/sanitize.ts` antes do envio.

---

## PostHog (analytics de produto, A/B tests, feature flags)

### 1. Criar conta e projeto

1. Acesse https://posthog.com e crie conta (ou use GitHub OAuth)
2. Crie um novo **Project** chamado `meualbum2026`
3. Escolha região: **US** (padrão) ou **EU** (se quiser dados na Europa por LGPD)

### 2. Obter as chaves

Em **Project Settings → Project API key**:
- **API Key**: `phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Host**: `https://us.i.posthog.com` (US) ou `https://eu.i.posthog.com` (EU)

### 3. Configurar no Vercel

Adicione nas Environment Variables do Vercel:
| Nome | Valor | Environments |
|------|-------|-------------|
| `VITE_POSTHOG_KEY` | `phc_xxx...` | Production, Preview |
| `VITE_POSTHOG_HOST` | `https://us.i.posthog.com` | Production, Preview |

### 4. Instalar o SDK (quando for implementar issue #75)

```bash
npm install posthog-js
```

Inicialização básica em `src/lib/posthog.ts`:
```ts
import posthog from 'posthog-js'

export function initPostHog() {
  const key = import.meta.env.VITE_POSTHOG_KEY
  const host = import.meta.env.VITE_POSTHOG_HOST
  if (!key || !import.meta.env.PROD) return
  posthog.init(key, { api_host: host, capture_pageview: false })
}
```

> **Nota LGPD**: PostHog só deve ser inicializado após consentimento do usuário (issue #18).
> O `ConsentBanner` existente no código precisa chamar `initPostHog()` no accept.

### 5. Feature flags

No painel PostHog: **Feature Flags → New Feature Flag**
- Key: snake_case (ex: `visitor_paywall_enabled`)
- Rollout: % de usuários ou por propriedade

No código:
```ts
import posthog from 'posthog-js'
if (posthog.isFeatureEnabled('visitor_paywall_enabled')) { ... }
```

---

## Variáveis de ambiente — resumo completo

```env
# .env.local (dev — nunca commitar)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Sentry (só produção)
VITE_SENTRY_DSN=https://xxx@oXXX.ingest.sentry.io/XXX

# PostHog (só produção)
VITE_POSTHOG_KEY=phc_xxx
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

No Vercel, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em **Production + Preview**,
e Sentry/PostHog só em **Production** (evitar poluir dados com previews, ou criar projetos separados).
