import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { useI18n } from '../i18n'
import { decodeTradePayload } from '../lib/tradePayload'
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

  if (!d?.trim()) {
    return (
      <TradePageLayout session={session} title={t('trade.pageTitle')}>
        <TradeInvalidState title={t('trade.invalidTitle')} body={t('trade.missingParam')} />
      </TradePageLayout>
    )
  }

  if (!payload) {
    return (
      <TradePageLayout session={session} title={t('trade.pageTitle')}>
        <TradeInvalidState title={t('trade.invalidTitle')} body={t('trade.invalidDesc')} />
      </TradePageLayout>
    )
  }

  if (!session) {
    return (
      <TradePageLayout session={session} title={t('trade.pageTitle')}>
        <TradeLoginState />
      </TradePageLayout>
    )
  }

  return (
    <TradePageLayout session={session} title={t('trade.pageTitle')}>
      <TradeMatchPanel payload={payload} />
    </TradePageLayout>
  )
}
