import { useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useI18n } from '../i18n'
import { useTradeIdLists } from '../state/stickersStore'
import { encodeTradeSwapsOnly, MAX_TRADE_PARAM_LENGTH } from '../lib/tradePayload'

type TradeQRModalProps = {
  open: boolean
  onClose: () => void
}

export default function TradeQRModal({ open, onClose }: TradeQRModalProps) {
  const { t } = useI18n()
  const { swapIds } = useTradeIdLists()
  const [copied, setCopied] = useState(false)

  const { tradeUrl, tooLong, empty } = useMemo(() => {
    if (swapIds.length === 0) {
      return { tradeUrl: '', tooLong: false, empty: true }
    }
    const d = encodeTradeSwapsOnly(swapIds)
    if (d.length > MAX_TRADE_PARAM_LENGTH) {
      return { tradeUrl: '', tooLong: true, empty: false }
    }
    const u = new URL('/trade', typeof window !== 'undefined' ? window.location.origin : 'https://example.invalid')
    u.searchParams.set('d', d)
    return { tradeUrl: u.toString(), tooLong: false, empty: false }
  }, [swapIds])

  useEffect(() => {
    if (!open) setCopied(false)
  }, [open])

  if (!open) return null

  async function copyLink() {
    if (!tradeUrl) return
    try {
      await navigator.clipboard.writeText(tradeUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return createPortal(
    <div className='fixed inset-0 z-[60] flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onClose} aria-hidden />
      <div
        role='dialog'
        aria-modal
        aria-labelledby='trade-qr-title'
        className='relative z-10 w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl'
      >
        <h2 id='trade-qr-title' className='text-lg font-bold text-white mb-2'>
          {t('trade.generateTitle')}
        </h2>
        <p className='text-slate-400 text-xs mb-4 leading-relaxed'>{t('trade.generateHint')}</p>

        {empty && (
          <p className='text-amber-300/90 text-sm mb-4'>{t('trade.emptyLists')}</p>
        )}
        {tooLong && (
          <p className='text-amber-300/90 text-sm mb-4'>{t('trade.payloadTooLong')}</p>
        )}

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
