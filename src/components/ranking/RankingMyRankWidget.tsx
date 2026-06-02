import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import type { MyRank } from '../../hooks/useMyRank'
import type { RankingEntry } from '../../hooks/usePublicRanking'

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function rankIcon(rank: number): string {
  return MEDAL[rank] ?? `#${rank}`
}

type Props = {
  myRank: MyRank | null
  rankingPublic: boolean
  loading: boolean
  top3?: RankingEntry[]
  currentUserId?: string
}

export default function RankingMyRankWidget({
  myRank,
  rankingPublic,
  loading,
  top3 = [],
  currentUserId,
}: Props) {
  const { t } = useI18n()

  // ── loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className='rounded-xl bg-slate-800 border border-slate-700 animate-pulse overflow-hidden'>
        <div className='h-4 w-24 bg-slate-700 rounded m-4 mb-2' />
        {[1, 2, 3].map(i => (
          <div key={i} className='flex items-center gap-3 px-4 py-2'>
            <div className='w-6 h-4 bg-slate-700 rounded' />
            <div className='w-7 h-7 rounded-full bg-slate-700 shrink-0' />
            <div className='flex-1 h-3 bg-slate-700 rounded' />
            <div className='w-10 h-3 bg-slate-700 rounded' />
          </div>
        ))}
      </div>
    )
  }

  // ── não participando ──────────────────────────────────────────────────────
  if (!rankingPublic) {
    return (
      <div className='px-4 py-3 rounded-xl bg-slate-800 border border-slate-700'>
        <div className='flex items-center gap-2 mb-1'>
          <span className='text-base'>🏆</span>
          <p className='text-sm font-semibold text-white'>{t('ranking.pageTitle')}</p>
        </div>
        <p className='text-xs text-slate-400 mb-2'>{t('ranking.notOptedIn')}</p>
        <Link to='/settings' className='text-xs text-indigo-400 hover:text-indigo-300'>
          {t('ranking.activateInSettings')}
        </Link>
      </div>
    )
  }

  // ── participando ──────────────────────────────────────────────────────────
  return (
    <div className='rounded-xl bg-slate-800 border border-indigo-500/30 overflow-hidden'>
      <div className='flex items-center justify-between px-4 pt-3 pb-2'>
        <div className='flex items-center gap-2'>
          <span className='text-base'>🏆</span>
          <p className='text-sm font-semibold text-white'>{t('ranking.pageTitle')}</p>
        </div>
        <Link to='/ranking' className='text-xs text-indigo-400 hover:text-indigo-300'>
          {t('ranking.seeFullRanking')}
        </Link>
      </div>

      {/* Top 3 */}
      {top3.slice(0, 3).map(entry => (
        <Link
          key={entry.user_id}
          to={`/u/${entry.nickname}`}
          className={`flex items-center gap-3 px-4 py-2 hover:bg-slate-700/50 transition-colors ${
            entry.user_id === currentUserId ? 'bg-indigo-950/30' : ''
          }`}
        >
          <span className='w-6 text-center text-base shrink-0'>{rankIcon(entry.rank)}</span>
          <div className='shrink-0 w-7 h-7 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-sm'>
            {entry.avatar_url
              ? <img src={entry.avatar_url} alt='' className='w-full h-full object-cover' />
              : <span>👤</span>
            }
          </div>
          <p className='flex-1 text-sm text-white truncate'>{entry.display_name || entry.nickname}</p>
          <p className='text-xs text-slate-400 shrink-0'>{entry.completion_pct}%</p>
        </Link>
      ))}

      {/* Minha posição abaixo do top 3 */}
      {myRank && (top3.length === 0 || myRank.rank > 3) && (
        <>
          {top3.length > 0 && <div className='mx-4 my-1 border-t border-slate-700/60' />}
          <div className='flex items-center gap-3 px-4 py-2'>
            <span className='w-6 text-center text-sm font-bold text-indigo-400 shrink-0'>
              {rankIcon(myRank.rank)}
            </span>
            <div className='shrink-0 w-7 h-7 rounded-full bg-indigo-900/60 border border-indigo-500/40 flex items-center justify-center text-sm'>
              👤
            </div>
            <p className='flex-1 text-sm text-indigo-300'>{t('ranking.myRank')}</p>
            <p className='text-xs text-slate-400 shrink-0'>{myRank.completion_pct}%</p>
          </div>
        </>
      )}

      {/* Sem dados ainda */}
      {top3.length === 0 && !myRank && (
        <p className='px-4 pb-3 pt-1 text-sm text-slate-400'>{t('ranking.emptyState')}</p>
      )}
    </div>
  )
}
