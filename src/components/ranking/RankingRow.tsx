import { Link } from 'react-router-dom'
import type { RankingEntry } from '../../hooks/usePublicRanking'

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

type Props = {
  entry: RankingEntry
  isCurrentUser: boolean
}

export default function RankingRow({ entry, isCurrentUser }: Props) {
  const pctRounded = Math.round(entry.completion_pct)

  return (
    <Link
      to={`/u/${entry.nickname}`}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-slate-800/60 ${
        isCurrentUser ? 'border border-indigo-500/40 bg-indigo-950/30' : ''
      }`}
    >
      <span className='w-8 text-center text-sm font-bold shrink-0 text-slate-400'>
        {MEDAL[entry.rank] ?? `#${entry.rank}`}
      </span>

      <div className='shrink-0 w-9 h-9 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center'>
        {entry.avatar_url
          ? <img src={entry.avatar_url} alt='' className='w-full h-full object-cover' />
          : <span className='text-lg'>👤</span>
        }
      </div>

      <div className='flex-1 min-w-0'>
        <p className='text-sm font-semibold text-white truncate'>
          {entry.display_name || entry.nickname}
        </p>
        <p className='text-xs text-slate-400'>@{entry.nickname}</p>
        <div className='mt-1 h-1.5 rounded-full bg-slate-700 overflow-hidden'>
          <div
            className='h-full rounded-full bg-emerald-500 transition-all'
            style={{ width: `${pctRounded}%` }}
          />
        </div>
      </div>

      <div className='shrink-0 text-right'>
        <p className='text-sm font-bold text-white'>{entry.owned_count}</p>
        <p className='text-xs text-slate-500'>/ 994</p>
      </div>
    </Link>
  )
}
