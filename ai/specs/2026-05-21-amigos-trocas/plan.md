# Plan · Amigos & Sugestão de Trocas

## Existing Context

- **Docs lidos:** `AGENTS.md`, `ai/agents/README.md`, `ai/specs/README.md`, `docs/mvp-quality-and-observability.md` (telemetria), `docs/mvp-activation-retention.md` (taxonomia).
- **Source files lidos (do mapeamento Explore):**
  - `src/hooks/useAuth.ts:9-122` — sessão atual via `session.user`, sem profile DB.
  - `src/AuthenticatedApp.tsx` — app shell com Header + TabNav + Sidebar + main.
  - `src/components/TabNav.tsx:7-30` — 4 tabs hoje (dashboard/album/missing/swaps).
  - `src/components/ConfirmModal.tsx:18-79` — modal padrão (portal, danger variant, loading state).
  - `src/pages/SettingsPage.tsx:20-53` — Account / Consent / Export / Delete sections.
  - `src/lib/telemetry/events.ts:8-45` — catálogo canônico (26 eventos snake_case).
  - `src/lib/telemetry/index.ts:45-96` — `syncTelemetryConsent()` gate LGPD.
  - `src/hooks/useAnalyticsConsent.ts:4-50` — `ConsentState`.
  - `src/lib/tradePayload.ts` — sistema atual de share via URL (continua paralelo, não tocar).
  - `src/i18n/locales/{pt-BR,en,es}.json` — 3 locales.
- **Migrations lidas:** `supabase/migrations/20260512_0001_create_catalog_schema.sql:35-107` — `user_stickers` (PK `(user_id, sticker_id)`, RLS strict, RPC `adjust_sticker(sticker_id, delta)`).
- **Tests lidos:** nenhum diretamente relacionado (greenfield), mas seguir padrão de testes em `src/**/*.test.ts(x)` e `e2e/authenticated/` (perfis privados precisam auth).

## Architecture

### Modelo de dados

```sql
-- profiles: 1:1 com auth.users
create table profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  nickname       citext unique not null,          -- 3-20 chars, [a-z0-9_]
  display_name   text not null,                   -- 1-40 chars, livre
  avatar_url     text,                            -- nullable, v1.1
  collection_visibility text not null default 'friends'
                 check (collection_visibility in ('public','friends','private')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- friend_requests: pedidos pendentes
create table friend_requests (
  id           uuid primary key default gen_random_uuid(),
  from_user    uuid not null references auth.users(id) on delete cascade,
  to_user      uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (from_user, to_user),
  check (from_user <> to_user)
);

-- friendships: amizades aceitas, canonicalizadas (user_a < user_b)
create table friendships (
  user_a       uuid not null references auth.users(id) on delete cascade,
  user_b       uuid not null references auth.users(id) on delete cascade,
  initiated_by uuid not null references auth.users(id) on delete cascade,  -- quem mandou o pedido
  created_at   timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b),
  check (initiated_by in (user_a, user_b))
);

create index on friendships (user_a, created_at desc);
create index on friendships (user_b, created_at desc);
```

Pedidos recusados são **apagados** (sem tabela de histórico) — recusa é silenciosa e usuário pode mandar de novo.

`initiated_by` é usado pelo inbox: o sender vê a amizade em "aceitos recentes" se `initiated_by = me AND created_at > now() - interval '7 days'`. O aceitante vê "novo amigo" via fetch agregado.

### RPCs (`SECURITY DEFINER`, `search_path = public, pg_temp`)

| RPC | Input | Output | Função |
| --- | --- | --- | --- |
| `set_nickname(p_nickname)` | text | profile | cria/atualiza perfil; valida regex/uniq; **sem cooldown** |
| `lookup_by_nickname(p_nickname)` | text | `(user_id, nickname, display_name, avatar_url)` ou null | descoberta pública |
| `send_friend_request_by_email(p_email)` | citext | `{ ok: true }` sempre | anti-enumeration |
| `send_friend_request_by_nickname(p_nickname)` | text | request_id ou erro `not_found` | nickname é público, ok revelar |
| `accept_friend_request(p_request_id)` | uuid | friendship | move pra `friendships`, deleta request |
| `decline_friend_request(p_request_id)` | uuid | void | deleta request silenciosamente |
| `remove_friend(p_other_user)` | uuid | void | deleta linha de `friendships` |
| `get_friend_profile(p_user_id)` | uuid | profile + collection (se visível) | aplica visibility check |
| `suggest_trades(p_friend_user_id)` | uuid | `(they_have_i_need[], i_have_they_need[])` | join de `user_stickers` server-side |

