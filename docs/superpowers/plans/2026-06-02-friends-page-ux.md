# Friends Page UX Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Melhorar a UX da página de amigos removendo a seção "Aceitos Recentemente", adicionando badge "Novo" nos cards, redesenhando o botão de remoção e reorganizando os CTAs.

**Architecture:** Mudanças cirúrgicas em `FriendsPage.tsx` e `FriendCard.tsx`. A lógica de "novo amigo" fica inline no componente via `friendship_created_at`. Sem novos hooks ou state.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, react-router-dom, i18n via `useI18n`/`t()`

**Branch:** `feat/friends-page-ux-improvements`

**Issue:** #243

---

### Task 1: i18n — Adicionar e remover chaves

**Files:**
- Modify: `src/i18n/locales/pt-BR.json`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/es.json`

- [ ] **Step 1: Adicionar `friends.page.newFriend` e `friends.unfriend` em pt-BR.json**

No objeto `friends.page` (que já contém `title`, `addFriend`, `myFriends`, `empty`, `subtitle`), adicionar:

```json
"newFriend": "Novo",
```

No objeto raiz `friends` (ao lado de `removeFriend`, `removeConfirmTitle`, etc.), adicionar:

```json
"unfriend": "Desfazer amizade",
```

- [ ] **Step 2: Remover `friends.requests.recentlyAccepted` em pt-BR.json**

No objeto `friends.requests`, remover a linha:

```json
"recentlyAccepted": "Aceitos recentemente (7 dias)",
```

- [ ] **Step 3: Repetir para en.json**

Adicionar em `friends.page`:
```json
"newFriend": "New",
```

Adicionar em `friends` (raiz):
```json
"unfriend": "Unfriend",
```

Remover de `friends.requests`:
```json
"recentlyAccepted": "Recently accepted (7 days)",
```

- [ ] **Step 4: Repetir para es.json**

Adicionar em `friends.page`:
```json
"newFriend": "Nuevo",
```

Adicionar em `friends` (raiz):
```json
"unfriend": "Dejar de ser amigo",
```

Remover de `friends.requests`:
```json
"recentlyAccepted": "Aceptados recientemente (7 días)",
```

- [ ] **Step 5: Verificar typecheck**

```bash
npm run typecheck
```

Esperado: sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/locales/pt-BR.json src/i18n/locales/en.json src/i18n/locales/es.json
git commit -m "i18n: add newFriend/unfriend keys, remove recentlyAccepted (#243)"
```

---

### Task 2: Deletar AcceptedRequestRow e limpar re-export

**Files:**
- Delete: `src/components/friends/AcceptedRequestRow.tsx`
- Modify: `src/components/friends/FriendRequestRow.tsx`

- [ ] **Step 1: Deletar o arquivo via git rm**

```bash
git rm src/components/friends/AcceptedRequestRow.tsx
```

- [ ] **Step 2: Remover o re-export de `FriendRequestRow.tsx`**

O arquivo atual (`src/components/friends/FriendRequestRow.tsx`) contém:

```ts
// Re-exports for convenience — use the individual files for new imports.
export { default as PendingRequestRow } from './PendingRequestRow'
export { default as AcceptedRequestRow } from './AcceptedRequestRow'
```

Substituir por:

```ts
export { default as PendingRequestRow } from './PendingRequestRow'
```

- [ ] **Step 3: Verificar typecheck**

```bash
npm run typecheck
```

Esperado: erros de import em `FriendsPage.tsx` (será corrigido na Task 3). Se houver outros arquivos referenciando `AcceptedRequestRow`, corrigi-los agora.

- [ ] **Step 4: Commit parcial (será completado junto com Task 3)**

Não commitar ainda — o typecheck passará após Task 3.

---

### Task 3: Atualizar FriendsPage.tsx

**Files:**
- Modify: `src/pages/FriendsPage.tsx`

Conteúdo completo do arquivo após as mudanças:

- [ ] **Step 1: Remover import de `AcceptedRequestRow` e a variável `recentlyAccepted`**

Linha 6 atual:
```ts
import { PendingRequestRow, AcceptedRequestRow } from '../components/friends/FriendRequestRow'
```

Substituir por:
```ts
import { PendingRequestRow } from '../components/friends/FriendRequestRow'
```

Linha 39 atual:
```ts
const recentlyAccepted = requests?.recently_accepted ?? []
```

Remover essa linha inteira.

- [ ] **Step 2: Remover o botão "Adicionar amigo" do header da página**

Remover o bloco do header (linhas 48–59 do arquivo original):

```tsx
{profile && (
  <button
    type='button'
    onClick={() => setAddFriendOpen(true)}
    className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors'
  >
    <svg className='w-4 h-4' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
      <path d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z' />
    </svg>
    {t('friends.page.addFriend')}
  </button>
)}
```

O div do header passa a ser apenas:
```tsx
<div className='flex items-center justify-between'>
  <h1 className='text-xl font-bold text-white'>{t('friends.page.title')}</h1>
</div>
```

- [ ] **Step 3: Remover a seção "Aceitos Recentemente"**

Remover o bloco inteiro (linhas 87–97 do arquivo original):

```tsx
{/* Recently accepted */}
{recentlyAccepted.length > 0 && (
  <section className='flex flex-col gap-2'>
    <h2 className='text-xs font-semibold text-slate-400 uppercase tracking-wide'>
      {t('friends.requests.recentlyAccepted')}
    </h2>
    {recentlyAccepted.map(f => (
      <AcceptedRequestRow key={f.user_id} friend={f} />
    ))}
  </section>
)}
```

