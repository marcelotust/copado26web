# Auditoria pré go-live — Segurança, Performance e Usabilidade

**Data:** 2026-05-15  
**Produto:** Meu Álbum 2026 (`meualbum2026`)  
**Repositório:** `copado26web`  
**URL de produção:** https://www.meualbum2026.app (apex `meualbum2026.app` → redirect 307 para `www`)  
**Supabase (prod):** `dawndpqwuusfgzshioxs.supabase.co`  
**Método:** revisão de código (`src/`, `supabase/migrations/`, `vercel.json`, CI) + smoke em produção (Playwright, magic link de teste, uma sessão)

Documentos relacionados:

- Checklist operacional Supabase: [`docs/supabase-production-security.md`](../supabase-production-security.md) (atualizar URLs para `meualbum2026.app`)
- Setup Sentry/PostHog: [`docs/setup-sentry-posthog.md`](../setup-sentry-posthog.md)
- Auditoria anterior (parcialmente obsoleta): [`ai/docs/security-performance-audit.md`](../../ai/docs/security-performance-audit.md)

---

## Resumo executivo

O app está **apto para go-live funcional**: auth (magic link + Google), área logada estável, headers de segurança e HSTS em produção, telemetria (PostHog/Sentry) **após consentimento**, LGPD (export, delete account, audit trail) e code-splitting por rota.

Itens que **não bloqueiam** o lançamento mas devem entrar no roadmap imediato:

1. **Supabase Auth — Redirect URLs** alinhadas ao domínio canônico (`www.meualbum2026.app`)
2. ~~**RLS** em `user_challenge_completions`~~ → migration `20260516_0001` (aplicar em prod)
3. **Limites** em `adjust_sticker` e no import CSV (`replaceAllQuantities`)
4. **Performance:** cache do catálogo estático + lazy-load do bundle Sentry antes do consent

---

## O que já melhorou (vs. auditoria 2026-05-13)

| Tema | Antes | Agora |
|------|--------|--------|
| CSP | `Content-Security-Policy-Report-Only` | **Enforced** em `vercel.json` |
| Bundle inicial | Monolito ~436 KB | **`React.lazy`** por rota/página |
| Cache de assets | Implícito Vercel | **`Cache-Control: immutable`** em `/assets/*` |
| Observabilidade | Nenhuma | Sentry + PostHog + `AppErrorBoundary` |
| Testes / CI | Sem testes | **40 testes Vitest** + `npm run test:ci` no workflow |
| LGPD backend | Parcial | `delete_my_account`, `audit_events`, `reset_my_album` |
| HSTS (domínio custom) | Ausente no doc | **Presente** em `www.meualbum2026.app` (`max-age=63072000`) |

---

## Verificação em produção (2026-05-15)

### Headers (`www.meualbum2026.app`)

| Header | Status |
|--------|--------|
| `Strict-Transport-Security` | ✅ `max-age=63072000` |
| `Content-Security-Policy` | ✅ Enforced (ver `vercel.json`) |
| `X-Content-Type-Options: nosniff` | ✅ |
| `Referrer-Policy: strict-origin-when-cross-origin` | ✅ |
| `X-Frame-Options: SAMEORIGIN` | ✅ |
| `Permissions-Policy` (camera self) | ✅ |

### Auth (magic link)

- Link válido redireciona para `https://www.meualbum2026.app/#` com sessão ativa (`auth/v1/user` → 200).
- Link expirado/usado retorna `#error=otp_expired` (comportamento esperado).
- Código usa `redirectTo: window.location.origin` — **segurança depende do allow-list no painel Supabase**.

### Rotas autenticadas (smoke)

| Rota | ~Tempo (networkidle) | Resultado |
|------|----------------------|-----------|
| `/dashboard` | ~1,8s | OK — progresso álbum |
| `/album` | ~1,6s | OK — sidebar + grid |
| `/settings` | ~1,4s | OK — conta, LGPD |
| `/swaps` | ~1,2s | OK |
| `/challenges` | ~1,6s | OK |
| `/missing` | ~1,2s | OK |