### RLS (resumo — detalhe na migration)

- `profiles`:
  - SELECT: público em campos limitados via RPC `get_public_profile(nickname)`; SELECT direto na tabela só pelo dono.
  - INSERT/UPDATE: só dono.
- `friend_requests`:
  - SELECT: `auth.uid() in (from_user, to_user)`.
  - INSERT/DELETE: via RPC (não permitir direto).
- `friendships`:
  - SELECT: `auth.uid() in (user_a, user_b)`.
  - INSERT: só via RPC `accept_friend_request`.
  - DELETE: via RPC `remove_friend`.
- `user_stickers`: **inalterada** (RLS atual `auth.uid() = user_id` continua). Acesso cross-user só via `get_friend_profile` e `suggest_trades`, ambos `SECURITY DEFINER` que validam amizade + visibilidade.

### Frontend

- **Estado:** novo módulo `src/state/friends/` com hooks `useProfile()`, `useFriends()`, `useFriendRequests()` (retorna `{ pending, recentlyAccepted }`), `useFriendProfile(userId)`, `useTradeSuggestions(userId)`, `useFriendsBadgeCount()`. Padrão de fetching: verificar se o repo já usa React Query/SWR ou padrão manual em `src/state/` antes do PR1 — manter consistência.
- **Roteamento:** rota `/friends` (página dedicada com lista + inbox) + `/u/:nickname` (perfil, público quando visibility=public) + deep link `/friends/add?code=<nickname>`. Sem rota separada `/friends/requests` — inbox é seção da mesma página.
- **Entry point:** ícone "Amigos" no Header (avaliar `src/AuthenticatedApp.tsx` pra localização). Badge mostra `pending + recentlyAccepted(7d)`. **TabNav intocado**.
- **Componentes novos:**
  - `src/components/friends/FriendsHeaderButton.tsx` (ícone + badge)
  - `src/components/friends/FriendCard.tsx`
  - `src/components/friends/FriendRequestRow.tsx` (variant: pending vs accepted)
  - `src/components/friends/NicknameSetupModal.tsx`
  - `src/components/friends/NicknameBanner.tsx` (top-of-app, dismissível via localStorage)
  - `src/components/friends/AddFriendDialog.tsx` (3 tabs: nickname / email / QR)
  - `src/components/friends/QRScanner.tsx` + `QRGenerator.tsx`
  - `src/components/friends/Avatar.tsx` (iniciais coloridas; cor derivada de hash do user_id)
  - `src/components/friends/TradeSuggestionList.tsx`
  - `src/pages/FriendsPage.tsx`, `src/pages/FriendProfilePage.tsx`
- **Reuso:** grids de figurinhas existentes do álbum (extrair componente puro se ainda acoplado a estado de "minha" coleção — avaliar no slice 4).
- **/swaps:** **não alterado**. Trade suggestions vivem apenas em `FriendProfilePage`.

## Implementation Slices

Cada slice = 1 PR/issue. Cada PR é mergeável sozinho (com feature flag se necessário) e entrega valor parcial.

### Slice 1 — Profiles foundation
- Migration `profiles` + RLS + RPC `set_nickname`, `get_public_profile`.
- Lista de nicknames reservados na migration.
- Hook `useProfile()`.
- `NicknameBanner` no topo do `AuthenticatedApp` quando perfil ausente (dismiss em localStorage `nickname_banner_dismissed_v1`).
- `NicknameSetupModal` disparável manualmente (slice 2 usa quando user tenta entrar em `/friends`).
- Seção "Perfil" em `SettingsPage` (nickname, display_name, visibility selector).
- Componente `Avatar.tsx` (iniciais coloridas).
- Telemetria: `nickname_set`, `nickname_changed`, `profile_visibility_changed`.
- i18n: copies em pt-BR/en/es.
- **Sem amigos ainda.** Entrega: usuários têm perfil + visibility.

