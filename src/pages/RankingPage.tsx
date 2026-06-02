import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { usePublicRanking } from '../hooks/usePublicRanking'
import { useMyRank } from '../hooks/useMyRank'
import { useProfile } from '../state/friends'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import RankingRow from '../components/ranking/RankingRow'
import RankingMyRankWidget from '../components/ranking/RankingMyRankWidget'
import StickerListPageHeader from '../components/StickerListPageHeader'

type Props = { userId: string }

export default function RankingPage({ userId }: Props) {
  const { t } = useI18n()
  const { entries, loading: listLoading } = usePublicRanking()
  const { myRank, loading: rankLoading } = useMyRank()
  const { profile } = useProfile(userId)

  const rankingPublic = profile?.ranking_public ?? false
  const userInTop20 = entries.some(e => e.user_id === userId)

  useEffect(() => {
    telemetry.track(AnalyticsEvent.RANKING_PAGE_VIEWED, {
      user_opted_in: rankingPublic,
      user_rank: myRank?.rank ?? null,
    })
  }, [rankingPublic, myRank?.rank])

  return (
    <div className='flex flex-col h-full'>
      <StickerListPageHeader
        title={t('ranking.pageTitle')}
        icon='🏅'
        accentColor='#6366F1'
        summary={t('ranking.subtitle')}
      />

      <div className='flex-1 overflow-y-auto px-3 py-4'>
        <div className='mx-auto max-w-lg flex flex-col gap-2'>
          {listLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className='h-16 rounded-xl bg-slate-800 animate-pulse' />
            ))
          ) : entries.length === 0 ? (
            <p className='text-sm text-slate-400 text-center py-10'>{t('ranking.emptyState')}</p>
          ) : (
            entries.map(entry => (
              <RankingRow
                key={entry.user_id}
                entry={entry}
                isCurrentUser={entry.user_id === userId}
              />
            ))
          )}

          {rankingPublic && !userInTop20 && (
            <div className='mt-4'>
              <RankingMyRankWidget
                myRank={myRank}
                rankingPublic={rankingPublic}
                loading={rankLoading}
              />
            </div>
          )}

          {!rankingPublic && (
            <div className='mt-4 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 opacity-70'>
              <p className='text-sm text-slate-300 mb-1'>{t('ranking.notOptedIn')}</p>
              <Link to='/settings' className='text-xs text-indigo-400 hover:text-indigo-300'>
                {t('ranking.activateInSettings')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
