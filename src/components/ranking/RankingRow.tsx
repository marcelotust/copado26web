import { Link } from 'react-router-dom'
import type { RankingEntry } from '../../hooks/usePublicRanking'

const TOTAL = 994

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

type Props = {
  entry: RankingEntry
  isCurrentUser: boolean
}

export default function RankingRow({ entry, isCurrentUser }: Props) {
  const pctRounded = Math.round(entry.completion_pct)
  const missing = TOTAL - entry.owned_count
  const isMedal = entry.rank <= 3

  return (
    <Link
      to={`/u/${entry.nickname}`}
      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors hover:bg-slate-800/60 ${
        isCurrentUser ? 'border border-indigo-500/40 bg-indigo-950/30' : ''
      }`}
    >
      {/* Medal / position */}
      <div className='shrink-0 w-12 text-center'>
        {isMedal ? (
          <span className='text-4xl leading-none'>{MEDAL[entry.rank]}</span>
        ) : (
          <span className='text-lg font-bold text-slate-400'>#{entry.rank}</span>
        )}
      </div>

      {/* Name + nickname + progress bar */}
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-semibold text-white truncate'>
          {entry.display_name || entry.nickname}
        </p>
        <p className='text-xs text-slate-400 mb-1'>@{entry.nickname}</p>
        <div className='h-1.5 rounded-full bg-slate-700 overflow-hidden'>
          <div
            className='h-full rounded-full bg-emerald-500 transition-all'
            style={{ width: `${pctRounded}%` }}
          />
        </div>
      </div>

      {/* Stats: pct + missing */}
      <div className='shrink-0 text-right min-w-[3.5rem]'>
        <p className='text-sm font-bold text-white'>{pctRounded}%</p>
        <p className='text-[10px] text-slate-500 leading-tight'>fig. faltando</p>
        <p className='text-base font-bold text-slate-400 leading-tight'>{missing}</p>
      </div>
    </Link>
  )
}