### Slice 2 — Friend lifecycle (sem descoberta UI)
- Migrations `friend_requests` + `friendships` (com `initiated_by`) + RLS.
- RPCs `send_friend_request_by_nickname` (usada manualmente via SQL editor/console pra seedar pedidos no inbox enquanto slice 3 não chega), `accept_friend_request`, `decline_friend_request`, `remove_friend`.
- Hooks `useFriends()`, `useFriendRequests()` (retorna `{ pending, recentlyAccepted }`), `useFriendsBadgeCount()`.
- `FriendsHeaderButton` no Header (ícone + badge agregado).
- Página `/friends` com 3 seções: "Amigos" (lista + remove) + "Pedidos pendentes" (aceitar/recusar) + "Aceitos recentes" (últimos 7d, info-only). Sem botão "adicionar amigo" ainda (vem no slice 3 — placeholder "em breve").
- `NicknameSetupModal` dispara ao acessar `/friends` sem perfil (soft-block dessa rota).
- Telemetria: `friend_request_accepted`, `friend_request_declined`, `friend_removed`, `friend_request_received` (emit ao fetch retornar pendentes novos vs último visto).
- i18n.
- Rate limit definido (sugestão: 30 pedidos/hora por user, validado server-side na RPC).

### Slice 3 — Discovery (nickname / email / QR)
- RPC `lookup_by_nickname`, `send_friend_request_by_email` (anti-enumeration, sempre `{ ok: true }`), `send_friend_request_by_nickname` (rate-limited 30/h).
- `AddFriendDialog` com 3 tabs: nickname (search-as-you-type via debounced `lookup_by_nickname`), email (form), QR (gerar próprio + scanner).
- Lib geração: `qrcode.react` (**já no repo**, ver `src/components/TradeQRModal.tsx` e `src/lib/brand/shareFooter.ts` pra padrão).
- Lib scan: `@yudiel/react-qr-scanner` (lazy-loaded só ao abrir aba QR; usa native `BarcodeDetector` quando disponível → ~6kb gz, fallback ZXing → ~25kb gz). Fallback "cole o link" se camera negada.
- Deep link `/friends/add?code=<nickname>` pra cair direto no dialog com pedido pronto.
- Telemetria: `friend_request_sent` (com `discovery_method`), `qr_profile_generated`, `qr_profile_scanned`.
- i18n.

### Slice 4 — Friend profile + collection visibility
- RPC `get_friend_profile(user_id)` que retorna profile + `user_stickers` se visibility permitir.
- Rota `/u/:nickname` (pública pra visibility=public, requer amizade pra friends, 404 pra private).
- `FriendProfilePage`: header com display_name + nickname + progresso (%), grids de "tem / faltam / repetidas".
- Setting de visibility já existe do slice 1 — testar end-to-end aqui.
- Telemetria: `friend_profile_viewed`.
- i18n.

### Slice 5 — Trade suggestions
- RPC `suggest_trades(friend_user_id)` retorna 2 arrays de sticker_ids (`they_have_i_need`, `i_have_they_need`).
- Hook `useTradeSuggestions(userId)`.
- `TradeSuggestionList` no `FriendProfilePage` — seção "Vocês podem trocar" com os 2 grids.
- Empty states bem desenhados (sem matches / coleção do amigo private / coleção própria vazia).
- **`/swaps` permanece intocado** (sistema atual de share via URL continua funcionando em paralelo).
- Telemetria: `trade_suggestion_viewed`, `trade_suggestion_match_count`.
- i18n.

## Risks

