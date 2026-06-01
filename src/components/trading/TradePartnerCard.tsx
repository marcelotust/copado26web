import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { AnalyticsEvent, telemetry } from '../../lib/telemetry'
import type { TradePartner } from '../../hooks/useTradePartners'

type Props = {
  partner: TradePartner
  shareText: string
}

export default function TradePartnerCard({ partner, shareText }: Props) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText })
        telemetry.track(AnalyticsEvent.TRADE_PARTNER_SHARE, { channel: 'native_share' })
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        telemetry.track(AnalyticsEvent.TRADE_PARTNER_SHARE, { channel: 'clipboard' })
      } catch { /* permissions denied */ }
    }
  }

  return (
    <div className='px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 flex flex-col gap-3'>
      <div className='flex items-center gap-3'>
        <div className='shrink-0 w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center'>
          {partner.avatar_url
            ? <img src={partner.avatar_url} alt='' className='w-full h-full object-cover' />
            : <span className='text-xl'>👤</span>
          }
        </div>
        <Link to={`/u/${partner.nickname}`} className='flex-1 min-w-0'>
          <p className='text-sm font-semibold text-white truncate'>{partner.display_name || partner.nickname}</p>
          <p className='text-xs text-slate-400'>@{partner.nickname} · {partner.completion_pct}%</p>
        </Link>
      </div>

      <div className='flex gap-2 flex-wrap'>
        <span className='px-2 py-1 rounded-md bg-emerald-900/40 border border-emerald-700/40 text-xs text-emerald-300 font-medium'>
          {t('tradingPartners.theyHaveINeed').replace('{{n}}', String(partner.they_have_i_need))}
        </span>
        <span className='px-2 py-1 rounded-md bg-amber-900/40 border border-amber-700/40 text-xs text-amber-300 font-medium'>
          {t('tradingPartners.iHaveTheyNeed').replace('{{n}}', String(partner.i_have_they_need))}
        </span>
      </div>

      <button
        type='button'
        onClick={() => void handleShare()}
        className='flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-colors'
      >
        {copied ? t('tradingPartners.copied') : t('tradingPartners.share')}
      </button>
    </div>
  )
}
