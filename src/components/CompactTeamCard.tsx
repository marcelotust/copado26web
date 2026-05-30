import type { Team } from '../types/database'

export type TeamStat = { team: Team; collected: number; total: number; pct: number }

export default function CompactTeamCard({
  stat,
  secondaryStat,
  accentColor,
  onClick,
}: {
  stat: TeamStat
  secondaryStat: string
  accentColor: string
  onClick: () => void
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5 hover:border-slate-600 transition-colors text-left w-full'
    >
      <span className='text-lg'>{stat.team.flag}</span>
      <span className='flex-1 truncate text-xs font-semibold text-white'>{stat.team.code}</span>
      <span className={`shrink-0 text-xs font-bold tabular-nums ${accentColor}`}>{stat.pct}%</span>
      <span className='shrink-0 text-[10px] text-slate-500'>{secondaryStat}</span>
    </button>
  )
}
