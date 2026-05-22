## Contexto

Spec completo em [`ai/specs/2026-05-21-amigos-trocas/`](../ai/specs/2026-05-21-amigos-trocas/) (`spec.md`, `plan.md`, `tasks.md`).

Esta é a **Slice 1 de 5** da feature de Amigos & Sugestão de Trocas. Estabelece a fundação: tabela de `profiles`, RPC `set_nickname`, modal de onboarding, banner dismissível, componente `Avatar` (iniciais coloridas) e seção "Perfil" no Settings. **Sem amigos ainda** — slice 2 traz o lifecycle.

Hoje o app não tem nenhuma noção de perfil persistido — só `auth.users` do Supabase, lido em `src/hooks/useAuth.ts:9-122`. Essa issue cria a primeira camada social.

## Decisões fechadas

- Nickname: `[a-z0-9_]{3,20}`, case-insensitive único, **livre pra trocar** (sem cooldown).
- Visibilidade da coleção: enum `public|friends|private`, **default `friends`**.
- Avatar: **iniciais coloridas** (cor derivada de hash de `user_id`). Upload real fica pra v1.1.
- Onboarding: **banner dismissível** no topo do app pra usuários sem nickname. Modal soft-blocking só ao tentar acessar `/friends` (essa rota chega no slice 2).
- Nicknames reservados (declarar na migration): marca (`panini, fifa, fwc, fwc26, copa, copa26, mundial, worldcup, wc2026, meualbum, meu_album, album, sticker, figurinha`) + sistema (`admin, administrator, support, suporte, help, ajuda, root, system, api, www, ftp, mail, email, anonymous, anonimo, guest, hidden, null, undefined, none, deleted`) + funções (`moderator, moderador, mod, bot, official, oficial, staff, equipe, team, owner, dono`) + genéricos (`me, you, voce, eu, friend, amigo, user, usuario`).

## Escopo

**DB (`supabase/migrations/<ts>_create_profiles.sql`):**
- Tabela `profiles` (PK `user_id`, `nickname citext unique`, `display_name`, `avatar_url` nullable, `collection_visibility` check, `created_at`, `updated_at`).
- RLS: SELECT/INSERT/UPDATE só dono. SELECT público em campos limitados via RPC.
- RPC `set_nickname(p_nickname text)` — `SECURITY DEFINER`, `search_path = public, pg_temp`, valida regex + uniqueness + lista de reservados.
- RPC `get_public_profile(p_nickname text)` — retorna `(user_id, nickname, display_name, avatar_url)` ou null.

**Frontend:**
- `src/state/profile/useProfile.ts` (hook de fetch + mutate via RPC).
- `src/components/friends/NicknameSetupModal.tsx` (form com regex client-side + debounced uniqueness check via RPC).
- `src/components/friends/NicknameBanner.tsx` (top-of-app, dismiss em `localStorage` key `nickname_banner_dismissed_v1`).
- `src/components/friends/Avatar.tsx` (iniciais 1-2 chars do `display_name`, background HSL derivado de hash do `user_id`).
- Integrar banner em `src/AuthenticatedApp.tsx` quando `useProfile()` retorna null e localStorage key ausente.
- Seção "Perfil" em `src/pages/SettingsPage.tsx` (campos: `display_name`, `nickname` editável, `collection_visibility` selector com 3 opções).

**Telemetria (em `src/lib/telemetry/events.ts`):**
- `nickname_set` (props: `length`)
- `nickname_changed` (props: `length`)
- `profile_visibility_changed` (props: `from`, `to`)
- Emitir gated em `syncTelemetryConsent` (`src/lib/telemetry/index.ts:45-96`).

**i18n:**
- Adicionar chaves novas em `src/i18n/locales/{pt-BR,en,es}.json`.

## Acceptance criteria

- [ ] Usuário sem nickname vê banner "Crie seu nickname pra adicionar amigos" no topo, com X pra dismissar.
- [ ] Banner não reaparece após dismiss (controle via localStorage).
- [ ] Settings → seção Perfil renderiza display_name, nickname (editável) e visibility selector.
- [ ] Setar nickname inválido (regex falha) mostra erro client-side antes de chamar RPC.
- [ ] Setar nickname já em uso mostra "este nickname já existe".
- [ ] Setar nickname reservado retorna erro server-side.
- [ ] Avatar renderiza iniciais coloridas; cor é determinística por `user_id`.
- [ ] Eventos novos só disparam com consent `granted` (validar em DevTools network).
- [ ] Copies em pt-BR, en, es.

## Personas obrigatórias

- `supabase-security-reviewer` (migration + RPCs).
- `telemetry-privacy-reviewer` (eventos novos).
- `frontend-product-engineer` (UX do modal + banner).

## Verificação

- `npm run ai:harness -- --run` clean.
- `npm run typecheck`, `npm run test:ci`, `npm run build` pass.
- E2E manual: logar como user sem profile → banner aparece → setar nickname → banner desaparece → trocar nickname em Settings → telemetria emitiu eventos.

## Fora de escopo

- Tabelas `friend_requests` / `friendships` → issue #188.
- `/friends` page, header icon, AddFriendDialog → issues #188 e #189.
- Upload real de avatar → follow-up post-MVP.
- Lookup por email → issue #189.

## Próximos slices

Depois desta: #188 (Friend lifecycle) → #189 (Discovery) → #190 (Friend profile + visibility RPC) → #191 (Trade suggestions).
