import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useAlbumProgress, useTeams, useMissing, useSwaps } from '../state/stickersStore'
import { useStickersContext } from '../state/StickersProvider'
import { useChallengeProgress } from '../hooks/useChallengeProgress'
import { loadPersistedMilestones } from '../lib/milestoneStorage'
import type { Milestone } from '../lib/milestoneDetection'
import { DIFFICULTY_COLOR, DIFFICULTY_BORDER, DIFFICULTY_GRADIENT } from '../components/ChallengeCard'
import { challengeTitle } from '../lib/challengeI18n'
import { interpolate } from '../lib/shareText'
import CompactTeamCard from '../components/CompactTeamCard'
import FatProgressBar from '../components/FatProgressBar'

type Props = {
  userId: string
  onShowMilestone: (m: Milestone) => void
  onNavigateToTeam: (code: string) => void
}

// ── helpers ──────────────────────────────────────────────────────────────────

const SPECIAL_CODES = new Set(['WAP', 'FWC', 'CC'])

function pctFillColor(pct: number): string {
  if (pct >= 75) return 'bg-emerald-500'
  if (pct >= 40) return 'bg-amber-500'
  return 'bg-sky-500'
}

function sectionHeader(label: string) {
  return <h2 className='px-1 text-xs font-bold uppercase tracking-widest text-slate-500'>{label}</h2>
}

function fraction(stat: { collected: number; total: number }): string {
  return `${stat.collected}/${stat.total}`
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

    // 1. WAP (opening section) — matches sidebar order
    const wapIds = byTeam.get('WAP') ?? []
    const wapCollected = wapIds.filter(id => (quantities.get(id) ?? 0) >= 1).length
    if (wapIds.length > 0) rows.push({ key: 'WAP', label: t('sections.wap'), collected: wapCollected, total: wapIds.length })

    // 2. Groups A → L
    const letters = [...new Set(teams.filter(tm => tm.group_letter).map(tm => tm.group_letter!))].sort()
    for (const letter of letters) {
      const teamsInGroup = teams.filter(tm => tm.group_letter === letter)
      const allIds = teamsInGroup.flatMap(tm => byTeam.get(tm.code) ?? [])
      const collected = allIds.filter(id => (quantities.get(id) ?? 0) >= 1).length
      rows.push({ key: `group-${letter}`, label: `${t('sidebar.group')} ${letter}`, collected, total: allIds.length })
    }

    // 3. FWC then CC — closing sections
    for (const [code, labelKey] of [['FWC', 'sections.fwc'], ['CC', 'sections.cc']] as const) {
      const ids = byTeam.get(code) ?? []
      const collected = ids.filter(id => (quantities.get(id) ?? 0) >= 1).length
      if (ids.length > 0) rows.push({ key: code, label: t(labelKey), collected, total: ids.length })
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

  return (
    <div className='flex flex-col h-full'>
      <div className='flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6'>

        {/* 1 — Global progress: 3-column stat grid */}
        <section className='flex flex-col gap-3'>
          {sectionHeader(t('dashboard.globalProgress'))}
          <div
            className='grid grid-cols-2 md:grid-cols-3 gap-2'
            data-onboarding-target='dashboard-global-progress'
          >
            {/* Album % — full width on mobile, 1 col on desktop */}
            <div className='col-span-2 md:col-span-1 relative overflow-hidden flex flex-col gap-2 rounded-xl bg-gradient-to-br from-sky-900/60 to-slate-900 border border-sky-700/30 px-3 py-3 md:px-4 md:py-4'>
              <span className='text-3xl md:text-4xl font-black text-white tabular-nums leading-none'>{albumPct}%</span>
              <FatProgressBar
                pct={albumPct}
                color='bg-sky-500'
                track='bg-sky-900/60'
                label={`${albumCollected}/${albumTotal}`}
              />
            </div>
            {/* Missing */}
            <button
              type='button'
              onClick={() => navigate('/missing')}
              className='relative overflow-hidden flex flex-col gap-1 rounded-xl bg-gradient-to-br from-amber-900/60 to-slate-900 border border-amber-700/30 px-3 py-3 md:px-4 md:py-4 text-left hover:border-amber-600/50 transition-colors'
            >
              <span className='text-3xl md:text-4xl font-black text-amber-400 tabular-nums leading-none'>{totalMissing}</span>
              <span className='text-[10px] text-amber-300/70 mt-auto'>{t('nav.missing')}</span>
            </button>
            {/* Repeated */}
            <button
              type='button'
              onClick={() => navigate('/swaps')}
              className='relative overflow-hidden flex flex-col gap-1 rounded-xl bg-gradient-to-br from-rose-900/60 to-slate-900 border border-rose-700/30 px-3 py-3 md:px-4 md:py-4 text-left hover:border-rose-600/50 transition-colors'
            >
              <span className='text-3xl md:text-4xl font-black text-rose-400 tabular-nums leading-none'>{totalSwaps}</span>
              <span className='text-[10px] text-rose-300/70 mt-auto'>{t('nav.swaps')}</span>
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
                  <button
                    key={r.challenge.id}
                    type='button'
                    onClick={() => navigate('/challenges')}
                    className={[
                      'flex items-center gap-3 rounded-xl border px-3 py-2.5 w-full text-left',
                      'bg-gradient-to-br',
                      DIFFICULTY_GRADIENT[r.challenge.difficulty],
                      DIFFICULTY_BORDER[r.challenge.difficulty],
                      'hover:brightness-110 transition-all',
                    ].join(' ')}
                  >
                    <span className='text-xl shrink-0'>{r.challenge.icon}</span>
                    <div className='flex-1 min-w-0'>
                      <FatProgressBar
                        pct={r.pct}
                        color={DIFFICULTY_COLOR[r.challenge.difficulty]}
                        label={challengeTitle(r.challenge, t)}
                      />
                    </div>
                  </button>
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
                  className='flex flex-col items-center gap-0.5 hover:scale-110 transition-transform'
                >
                  <span className='text-2xl'>{s.team.flag}</span>
                  <span className='text-[9px] font-bold text-slate-400 tracking-wide'>{s.team.code}</span>
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
                  secondaryStat={interpolate(t('dashboard.teamMissing'), { n: s.total - s.collected })}
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
                  secondaryStat={fraction(s)}
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
                    secondaryStat={interpolate(t('dashboard.teamMissing'), { n: s.total - s.collected })}
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
          <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
            {groupRows.map(r => {
              const pct = r.total > 0 ? Math.round((r.collected / r.total) * 100) : 0
              return (
                <FatProgressBar
                  key={r.key}
                  pct={pct}
                  color={pctFillColor(pct)}
                  label={r.label}
                />
              )
            })}
          </div>
        </section>

      </div>
    </div>
  )
}
