# Spec · Amigos & Sugestão de Trocas

**Data:** 2026-05-21 · **Owner:** @rlpereira · **Status:** Draft

## User problem

Hoje o app rastreia coleção individual e gera links/payloads de troca anônimos (`src/lib/tradePayload.ts`), mas não há noção de "amigo". O colecionador precisa exportar uma lista, mandar pro grupo do WhatsApp, e cruzar manualmente com o que cada amigo tem. Perde-se o gancho mais natural do álbum: **"meu amigo X tem a figurinha que eu preciso"** sem fricção.

Queremos transformar contatos recorrentes (irmão, primo, colega de trabalho) em vínculos persistentes dentro do app, com sugestão automática de trocas baseada nas duplicatas/faltantes de cada lado.

## Target surface

PWA `Meu Álbum 2026`:

- **Novo:** tabela `profiles` (nickname, display_name, avatar opcional, visibilidade da coleção)
- **Novo:** tabelas `friend_requests` e `friendships`
- **Novo:** RPCs `SECURITY DEFINER` para cross-user reads (perfil, coleção visível, sugestão de trocas)
- **Novo:** ícone "Amigos" no Header (`src/AuthenticatedApp.tsx`) que abre `/friends`, com badge contendo `count(pedidos pendentes) + count(aceitos nos últimos 7 dias)`. **TabNav não é alterado** (segue 4 tabs).
- **Novo:** tela de perfil de amigo na rota `/u/:nickname` reusando padrão `ConfirmModal` (`src/components/ConfirmModal.tsx:18-79`) e cards do álbum
- **Settings:** seção em `src/pages/SettingsPage.tsx:20-53` pra setar nickname e visibilidade
- **Telemetria:** novos eventos em `src/lib/telemetry/events.ts` (gated em `useAnalyticsConsent` `src/hooks/useAuth.ts` / `syncTelemetryConsent` `src/lib/telemetry/index.ts:45-96`)
- **i18n:** novas chaves em `src/i18n/locales/{pt-BR,en,es}.json`

## Decisões de produto (travadas)

1. **Vínculo:** simétrico — pedido + aceite. Sem follow assimétrico.
2. **Descoberta:** três caminhos — (a) nickname público, (b) email (sem enumeration), (c) QR code do perfil.
3. **Escopo MVP:** amigos + ver coleção do amigo + sugestão de trocas (lista "vocês podem trocar"). **Sem** chat, **sem** workflow de proposta/aceite de troca in-app.
4. **Privacidade da coleção:** configurável por usuário — `public | friends | private`. **Default = `friends`** para novos perfis (e para usuários existentes na migração).

## Non-goals

- Chat / DM in-app.
- Workflow transacional de troca (propor → aceitar → marcar concluída). Fica pra fase 2.
- Modelo de grupos/clãs/comunidades (apesar de o usuário ter mencionado "comunidades", o MVP é só amizades 1:1; comunidades viram fase 3).
- Recomendação de amigos / "pessoas que você talvez conheça".
- Bloqueio/denúncia/moderação — sem feed público nem chat, risco é baixo o suficiente pra MVP; fica como follow-up se virar problema.
- Notificações push reais. Inbox in-app é suficiente; push fica pra depois.
- Migrar/integrar com o sistema atual de share via URL comprimida (`src/lib/tradePayload.ts`) — ele continua funcionando em paralelo pra não-amigos.

## Acceptance criteria

1. **Onboarding de perfil:** usuário sem nickname vê banner dismissível no topo do app ("Crie seu nickname pra adicionar amigos"). Acessar `/friends` pela 1ª vez abre `NicknameSetupModal` (soft-blocking só nessa rota). Nickname: 3-20 chars `[a-z0-9_]`, case-insensitive único, **livre pra trocar** (sem cooldown).
2. **Pedido de amizade:** A pode enviar pedido por nickname, email ou escaneando QR de B. Email lookup NÃO revela existência de conta (resposta uniforme "pedido enviado se conta existir").
3. **Inbox de pedidos:** B vê 2 seções — "Pendentes" (aceitar/recusar) + "Aceitos recentes" (últimos 7 dias, info-only). Aceitar cria registro em `friendships` com `initiated_by`. Recusar não notifica A. Sender vê o aceite na sua própria seção "aceitos recentes".
4. **Lista de amigos:** ambos veem o outro na lista após aceite. Remover amigo é simétrico e silencioso. **Sem cap de amigos no MVP** (telemetria de p99 pra monitorar).
5. **Visibilidade da coleção:** setting em Settings com 3 opções; default `friends`. RLS/RPC respeita a config — `private` esconde do amigo, `public` permite ver via link `/u/:nickname` mesmo sem amizade.
6. **Perfil de amigo:** ao abrir, mostra progresso (% completo), e — se visibilidade permitir — grids de figurinhas que ele tem / faltam / repetidas, no padrão visual do álbum atual. Avatar = iniciais coloridas (cor derivada do `user_id`); **upload de avatar real fica fora do MVP**.
7. **Sugestão de trocas:** seção "Vocês podem trocar" **no `FriendProfilePage`** lista: `figurinhas que ele tem repetidas e você precisa` e `figurinhas que você tem repetidas e ele precisa`. Empty state explícito quando não há match. **`/swaps` permanece intocado.**
8. **Entry point:** ícone "Amigos" no Header com badge `count(pendentes) + count(aceitos < 7d)`. **TabNav não muda.**
9. **LGPD:** nickname e visibilidade são opt-in informados. Email nunca exibido em nenhum perfil. Eventos novos gated por consent.
10. **i18n:** 100% das copies user-facing em pt-BR, en, es.
11. **RLS auditada:** persona `supabase-security-reviewer` aprovou as policies/RPCs antes do merge.

