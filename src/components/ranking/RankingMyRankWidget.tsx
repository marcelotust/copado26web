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
