# Verification · Amigos & Sugestão de Trocas

**Data:** 2026-05-22 · **Owner:** @rlpereira · **Status:** In progress (migrations pendentes)

## Automated gates

| Gate | Command | Result |
| --- | --- | --- |
| TypeScript | `npm run typecheck` | PASS (clean, 2026-05-22) |
| Lint | `npm run lint` | Pending — rodar antes do merge |
| Unit tests | `npm run test:ci` | Pending — Avatar.test.tsx (5/5) passa; demais suites pendentes (issue #192) |
| Build | `npm run build` | Pending — verificar chunk `/friends` lazy split |
| Public E2E | `npm run test:e2e:public` | Pending — validar que guest flow não regrediu |

## Supabase migration review

Revisado por `supabase-security-reviewer` na sessão de implementação (2026-05-21).

Itens críticos confirmados:

- `_are_friends` e `_check_friend_request_rate`: `REVOKE ALL FROM PUBLIC` aplicados.
- Todas as RPCs públicas: `SECURITY DEFINER`, `search_path = public, pg_temp`, granted a `authenticated` (e `anon` onde aplicável: `get_public_profile`).
- `friend_requests` e `friendships`: `with check (false)` / `using (false)` bloqueiam INSERT/DELETE diretos.
- `send_friend_request_by_email`: retorna sempre `{ok:true}` (anti-enumeration). Side-channel de timing aceito e documentado.
- Rate limit: 30 pedidos/hora por user, validado via agg em `friend_requests`.

## Telemetry & privacy review

Revisado por `telemetry-privacy-reviewer` na sessão de 2026-05-22. Resultado: **APROVADO com 1 pendência menor**.

Itens confirmados:
- Todos os 13 novos eventos passam por `telemetry.track()` que já é gated em `syncTelemetryConsent`.
- Nenhum evento carrega PII (sem email, nickname, display_name, ou user_id nos payloads).
- `profile_visibility_changed` emite `{from, to}` com valores enum — seguro.
- `trade_suggestion_match_count` emite counts numéricos — seguro.
- `friend_request_sent` emite `{discovery_method}` com enum — seguro.

Pendência: atualizar `docs/mvp-activation-retention.md` e `docs/mvp-quality-and-observability.md` com a nova taxonomia de eventos (task de rollout, não bloqueante para merge).

## QA release plan

Revisado por `qa-release-reviewer` na sessão de 2026-05-22.

Minimum verification set:

1. `npm run typecheck` — PASS
2. `npm run lint` — rodar antes do merge
3. `npm run test:ci` — Avatar.test.tsx cobre cor determinística + renders básicos
4. `npm run build` — validar chunk lazy de `/friends/add` (alvo: +≤25kb gz)
5. `npm run test:e2e:public` — confirmar guest flow não regrediu (friends gated por FF)
6. Smoke manual com FF habilitada: fluxo nickname → add friend → inbox → perfil → sugestões

Gates não rodados (bloqueados):
- `e2e/authenticated/friends-lifecycle.spec.ts` — não existe ainda (issue #192); requer 2 contas seeded no Supabase test env.
- `e2e/authenticated/visibility.spec.ts` — idem.
- `e2e/public/public-profile.spec.ts` — idem.
- `e2e/authenticated/swaps-untouched.spec.ts` — idem.

Residual risk: cobertura de autenticação/banco zero até issue #192 ser resolvida. Mitigado pela FF `friends_v1` (rollout 10% → 50% → 100%).

## Manual verification checklist

Pré-requisito: migrations aplicadas no Supabase e `friends_v1` habilitada para o user de teste.

- [ ] Usuário sem nickname vê NicknameBanner no topo
- [ ] Fechar banner e reabrir app: banner reaparece (não persiste dismiss antes de criar nickname)
- [ ] Clicar "Criar nickname" navega pra `/friends` com modal soft-blocking
- [ ] Criar nickname com formato inválido (`abc 1`, `ab`, strings reservadas) mostra erro correto
- [ ] Criar nickname válido: evento `nickname_set` aparece no PostHog (com consent ativo)
- [ ] Settings → Perfil público: mudar visibility de `friends` → `private` → `public`; evento `profile_visibility_changed` com `{from, to}` corretos
- [ ] Adicionar amigo por nickname: resultado "não encontrado" e resultado de sucesso
- [ ] Adicionar amigo por email: sempre mostra "pedido enviado se conta existir"
- [ ] QR code: gerar e escanear com outro dispositivo
- [ ] Aceitar pedido pendente: amigo aparece na lista; `friend_request_accepted` emitido
- [ ] Remover amigo: modal de confirmação; `friend_removed` emitido
- [ ] Perfil do amigo: seções Tem / Faltam / Repetidas aparecem com visibilidade `friends` ou `public`
- [ ] Perfil do amigo com visibilidade `private`: mensagem de coleção privada
- [ ] Sugestão de trocas: seção "Vocês podem trocar" aparece quando há matches
- [ ] `/swaps` continua funcionando sem regressão

## Spec gaps documentados (não bloqueantes para merge)

| Gap | Severidade | Status |
| --- | --- | --- |
| G1 — seção "faltam" em FriendProfilePage | Médio | **RESOLVIDO 2026-05-22** |
| G2 — rate_limit_exceeded não mapeado no AddFriendDialog | Baixo | Pendente (follow-up) |
| G3 — TradeSuggestionList não distingue "sem match" vs "própria coleção vazia" | Baixo | Pendente (follow-up) |
| G4 — chips de figurinha são texto simples, não StickerCard components | Baixo | Pendente (follow-up) |
| G5 — qa-release e telemetry-privacy personas | — | **RESOLVIDO 2026-05-22** |

## Rollout plan

1. `friends_v1` em 10% por 3 dias → confirmar funnel no PostHog
2. 50% por 4 dias → validar p99 de `get_friend_profile` e `suggest_trades`
3. 100% → cleanup do flag em ~30 dias
4. Criar dashboard PostHog "Social/Amizades": funnel `nickname_set → friend_request_sent → friend_request_accepted → friend_profile_viewed → trade_suggestion_viewed`

## Residual risk

| Risco | Probabilidade | Mitigação |
| --- | --- | --- |
| RPC `suggest_trades` lenta com muitos amigos | Baixa (MVP < 50 amigos) | Monitorar p95 no rollout; índice em `user_stickers.user_id` já existe |
| Timing side-channel no email lookup | Aceito | Documentado na migration; não revela existência de conta |
| Câmera negada no Safari iOS | Média | Fallback de paste de link implementado |
| Dual-fetch `get_friend_requests` (useFriendsBadgeCount + useFriendRequests) | Baixa | Follow-up: compartilhar o fetch via context |
