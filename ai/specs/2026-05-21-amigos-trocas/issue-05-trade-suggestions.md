## Contexto

Spec completo em [`ai/specs/2026-05-21-amigos-trocas/`](../ai/specs/2026-05-21-amigos-trocas/).

**Slice 5 de 5** (final) da feature Amigos & Sugestão de Trocas. Adiciona a RPC `suggest_trades` que cruza duplicatas/faltantes entre dois amigos, e renderiza a seção "Vocês podem trocar" no `FriendProfilePage`.

**Depende de:** #187, #188, #190.

## Decisões fechadas

- **Sugestão aparece SÓ no `FriendProfilePage`.** `/swaps` permanece intocado — sistema atual de share via URL (`src/lib/tradePayload.ts`) continua funcionando em paralelo.
- **RPC valida amizade + visibility do amigo** antes de retornar (mesmo padrão do `get_friend_profile` no #190).
- **Performance:** p95 < 200ms com 500 stickers × 50 amigos.
- **Card agregado em `/swaps`** ("Trocas com seus amigos") fica como follow-up post-MVP — deliberadamente fora.

## Escopo

**DB (nova migration):**
- RPC `suggest_trades(p_friend_user_id uuid)` — `SECURITY DEFINER`, `search_path = public, pg_temp`:
  1. Valida `auth.uid()` é amigo de `p_friend_user_id` (via `friendships`).
  2. Valida `collection_visibility` do amigo permite (`public` ou `friends`); se `private`, retorna empty + flag.
  3. Computa:
     - `they_have_i_need`: `sticker_id` onde amigo tem `quantity >= 2` AND eu tenho `quantity = 0` (ou não tenho linha).
     - `i_have_they_need`: `sticker_id` onde eu tenho `quantity >= 2` AND amigo tem `quantity = 0`.
  4. Retorna `(they_have_i_need text[], i_have_they_need text[])`.
- Grant `execute to authenticated`, `revoke from public`.

**Frontend:**
- `src/state/friends/useTradeSuggestions.ts` hook (chama RPC, cacheia por `friend_user_id`).
- `src/components/friends/TradeSuggestionList.tsx`:
  - Seção "Vocês podem trocar" no `FriendProfilePage`.
  - 2 grids lado a lado (responsive: stack em mobile):
    - "Ele tem, você precisa" (clicável → marca como wanted ou abre detalhe)
    - "Você tem, ele precisa"
  - Empty states: "Sem matches por enquanto" / "A coleção dele é privada" / "Sua coleção está vazia".

**Telemetria (em `src/lib/telemetry/events.ts`):**
- `trade_suggestion_viewed` (emit ao montar o componente com dados).
- `trade_suggestion_match_count` (props: `they_have_i_need_count`, `i_have_they_need_count` — numeric).
- Gated em consent.

**i18n:** 3 locales.

## Acceptance criteria

- [ ] RPC retorna apenas sticker_ids onde a condição bate (testar via SQL editor com 2 contas seeded).
- [ ] RPC respeita visibility: amigo com `private` retorna empty.
- [ ] RPC bloqueia chamada pra não-amigo (retorna empty ou erro).
- [ ] Seção aparece no `FriendProfilePage` quando há matches.
- [ ] Empty states corretos pros 3 cenários.
- [ ] Responsivo: stack vertical em < 640px.
- [ ] Performance: query roda em < 200ms com seed de 500 stickers × 50 amigos (script `scripts/seed-friends-perf.ts` opcional).
- [ ] `/swaps` continua funcionando exatamente como antes (regressão zero).
- [ ] Telemetria emite com counts corretos.
- [ ] Copies em pt-BR, en, es.

## Personas obrigatórias

- `supabase-security-reviewer` (validação de amizade + visibility na RPC).
- `qa-release-reviewer` (regressão de `/swaps` é crítica).
- `telemetry-privacy-reviewer` (counts numéricos, sem PII).

## Verificação

- `npm run ai:harness -- --run` clean.
- `npm run typecheck`, `npm run test:ci`, `npm run build` pass.
- E2E `e2e/authenticated/friends-lifecycle.spec.ts` ganha passo final validando sugestão visível.
- E2E **novo:** `e2e/authenticated/swaps-untouched.spec.ts` confirma que `/swaps` continua funcionando após slices 1-5.
- Manual: criar 2 contas com coleções com overlap conhecido → conferir que matches batem.

## Fora de escopo

- Card agregado "Trocas com seus amigos" em `/swaps` (follow-up post-MVP).
- Workflow transacional (propor → aceitar → marcar entregue) (fase 2).
- Notificações push de novo match (post-MVP).
- Filtros/sort na seção de sugestões.

## Rollout (depois deste merge)

- Feature flag `friends_v1` em 10% por 3 dias → 50% por 4 dias → 100%.
- Dashboard PostHog "Social/Amizades" criado (funnel `nickname_set` → `friend_request_sent` → `friend_request_accepted` → `friend_profile_viewed` → `trade_suggestion_viewed`).
- Cleanup do flag 30 dias após 100%.
- Atualizar `docs/mvp-activation-retention.md` e `docs/mvp-quality-and-observability.md` com a nova taxonomia.
