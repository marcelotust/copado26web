import { useMemo } from 'react'
import { useI18n } from '../../i18n'
import type { TradePayload } from '../../lib/tradePayload'
import { useStickersStatus, useTradeIdLists } from '../../state/stickersStore'
import { useStickersContext } from '../../state/StickersProvider'
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
  const youGive = useMemo(
    () => sortStickerIds(bSwaps.filter((id) => aMissing.has(id)), catalog),
    [bSwaps, aMissing, catalog],
  )

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
      {empty && (
        <p className='text-center text-slate-400 text-sm bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3'>
          {t('trade.emptyMatch')}
        </p>
      )}

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <TradeStickerListColumn title={t('trade.youReceive')} ids={youReceive} catalog={catalog} />
        <TradeStickerListColumn title={t('trade.youGive')} ids={youGive} catalog={catalog} />
      </div>
    </div>
  )
}
