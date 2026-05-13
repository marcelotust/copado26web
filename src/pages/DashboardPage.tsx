import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useAlbumProgress, useTeams, useMissing, useSwaps } from '../state/stickersStore'
import { useStickersContext } from '../state/StickersProvider'
import { useChallengeProgress } from '../hooks/useChallengeProgress'
import { loadPersistedMilestones } from '../lib/milestoneStorage'
import { DIFFICULTY_COLOR, DIFFICULTY_BORDER } from '../components/ChallengeCard'
import type { Team } from '../types/database'

type Props = { userId: string }

// ── helpers ──────────────────────────────────────────────────────────────────

const SPECIAL_SECTIONS = [
  { code: 'WAP', labelKey: 'sections.wap' },
  { code: 'FWC', labelKey: 'sections.fwc' },
  { code: 'CC',  labelKey: 'sections.cc'  },
] as const

function pctColor(pct: number): string {
  if (pct >= 75) return 'text-emerald-400'
  if (pct >= 40) return 'text-amber-400'
  return 'text-slate-400'
}

function progressBar(pct: number, color = 'bg-sky-500', track = 'bg-slate-800'): JSX.Element {
  return (
    <div className={`h-1.5 flex-1 overflow-hidden rounded-full ${track}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ── section renderers (lowercase = not React components, no ESLint conflict) ─

function renderSectionHeader(label: string): JSX.Element {
  return (
    <h2 className='px-1 text-xs font-bold uppercase tracking-widest text-slate-500'>
      {label}
    </h2>
  )
}

function renderGroupRow(
  key: string,
  label: string,
  collected: number,
  total: number,
): JSX.Element {
  if (total === 0) return <></>
  const pct = Math.round((collected / total) * 100)
  return (
    <div key={key} className='flex items-center gap-3'>
      <span className='w-28 shrink-0 truncate text-xs text-slate-300'>{label}</span>
      {progressBar(pct)}
      <span className={`shrink-0 w-8 text-right text-xs font-semibold tabular-nums ${pctColor(pct)}`}>
        {pct}%
      </span>
    </div>
  )
}

function renderTeamCard(team: Team, pct: number, collected: number, total: number): JSX.Element {
  return (
    <div key={team.code} className='flex items-center gap-2.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2'>
      <span className='text-xl'>{team.flag}</span>
      <div className='flex min-w-0 flex-1 flex-col gap-1'>
        <p className='truncate text-xs font-semibold text-white'>{team.code}</p>
        {progressBar(pct, 'bg-emerald-500', 'bg-slate-700')}
      </div>
      <span className='shrink-0 text-xs font-bold tabular-nums text-emerald-400'>{pct}%</span>
      <span className='shrink-0 text-[10px] text-slate-500'>{collected}/{total}</span>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function DashboardPage({ userId }: Props) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { total: albumTotal, collected: albumCollected } = useAlbumProgress()
  const teams = useTeams()
  const { total: totalSwaps } = useSwaps()
  const missingGroups = useMissing()
  const { byTeam, quantities } = useStickersContext()
  const challengeResults = useChallengeProgress()

  const albumPct = albumTotal > 0 ? Math.round((albumCollected / albumTotal) * 100) : 0
  const totalMissing = missingGroups.reduce((acc, g) => acc + g.numbers.length, 0)

  // Group-level progress (album order: WAP → A-L → FWC → CC)
  const groupRows = useMemo(() => {
    const rows: Array<{ key: string; label: string; collected: number; total: number }> = []

    // Special sections
    for (const { code, labelKey } of SPECIAL_SECTIONS) {
      const ids = byTeam.get(code) ?? []
      const collected = ids.filter(id => (quantities.get(id) ?? 0) >= 1).length
      if (ids.length > 0) rows.push({ key: code, label: t(labelKey), collected, total: ids.length })
    }

    // Groups A–L
    const letters = [...new Set(
      teams.filter(tm => tm.group_letter).map(tm => tm.group_letter!)
    )].sort()

    for (const letter of letters) {
      const teamsInGroup = teams.filter(tm => tm.group_letter === letter)
      const allIds = teamsInGroup.flatMap(tm => byTeam.get(tm.code) ?? [])
      const collected = allIds.filter(id => (quantities.get(id) ?? 0) >= 1).length
      rows.push({ key: `group-${letter}`, label: `${t('sidebar.group')} ${letter}`, collected, total: allIds.length })
    }

    return rows
  }, [teams, byTeam, quantities, t])

  // Team highlights
  const teamStats = useMemo(() => {
    const SPECIAL = new Set(['WAP', 'FWC', 'CC'])
    return teams
      .filter(tm => !SPECIAL.has(tm.code))
      .map(tm => {
        const ids = byTeam.get(tm.code) ?? []
        const collected = ids.filter(id => (quantities.get(id) ?? 0) >= 1).length
        const total = ids.length
        const pct = total > 0 ? Math.round((collected / total) * 100) : 0
        return { team: tm, collected, total, pct }
      })
  }, [teams, byTeam, quantities])

  const topTeams    = useMemo(() => [...teamStats].sort((a, b) => b.pct - a.pct).slice(0, 3), [teamStats])
  const nearComplete = useMemo(
    () => teamStats.filter(s => s.total > 0 && s.total - s.collected <= 3 && s.collected < s.total),
    [teamStats],
  )

  // Top 3 challenges in progress
  const topChallenges = useMemo(
    () => challengeResults.filter(r => !r.completed).sort((a, b) => b.pct - a.pct).slice(0, 3),
    [challengeResults],
  )

  // Recent earned milestones
  const earnedMilestones = useMemo(() => {
    return loadPersistedMilestones(userId)
      .slice(-3)
      .reverse()
      .map(m => {
        if (m.kind === 'album') return { icon: '🏆', label: `${m.pct}% do álbum` }
        const tm = teams.find(t => t.code === m.teamCode)
        return { icon: tm?.flag ?? '🏅', label: tm ? t(tm.name_key) : m.teamCode }
      })
  }, [userId, teams, t])

  return (
    <div className='flex flex-col h-full'>
      <div className='flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6'>

        {/* 1 — Global progress */}
        <section className='flex flex-col gap-3'>
          {renderSectionHeader(t('dashboard.globalProgress'))}
          <div className='flex items-center gap-4 rounded-2xl bg-slate-900 border border-slate-800 px-5 py-4'>
            <div className='flex flex-col items-center'>
              <span className='text-4xl font-black text-white tabular-nums'>{albumPct}%</span>
              <span className='text-[10px] text-slate-500 uppercase tracking-wide mt-0.5'>do álbum</span>
            </div>
            <div className='flex-1 flex flex-col gap-1.5'>
              {progressBar(albumPct, 'bg-sky-500')}
              <p className='text-xs text-slate-400'>
                <span className='text-white font-semibold'>{albumCollected}</span>
                {' '}de {albumTotal} figurinhas
              </p>
            </div>
          </div>
        </section>

        {/* 2 — Quick links */}
        <section className='flex flex-col gap-3'>
          {renderSectionHeader(t('dashboard.shortcuts'))}
          <div className='grid grid-cols-2 gap-3'>
            <button
              type='button'
              onClick={() => navigate('/missing')}
              className='flex flex-col gap-1 rounded-xl bg-slate-900 border border-slate-800 p-4 text-left hover:border-emerald-800 transition-colors'
            >
              <span className='text-2xl font-black text-emerald-400 tabular-nums'>{totalMissing}</span>
              <span className='text-xs text-slate-400'>{t('dashboard.shortcuts')} · {t('nav.missing')}</span>
            </button>
            <button
              type='button'
              onClick={() => navigate('/swaps')}
              className='flex flex-col gap-1 rounded-xl bg-slate-900 border border-slate-800 p-4 text-left hover:border-rose-800 transition-colors'
            >
              <span className='text-2xl font-black text-rose-400 tabular-nums'>{totalSwaps}</span>
              <span className='text-xs text-slate-400'>{t('dashboard.shortcuts')} · {t('nav.swaps')}</span>
            </button>
          </div>
        </section>

        {/* 3 — Group progress */}
        <section className='flex flex-col gap-3'>
          {renderSectionHeader(t('dashboard.byGroup'))}
          <div className='flex flex-col gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3'>
            {groupRows.map(r => renderGroupRow(r.key, r.label, r.collected, r.total))}
          </div>
        </section>

        {/* 4 — Team highlights */}
        <section className='flex flex-col gap-3'>
          {renderSectionHeader(t('dashboard.topTeams'))}
          <div className='flex flex-col gap-2'>
            {topTeams.map(s => renderTeamCard(s.team, s.pct, s.collected, s.total))}
          </div>
          {nearComplete.length > 0 && (
            <>
              <p className='px-1 text-xs font-semibold text-amber-400 mt-1'>
                {t('dashboard.nearComplete')} 🔥
              </p>
              <div className='flex flex-col gap-2'>
                {nearComplete.map(s => renderTeamCard(s.team, s.pct, s.collected, s.total))}
              </div>
            </>
          )}
        </section>

        {/* 5 — Challenges preview */}
        {topChallenges.length > 0 && (
          <section className='flex flex-col gap-3'>
            {renderSectionHeader(t('dashboard.challengesPreview'))}
            <div className='flex flex-col gap-2'>
              {topChallenges.map(r => (
                <div
                  key={r.challenge.id}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${DIFFICULTY_BORDER[r.challenge.difficulty]}`}
                >
                  <span className='text-xl'>{r.challenge.icon}</span>
                  <div className='flex min-w-0 flex-1 flex-col gap-1'>
                    <p className='truncate text-xs font-semibold text-white'>{r.challenge.title}</p>
                    {progressBar(r.pct, DIFFICULTY_COLOR[r.challenge.difficulty])}
                  </div>
                  <span className={`shrink-0 text-xs font-bold tabular-nums ${DIFFICULTY_COLOR[r.challenge.difficulty].replace('bg-', 'text-')}`}>
                    {r.pct}%
                  </span>
                </div>
              ))}
            </div>
            <button
              type='button'
              onClick={() => navigate('/challenges')}
              className='text-xs text-sky-400 hover:text-sky-300 text-left px-1 transition-colors'
            >
              {t('dashboard.seeAll')} →
            </button>
          </section>
        )}

        {/* 6 — Recent badges */}
        <section className='flex flex-col gap-3'>
          {renderSectionHeader(t('dashboard.recentBadges'))}
          {earnedMilestones.length === 0 ? (
            <p className='px-1 text-xs text-slate-500'>{t('dashboard.noMilestones')}</p>
          ) : (
            <div className='flex flex-col gap-2'>
              {earnedMilestones.map((m, i) => (
                <div key={i} className='flex items-center gap-3 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2'>
                  <span className='text-xl'>{m.icon}</span>
                  <p className='text-sm font-semibold text-white'>{m.label}</p>
                  <span className='ml-auto text-xs text-amber-400'>✓</span>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
