import { useEffect, useMemo } from 'react'
import { useI18n } from '../../i18n'
import type { TradePayload } from '../../lib/tradePayload'
import { useStickersStatus, useTradeIdLists } from '../../state/stickersStore'
import { useStickersContext } from '../../state/StickersProvider'
import { AnalyticsEvent, telemetry } from '../../lib/telemetry'
import CatalogErrorScreen from '../../components/CatalogErrorScreen'
import TradeStickerListColumn from './TradeStickerListColumn'
import { sortStickerIds } from './sortStickerIds'

export default function TradeMatchPanel({ payload }: { payload: TradePayload }) {
  const { t } = useI18n()
  const { status, error } = useStickersStatus()
  const { catalog } = useStickersContext()
  const { swapIds: bSwaps, missingIds: bMissing } = useTradeIdLists()

  const aMissing = useMemo(() => new Set(payload.missing), [payload.missing])
  const bMissingSet = useMemo(() => new Set(bMissing), [bMissing])

  const youReceive = useMemo(
    () => sortStickerIds(payload.swaps.filter((id) => bMissingSet.has(id)), catalog),
    [payload.swaps, bMissingSet, catalog],
  )
  const youGive = useMemo(() => {
    if (!payload.hasPeerMissingList) return [] as string[]
    return sortStickerIds(bSwaps.filter((id) => aMissing.has(id)), catalog)
  }, [payload.hasPeerMissingList, bSwaps, aMissing, catalog])

  useEffect(() => {
    if (status !== 'ready') return
    telemetry.track(AnalyticsEvent.TRADE_MATCH_VIEWED, {
      you_receive: youReceive.length,
      you_give: youGive.length,
      has_peer_missing_list: payload.hasPeerMissingList,
    })
  }, [status, youReceive.length, youGive.length, payload.hasPeerMissingList])

  if (status === 'idle' || status === 'loading') {
    return (
      <div className='flex flex-col items-center justify-center py-20 gap-3'>
        <span className='text-5xl animate-bounce'>⚽</span>
        <p className='text-slate-400 text-sm font-medium'>{t('loading')}</p>
      </div>
    )
  }

  if (status === 'error') {
    return <CatalogErrorScreen error={error} />
  }

  const empty = youReceive.length === 0 && youGive.length === 0

  return (
    <div className='flex flex-col gap-6'>
      {!payload.hasPeerMissingList && (
        <p className='text-center text-sky-200/85 text-sm bg-sky-950/40 border border-sky-800/60 rounded-xl px-4 py-3 leading-relaxed'>
          {t('trade.swapsOnlyBanner')}
        </p>
      )}

      {empty && (
        <p className='text-center text-slate-400 text-sm bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3'>
          {t('trade.emptyMatch')}
        </p>
      )}

      <div
        className={
          payload.hasPeerMissingList ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'grid grid-cols-1 gap-4'
        }
      >
        <TradeStickerListColumn title={t('trade.youReceive')} ids={youReceive} catalog={catalog} />
        {payload.hasPeerMissingList && (
          <TradeStickerListColumn title={t('trade.youGive')} ids={youGive} catalog={catalog} />
        )}
      </div>
    </div>
  )
}
