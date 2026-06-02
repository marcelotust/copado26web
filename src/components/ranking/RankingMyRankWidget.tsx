import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import type { MyRank } from '../../hooks/useMyRank'

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

type Props = {
  myRank: MyRank | null
  rankingPublic: boolean
  loading: boolean
}

export default function RankingMyRankWidget({ myRank, rankingPublic, loading }: Props) {
  const { t } = useI18n()

  if (loading) {
    return (
      <div className='rounded-xl bg-slate-800 border border-slate-700 animate-pulse h-32' />
    )
  }

  if (!rankingPublic) {
    return (
      <div className='rounded-xl bg-slate-800 border border-slate-700 px-4 py-4 opacity-60'>
        <p className='text-xs text-slate-400 mb-2'>{t('ranking.notOptedIn')}</p>
        <Link to='/settings' className='text-xs text-indigo-400 hover:text-indigo-300'>
          {t('ranking.activateInSettings')}
        </Link>
      </div>
    )
  }

  if (!myRank) {
    return (
      <div className='rounded-xl bg-slate-800 border border-slate-700/50 px-4 py-4'>
        <p className='text-xs text-slate-400'>{t('ranking.emptyState')}</p>
      </div>
    )
  }

  const medal = MEDAL[myRank.rank]
  const isTop3 = myRank.rank <= 3

  return (
    <div className='relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-950/90 via-indigo-900/30 to-slate-900 border border-indigo-500/30'>
      {/* Decorative glows */}
      <div className='pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-indigo-500/15 blur-2xl' />
      <div className='pointer-events-none absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-violet-500/10 blur-xl' />

      <div className='relative flex flex-col gap-4 px-4 py-4'>
        {/* Label */}
        <p className='text-[10px] font-bold uppercase tracking-widest text-indigo-300/60'>
          {t('ranking.myRank')}
        </p>

        {/* Position */}
        <div className='flex items-center gap-3'>
          {medal && (
            <span className='text-5xl leading-none shrink-0'>{medal}</span>
          )}
          <div>
            <p className='text-3xl font-black text-white leading-none tabular-nums'>
              {isTop3 ? `${myRank.rank}ª` : `#${myRank.rank}`}
            </p>
            <p className='text-xs text-slate-400 mt-1'>{t('ranking.generalPosition')}</p>
          </div>
        </div>

        {/* CTA */}
        <Link
          to='/ranking'
          className='flex items-center justify-center gap-1.5 w-full rounded-lg bg-indigo-600/70 hover:bg-indigo-600 border border-indigo-500/40 text-white text-xs font-semibold py-2 transition-colors'
        >
          {t('ranking.seeFullRanking')}
        </Link>
      </div>
    </div>
  )
}
