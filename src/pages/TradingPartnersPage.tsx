import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useTradePartners } from '../hooks/useTradePartners'
import { useProfile } from '../state/friends'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import TradePartnerCard from '../components/trading/TradePartnerCard'

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
      <div className='shrink-0 border-b border-slate-800 bg-slate-900/95 px-4 py-3'>
        <div className='mx-auto max-w-lg'>
          <h1 className='text-lg font-bold text-white'>{t('tradingPartners.pageTitle')}</h1>
          <p className='text-sm text-slate-400'>{t('tradingPartners.subtitle')}</p>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto px-3 py-4'>
        <div className='mx-auto max-w-lg flex flex-col gap-3'>
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
            partners.map(partner => {
              const shareText = t('tradingPartners.shareText')
                .replace('{{nickname}}', partner.nickname)
                .replace('{{m}}', String(partner.they_have_i_need))
                .replace('{{n}}', String(partner.i_have_they_need))
              return (
                <TradePartnerCard
                  key={partner.user_id}
                  partner={partner}
                  shareText={shareText}
                />
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