| Risk | Mitigation |
| --- | --- |
| RLS cross-user leak (amigo de amigo, ou ex-amigo continua vendo) | Sempre validar amizade dentro do `SECURITY DEFINER`. Persona `supabase-security-reviewer` obrigatória em PR2, PR4, PR5. Testes pgTAP ou RLS test harness se já houver no repo. |
| Email enumeration | RPC `send_friend_request_by_email` retorna sempre `{ ok: true }`. Rate limit por IP/user via Supabase edge ou tabela de attempts. |
| Nickname squatting | Reservar lista mínima de nicknames (admin, suporte, panini, fifa, fwc, copa) na migration. **Sem cooldown** — aceita o risco de identidade móvel; mitigar exibindo display_name + @nickname juntos em todo card. |
| Spam de pedidos / abuso de inbox | Rate limit server-side: 30 pedidos/hora por user (validar na RPC com tabela `friend_request_attempts` ou query agregada em `friend_requests` por janela). |
| Sem cap de amigos pode dar pathological case | Telemetria de `friends_count_p99` por dia. Adicionar cap reactive se p99 > 1000. |
| QR scanner performance/permissão camera | Lazy-load `html5-qrcode` só ao abrir dialog; fallback "cole o link" se câmera negada. |
| Migração soft-blocking nickname pode irritar usuários ativos | Banner top dismissível em vez de modal full-screen pros já-logados; modal só pra novos. |
| Trade suggestion query lenta com muitos amigos × muitas figurinhas | Index em `user_stickers(user_id, sticker_id) where quantity > 0` (já é PK). Query do `suggest_trades` é join de 2 selects de `user_stickers` — testar com 500 stickers × N amigos. |
| Avatar storage abuso | Deferir avatar pra v1.1 (issue separada). MVP usa iniciais coloridas geradas client-side. |
| Realtime de pedidos (B aceitar e A não ver atualizado) | MVP: polling no inbox (refetch ao montar + ao retornar foco). Realtime channel fica pra fase 2. |
| Feature flag pra rollout gradual | Avaliar PostHog feature flag (já há infra) — gate da 5ª tab e do dialog. Cleanup após 100%. |

## Verification Strategy

- **Unit/component:**
  - Reducers/selectors em `src/state/friends/*.test.ts`.
  - `NicknameSetupModal` valida regex/uniq (mock RPC).
  - `TradeSuggestionList` empty states.
- **E2E:**
  - `e2e/authenticated/friends.spec.ts` — fluxo full: A cria nickname, manda pedido pra B (seeded), B aceita, ambos veem coleção, sugestão aparece no `FriendProfilePage`, sender vê em "aceitos recentes".
  - `e2e/authenticated/visibility.spec.ts` — A muda visibility pra private, B deixa de ver coleção.
  - `e2e/public/profile.spec.ts` — `/u/:nickname` de perfil público renderiza sem login.
  - `e2e/authenticated/swaps-untouched.spec.ts` — regressão garantindo que `/swaps` continua funcionando após slices 1-5.
- **Manual:**
  - QR scan no mobile real (não funciona em headless).
  - LGPD: usuário sem consent não emite eventos novos (DevTools network).
- **Observability:**
  - Verificar dashboards PostHog existentes (memory: 5 dashboards). Adicionar 1 novo "Social/Amizades" com funnel: nickname_set → friend_request_sent → friend_request_accepted → friend_profile_viewed → trade_suggestion_viewed.
- **Supabase/security:**
  - Persona `supabase-security-reviewer` obrigatória em cada PR que toca migration/RPC.
  - Checklist manual: `SECURITY DEFINER` + `search_path` set + `revoke execute from public` + `grant execute to authenticated`.
  - Tentar SELECT direto em `friendships` de user terceiro via SQL editor com role anon — deve falhar.

## Rollout Notes

- **Feature flag (PostHog):** `friends_v1` — gate da tab "Amigos", `NicknameSetupModal`, `/u/:nickname`. Lançar 10% → 50% → 100% ao longo de 2 semanas.
- **Ordem de PRs:** 1 → 2 → 3 → 4 → 5. PRs 4 e 5 podem ir em paralelo após 3 (toca arquivos disjuntos).
- **Owner sugestão:** todos pra @rlpereira ou delegação via issues GH (per memory: usuário prefere fatiar em issues pra delegar).
- **Migração de usuários:** banner "Crie seu nickname pra adicionar amigos" no topo do app pra contas pré-existentes. Soft-blocking só pra acessar `/friends`.
- **Cleanup:** flag removida após 30 dias em 100%.
