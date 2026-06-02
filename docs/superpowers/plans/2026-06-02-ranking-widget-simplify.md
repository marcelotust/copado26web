# Ranking Widget Simplify — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify `RankingMyRankWidget` to show only the user's own ranking position (with medal for top 3), removing the public top-3 list and its slow RPC call.

**Architecture:** The widget depends only on `useMyRank` (existing) and `rankingPublic` from `useProfile` (existing). The `usePublicRanking` hook and its `get_public_ranking` RPC are removed from `DashboardPage` entirely. The component shrinks to 3 props and 3 render states: loading skeleton, not-opted-in card, and ranked display.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vitest + React Testing Library

---

## File Map

| File | Action |
|---|---|
| `src/components/ranking/RankingMyRankWidget.tsx` | Rewrite — remove `top3`/`currentUserId` props and top-3 rendering |
| `src/components/ranking/RankingMyRankWidget.test.tsx` | Update — remove top3 cases, add medal test |
| `src/pages/DashboardPage.tsx` | Update — remove `usePublicRanking` import/call and props |

---

### Task 1: Update the unit tests first (TDD)

**Files:**
- Modify: `src/components/ranking/RankingMyRankWidget.test.tsx`

- [ ] **Step 1: Replace the entire test file** with the updated suite below (removes top3 tests, adds medal test):

```tsx
import { beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { persistLocale } from '../../i18n/localeData'
import { renderWithProviders } from '../../test/renderWithProviders'
import RankingMyRankWidget from './RankingMyRankWidget'

describe('RankingMyRankWidget', () => {
  beforeEach(() => {
    persistLocale('pt-BR')
  })

  it('shows skeleton when loading', () => {
    const { container } = renderWithProviders(
      <RankingMyRankWidget myRank={null} rankingPublic={false} loading={true} />
    )
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows not-opted-in card when ranking_public is false', () => {
    renderWithProviders(
      <RankingMyRankWidget myRank={null} rankingPublic={false} loading={false} />
    )
    expect(screen.getByRole('link', { name: /configura/i })).toBeInTheDocument()
    expect(screen.getByText(/não está participando/i)).toBeInTheDocument()
  })

  it('shows empty state when opted in but no rank yet', () => {
    renderWithProviders(
      <RankingMyRankWidget myRank={null} rankingPublic={true} loading={false} />
    )
    expect(screen.getByText(/nenhum/i)).toBeInTheDocument()
  })

  it('shows rank and link when user is ranked outside top 3', () => {
    renderWithProviders(
      <RankingMyRankWidget
        myRank={{ rank: 12, owned_count: 744, completion_pct: 74.8 }}
        rankingPublic={true}
        loading={false}
      />
    )
    expect(screen.getByText('#12')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ranking/i })).toBeInTheDocument()
  })

  it('shows medal emoji for top 3 positions', () => {
    const { rerender } = renderWithProviders(
      <RankingMyRankWidget
        myRank={{ rank: 1, owned_count: 900, completion_pct: 90 }}
        rankingPublic={true}
        loading={false}
      />
    )
    expect(screen.getByText('🥇')).toBeInTheDocument()

    rerender(
      <RankingMyRankWidget
        myRank={{ rank: 2, owned_count: 880, completion_pct: 88 }}
        rankingPublic={true}
        loading={false}
      />
    )
    expect(screen.getByText('🥈')).toBeInTheDocument()

    rerender(
      <RankingMyRankWidget
        myRank={{ rank: 3, owned_count: 860, completion_pct: 86 }}
        rankingPublic={true}
        loading={false}
      />
    )
    expect(screen.getByText('🥉')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests — expect failures** (component still has old API)

```bash
npm run test:ci -- --reporter=verbose src/components/ranking/RankingMyRankWidget.test.tsx
```

Expected: several tests fail because component still accepts `top3` prop and the `rerender` call will fail with type errors.

---

### Task 2: Rewrite the component

**Files:**
- Modify: `src/components/ranking/RankingMyRankWidget.tsx`

- [ ] **Step 1: Replace the entire file** with the simplified component:

```tsx
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import type { MyRank } from '../../hooks/useMyRank'

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function rankIcon(rank: number): string {
  return MEDAL[rank] ?? `#${rank}`
}

type Props = {
  myRank: MyRank | null
  rankingPublic: boolean
  loading: boolean
}

