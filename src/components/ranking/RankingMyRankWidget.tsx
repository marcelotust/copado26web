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
    <div className='rounded-xl bg-slate-800 border border-indigo-500/30 overflow-hidden'>
      {/* header */}
      <div className='flex items-center justify-between px-4 pt-3 pb-2'>
        <div className='flex items-center gap-2'>
          <span className='text-base'>🏆</span>
          <p className='text-sm font-semibold text-white'>{t('ranking.pageTitle')}</p>
        </div>
        <Link to='/ranking' className='text-xs text-indigo-400 hover:text-indigo-300'>
          {t('ranking.seeFullRanking')}
        </Link>
      </div>

      {/* top 3 other users */}
      {top3.slice(0, 3).filter(e => e.user_id !== currentUserId).map(entry => (
        <Link
          key={entry.user_id}
          to={`/u/${entry.nickname ?? entry.user_id}`}
          className='flex items-center gap-3 px-4 py-2 hover:bg-slate-700/50 transition-colors'
        >
          <span className='w-6 text-center text-base shrink-0'>{rankIcon(entry.rank)}</span>
          <div className='shrink-0 w-7 h-7 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-sm'>
            {entry.avatar_url
              ? <img src={entry.avatar_url} alt='' className='w-full h-full object-cover' />
              : <span>👤</span>
            }
          </div>
          <p className='flex-1 text-sm text-white truncate'>
            {entry.display_name || entry.nickname || t('ranking.unknownUser')}
          </p>
          <p className='text-xs text-slate-400 shrink-0'>{entry.completion_pct}%</p>
        </Link>
      ))}

      {/* my rank — always shown when opted in, prominent like the master widget */}
      {myRank ? (
        <>
          {top3.filter(e => e.user_id !== currentUserId).length > 0 && (
            <div className='mx-4 my-1 border-t border-slate-700/60' />
          )}
          <div className='px-4 py-3'>
            <p className='text-xs text-slate-400 mb-0.5'>{t('ranking.myRank')}</p>
            <p className='text-2xl font-bold text-indigo-400 leading-none mb-1'>
              {rankIcon(myRank.rank)}
            </p>
            <p className='text-xs text-slate-400'>
              {myRank.completion_pct}% · {myRank.owned_count} {t('ranking.of').replace('{{total}}', '994')}
            </p>
          </div>
        </>
      ) : (
        <p className='px-4 pb-3 pt-1 text-xs text-slate-400'>{t('ranking.emptyState')}</p>
      )}
    </div>
  )
}
