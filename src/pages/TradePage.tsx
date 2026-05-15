import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { useI18n } from '../i18n'
import { decodeTradePayload } from '../lib/tradePayload'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import TradePageLayout from './trade/TradePageLayout'
import TradeInvalidState from './trade/TradeInvalidState'
import TradeLoginState from './trade/TradeLoginState'
import TradeMatchPanel from './trade/TradeMatchPanel'

type TradePageProps = { session: Session | null }

export default function TradePage({ session }: TradePageProps) {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const d = params.get('d')
  const payload = useMemo(() => decodeTradePayload(d), [d])

  const invalidReason: 'missing_param' | 'invalid_payload' | null = !d?.trim()
    ? 'missing_param'
    : !payload
      ? 'invalid_payload'
      : null

  const loginRequired = invalidReason === null && !session

  useEffect(() => {
    if (invalidReason) {
      telemetry.track(AnalyticsEvent.TRADE_LINK_INVALID, { reason: invalidReason })
    } else if (loginRequired) {
      telemetry.track(AnalyticsEvent.TRADE_LOGIN_REQUIRED)
    }
  }, [invalidReason, loginRequired])

  if (invalidReason) {
    return (
      <TradePageLayout session={session} title={t('trade.pageTitle')}>
        <TradeInvalidState
          title={t('trade.invalidTitle')}
          body={invalidReason === 'missing_param' ? t('trade.missingParam') : t('trade.invalidDesc')}
        />
      </TradePageLayout>
    )
  }

  if (loginRequired) {
    return (
      <TradePageLayout session={session} title={t('trade.pageTitle')}>
        <TradeLoginState />
      </TradePageLayout>
    )
  }

  return (
    <TradePageLayout session={session} title={t('trade.pageTitle')}>
      <TradeMatchPanel payload={payload!} />
    </TradePageLayout>
  )
}
