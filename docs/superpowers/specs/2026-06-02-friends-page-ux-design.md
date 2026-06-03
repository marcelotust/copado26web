# Design — Melhorias UX da Página de Amigos

**Issue:** #243  
**Data:** 2026-06-02  
**Branch:** feat/friends-page-ux

---

## Problema

A página de amigos tem inconsistências de UX:
- Seção "Aceitos recentemente" duplica informação que pode viver no item da lista
- Botão de remover amigo é um ícone discreto sem texto, tornando a ação pouco clara
- Os CTAs "Adicionar amigo" e "Parceiros de troca" ficam separados do contexto da lista
- Não há indicativo visual de amizades novas na lista principal

## Escopo

### Dentro do escopo
- Remover seção "Aceitos Recentemente"
- Badge "Novo" (7 dias) no `FriendCard`
- Redesenho do botão de remoção: ícone vermelho + texto "Desfazer amizade"
- CTAs "Adicionar amigo" e "Parceiros de troca" abaixo do h2 "Meus Amigos"
- Atualização de chaves i18n nos 3 locales

### Fora do escopo
- Mudanças em backend, RLS ou RPCs
- Redesenho da seção de pedidos pendentes
- Navegação por amigo para parceiros de troca (cada card não ganha link individual)

## Design

### 1. Remover seção "Aceitos Recentemente"

Remover o bloco `recentlyAccepted` de `FriendsPage.tsx`. Deletar `AcceptedRequestRow.tsx`. Remover a chave `friends.requests.recentlyAccepted` dos 3 locales.

A informação de "amizade recente" migra para o badge no `FriendCard` (item 2).

### 2. Badge "Novo" no FriendCard

`FriendEntry.friendship_created_at` (já disponível no tipo) é comparado com a data atual. Se a diferença for < 7 dias, exibir badge `Novo` em verde (`text-emerald-400 bg-emerald-500/10`) ao lado do `@nickname` no card.

```
[ Avatar ]  Nome completo          [🔴 Desfazer amizade]
            @nickname  • Novo
```

Lógica de cálculo fica dentro do componente `FriendCard` (sem hook separado).

### 3. Botão "Desfazer amizade"

Substituir o botão ícone-only por um botão com ícone + texto sempre visível:

```tsx
<button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
  text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold">
  <RemoveIcon /> Desfazer amizade
</button>
```

O modal de confirmação existente permanece sem alteração.

### 4. CTAs abaixo do h2 "Meus Amigos"

Dentro da `<section>` de amigos, logo após o `h2`, adicionar uma linha de botões:

```
Meus Amigos (3)
[+ Adicionar amigo]  [↔ Parceiros de troca →]
────────────────────────────────────────────
[ Card 1   ]  [🔴 Desfazer amizade]
[ Card 2   ]  [🔴 Desfazer amizade]
```

- Ambos os botões só renderizam se `profile` existir (mesma guarda da lógica atual)
- "Adicionar amigo" abre o `AddFriendDialog` existente
- "Parceiros de troca" é um `<Link to="/trading-partners">`
- O botão "Adicionar amigo" do header do app (topo da página) é removido

### 5. i18n

**Adicionar:**
- `friends.page.tradingPartners`: "Parceiros de troca" / "Trading partners" / "Socios de intercambio"
- `friends.page.newFriend`: "Novo" / "New" / "Nuevo"

**Remover:**
- `friends.requests.recentlyAccepted`

## Critérios de Aceite

- [ ] Seção "Aceitos Recentemente" não aparece
- [ ] Amigos com `friendship_created_at` < 7 dias exibem badge "Novo"
- [ ] Botão de remoção é vermelho com texto "Desfazer amizade" visível
- [ ] CTAs "Adicionar amigo" e "Parceiros de troca" aparecem abaixo do h2 "Meus Amigos"
- [ ] "Parceiros de troca" navega para `/trading-partners`
- [ ] Layout mobile não quebra (testar em 375px)
- [ ] Nenhuma regressão na seção de pedidos pendentes

## Arquivos Afetados

| Arquivo | Mudança |
|---|---|
| `src/pages/FriendsPage.tsx` | Remove bloco recentlyAccepted, move CTA para seção |
| `src/components/friends/FriendCard.tsx` | Badge Novo + botão redesenhado |
| `src/components/friends/AcceptedRequestRow.tsx` | Deletar |
| `src/i18n/locales/pt-BR.json` | Adicionar/remover chaves |
| `src/i18n/locales/en.json` | Adicionar/remover chaves |
| `src/i18n/locales/es.json` | Adicionar/remover chaves |

## Telemetria / Privacidade

Nenhum evento novo. Nenhuma PII exposta. Sem impacto em LGPD.

## Testes

- Atualizar/remover testes que referenciem `AcceptedRequestRow` ou `recentlyAccepted`
- Verificar visualmente em mobile (375px) após implementação
