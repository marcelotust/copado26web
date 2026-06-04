import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useTradePartners } from '../hooks/useTradePartners'
import { useProfile } from '../state/friends'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import TradePartnerCard from '../components/trading/TradePartnerCard'
import StickerListPageHeader from '../components/StickerListPageHeader'

type Props = { userId: string }

export default function TradingPartnersPage({ userId }: Props) {
  const { t } = useI18n()
  const { partners, loading } = useTradePartners()
  const { profile } = useProfile(userId)

  const tradingPublic = profile?.trading_public ?? false

  useEffect(() => {
    telemetry.track(AnalyticsEvent.TRADING_PARTNERS_PAGE_VIEWED, {
      partner_count: partners.length,
    })
  }, [partners.length])

  return (
    <div className='flex flex-col h-full'>
      <StickerListPageHeader
        title={t('tradingPartners.pageTitle')}
        icon='🤝'
        accentColor='#6366F1'
        summary={t('tradingPartners.subtitle')}
      />

      <div className='flex-1 overflow-y-auto px-3 py-4'>
        <div className='mx-auto w-full max-w-6xl flex flex-col gap-3'>
          {!tradingPublic && (
            <div className='px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 opacity-70'>
              <p className='text-sm text-slate-300 mb-1'>{t('tradingPartners.notOptedIn')}</p>
              <Link to='/settings' className='text-xs text-indigo-400 hover:text-indigo-300'>
                {t('tradingPartners.activateInSettings')}
              </Link>
            </div>
          )}

          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className='h-28 rounded-xl bg-slate-800 animate-pulse' />
            ))
          ) : partners.length === 0 ? (
            <div className='py-10 text-center'>
              <p className='text-sm text-slate-300 mb-1'>{t('tradingPartners.emptyState')}</p>
              <p className='text-xs text-slate-500'>{t('tradingPartners.emptyHint')}</p>
            </div>
          ) : (
            partners.map(partner => (
              <TradePartnerCard
                key={partner.user_id}
                partner={partner}
                currentNickname={profile?.nickname ?? ''}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
