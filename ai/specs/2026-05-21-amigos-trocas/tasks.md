# Tasks · Amigos & Sugestão de Trocas

Cada slice abaixo vira **1 issue/PR no GitHub** (per preferência registrada em memory: fatiar em issues pra delegar). Marcar `Closes #N` ao mergear.

## Slice 1 · Profiles foundation

**Issue title:** `feat(friends): profiles table + nickname onboarding + Settings`

- [ ] Migration `supabase/migrations/<ts>_create_profiles.sql` com tabela, RLS, RPCs `set_nickname` (sem cooldown), `get_public_profile`. Lista de nicknames reservados em CTE/array literal: marca (`panini, fifa, fwc, fwc26, copa, copa26, mundial, worldcup, wc2026, meualbum, meu_album, album, sticker, figurinha`) + sistema (`admin, administrator, support, suporte, help, ajuda, root, system, api, www, ftp, mail, email, anonymous, anonimo, guest, hidden, null, undefined, none, deleted`) + funções (`moderator, moderador, mod, bot, official, oficial, staff, equipe, team, owner, dono`) + genéricos (`me, you, voce, eu, friend, amigo, user, usuario`).
- [ ] `src/state/profile/useProfile.ts` (fetch + mutate via RPC).
- [ ] `src/components/friends/NicknameSetupModal.tsx` (regex `^[a-z0-9_]{3,20}$`, debounced uniqueness check).
- [ ] `src/components/friends/NicknameBanner.tsx` no topo do `AuthenticatedApp` quando perfil ausente (dismiss em localStorage `nickname_banner_dismissed_v1`).
- [ ] `src/components/friends/Avatar.tsx` — iniciais coloridas (hash de `user_id` → cor da paleta). **Sem upload no MVP.**
- [ ] Seção "Perfil" em `src/pages/SettingsPage.tsx` — campos display_name, nickname (edit, livre), visibility selector (`public|friends|private`, default `friends`).
- [ ] Telemetria: adicionar `nickname_set`, `nickname_changed`, `profile_visibility_changed` em `src/lib/telemetry/events.ts`. Emitir gated.
- [ ] i18n: chaves novas em `src/i18n/locales/{pt-BR,en,es}.json`.
- [ ] Testes: Vitest pro hook + componente + Avatar (cor determinística).
- [ ] Persona `supabase-security-reviewer` revisou migration.
- [ ] `npm run ai:harness` clean.

## Slice 2 · Friend lifecycle (DB + inbox UI)

**Issue title:** `feat(friends): friend_requests + friendships + inbox UI + header entry`

- [ ] Migration `<ts>_create_friendships.sql` — tabelas `friend_requests`, `friendships` (com `initiated_by` + check), RLS, RPCs `accept_friend_request` (preenche `initiated_by`), `decline_friend_request`, `remove_friend`, `send_friend_request_by_nickname` (rate-limited: 30 pedidos/hora por user, validado via `select count(*) from friend_requests where from_user = auth.uid() and created_at > now() - interval '1 hour'` antes de inserir).
- [ ] `src/components/friends/FriendsHeaderButton.tsx` — ícone + badge `pendentes + aceitos(7d)`. Inserir em `src/AuthenticatedApp.tsx` Header. **TabNav NÃO é alterado.**
- [ ] `src/pages/FriendsPage.tsx` com 3 seções: "Amigos" + "Pedidos pendentes" + "Aceitos recentes (7d)".
- [ ] `src/components/friends/FriendCard.tsx`, `FriendRequestRow.tsx` (variant pending/accepted).
- [ ] Hooks `useFriends()`, `useFriendRequests()` (retorna `{ pending, recentlyAccepted }`), `useFriendsBadgeCount()` em `src/state/friends/`.
- [ ] `NicknameSetupModal` dispara ao acessar `/friends` sem perfil (soft-block dessa rota).
- [ ] Reuso de `ConfirmModal` pra remover amigo.
- [ ] Telemetria: `friend_request_accepted`, `friend_request_declined`, `friend_removed`, `friend_request_received` (diff com último visto, persistido em localStorage).
- [ ] i18n: 3 locales.
- [ ] E2E `e2e/authenticated/friends-lifecycle.spec.ts` (2 contas seeded; seed pedidos via SQL editor antes do slice 3).
- [ ] Persona `supabase-security-reviewer` revisou migration (alto risco: cross-user reads, rate limit).
- [ ] Persona `qa-release-reviewer` revisou plano de teste E2E.
- [ ] Feature flag `friends_v1` (PostHog) gating o ícone do header.

## Slice 3 · Discovery (nickname / email / QR)

**Issue title:** `feat(friends): add friend dialog with nickname, email, and QR discovery`

