import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import type { MyRank } from '../../hooks/useMyRank'

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
        <div className='h-4 w-32 bg-slate-700 rounded mb-2' />
        <div className='h-3 w-48 bg-slate-700 rounded' />
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
    <div className='px-4 py-3 rounded-xl bg-slate-800 border border-indigo-500/30'>
      <p className='text-sm font-semibold text-white mb-1'>🏆 {t('ranking.myRank')}</p>
      {myRank ? (
        <>
          <p className='text-2xl font-bold text-indigo-400 mb-0.5'>
            {`#${myRank.rank}`}
          </p>
          <p className='text-xs text-slate-400 mb-2'>
            {myRank.completion_pct}% · {myRank.owned_count} {t('ranking.of').replace('{{total}}', '994')}
          </p>
        </>
      ) : (
        <p className='text-xs text-slate-400 mb-2'>{t('ranking.noRank')}</p>
      )}
      <Link to='/ranking' className='text-xs text-indigo-400 hover:text-indigo-300'>
        {t('ranking.seeFullRanking')}
      </Link>
    </div>
  )
}
