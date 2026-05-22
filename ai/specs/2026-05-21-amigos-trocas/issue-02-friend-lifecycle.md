## Contexto

Spec completo em [`ai/specs/2026-05-21-amigos-trocas/`](../ai/specs/2026-05-21-amigos-trocas/).

**Slice 2 de 5** da feature Amigos & Sugestão de Trocas. Cria as tabelas de pedidos e amizades, RPCs do lifecycle (accept/decline/remove), página `/friends` com 3 seções, ícone no Header com badge, e dispara `NicknameSetupModal` ao acessar `/friends` sem perfil.

**Depende de:** #187 (Profiles foundation).

**Bloqueia:** #189, #190, #191.

## Decisões fechadas

- **Entry point:** ícone "Amigos" no Header (NÃO 5ª tab). `TabNav` (`src/components/TabNav.tsx`) permanece em 4 tabs. Badge mostra `count(pendentes) + count(aceitos < 7d)`.
- **Inbox tem 3 seções:** Amigos · Pedidos pendentes · Aceitos recentes (7d).
- **`friendships.initiated_by`:** coluna preenchida pela RPC `accept_friend_request` pra distinguir sender/aceitante na seção "aceitos recentes".
- **Remove friend** é simétrico e silencioso.
- **Sem cap de amigos no MVP** (telemetria de p99 monitora).
- **Rate limit:** 30 pedidos/hora por user, validado server-side.
- **Feature flag PostHog:** `friends_v1` gateia o ícone do header.
- **Pedidos sem dialog ainda:** discovery UI vem no #189. Slice 2 testa o lifecycle seedando pedidos via SQL editor.

## Escopo

**DB (`supabase/migrations/<ts>_create_friendships.sql`):**

```sql
create table friend_requests (
  id          uuid primary key default gen_random_uuid(),
  from_user   uuid not null references auth.users(id) on delete cascade,
  to_user     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (from_user, to_user),
  check (from_user <> to_user)
);

create table friendships (
  user_a       uuid not null references auth.users(id) on delete cascade,
  user_b       uuid not null references auth.users(id) on delete cascade,
  initiated_by uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b),
  check (initiated_by in (user_a, user_b))
);
create index on friendships (user_a, created_at desc);
create index on friendships (user_b, created_at desc);
```

**RLS:**
- `friend_requests`: SELECT `auth.uid() in (from_user, to_user)`. INSERT/DELETE só via RPC.
- `friendships`: SELECT `auth.uid() in (user_a, user_b)`. INSERT só via RPC. DELETE via RPC `remove_friend`.

**RPCs (`SECURITY DEFINER`, `search_path = public, pg_temp`, `revoke execute from public`, `grant execute to authenticated`):**
- `send_friend_request_by_nickname(p_nickname text)` — valida nickname existe, NÃO é o próprio user, ainda não há request/friendship; aplica rate limit (`count(*) from friend_requests where from_user = auth.uid() and created_at > now() - interval '1 hour' < 30`); insere request.
- `accept_friend_request(p_request_id uuid)` — valida `to_user = auth.uid()`; canonicaliza `user_a/user_b`; insere em `friendships` com `initiated_by = from_user`; deleta request.
- `decline_friend_request(p_request_id uuid)` — valida `to_user = auth.uid()`; deleta request.
- `remove_friend(p_other_user uuid)` — deleta linha de `friendships` se `auth.uid()` é participante.

**Frontend:**
- `src/state/friends/useFriends.ts` (lista de amigos via JOIN com `profiles`).
- `src/state/friends/useFriendRequests.ts` (retorna `{ pending, recentlyAccepted }`).
- `src/state/friends/useFriendsBadgeCount.ts` (count agregado para o header).
- `src/components/friends/FriendsHeaderButton.tsx` (ícone + badge).
- `src/components/friends/FriendCard.tsx`.
- `src/components/friends/FriendRequestRow.tsx` (variants: `pending` com botões aceitar/recusar; `accepted` info-only mostrando "X aceitou seu pedido").
- `src/pages/FriendsPage.tsx` (route `/friends`, 3 seções stack vertical).
- Inserir `FriendsHeaderButton` no Header em `src/AuthenticatedApp.tsx` atrás de feature flag `friends_v1`.
- Trigger de `NicknameSetupModal` (do #187) ao montar `/friends` sem perfil.
- Reuso de `src/components/ConfirmModal.tsx:18-79` pra confirmar remoção.

**Telemetria (em `src/lib/telemetry/events.ts`):**
- `friend_request_received` (emit ao fetch retornar pendentes novos vs último visto — persistir cursor em localStorage).
- `friend_request_accepted`, `friend_request_declined`, `friend_removed`.
- Gated em consent.

**i18n:** 3 locales.

## Acceptance criteria

- [ ] Migration aplica sem erros; RLS bloqueia SELECT em `friendships` de user não-participante (testar via SQL editor com role anon).
- [ ] Rate limit funciona: 31º pedido em 1h retorna erro "limite atingido".
- [ ] Ícone "Amigos" aparece no Header com badge correto.
- [ ] Acessar `/friends` sem nickname abre `NicknameSetupModal` (soft-block).
- [ ] Aceitar pedido cria amizade; ambos os usuários veem o outro na lista.
- [ ] Sender vê o aceite na seção "Aceitos recentes" por até 7 dias.
- [ ] Recusar pedido deleta silenciosamente (A não é notificado).
- [ ] Remover amigo é simétrico (some da lista dos dois).
- [ ] Eventos só emitem com consent.
- [ ] Copies em pt-BR, en, es.
- [ ] Feature flag `friends_v1` configurada no PostHog; com flag OFF, ícone não aparece.

## Personas obrigatórias

- `supabase-security-reviewer` (alta criticidade: cross-user reads, rate limit, RPCs `SECURITY DEFINER`).
- `qa-release-reviewer` (E2E com 2 contas).
- `telemetry-privacy-reviewer`.

## Verificação

- `npm run ai:harness -- --run` clean.
- `npm run typecheck`, `npm run test:ci`, `npm run build` pass.
- E2E `e2e/authenticated/friends-lifecycle.spec.ts` (2 contas seeded, pedido criado via SQL editor antes do teste).
- Manual: seedar pedido via SQL editor → B vê inbox → aceita → A vê em "aceitos recentes".

## Fora de escopo

- `AddFriendDialog` + lookup por nickname/email/QR → #189.
- Página de perfil do amigo → #190.
- Sugestão de trocas → #191.