- [ ] RPCs `lookup_by_nickname`, `send_friend_request_by_email` (sempre retorna `{ ok: true }`, mas internamente cria pedido se conta existir + aplica mesmo rate limit do slice 2).
- [ ] `src/components/friends/AddFriendDialog.tsx` com 3 tabs (nickname com busca debounced 300ms / email form / QR).
- [ ] `QRGenerator.tsx` (lib `qrcode.react`, já no repo — espelhar padrão de `src/components/TradeQRModal.tsx`) — gera QR do próprio deep link `/friends/add?code=<nickname>`.
- [ ] `QRScanner.tsx` (lib `@yudiel/react-qr-scanner` lazy-loaded via `React.lazy`/dynamic import; usa native `BarcodeDetector` quando disponível).
- [ ] Adicionar `@yudiel/react-qr-scanner` em `package.json` (~25kb gz worst case).
- [ ] Deep link handler `/friends/add?code=<nickname>` em router (abre `AddFriendDialog` com nickname pré-preenchido + envia pedido após confirmação).
- [ ] Telemetria: `friend_request_sent` com prop `discovery_method` ∈ {`nickname`,`email`,`qr`}, `qr_profile_generated`, `qr_profile_scanned`.
- [ ] Empty states: nickname não encontrado, email enviado (msg uniforme "se a conta existir, o pedido foi enviado"), camera negada (fallback "cole o link aqui"), rate limit atingido.
- [ ] i18n.
- [ ] Verificar peso do bundle com `npm run build` — diff aceitável: +25kb gz no chunk de `/friends/add` (lazy, não no main).
- [ ] Persona `supabase-security-reviewer` revisou anti-enumeration.
- [ ] Persona `telemetry-privacy-reviewer` revisou eventos.

## Slice 4 · Friend profile + collection visibility

**Issue title:** `feat(friends): friend profile page with collection visibility RPC`

- [ ] RPC `get_friend_profile(user_id)` validando visibility + amizade.
- [ ] Rota `/u/:nickname` em router (pública quando visibility=public).
- [ ] `src/pages/FriendProfilePage.tsx` — header + grids de figurinhas (reusar componentes do álbum atual).
- [ ] Extrair componente puro do grid se ainda acoplado a estado de "minha" coleção (avaliar `src/pages/AlbumPage.tsx` / cards).
- [ ] Verificar setting de visibility do slice 1 end-to-end (mudar pra private esconde, public expõe via link).
- [ ] Telemetria: `friend_profile_viewed`.
- [ ] i18n.
- [ ] E2E `e2e/authenticated/visibility.spec.ts` + `e2e/public/public-profile.spec.ts`.
- [ ] Persona `supabase-security-reviewer` revisou RPC (visibility check é a parte crítica).
- [ ] Persona `frontend-product-engineer` revisou reuso do grid.

## Slice 5 · Trade suggestions

**Issue title:** `feat(friends): trade suggestions RPC and UI on FriendProfilePage`

- [ ] RPC `suggest_trades(friend_user_id)` retornando `(they_have_i_need uuid[], i_have_they_need uuid[])`. Valida amizade + visibility do amigo antes de retornar.
- [ ] Hook `useTradeSuggestions(userId)`.
- [ ] `src/components/friends/TradeSuggestionList.tsx` — seção "Vocês podem trocar" no `FriendProfilePage` com 2 grids lado a lado (responsive: stack em mobile).
- [ ] Empty states: sem matches / coleção do amigo private / própria coleção vazia.
- [ ] **`/swaps` NÃO alterado.** Sistema de share via URL (`src/lib/tradePayload.ts`) segue intocado.
- [ ] Telemetria: `trade_suggestion_viewed`, `trade_suggestion_match_count` (numeric).
- [ ] i18n.
- [ ] Performance: testar `suggest_trades` com 500 stickers × 50 amigos (script em `scripts/` se útil). p95 < 200ms.
- [ ] E2E: passo final do `friends-lifecycle.spec.ts` valida sugestão aparecendo no perfil.
- [ ] E2E `e2e/authenticated/swaps-untouched.spec.ts` confirma que `/swaps` continua funcionando.
- [ ] Persona `supabase-security-reviewer` revisou query.

## Rollout (após slice 5)

- [ ] Feature flag `friends_v1` em 10% por 3 dias → 50% por 4 dias → 100%.
- [ ] Dashboard PostHog "Social/Amizades" criado (funnel nickname_set → request_sent → accepted → profile_viewed → suggestion_viewed).
- [ ] Cleanup do flag 30 dias após 100%.
- [ ] Atualizar `docs/mvp-activation-retention.md` e `docs/mvp-quality-and-observability.md` com a nova taxonomia.

## Review Checklist (por PR)

- [ ] Acceptance criteria do `spec.md` continuam batendo.
- [ ] RLS/RPC auditados por `supabase-security-reviewer`.
- [ ] Telemetria gated em consent (`syncTelemetryConsent`) e sem PII.
- [ ] i18n nas 3 línguas.
- [ ] `npm run ai:harness` + gates recomendados rodados.
- [ ] Working tree só com arquivos do slice.
- [ ] `verification.md` atualizado.

## Open follow-ups (post-MVP)

- **Avatar real** (Supabase Storage bucket público + resize client-side).
- **Realtime** de inbox de pedidos (canal Supabase) — substituir polling.
- **Workflow transacional de troca** (propor → aceitar → marcar entregue) — fase 2.
- **Card agregado em `/swaps`** "Trocas com seus amigos" (decidido fora do MVP pra não regredir).
- **Grupos/comunidades** — fase 3 (user mencionou no kickoff).
- **Notificações push reais** (precisa de PWA push permission flow).
- **Bloqueio/denúncia** — só se virar problema.
- **"Pessoas que talvez você conheça"** — privacy-heavy, requer análise dedicada.
- **Cap reactive de amigos** se telemetria mostrar `friends_count_p99 > 1000`.
