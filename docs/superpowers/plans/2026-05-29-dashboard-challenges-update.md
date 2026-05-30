# Dashboard + Challenges Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Dashboard layout for better information hierarchy and add a new Legendary challenge tier with a "full album" challenge.

**Architecture:** All changes are front-end only (no migrations). The Dashboard receives a new `onNavigateToTeam` prop threaded from `AuthenticatedApp` (mirrors the existing Sidebar `onSelect` pattern). The Legendary tier extends `ChallengeDifficulty` and the `DIFFICULTY_*` token maps in `ChallengeCard`.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, react-router-dom v6, Vitest, i18n via JSON locales.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/data/challenges.types.ts` | Modify | Add `'legendary'` to `ChallengeDifficulty` union |
| `src/data/challenges.legendary.ts` | **Create** | `CHALLENGES_LEGENDARY` array with `full-album` entry |
| `src/data/challenges.ts` | Modify | Import and merge `CHALLENGES_LEGENDARY` |
| `src/data/challenges.audit.test.ts` | Modify | Update challenge count assertion; add full-album test |
| `src/components/ChallengeCard.tsx` | Modify | Add `legendary` color/border/track tokens |
| `src/pages/ChallengesPage.tsx` | Modify | Add `'legendary'` to `DIFFICULTY_ORDER` |
| `src/i18n/locales/pt-BR.json` | Modify | Add legendary + full-album + dashboard keys |
| `src/i18n/locales/en.json` | Modify | Same |
| `src/i18n/locales/es.json` | Modify | Same |
| `src/AuthenticatedRoutes.tsx` | Modify | Add `onNavigateToTeam` prop, thread to DashboardPage |
| `src/AuthenticatedApp.tsx` | Modify | Pass `onNavigateToTeam` callback |
| `src/pages/DashboardPage.tsx` | Modify | Full layout restructure |

---

## Task 1 — Legendary difficulty type + ChallengeCard tokens

**Files:**
- Modify: `src/data/challenges.types.ts`
- Modify: `src/components/ChallengeCard.tsx`

- [ ] **Step 1.1: Update `ChallengeDifficulty` type**

Replace the union in `src/data/challenges.types.ts` (line 1):

```ts
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'legendary'
```

- [ ] **Step 1.2: Add `legendary` tokens in ChallengeCard**

In `src/components/ChallengeCard.tsx`, update the three `Record<ChallengeDifficulty, string>` maps (lines 7–23):

```ts
export const DIFFICULTY_COLOR: Record<ChallengeDifficulty, string> = {
  easy:      'bg-emerald-500',
  medium:    'bg-amber-500',
  hard:      'bg-rose-500',
  legendary: 'bg-yellow-400',
}

export const DIFFICULTY_TRACK: Record<ChallengeDifficulty, string> = {
  easy:      'bg-emerald-900/40',
  medium:    'bg-amber-900/40',
  hard:      'bg-rose-900/40',
  legendary: 'bg-yellow-900/40',
}

export const DIFFICULTY_BORDER: Record<ChallengeDifficulty, string> = {
  easy:      'border-emerald-800/40',
  medium:    'border-amber-800/40',
  hard:      'border-rose-800/40',
  legendary: 'border-yellow-500/60',
}
```

- [ ] **Step 1.3: Run typecheck — expect zero errors**

```bash
npm run typecheck
```

Expected: no errors related to `ChallengeDifficulty`.

- [ ] **Step 1.4: Commit**

```bash
git add src/data/challenges.types.ts src/components/ChallengeCard.tsx
git commit -m "feat(challenges): add legendary difficulty tier and visual tokens"
```

---

## Task 2 — Create `challenges.legendary.ts` and merge into `challenges.ts`

**Files:**
- Create: `src/data/challenges.legendary.ts`
- Modify: `src/data/challenges.ts`

Album total is **994** stickers (verified in `challenges.audit.test.ts` line 54).

- [ ] **Step 2.1: Create `src/data/challenges.legendary.ts`**

```ts
import type { Challenge } from './challenges.types'