Sem error boundary, sem console errors na sessão testada.

### Telemetria

| Ferramenta | Antes do consent | Após “Aceitar” analytics |
|------------|------------------|-------------------------|
| Vercel Analytics | Presente em rotas anônimas (landing/login/guest) | Presente quando `consent === 'granted'` na área logada |
| Sentry (chunk JS) | **Download** ~155 KB (`sentry-*.js`) no idle boot | Envio bloqueado até consent (`beforeSend` → null) |
| PostHog | Não carrega | ✅ `us.i.posthog.com`, flags, web-vitals, autocapture |

### Performance observada

- Landing `/`: chunk principal ~80 KB + lazy `LandingPage` ~5 KB.
- **Problema:** a cada navegação entre tabs autenticadas, o app refaz:
  - `GET /rest/v1/teams?select=*`
  - `GET /rest/v1/stickers_catalog?select=*` (~994 linhas, estático)
  - `GET /rest/v1/user_stickers?...`
- Guest `/album`: carrega Supabase (~52 KB) + Sentry (~155 KB) sem login.

---

## Achados detalhados

### Segurança

#### SEC-01 — Redirect URLs do Supabase Auth (painel)

**Severidade:** Alta (config)  
**Evidência:** `src/hooks/useAuth.ts` — `emailRedirectTo` / OAuth `redirectTo` = `window.location.origin`  
**Risco:** wildcard ou preview não controlado no painel → roubo de token OAuth / magic link  
**Ação:** ver [Instruções para o time — Supabase Auth URLs](#instruções-para-o-time--supabase-auth-urls) e [`docs/supabase-production-security.md`](../supabase-production-security.md)

#### SEC-02 — CSP com `'unsafe-inline'` (script + style)

**Severidade:** Média  
**Evidência:** `vercel.json` — `script-src 'self' 'unsafe-inline' ...`  
**Risco:** XSS refletido/armazenado tem superfície maior  
**Mitigação MVP:** sem UGC HTML; aceitável documentado para Vite/React  
**Ação futura:** nonces/hashes no build; remover `cdn.jsdelivr.net` de `worker-src` se OCR não lançar

#### SEC-03 — `user_challenge_completions` SELECT global

**Severidade:** Alta  
**Evidência:** `supabase/migrations/20260513_0003_challenge_completions.sql` — policy `auth.role() = 'authenticated'`  
**Risco:** qualquer user logado lista `(user_id, challenge_id, completed_at)` de todos via PostgREST  
**Fix:** `using (auth.uid() = user_id)`; agregados só via view/RPC sem PII

#### SEC-04 — `adjust_sticker` sem teto / rate limit

**Severidade:** Média  
**Evidência:** `adjust_sticker(p_sticker_id, p_delta int)` — `p_delta` arbitrário  
**Risco:** spam de linhas, quantidades absurdas, custo DB  
**Fix:** clamp `p_delta ∈ {-1,1}`, `quantity <= 99`, opcional limite de linhas/user

#### SEC-05 — Import CSV contorna RPC (`replaceAllQuantities`)

**Severidade:** Média  
**Evidência:** `src/state/StickersProvider.tsx` — delete + insert direto em `user_stickers`  
**Risco:** mesmo que SEC-04 via import malicioso  
**Fix:** RPC `import_my_album` com validação + caps

#### SEC-06 — View `challenge_completion_rates`

**Severidade:** Baixa  
**Evidência:** view sem `security_invoker`; agregados sem `user_id`  
**Ação:** corrigir junto com SEC-03

#### SEC-07 — Catálogo legível por `anon`

**Severidade:** Info (intencional)  
**Evidência:** `20260515_0001_catalog_anon_read.sql` — guest `/album`  
**Nota:** apenas dados públicos do catálogo; `user_stickers` permanece protegido

#### SEC-08 — Vercel Analytics antes do consent (anônimos)

**Severidade:** Média (LGPD)  
**Evidência:** `App.tsx`, `AppAuthGate.tsx` — `<Analytics />` em landing/login/guest  
**Ação:** banner para visitantes ou desligar analytics até opt-in (decisão jurídica)

#### SEC-09 — CSV formula injection

**Severidade:** Baixa  
**Evidência:** `src/lib/albumCsv.ts` — labels quoted, sem prefixo `=` escape  
**Risco:** baixo (catálogo curado)

#### SEC-10 — `window.open` sem `noopener`

**Severidade:** Baixa  
**Evidência:** `StickerShareActions.tsx`, `ChallengeCompletedModal.tsx`

#### SEC-11 — Dependências (dev)

**Severidade:** Baixa (dev-only)  
**Evidência:** `npm audit` — vite/esbuild (dev server mitigado com `host: 127.0.0.1`), playwright SSL em CI  
**Prod:** 0 vulnerabilidades reportadas com `--omit=dev`

#### SEC-12 — Headers opcionais ausentes

**Severidade:** Baixa  
**Nota:** `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy` não configurados

### Performance

#### PERF-01 — Refetch do catálogo a cada troca de rota

**Severidade:** Alta (UX mobile / custo)  
**Evidência:** smoke prod — 3 requests Supabase repetidos em `/dashboard`, `/album`, `/settings`, etc.  
**Fix:** cache em memória + version stamp; SWR; ou persistir catálogo em IndexedDB; só refetch `user_stickers` + realtime

#### PERF-02 — Bundle Sentry no boot (~155 KB)

**Severidade:** Média  
**Evidência:** `src/main.tsx` — `requestIdleCallback` → `initSentryClient()`; chunk baixado em landing/guest  
**Fix:** dynamic import de `./lib/sentry` apenas após `grantSentryConsent`

#### PERF-03 — `StickersProvider.adjust` recria callback com `state.quantities`

**Severidade:** Média  
**Evidência:** `StickersProvider.tsx` deps `[..., state.quantities, ...]` → re-render em cascata  
**Fix:** `useRef` para snapshot de quantities no handler

#### PERF-04 — Sem `preconnect` Supabase

**Severidade:** Baixa  
**Evidência:** `index.html` — só preconnect Google Fonts  
**Fix:** `<link rel="preconnect" href="https://dawndpqwuusfgzshioxs.supabase.co" crossorigin />`

#### PERF-05 — Sem `manualChunks` explícito

**Severidade:** Baixa  
**Fix:** separar `react`, `@supabase/supabase-js`, `posthog-js` em `vite.config.js`

#### PERF-06 — Dead code Scanner / Tesseract

**Severidade:** Baixa (dívida)  
**Evidência:** `ScannerPage`, `useOCR`, deps `tesseract.js` / `react-webcam`; view `scanner` em `AuthenticatedApp` sem `<Route>`  
**Fix:** remover ou religar rota com `React.lazy`

#### PERF-07 — PWA precache amplo

**Severidade:** Baixa  
**Evidência:** `vite.config.js` — `globPatterns: ['**/*.{js,css,...}']`  
**Ação:** monitorar tamanho do SW após releases

### Usabilidade

#### UX-01 — Rota `/scanner` órfã

**Severidade:** Média  
**Evidência:** `AuthenticatedApp` referencia view `scanner`; `AuthenticatedRoutes` não define rota  
**Fix:** remover referência ou adicionar `<Route path="/scanner" ...>`

#### UX-02 — Error boundary só em português

**Severidade:** Baixa  
**Evidência:** `AppErrorBoundary.tsx` — texto fixo “Algo deu errado”

#### UX-03 — E2E não bloqueia merge

**Severidade:** Info  
**Evidência:** `.github/workflows/e2e.yml` — `continue-on-error: true`

#### UX-04 — Conta vazia / estados zero

**Severidade:** Info  
**Smoke:** swaps “0 stickers”, missing alto — comportamento esperado, não bug

### Observabilidade / Ops

#### OPS-01 — CI sem `npm audit` gate

**Severidade:** Baixa  
**Evidência:** `.github/workflows/check.yml`

#### OPS-02 — Domínio legado na documentação

**Severidade:** Info  
**Evidência:** `docs/supabase-production-security.md` cita `copado26web.vercel.app`; prod é `meualbum2026.app`

#### OPS-03 — Checklist painéis (não validado automaticamente)

Ver seções [Vercel](#vercel), [Supabase](#supabase), [Sentry](#sentry), [PostHog](#posthog) abaixo.

---

## Checklists de ferramentas (validação manual)

### Vercel

- [ ] Domínio canônico: `www.meualbum2026.app` (apex → www)
- [ ] `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` em Production (+ Preview se necessário)
- [ ] `VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST` em Production
- [ ] `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` apenas no **Build**
- [ ] Web Analytics habilitado
- [ ] Redeploy após alterar env vars

### Supabase

- [ ] Migrations aplicadas até `20260515_0003_delete_my_account.sql`
- [ ] **Site URL** = `https://www.meualbum2026.app`
- [ ] **Redirect URLs** — lista explícita (sem wildcard perigoso) — ver instruções abaixo
- [ ] Magic link + Google OAuth habilitados
- [ ] Rate limits / CAPTCHA conforme tráfego
- [ ] RLS ON em todas as tabelas com dados de usuário
- [ ] `service_role` nunca em `VITE_*` nem no browser

### Sentry

- [ ] Projeto `meualbum2026` recebe issues de `environment: production`
- [ ] Source maps com release = `VERCEL_GIT_COMMIT_SHA`
- [ ] Alertas configurados (Slack/email)
- [ ] Confirmar que PII não aparece (sanitizer em `src/lib/sentry/sanitize.ts`)

### PostHog

- [ ] Host US: `https://us.i.posthog.com` (ou EU se decisão LGPD)
- [ ] `person_profiles: identified_only` (código já faz)
- [ ] Session replay: desligado ou só pós-consent se ativar depois
- [ ] Feature flags documentadas no código (`FeatureFlag` em telemetry)

---

## Instruções para o time — Supabase Auth URLs

Texto pronto para enviar ao colega responsável pelo painel Supabase (copiar seção abaixo ou o bloco no final deste documento).

**Contexto:** o app envia `redirectTo` / `emailRedirectTo` como `window.location.origin`. O Supabase só aceita redirects que estão na allow-list. Produção usa **`https://www.meualbum2026.app`** (com `www`).

**Passos:**

1. Abrir [Auth → URL Configuration](https://supabase.com/dashboard/project/dawndpqwuusfgzshioxs/auth/url-configuration) (projeto `dawndpqwuusfgzshioxs`).
2. **Site URL:** `https://www.meualbum2026.app`
3. **Redirect URLs** — manter apenas entradas explícitas, uma por linha:
   ```
   https://www.meualbum2026.app/**
   https://meualbum2026.app/**
   http://localhost:5173/**
   ```
   - A linha com `meualbum2026.app` (sem www) cobre o redirect 307 do apex.
   - `http://localhost:5173/**` só se a equipa desenvolve localmente contra este projeto; caso contrário, remover.
4. **Remover** entradas amplas ou obsoletas, por exemplo:
   - `https://copado26web.vercel.app/**`
   - `https://copado26web.app/**`
   - `https://*.vercel.app/**` (wildcard de preview — só manter se houver política documentada de previews)
5. Salvar e testar:
   - Pedir magic link com redirect explícito:  
     `redirect_to=https://www.meualbum2026.app`
   - Confirmar login e que a URL final não contém `#error=access_denied`.
6. Atualizar [`docs/supabase-production-security.md`](../supabase-production-security.md) com o domínio canônico novo (substituir referências a `copado26web.vercel.app`).

**OAuth Google:** em [Auth → Providers → Google](https://supabase.com/dashboard/project/dawndpqwuusfgzshioxs/auth/providers), confirmar que **Authorized redirect URIs** no Google Cloud Console incluem o callback do Supabase (`https://dawndpqwuusfgzshioxs.supabase.co/auth/v1/callback`) — isso é independente do `redirect_to` do app.

---

## Backlog por especialidade

IDs estáveis para issues/PRs. Severidade: **C** crítico · **A** alto · **M** médio · **B** baixo · **I** info.

### Segurança

| ID | Sev | Título | Esforço |
|----|-----|--------|---------|
| SEC-01 | A | Alinhar Supabase Site URL + Redirect URLs | 15 min (painel) |
| SEC-03 | A | RLS `user_challenge_completions` + view agregada | 1–2 h |
| SEC-04 | M | Clamp / validação `adjust_sticker` | 1 h |
| SEC-05 | M | RPC import álbum com limites | 2–3 h |
| SEC-02 | M | End sharden CSP (nonces; tirar jsdelivr) | Alto |
| SEC-08 | M | Analytics anônimos vs LGPD | 1–2 h |
| SEC-06 | B | `security_invoker` na view de rates | 30 min |
| SEC-09 | B | Escape CSV formula | 30 min |
| SEC-10 | B | `noopener` em `window.open` | 15 min |
| SEC-12 | B | COOP/CORP headers | 30 min |
| SEC-11 | B | Plano upgrade Vite 8 / playwright | Backlog |

### Performance

| ID | Sev | Título | Esforço |
|----|-----|--------|---------|
| PERF-01 | A | Cache catálogo (evitar refetch por rota) | 3–6 h |
| PERF-02 | M | Lazy-load Sentry após consent | 1–2 h |
| PERF-03 | M | Otimizar deps `StickersProvider.adjust` | 2–4 h |
| PERF-04 | B | `preconnect` Supabase em `index.html` | 15 min |
| PERF-05 | B | `manualChunks` no Vite | 1 h |
| PERF-06 | B | Remover ou restaurar Scanner/OCR | 1–4 h |
| PERF-07 | B | Revisar escopo PWA precache | 1 h |

### Usabilidade

| ID | Sev | Título | Esforço |
|----|-----|--------|---------|
| UX-01 | M | Resolver rota `/scanner` órfã | 30 min – 2 h |
| UX-02 | B | i18n no `AppErrorBoundary` | 30 min |
| UX-03 | I | Tornar E2E blocking quando estável | 1 h |

### Observabilidade / Ops

| ID | Sev | Título | Esforço |
|----|-----|--------|---------|
| OPS-02 | I | Atualizar doc URLs em `supabase-production-security.md` | 15 min |
| OPS-01 | B | `npm audit` no CI (advisory) | 30 min |
| OPS-03 | I | Checklist trimestral painéis | Recorrente |

---

## Ordem de execução sugerida

### Segurança (especialista)

1. **SEC-01** — Redirect URLs (bloqueante de config, 15 min)  
2. **SEC-03** + **SEC-06** — RLS completions (antes de marketing público)  
3. **SEC-04** — clamp RPC  
4. **SEC-05** — import seguro  
5. **SEC-08** — decisão jurídica + implementação analytics anônimos  
6. **SEC-02**, **SEC-09**, **SEC-10**, **SEC-12** — hardening incremental  
7. **SEC-11** — upgrade toolchain (sprint dedicado)

### Performance (especialista)

1. **PERF-01** — cache catálogo (maior ganho percebido)  
2. **PERF-02** — Sentry lazy (ganho em landing/guest)  
3. **PERF-04** + **PERF-05** — quick wins  
4. **PERF-03** — hot path provider (se métricas mostrarem jank)  
5. **PERF-06**, **PERF-07** — dívida / manutenção

### Usabilidade (especialista)

1. **UX-01** — scanner órfão  
2. **UX-02** — i18n errors  
3. **UX-03** — CI E2E quando suite estável

### Ops

1. **OPS-02** — docs  
2. **OPS-01** — audit no CI  
3. **OPS-03** — revisão trimestral

---

## Ordem global recomendada (cross-funcional)

Fases pensadas para **go-live seguro** sem atrasar demais o lançamento.

### Fase 0 — Antes ou no dia do go-live (horas)

| # | ID | Responsável típico |
|---|-----|-------------------|
| 1 | SEC-01 | DevOps / dono Supabase |
| 2 | OPS-02 | Qualquer dev |
| 3 | OPS-03 (smoke painéis) | Tech lead |

### Fase 1 — Semana 1 pós go-live (dias)

| # | ID | Notas |
|---|-----|-------|
| 4 | SEC-03, SEC-06 | Dado user-user leak |
| 5 | SEC-04, SEC-05 | Abuse / custo |
| 6 | PERF-01 | Latência tabs + egress Supabase |
| 7 | PERF-02 | Mobile first paint |

### Fase 2 — Semana 2–3 (melhoria contínua)

| # | ID |
|---|-----|
| 8 | PERF-03, PERF-04, PERF-05 |
| 9 | SEC-08 |
| 10 | UX-01, UX-02 |

### Fase 3 — Backlog (quando houver capacidade)

| # | ID |
|---|-----|
| 11 | SEC-02, SEC-09, SEC-10, SEC-12 |
| 12 | PERF-06, PERF-07 |
| 13 | SEC-11, UX-03, OPS-01 |

---

## Registro de validação em produção

| Check | Data | Resultado |
|-------|------|-----------|
| Headers segurança | 2026-05-15 | ✅ |
| Magic link auth | 2026-05-15 | ✅ (link one-time) |
| Rotas autenticadas | 2026-05-15 | ✅ |
| PostHog pós-consent | 2026-05-15 | ✅ |
| Export CSV / delete account | — | Não testado nesta sessão |
| RLS completions (API direta) | 2026-05-16 | ✅ migration `20260516_0001_challenge_completions_rls_tighten.sql` (aplicar em prod) |

---

## Apêndice — Texto para o colega (Supabase redirects)

Copiar e colar:

---

**Assunto: Ajustar Redirect URLs do Supabase (Meu Álbum 2026)**

Oi! Precisamos alinhar as URLs de auth do projeto Supabase **`dawndpqwuusfgzshioxs`** com o domínio de produção.

O app usa `window.location.origin` no magic link e no Google OAuth. Se o redirect não estiver na allow-list, o login falha ou cai em domínio errado.

**O que fazer**

1. Abrir: https://supabase.com/dashboard/project/dawndpqwuusfgzshioxs/auth/url-configuration  
2. **Site URL:** `https://www.meualbum2026.app`  
3. **Redirect URLs** (substituir lista por estas linhas, salvo combinar previews Vercel à parte):

   ```
   https://www.meualbum2026.app/**
   https://meualbum2026.app/**
   http://localhost:5173/**
   ```

4. **Remover** URLs antigas se ainda existirem: `copado26web.vercel.app`, `copado26web.app`, wildcards `https://*.vercel.app/**` (a menos que a gente use previews com política explícita).

5. **Testar:** enviar magic link para um email de teste com link apontando para  
   `redirect_to=https://www.meualbum2026.app`  
   — deve logar sem `#error=access_denied` na URL.

6. Atualizar o checklist em `docs/supabase-production-security.md` com `meualbum2026.app`.

**Google OAuth:** no Google Cloud Console, o redirect do Supabase continua sendo  
`https://dawndpqwuusfgzshioxs.supabase.co/auth/v1/callback` — não mudar isso; só a lista acima no Supabase.

Obrigado!

---

*Fim do documento.*