## Data, Privacy, and Security

- **PII envolvida:**
  - Nickname é PII voluntária (escolha do usuário, pode ser pseudônimo).
  - Display name idem.
  - Email do amigo NUNCA é exibido (lookup-only, server-side).
  - Avatar é opcional, upload no Storage (decidir bucket em plan).
- **Tabelas afetadas:**
  - **Novas:** `profiles`, `friend_requests`, `friendships`
  - **Estendida (lógica, não schema):** acesso de leitura a `user_stickers` via RPC pra amigos (definida em `supabase/migrations/20260512_0001_create_catalog_schema.sql:35-42`)
- **RLS/grants:**
  - `profiles`: SELECT público em campos limitados (nickname, display_name, avatar) via RPC; UPDATE só dono; INSERT no signup.
  - `friend_requests`: SELECT só from_user ou to_user; INSERT só from_user; UPDATE status só to_user.
  - `friendships`: SELECT só participantes; DELETE qualquer participante; INSERT só via RPC de aceite.
  - `user_stickers`: **mantém RLS atual restritivo**. Acesso cross-user via RPC `SECURITY DEFINER` que valida amizade + visibilidade.
- **Analytics events novos** (todos snake_case, sem PII):
  - `nickname_set`, `nickname_changed`
  - `profile_visibility_changed` (props: `from`, `to`)
  - `friend_request_sent` (props: `discovery_method` ∈ `nickname|email|qr`)
  - `friend_request_received`
  - `friend_request_accepted`, `friend_request_declined`
  - `friend_removed`
  - `friend_profile_viewed`
  - `trade_suggestion_viewed`, `trade_suggestion_match_count` (numeric prop)
  - `qr_profile_generated`, `qr_profile_scanned`
- **Consent impact:** todos os eventos novos gated em `syncTelemetryConsent` (`src/lib/telemetry/index.ts:45-96`).
- **Anti-enumeration:** lookup por email retorna sempre `{ ok: true }` independente de existir conta. Lookup por nickname pode revelar existência (nicknames são públicos por design — usuário escolhe).

## Decisões fechadas (recap)

| Tópico | Decisão |
| --- | --- |
| Entry point | Ícone no Header (não 5ª tab) |
| Migração | Banner dismissível + soft-blocking modal só em `/friends` |
| Avatar MVP | Iniciais coloridas (real avatar = follow-up) |
| Surface trocas | Apenas `FriendProfilePage` (não tocar `/swaps`) |
| Cooldown nickname | Livre, sem limite |
| Cap amigos | Sem cap (monitorar p99) |
| Slicing | 5 PRs separados como em `tasks.md` |
| Aceite de pedido | Sender vê na seção "aceitos recentes (7d)" do inbox |

## Decisões técnicas fechadas

| Tópico | Decisão |
| --- | --- |
| Lib geração QR | `qrcode.react@4.2.0` (já instalada — ver `src/components/TradeQRModal.tsx`) |
| Lib scan QR | `@yudiel/react-qr-scanner` — usa native `BarcodeDetector` (~6kb gz) com fallback ZXing (~25kb gz). Lazy-loaded só ao abrir `AddFriendDialog` |
| Rate limit pedidos | **30 por hora por user**. Validado server-side via agg em `friend_requests` (created_at > now() - interval '1 hour' AND from_user = auth.uid()). Sem cota diária no MVP. |
| Nicknames reservados | Lista 4-grupos abaixo, declarada na migration do slice 1. |

### Nicknames reservados (slice 1 migration)

- **Marca/produto:** `panini, fifa, fwc, fwc26, copa, copa26, mundial, worldcup, wc2026, meualbum, meu_album, album, sticker, figurinha`
- **Sistema:** `admin, administrator, support, suporte, help, ajuda, root, system, api, www, ftp, mail, email, anonymous, anonimo, guest, hidden, null, undefined, none, deleted`
- **Funções no app:** `moderator, moderador, mod, bot, official, oficial, staff, equipe, team, owner, dono`
- **Genéricos confusíveis:** `me, you, voce, eu, friend, amigo, user, usuario`

## Open questions remanescentes

Nenhuma bloqueante. Tudo abaixo é escolha de execução que pode ser fechada na PR sem voltar pro spec.

## Issues a serem abertas

Ver `tasks.md` deste folder — alvo é fatiar em 5 PRs/issues:

1. **#187:** Profiles (tabela + nickname onboarding + Settings)
2. **#188:** Friend request/accept lifecycle (DB + inbox UI)
3. **#189:** Discovery (nickname search + email lookup + QR generate/scan)
4. **#190:** Friend profile view + collection visibility RPC + visibility setting
5. **#191:** Trade suggestions RPC + UI no `FriendProfilePage` (decidido: NÃO mexer em `/swaps`)