export const CHALLENGES_LEGENDARY: Challenge[] = [
  {
    id: 'full-album',
    icon: '🏆',
    difficulty: 'legendary',
    albumTotal: true,
    requiredQty: 994,
  },
]
```

- [ ] **Step 2.2: Merge into `src/data/challenges.ts`**

Replace the entire file:

```ts
import { CHALLENGES_EASY } from './challenges.easy'
import { CHALLENGES_HARD } from './challenges.hard'
import { CHALLENGES_MEDIUM } from './challenges.medium'
import { CHALLENGES_LEGENDARY } from './challenges.legendary'
import type { Challenge, ChallengeDifficulty } from './challenges.types'

export type { Challenge, ChallengeDifficulty }

export const CHALLENGES: Challenge[] = [
  ...CHALLENGES_LEGENDARY,
  ...CHALLENGES_EASY,
  ...CHALLENGES_MEDIUM,
  ...CHALLENGES_HARD,
]
```

- [ ] **Step 2.3: Update audit test**

In `src/data/challenges.audit.test.ts`:

Change line 58 (`it('has exactly 14 challenges'`):
```ts
it('has exactly 15 challenges', () => {
  expect(CHALLENGES).toHaveLength(15)
})
```

Add a new test after the `five-continents` test (after line 134):
```ts
it('full-album resolves to total=994 and owned=0 when empty', () => {
  const c = CHALLENGES.find(ch => ch.id === 'full-album')!
  const r = resolveChallengeProgress(c, teams, byTeam, new Map(), 0)
  expect(r).toEqual({ owned: 0, total: 994 })
})

it('full-album resolves to completed when albumCollected=994', () => {
  const c = CHALLENGES.find(ch => ch.id === 'full-album')!
  const r = resolveChallengeProgress(c, teams, byTeam, new Map(), 994)
  expect(r).toEqual({ owned: 994, total: 994 })
})
```

- [ ] **Step 2.4: Run the audit test — expect all pass**

```bash
npm test -- src/data/challenges.audit.test.ts
```

Expected: all tests pass, including the 2 new full-album tests.

- [ ] **Step 2.5: Commit**

```bash
git add src/data/challenges.legendary.ts src/data/challenges.ts src/data/challenges.audit.test.ts
git commit -m "feat(challenges): add full-album legendary challenge (994 stickers)"
```

---

## Task 3 — i18n keys (all 3 locales)

**Files:**
- Modify: `src/i18n/locales/pt-BR.json`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/es.json`

New keys needed:
- `challenges.legendary` — difficulty label
- `challenges.items.full-album.title` — challenge title
- `challenges.items.full-album.description` — challenge description
- `dashboard.completedTeams` — section header for 100%-complete teams
- `dashboard.teamMissing` — interpolation template for missing count on team card (e.g. "faltando {{n}}")

- [ ] **Step 3.1: Update `pt-BR.json`**

In `challenges` object, add after `"hard": "Difíceis"`:
```json
"legendary": "Lendários",
```

In `challenges.items`, add after `"halfway"` entry:
```json
"full-album": {
  "title": "Álbum Completo",
  "description": "Cole todas as 994 figurinhas do álbum. O desafio definitivo."
}
```

In `dashboard` object, add after `"leastComplete"`:
```json
"completedTeams": "Times completos",
"teamMissing": "faltando {{n}}",
```

- [ ] **Step 3.2: Update `en.json`**

In `challenges`, add after `"hard": "Hard"`:
```json
"legendary": "Legendary",
```

In `challenges.items`, add after `"halfway"` entry:
```json
"full-album": {
  "title": "Full Album",
  "description": "Collect all 994 stickers. The ultimate challenge."
}
```

In `dashboard`, add after `"leastComplete"`:
```json
"completedTeams": "Completed teams",
"teamMissing": "{{n}} left",
```

- [ ] **Step 3.3: Update `es.json`**

In `challenges`, add after `"hard": "Difíciles"`:
```json
"legendary": "Legendarios",
```

In `challenges.items`, add after `"halfway"` entry:
```json
"full-album": {
  "title": "Álbum Completo",
  "description": "Pega los 994 cromos del álbum. El desafío definitivo."
}
```

In `dashboard`, add after `"leastComplete"`:
```json
"completedTeams": "Equipos completos",
"teamMissing": "faltando {{n}}",
```

- [ ] **Step 3.4: Verify JSON is valid**

```bash
node -e "require('./src/i18n/locales/pt-BR.json'); require('./src/i18n/locales/en.json'); require('./src/i18n/locales/es.json'); console.log('all valid')"
```

Expected: `all valid`

- [ ] **Step 3.5: Commit**

```bash
git add src/i18n/locales/pt-BR.json src/i18n/locales/en.json src/i18n/locales/es.json
git commit -m "i18n: add legendary tier and dashboard keys (pt-BR, en, es)"
```

---

## Task 4 — ChallengesPage: add Legendary section

**Files:**
- Modify: `src/pages/ChallengesPage.tsx`

- [ ] **Step 4.1: Add `'legendary'` to `DIFFICULTY_ORDER` and update i18n key pattern**

Replace the entire file content:

```tsx
import { useI18n } from '../i18n'
import { useChallengeProgress } from '../hooks/useChallengeProgress'
import { CHALLENGES, type ChallengeDifficulty } from '../data/challenges'
import ChallengeCard from '../components/ChallengeCard'

const DIFFICULTY_ORDER: ChallengeDifficulty[] = ['legendary', 'easy', 'medium', 'hard']

export default function ChallengesPage() {
  const { t } = useI18n()
  const results = useChallengeProgress()

  const byDifficulty = (diff: ChallengeDifficulty) =>
    CHALLENGES
      .filter(c => c.difficulty === diff)
      .map(c => results.find(r => r.challenge.id === c.id)!)
      .filter(Boolean)

  return (
    <div className='flex flex-col h-full'>
      <div className='flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6'>
        {DIFFICULTY_ORDER.map(diff => {
          const all = byDifficulty(diff)
          if (all.length === 0) return null
          const pending = all.filter(r => !r.completed)
          const done    = all.filter(r => r.completed)
          return (
            <section key={diff} className='flex flex-col gap-2'>
              <h2 className='px-1 text-xs font-bold uppercase tracking-widest text-slate-500'>
                {t(`challenges.${diff}`)}
              </h2>
              {pending.map(r => <ChallengeCard key={r.challenge.id} result={r} />)}
              {done.map(r    => <ChallengeCard key={r.challenge.id} result={r} />)}
            </section>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4.2: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4.3: Commit**

```bash
git add src/pages/ChallengesPage.tsx
git commit -m "feat(challenges): show Legendary section first on ChallengesPage"
```

---

## Task 5 — Thread `onNavigateToTeam` prop

**Files:**
- Modify: `src/AuthenticatedRoutes.tsx`
- Modify: `src/AuthenticatedApp.tsx`

This follows the same pattern as the Sidebar's `onSelect` prop: `code => { setSection(code); navigate('/album') }`.

- [ ] **Step 5.1: Update `AuthenticatedRoutes.tsx`**

Add `onNavigateToTeam` to the props type (after line 26) and thread it to `DashboardPage`:

```tsx
type AuthenticatedRoutesProps = {
  userId: string
  section: string
  email?: string
  consent: ConsentState
  onGrantAnalytics: () => void
  onDeclineAnalytics: () => void
  onShowMilestone: (m: Milestone) => void
  onNavigateToTeam: (code: string) => void
  onSignOut: () => Promise<void>
}

export default function AuthenticatedRoutes({
  userId,
  section,
  email,
  consent,
  onGrantAnalytics,
  onDeclineAnalytics,
  onShowMilestone,
  onNavigateToTeam,
  onSignOut,
}: AuthenticatedRoutesProps) {
  const { t } = useI18n()

  return (
    <Suspense fallback={<LoadingScreen label={t('loading')} />}>
      <Routes>
        <Route
          path='/dashboard'
          element={
            <DashboardPage
              userId={userId}
              onShowMilestone={onShowMilestone}
              onNavigateToTeam={onNavigateToTeam}
            />
          }
        />
        {/* rest of routes unchanged */}
        <Route path='/album' element={<AlbumPage sectionCode={section} />} />
        <Route path='/missing' element={<MissingPage />} />
        <Route path='/swaps' element={<SwapsPage />} />
        <Route path='/challenges' element={<ChallengesPage />} />
        <Route path='/friends' element={<FriendsPage userId={userId} />} />
        <Route path='/friends/add' element={<FriendsPage userId={userId} />} />
        <Route path='/u/:nickname' element={<FriendProfilePage currentUserId={userId} />} />
        <Route
          path='/settings'
          element={
            <SettingsPage
              userId={userId}
              email={email}
              consent={consent}
              onGrantAnalytics={onGrantAnalytics}
              onDeclineAnalytics={onDeclineAnalytics}
              onSignOut={onSignOut}
            />
          }
        />
        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
```

- [ ] **Step 5.2: Update `AuthenticatedApp.tsx`**

Pass `onNavigateToTeam` to `AuthenticatedRoutes` (find the `<AuthenticatedRoutes` JSX block, around line 86–96, and add the prop):

```tsx
<AuthenticatedRoutes
  userId={session.user.id}
  section={section}
  email={email}
  consent={consent}
  onGrantAnalytics={grant}
  onDeclineAnalytics={decline}
  onShowMilestone={showMilestone}
  onNavigateToTeam={code => { setSection(code); navigate('/album') }}
  onSignOut={handleSignOut}
/>
```

- [ ] **Step 5.3: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors (DashboardPage will error until Task 6 adds the prop — that's expected, fix in Task 6).

- [ ] **Step 5.4: Commit (after Task 6 passes typecheck)**

This commit is deferred to the end of Task 6 since DashboardPage needs the prop too.

---

## Task 6 — DashboardPage full restructure

**Files:**
- Modify: `src/pages/DashboardPage.tsx`

New section order:
1. Global progress (3-col stat grid: album%, missing count, repeated count)
2. Badges + Challenges (unchanged 2-col grid)
3. Completed teams (conditional — flags only, shown when ≥1 team at 100%)
4. Most complete / Least complete (2-col simplified cards, 5 each, 100%-teams excluded from "most complete")
5. By Group (moved to bottom)

- [ ] **Step 6.1: Replace `DashboardPage.tsx` entirely**

```tsx
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useAlbumProgress, useTeams, useMissing, useSwaps } from '../state/stickersStore'
import { useStickersContext } from '../state/StickersProvider'
import { useChallengeProgress } from '../hooks/useChallengeProgress'
import { loadPersistedMilestones } from '../lib/milestoneStorage'
import type { Milestone } from '../lib/milestoneDetection'
import { DIFFICULTY_COLOR, DIFFICULTY_BORDER } from '../components/ChallengeCard'
import { challengeTitle } from '../lib/challengeI18n'
import { interpolate } from '../lib/shareText'
import type { Team } from '../types/database'

type Props = {
  userId: string
  onShowMilestone: (m: Milestone) => void
  onNavigateToTeam: (code: string) => void
}

// ── helpers ──────────────────────────────────────────────────────────────────

const SPECIAL_SECTIONS = [
  { code: 'WAP', labelKey: 'sections.wap' },
  { code: 'FWC', labelKey: 'sections.fwc' },
  { code: 'CC',  labelKey: 'sections.cc'  },
] as const
const SPECIAL_CODES = new Set(['WAP', 'FWC', 'CC'])

function pctColor(pct: number): string {
  if (pct >= 75) return 'text-emerald-400'
  if (pct >= 40) return 'text-amber-400'
  return 'text-slate-400'
}

function progressBar(pct: number, color = 'bg-sky-500', track = 'bg-slate-800') {
  return (
    <div className={`h-1.5 flex-1 overflow-hidden rounded-full ${track}`}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function sectionHeader(label: string) {
  return <h2 className='px-1 text-xs font-bold uppercase tracking-widest text-slate-500'>{label}</h2>
}

function groupRow(key: string, label: string, collected: number, total: number) {
  if (total === 0) return null
  const pct = Math.round((collected / total) * 100)
  return (
    <div key={key} className='flex items-center gap-3'>
      <span className='w-28 shrink-0 truncate text-xs text-slate-300'>{label}</span>
      {progressBar(pct)}
      <span className={`shrink-0 w-8 text-right text-xs font-semibold tabular-nums ${pctColor(pct)}`}>{pct}%</span>
    </div>
  )
}

type TeamStat = { team: Team; collected: number; total: number; pct: number }

function CompactTeamCard({
  stat,
  missingLabel,
  accentColor,
  onClick,
}: {
  stat: TeamStat
  missingLabel: string
  accentColor: string
  onClick: () => void
}) {
  const missing = stat.total - stat.collected
  return (
    <button
      type='button'
      onClick={onClick}
      className='flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5 hover:border-slate-600 transition-colors text-left w-full'
    >
      <span className='text-lg'>{stat.team.flag}</span>
      <span className='flex-1 truncate text-xs font-semibold text-white'>{stat.team.code}</span>
      <span className={`shrink-0 text-xs font-bold tabular-nums ${accentColor}`}>{stat.pct}%</span>
      <span className='shrink-0 text-[10px] text-slate-500'>{interpolate(missingLabel, { n: missing })}</span>
    </button>
  )
}

// ── component ─────────────────────────────────────────────────────────────────

export default function DashboardPage({ userId, onShowMilestone, onNavigateToTeam }: Props) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { total: albumTotal, collected: albumCollected } = useAlbumProgress()
  const teams = useTeams()
  const { total: totalSwaps } = useSwaps()
  const missingGroups = useMissing()
  const { byTeam, quantities } = useStickersContext()
  const challengeResults = useChallengeProgress()

  const albumPct     = albumTotal > 0 ? Math.round((albumCollected / albumTotal) * 100) : 0
  const totalMissing = missingGroups.reduce((acc, g) => acc + g.numbers.length, 0)

  const groupRows = useMemo(() => {
    const rows: Array<{ key: string; label: string; collected: number; total: number }> = []
    for (const { code, labelKey } of SPECIAL_SECTIONS) {
      const ids = byTeam.get(code) ?? []
      const collected = ids.filter(id => (quantities.get(id) ?? 0) >= 1).length
      if (ids.length > 0) rows.push({ key: code, label: t(labelKey), collected, total: ids.length })
    }
    const letters = [...new Set(teams.filter(tm => tm.group_letter).map(tm => tm.group_letter!))].sort()
    for (const letter of letters) {
      const teamsInGroup = teams.filter(tm => tm.group_letter === letter)
      const allIds = teamsInGroup.flatMap(tm => byTeam.get(tm.code) ?? [])
      const collected = allIds.filter(id => (quantities.get(id) ?? 0) >= 1).length
      rows.push({ key: `group-${letter}`, label: `${t('sidebar.group')} ${letter}`, collected, total: allIds.length })
    }
    return rows
  }, [teams, byTeam, quantities, t])

  const teamStats = useMemo(() => teams
    .filter(tm => !SPECIAL_CODES.has(tm.code))
    .map(tm => {
      const ids = byTeam.get(tm.code) ?? []
      const collected = ids.filter(id => (quantities.get(id) ?? 0) >= 1).length
      const total = ids.length
      const pct = total > 0 ? Math.round((collected / total) * 100) : 0
      return { team: tm, collected, total, pct }
    }), [teams, byTeam, quantities])

  const completedTeams = useMemo(() =>
    teamStats.filter(s => s.total > 0 && s.collected >= s.total),
    [teamStats])

  const topTeams = useMemo(() =>
    [...teamStats]
      .filter(s => s.pct < 100)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5),
    [teamStats])

  const bottomTeams = useMemo(() =>
    [...teamStats]
      .filter(s => s.pct < 100)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 5),
    [teamStats])

  const nearComplete = useMemo(() =>
    teamStats.filter(s => s.total > 0 && s.total - s.collected <= 3 && s.collected < s.total),
    [teamStats])

  const topChallenges = useMemo(
    () => challengeResults.filter(r => !r.completed).sort((a, b) => b.pct - a.pct).slice(0, 5),
    [challengeResults],
  )

  const earnedMilestones = useMemo(() =>
    loadPersistedMilestones(userId).slice(-5).reverse().map(m => {
      if (m.kind === 'album') {
        const milestone: Milestone = { kind: 'album', pct: m.pct }
        return {
          icon: '🏆',
          label: interpolate(t('dashboard.milestoneAlbum'), { pct: m.pct }),
          milestone,
        }
      }
      const tm = teams.find(team => team.code === m.teamCode)
      const milestone: Milestone = { kind: 'team', teamCode: m.teamCode, flag: tm?.flag ?? '🏅', name: tm ? t(tm.name_key) : m.teamCode }
      return { icon: tm?.flag ?? '🏅', label: tm ? t(tm.name_key) : m.teamCode, milestone }
    }), [userId, teams, t])

  const missingLabel = t('dashboard.teamMissing')

  return (
    <div className='flex flex-col h-full'>
      <div className='flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6'>

        {/* 1 — Global progress: 3-column stat grid */}
        <section className='flex flex-col gap-3'>
          {sectionHeader(t('dashboard.globalProgress'))}
          <div
            className='grid grid-cols-3 gap-2'
            data-onboarding-target='dashboard-global-progress'
          >
            {/* Album % */}
            <div className='flex flex-col gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-3'>
              <span className='text-2xl font-black text-white tabular-nums leading-none'>{albumPct}%</span>
              <div>{progressBar(albumPct, 'bg-sky-500', 'bg-slate-700')}</div>
              <span className='text-[10px] text-slate-500 tabular-nums'>{albumCollected}/{albumTotal}</span>
            </div>
            {/* Missing */}
            <button
              type='button'
              onClick={() => navigate('/missing')}
              className='flex flex-col gap-1 rounded-xl bg-slate-900 border border-slate-800 px-3 py-3 text-left hover:border-amber-800 transition-colors'
            >
              <span className='text-2xl font-black text-amber-400 tabular-nums leading-none'>{totalMissing}</span>
              <span className='text-[10px] text-slate-500 mt-auto'>{t('nav.missing')}</span>
            </button>
            {/* Repeated */}
            <button
              type='button'
              onClick={() => navigate('/swaps')}
              className='flex flex-col gap-1 rounded-xl bg-slate-900 border border-slate-800 px-3 py-3 text-left hover:border-rose-800 transition-colors'
            >
              <span className='text-2xl font-black text-rose-400 tabular-nums leading-none'>{totalSwaps}</span>
              <span className='text-[10px] text-slate-500 mt-auto'>{t('nav.swaps')}</span>
            </button>
          </div>
        </section>

        {/* 2 — Badges + Challenges (2-col desktop / stacked mobile) */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>

          <section className='flex flex-col gap-3'>
            {sectionHeader(t('dashboard.recentBadges'))}
            {earnedMilestones.length === 0 ? (
              <p className='px-1 text-xs text-slate-500'>{t('dashboard.noMilestones')}</p>
            ) : (
              <div className='flex flex-col gap-2'>
                {earnedMilestones.map((m, i) => (
                  <button key={i} type='button' onClick={() => onShowMilestone(m.milestone)}
                    className='flex items-center gap-3 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-left hover:border-amber-700 transition-colors group'>
                    <span className='text-xl'>{m.icon}</span>
                    <p className='flex-1 text-sm font-semibold text-white'>{m.label}</p>
                    <span className='text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity'>{t('dashboard.replay')}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section
            className='flex flex-col gap-3'
            data-onboarding-target='dashboard-challenges'
          >
            {sectionHeader(t('dashboard.challengesPreview'))}
            {topChallenges.length === 0 ? (
              <p className='px-1 text-xs text-slate-500'>{t('dashboard.noChallengesYet')}</p>
            ) : (
              <>
              <div className='flex flex-col gap-2'>
                {topChallenges.map(r => (
                  <div key={r.challenge.id}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${DIFFICULTY_BORDER[r.challenge.difficulty]}`}>
                    <span className='text-xl'>{r.challenge.icon}</span>
                    <div className='flex min-w-0 flex-1 flex-col gap-1'>
                      <p className='truncate text-xs font-semibold text-white'>{challengeTitle(r.challenge, t)}</p>
                      {progressBar(r.pct, DIFFICULTY_COLOR[r.challenge.difficulty])}
                    </div>
                    <span className='shrink-0 text-xs font-bold tabular-nums text-slate-400'>{r.pct}%</span>
                  </div>
                ))}
              </div>
              <button type='button' onClick={() => navigate('/challenges')}
                className='text-xs text-sky-400 hover:text-sky-300 text-left px-1 transition-colors'>
                {t('dashboard.seeAll')} →
              </button>
              </>
            )}
          </section>
        </div>

        {/* 3 — Completed teams (only when ≥1 team is 100%) */}
        {completedTeams.length > 0 && (
          <section className='flex flex-col gap-3'>
            {sectionHeader(t('dashboard.completedTeams'))}
            <div className='flex flex-wrap gap-3 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3'>
              {completedTeams.map(s => (
                <button
                  key={s.team.code}
                  type='button'
                  onClick={() => onNavigateToTeam(s.team.code)}
                  title={s.team.code}
                  className='text-2xl hover:scale-110 transition-transform'
                >
                  {s.team.flag}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 4 — Most complete / Least complete (2-col simplified, 5 each) */}
        <section className='flex flex-col gap-3'>
          <div className='grid grid-cols-2 gap-3'>
            {/* Most complete */}
            <div className='flex flex-col gap-2'>
              {sectionHeader(t('dashboard.topTeams'))}
              {topTeams.map(s => (
                <CompactTeamCard
                  key={s.team.code}
                  stat={s}
                  missingLabel={missingLabel}
                  accentColor='text-emerald-400'
                  onClick={() => onNavigateToTeam(s.team.code)}
                />
              ))}
            </div>
            {/* Least complete */}
            <div className='flex flex-col gap-2'>
              {sectionHeader(t('dashboard.leastComplete'))}
              {bottomTeams.map(s => (
                <CompactTeamCard
                  key={s.team.code}
                  stat={s}
                  missingLabel={missingLabel}
                  accentColor='text-rose-400'
                  onClick={() => onNavigateToTeam(s.team.code)}
                />
              ))}
            </div>
          </div>

          {/* Near complete sub-section */}
          {nearComplete.length > 0 && (
            <>
              <p className='px-1 text-xs font-semibold text-amber-400 mt-1'>{t('dashboard.nearComplete')} 🔥</p>
              <div className='flex flex-col gap-2'>
                {nearComplete.map(s => (
                  <CompactTeamCard
                    key={s.team.code}
                    stat={s}
                    missingLabel={missingLabel}
                    accentColor='text-amber-400'
                    onClick={() => onNavigateToTeam(s.team.code)}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        {/* 5 — Group progress (moved to bottom) */}
        <section className='flex flex-col gap-3'>
          {sectionHeader(t('dashboard.byGroup'))}
          <div className='flex flex-col gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3'>
            {groupRows.map(r => groupRow(r.key, r.label, r.collected, r.total))}
          </div>
        </section>

      </div>
    </div>
  )
}
```

- [ ] **Step 6.2: Run typecheck — expect zero errors**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 6.3: Run all tests**

```bash
npm run test:ci
```

Expected: all pass (225+ tests).

- [ ] **Step 6.4: Commit tasks 5 + 6 together**

```bash
git add src/AuthenticatedRoutes.tsx src/AuthenticatedApp.tsx src/pages/DashboardPage.tsx
git commit -m "feat(dashboard): redesign layout — stat grid, completed teams, 2-col highlights, clickable cards"
```

---

## Task 7 — Browser verification + final harness

- [ ] **Step 7.1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 7.2: Check DashboardPage in browser**

Navigate to `/dashboard` and verify:
- [ ] Global progress shows 3 equal-width cards (album %, faltando N, repetidas N)
- [ ] Clicking "Faltando" card navigates to `/missing`
- [ ] Clicking "Repetidas" card navigates to `/swaps`
- [ ] "Atalhos rápidos" section is gone
- [ ] "Completed teams" section is hidden (unless collector has a 100% team)
- [ ] Most/Least complete shows up to 5 teams per side in 2-column simplified layout
- [ ] Cards show: flag + code + % + missing count (e.g. "faltando 5")
- [ ] Clicking a team card navigates to `/album` and shows that team's stickers
- [ ] "Por grupo" section appears at the bottom
- [ ] "Faltam poucos" near-complete section appears if applicable

- [ ] **Step 7.3: Check ChallengesPage in browser**

Navigate to `/challenges` and verify:
- [ ] "Lendários" section appears first with the "Álbum Completo" challenge
- [ ] The challenge card has a gold/amber border
- [ ] Progress bar is yellow/gold

- [ ] **Step 7.4: Run the AI harness**

```bash
npm run ai:harness
```

Review and act on any recommended personas (telemetry, frontend, etc.).

- [ ] **Step 7.5: Run public E2E smoke**

```bash
npm run test:e2e:public
```

Expected: all public/setup E2E tests pass.

- [ ] **Step 7.6: Final commit if any harness fixes were applied**

```bash
git add -p  # review before staging
git commit -m "chore: apply harness feedback for dashboard+challenges update"
```

---

## Self-Review Checklist

**Spec coverage:**

| Spec item | Task |
|---|---|
| 3-col stat grid (album%, missing, repeated) | Task 6 |
| Remove Quick Shortcuts | Task 6 |
| By Group → bottom | Task 6 |
| Most/least: 5 teams, 2-col, simplified cards (%, missing count) | Task 6 |
| 100% teams excluded from "most complete" | Task 6 (`filter(s => s.pct < 100)`) |
| New "Completed teams" section (conditional, flags only) | Task 6 |
| All team cards clickable → album filtered by team | Tasks 5 + 6 |
| `'legendary'` difficulty tier | Tasks 1–4 |
| "Full album" challenge (994 stickers) | Task 2 |
| i18n (pt-BR, en, es) | Task 3 |
| Audit test updated | Task 2 |

**Type consistency:**
- `ChallengeDifficulty` extended in Task 1 → all `Record<ChallengeDifficulty, string>` maps updated in same task.
- `onNavigateToTeam: (code: string) => void` added to `Props` in Task 6, threaded in Task 5.
- `CompactTeamCard` defined at module level in DashboardPage — no inline anonymous functions.
- `interpolate(missingLabel, { n: missing })` — `interpolate` already imported and used elsewhere in the file.