- [ ] **Step 4: Adicionar toolbar de CTAs na seção "Meus Amigos"**

Localizar o bloco da seção de amigos. O h2 atual é:
```tsx
<h2 className='text-xs font-semibold text-slate-400 uppercase tracking-wide'>
  {t('friends.page.myFriends')} ({friends.length})
</h2>
```

Adicionar logo após esse h2, ainda dentro da `<section>`:

```tsx
{profile && (
  <div className='flex items-center gap-2'>
    <button
      type='button'
      onClick={() => setAddFriendOpen(true)}
      className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors'
    >
      <svg className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
        <path d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z' />
      </svg>
      {t('friends.page.addFriend')}
    </button>
    <Link
      to='/trading-partners'
      className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/15 border border-transparent hover:border-indigo-500/20 transition-colors text-xs font-semibold'
    >
      {t('tradingPartners.findPartners')}
    </Link>
  </div>
)}
```

Adicionar o import de `Link` no topo do arquivo se ainda não existir:
```ts
import { Link, useSearchParams } from 'react-router-dom'
```

- [ ] **Step 5: Verificar typecheck**

```bash
npm run typecheck
```

Esperado: sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/pages/FriendsPage.tsx src/components/friends/FriendRequestRow.tsx
git commit -m "feat(friends): remove seção aceitos recentemente, reorganiza CTAs (#243)"
```

> Nota: a deleção de `AcceptedRequestRow.tsx` já foi staged pelo `git rm` na Task 2 e está incluída neste commit automaticamente.

---

### Task 4: Atualizar FriendCard — badge "Novo" e botão "Desfazer amizade"

**Files:**
- Modify: `src/components/friends/FriendCard.tsx`

- [ ] **Step 1: Adicionar lógica de badge "Novo"**

No início do componente `FriendCard`, antes do `return`, adicionar:

```ts
const isNew = (() => {
  const created = new Date(friend.friendship_created_at)
  const diffMs = Date.now() - created.getTime()
  return diffMs < 7 * 24 * 60 * 60 * 1000
})()
```

- [ ] **Step 2: Adicionar badge no JSX**

Na parte de informações do amigo dentro do `<Link>`, o bloco atual é:

```tsx
<div className='min-w-0'>
  <p className='text-white text-sm font-medium truncate'>{friend.display_name}</p>
  <p className='text-slate-400 text-xs'>@{friend.nickname}</p>
</div>
```

Substituir por:

```tsx
<div className='min-w-0'>
  <p className='text-white text-sm font-medium truncate'>{friend.display_name}</p>
  <p className='text-slate-400 text-xs flex items-center gap-1.5'>
    @{friend.nickname}
    {isNew && (
      <span className='inline-flex items-center px-1.5 py-0.5 rounded text-emerald-400 bg-emerald-500/10 text-[10px] font-semibold leading-none'>
        {t('friends.page.newFriend')}
      </span>
    )}
  </p>
</div>
```

- [ ] **Step 3: Redesenhar o botão de remoção**

O botão atual:

```tsx
<button
  type='button'
  onClick={() => setConfirmOpen(true)}
  aria-label={t('friends.removeFriend')}
  className='shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors'
>
  <svg className='w-4 h-4' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
    <path d='M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' />
  </svg>
</button>
```

Substituir por:

```tsx
<button
  type='button'
  onClick={() => setConfirmOpen(true)}
  className='shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors text-xs font-semibold'
>
  <svg className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
    <path d='M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' />
  </svg>
  {t('friends.unfriend')}
</button>
```

- [ ] **Step 4: Ajustar layout do card para acomodar o botão maior**

O card container atual:
```tsx
<div className='flex items-center gap-3 px-4 py-3 bg-slate-800/60 rounded-xl'>
```

O `<Link>` interno já tem `flex-1 min-w-0` — sem mudança necessária. O botão maior empurrará o link para a esquerda naturalmente. Verificar visualmente se necessário.

- [ ] **Step 5: Verificar typecheck**

```bash
npm run typecheck
```

Esperado: sem erros.

- [ ] **Step 6: Rodar lint**

```bash
npm run lint
```

Esperado: sem erros.

- [ ] **Step 7: Commit**

```bash
git add src/components/friends/FriendCard.tsx
git commit -m "feat(friends): badge Novo em amizades recentes, botão Desfazer amizade (#243)"
```

---

### Task 5: Verificação final e harness

- [ ] **Step 1: Rodar o harness completo**

```bash
npm run ai:harness
```

Verificar se há personas recomendadas. Se `frontend-product-engineer` ou `qa-release-reviewer` aparecerem, invocar.

- [ ] **Step 2: Rodar typecheck e lint**

```bash
npm run typecheck && npm run lint
```

Esperado: sem erros em ambos.

- [ ] **Step 3: Verificar visualmente no browser**

```bash
npm run dev
```

Abrir `http://localhost:5173` e verificar:
- Página de amigos não mostra seção "Aceitos recentemente"
- Amigos com menos de 7 dias mostram badge "Novo"
- Botão "Desfazer amizade" aparece vermelho com texto visível
- CTAs "Adicionar amigo" e "Parceiros de troca" aparecem abaixo do h2 "Meus Amigos"
- "Parceiros de troca" navega para `/trading-partners`
- Testar em viewport 375px (mobile)

- [ ] **Step 4: Commit final se houver ajustes**

```bash
git add -p
git commit -m "fix(friends): ajustes visuais pós-verificação (#243)"
```

- [ ] **Step 5: Confirmar working tree limpa**

```bash
git status
```

Esperado: `nothing to commit, working tree clean`.