export default function RankingMyRankWidget({ myRank, rankingPublic, loading }: Props) {
  const { t } = useI18n()

  if (loading) {
    return (
      <div className='px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 animate-pulse'>
        <div className='h-4 w-24 bg-slate-700 rounded mb-2' />
        <div className='h-3 w-36 bg-slate-700 rounded' />
      </div>
    )
  }

  if (!rankingPublic) {
    return (
      <div className='px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 opacity-60'>
        <p className='text-sm font-semibold text-white mb-1'>🏆 {t('ranking.pageTitle')}</p>
        <p className='text-xs text-slate-400 mb-2'>{t('ranking.notOptedIn')}</p>
        <Link to='/settings' className='text-xs text-indigo-400 hover:text-indigo-300'>
          {t('ranking.activateInSettings')}
        </Link>
      </div>
    )
  }

  return (
    <div className='rounded-xl bg-slate-800 border border-indigo-500/30'>
      <div className='flex items-center justify-between px-4 pt-3 pb-2'>
        <div className='flex items-center gap-2'>
          <span className='text-base'>🏆</span>
          <p className='text-sm font-semibold text-white'>{t('ranking.pageTitle')}</p>
        </div>
        <Link to='/ranking' className='text-xs text-indigo-400 hover:text-indigo-300'>
          {t('ranking.seeFullRanking')}
        </Link>
      </div>

      {myRank ? (
        <div className='px-4 pb-4 pt-1'>
          <p className='text-xs text-slate-400 mb-1'>{t('ranking.myRank')}</p>
          <p className='text-3xl font-bold text-indigo-400 leading-none'>
            {rankIcon(myRank.rank)}
          </p>
        </div>
      ) : (
        <p className='px-4 pb-3 text-xs text-slate-400'>{t('ranking.emptyState')}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run the tests — expect pass**

```bash
npm run test:ci -- --reporter=verbose src/components/ranking/RankingMyRankWidget.test.tsx
```

Expected: all 5 tests PASS.

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

Expected: errors only in `DashboardPage.tsx` (passing removed props) — fix next task.

- [ ] **Step 4: Commit**

```bash
git add src/components/ranking/RankingMyRankWidget.tsx src/components/ranking/RankingMyRankWidget.test.tsx
git commit -m "refactor(ranking): simplify widget to show only user's own rank

Remove top3 list and usePublicRanking dependency. Widget now shows
position with medal (top 3) or #N, plus link to full ranking page."
```

---

### Task 3: Update DashboardPage

**Files:**
- Modify: `src/pages/DashboardPage.tsx`

- [ ] **Step 1: Remove `usePublicRanking` import and call**

Find and remove line (around line 15):
```ts
import { usePublicRanking } from '../hooks/usePublicRanking'
```

Find and remove line (around line 57):
```ts
const { entries: rankingEntries } = usePublicRanking()
```

- [ ] **Step 2: Update the widget usage** (around line 194–201)

Change from:
```tsx
<RankingMyRankWidget
  myRank={myRank}
  rankingPublic={profile?.ranking_public ?? false}
  loading={myRankLoading || profileLoading}
  top3={rankingEntries}
  currentUserId={userId}
/>
```

To:
```tsx
<RankingMyRankWidget
  myRank={myRank}
  rankingPublic={profile?.ranking_public ?? false}
  loading={myRankLoading || profileLoading}
/>
```

- [ ] **Step 3: Run typecheck — expect clean**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Run full test suite**

```bash
npm run test:ci
```

Expected: all tests pass.

- [ ] **Step 5: Run harness**

```bash
npm run ai:harness
```

Review any recommended personas and run them if flagged.

- [ ] **Step 6: Commit**

```bash
git add src/pages/DashboardPage.tsx
git commit -m "refactor(dashboard): remove usePublicRanking from dashboard

Widget no longer needs the public ranking list; removes one slow RPC
call per dashboard load."
```

---

### Task 4: Browser verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Open dashboard** at `http://localhost:5173` (or the port shown in terminal).

- [ ] **Step 3: Verify ranked state** — widget must show a position (e.g. `#5` or `🥇`) and a "Ver ranking completo →" link.

- [ ] **Step 4: Verify not-opted-in state** — go to Settings and disable ranking, return to dashboard. Widget must show "Você não está participando do ranking público." with "Ativar em Configurações →" link.

- [ ] **Step 5: Stop dev server** and declare task complete.
