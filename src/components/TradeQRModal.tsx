import { useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useI18n } from '../i18n'
import { useTradeIdLists } from '../state/stickersStore'
import { isShareAbort, logger } from '../lib/logger'
import { encodeTradeSmaller, MAX_TRADE_PARAM_LENGTH } from '../lib/tradePayload'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import TradeQRScanner from './TradeQRScanner'

export type TradeQRModalTab = 'show' | 'scan'

type TradeQRModalProps = {
  open: boolean
  onClose: () => void
  initialTab?: TradeQRModalTab
}

export default function TradeQRModal({ open, onClose, initialTab = 'show' }: TradeQRModalProps) {
  const { t } = useI18n()
  const { swapIds, missingIds } = useTradeIdLists()
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<TradeQRModalTab>(initialTab)

  const { tradeUrl, tradeKind, tooLong, empty } = useMemo(() => {
    if (swapIds.length === 0 && missingIds.length === 0) {
      return { tradeUrl: '', tradeKind: 'swaps' as const, tooLong: false, empty: true }
    }
    const { d, kind } = encodeTradeSmaller(swapIds, missingIds)
    if (d.length > MAX_TRADE_PARAM_LENGTH) {
      return { tradeUrl: '', tradeKind: kind, tooLong: true, empty: false }
    }
    const u = new URL('/trade', typeof window !== 'undefined' ? window.location.origin : 'https://example.invalid')
    u.searchParams.set('d', d)
    return { tradeUrl: u.toString(), tradeKind: kind, tooLong: false, empty: false }
  }, [swapIds, missingIds])

  useEffect(() => {
    if (!open) setCopied(false)
  }, [open])

  useEffect(() => {
    if (open) setTab(initialTab)
  }, [open, initialTab])

  useEffect(() => {
    if (open && tab === 'show' && tradeUrl) {
      const count = tradeKind === 'swaps' ? swapIds.length : missingIds.length
      telemetry.track(AnalyticsEvent.TRADE_LINK_GENERATED, { swap_count: count, kind: tradeKind })
    }
  }, [open, tab, tradeUrl, tradeKind, swapIds.length, missingIds.length])

  if (!open) return null

  async function copyLink() {
    if (!tradeUrl) return
    try {
      await navigator.clipboard.writeText(tradeUrl)
      telemetry.track(AnalyticsEvent.TRADE_LINK_COPIED)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      if (!isShareAbort(err)) {
        logger.warn('trade link copy failed', { feature: 'trade', action: 'copy_link' })
      }
      setCopied(false)
    }
  }

  const title = tab === 'show' ? t('trade.generateTitle') : t('trade.scanTitle')

  return createPortal(
    <div className='fixed inset-0 z-[60] flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onClose} aria-hidden />
      <div
        role='dialog'
        aria-modal
        aria-labelledby='trade-qr-title'
        className='relative z-10 w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl'
      >
        <h2 id='trade-qr-title' className='text-lg font-bold text-white mb-3'>
          {title}
        </h2>

        <div role='tablist' className='flex gap-1 p-1 mb-4 rounded-xl bg-slate-800/60 border border-slate-700'>
          <button
            type='button'
            role='tab'
            aria-selected={tab === 'show'}
            onClick={() => setTab('show')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${tab === 'show' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'}`}
          >
            {t('trade.showTab')}
          </button>
          <button
            type='button'
            role='tab'
            aria-selected={tab === 'scan'}
            onClick={() => setTab('scan')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${tab === 'scan' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'}`}
          >
            {t('trade.scanTab')}
          </button>
        </div>

        {tab === 'show' && (
          <>
            <p className='text-slate-400 text-xs mb-4 leading-relaxed'>
              {tradeKind === 'swaps' ? t('trade.generateHintSwaps') : t('trade.generateHintMissing')}
            </p>
            {empty && <p className='text-amber-300/90 text-sm mb-4'>{t('trade.emptyLists')}</p>}
            {tooLong && <p className='text-amber-300/90 text-sm mb-4'>{t('trade.payloadTooLong')}</p>}
            {!empty && !tooLong && tradeUrl && (
              <>
                <div className='flex justify-center p-3 rounded-xl bg-white mb-4'>
                  <QRCodeSVG value={tradeUrl} size={220} level='M' marginSize={1} />
                </div>
                <button
                  type='button'
                  onClick={copyLink}
                  className='w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors'
                >
                  {copied ? t('trade.copied') : t('trade.copyLink')}
                </button>
              </>
            )}
          </>
        )}

        {tab === 'scan' && (
          <TradeQRScanner onScanned={onClose} />
        )}

        <button
          type='button'
          onClick={onClose}
          className='mt-3 w-full py-2 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-800 transition-colors'
        >
          {t('trade.close')}
        </button>
      </div>
    </div>,
    document.body,
  )
}
