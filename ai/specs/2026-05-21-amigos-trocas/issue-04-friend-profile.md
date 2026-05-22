## Contexto

Spec completo em [`ai/specs/2026-05-21-amigos-trocas/`](../ai/specs/2026-05-21-amigos-trocas/).

**Slice 4 de 5** da feature Amigos & Sugestão de Trocas. Cria página de perfil de amigo (`/u/:nickname`), RPC `get_friend_profile` que respeita visibility, e valida end-to-end o setting de visibilidade introduzido em #187.

**Depende de:** #187, #188. **Pode rodar em paralelo com #189.**

## Decisões fechadas

- **Visibility configurável** (`public|friends|private`), setting já existe do #187; este slice valida E2E.
- **Cross-user read de `user_stickers`** só via RPC `SECURITY DEFINER` que valida amizade + visibility. **A RLS de `user_stickers` permanece inalterada** (continua `auth.uid() = user_id`).
- **Rota `/u/:nickname`:** pública pra visibility=public (acessível sem login), requer amizade pra visibility=friends, 404 pra private.
- **Avatar:** componente do #187 (iniciais coloridas).
- **Reuso de grids do álbum:** extrair componente puro se ainda acoplado a estado de "minha coleção" (avaliar `src/pages/AlbumPage.tsx`).

## Escopo

**DB (nova migration):**
- RPC `get_friend_profile(p_user_id uuid)` — `SECURITY DEFINER`, `search_path = public, pg_temp`:
  1. Lê `collection_visibility` do `p_user_id`.
  2. Se `private`: retorna profile sem stickers (ou erro `not_visible`).
  3. Se `friends`: valida `auth.uid()` é amigo via `friendships`; se não, retorna profile sem stickers.
  4. Se `public`: retorna profile + stickers sem checar amizade.
  5. Retorna `{ profile, stickers (sticker_id, quantity) | null, visibility }`.
- Grant `execute to authenticated`, `revoke from public`.
- Versão `get_public_friend_profile(p_nickname text)` pra rota pública (não autenticada) que só funciona pra `visibility = public`.

**Frontend:**
- `src/state/friends/useFriendProfile.ts` hook (chama RPC apropriado).
- Route `/u/:nickname` em router (pública). Resolver nickname → user_id via `get_public_profile` (do #187), depois chamar `get_friend_profile`.
- `src/pages/FriendProfilePage.tsx`:
  - Header: `Avatar` + display_name + `@nickname` + progresso (% completo se stickers visíveis).
  - Se stickers visíveis: grids "Tem", "Falta", "Repetidas" reusando componentes do álbum.
  - Se stickers escondidos (private ou não-amigo em friends): mensagem "Esta coleção é privada".
- Extrair grid puro se necessário (componente que recebe `stickers: { sticker_id, quantity }[]` em prop).

**Telemetria (em `src/lib/telemetry/events.ts`):**
- `friend_profile_viewed` (prop `visibility`, sem PII).
- Gated em consent.

**i18n:** 3 locales.

## Acceptance criteria

- [ ] Acessar `/u/:nickname` de amigo com `visibility=friends` mostra coleção.
- [ ] Acessar `/u/:nickname` de não-amigo com `visibility=friends` mostra perfil mas esconde coleção.
- [ ] Acessar `/u/:nickname` com `visibility=private` mostra mensagem "privada" mesmo sendo amigo? Decidir: NO, private esconde de TODOS incluindo amigos (consistência). ⇒ Private esconde sempre.
- [ ] Acessar `/u/:nickname` com `visibility=public` mostra coleção mesmo sem login.
- [ ] Mudar visibility em Settings reflete imediatamente (cache invalidation).
- [ ] RLS direto em `user_stickers` continua bloqueado pra outros users (validar via SQL editor).
- [ ] Progresso % calculado corretamente.
- [ ] Copies em pt-BR, en, es.

## Personas obrigatórias

- `supabase-security-reviewer` (RPCs são a parte crítica — visibility check, distinção autenticada vs pública).
- `frontend-product-engineer` (extração do grid + reuso).
- `qa-release-reviewer` (E2E cobrindo as 3 combinações de visibility × amizade).

## Verificação

- `npm run ai:harness -- --run` clean.
- `npm run typecheck`, `npm run test:ci`, `npm run build` pass.
- E2E `e2e/authenticated/visibility.spec.ts` cobrindo as 3 transições (public → friends → private).
- E2E `e2e/public/public-profile.spec.ts` validando perfil público sem login.
- Manual: SQL editor → tentar `select * from user_stickers where user_id != auth.uid()` com role anon → deve falhar.

## Fora de escopo

- Sugestão de trocas (próximo slice #191).
- Avatar real (post-MVP).
- Compartilhar link de perfil via WhatsApp/share API → pode entrar como tarefa pequena se trivial, senão post-MVP.
