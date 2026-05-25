import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useI18n } from '../i18n'
import { useCatalogOrder, useCatalogSnapshot } from '../state/stickersStore'
import { encodeAlbumBitmap } from '../lib/albumBitmap'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'

type Props = {
  open: boolean
  onClose: () => void
}

/** Shows a QR encoding the user's whole-album state for in-person trading. */
export default function AlbumQRModal({ open, onClose }: Props) {
  const { t } = useI18n()
  const order = useCatalogOrder()
  const { quantities } = useCatalogSnapshot()

  const payload = useMemo(
    () => (order.length ? encodeAlbumBitmap(order, quantities) : ''),
    [order, quantities],
  )

  useEffect(() => {
    if (open && payload) telemetry.track(AnalyticsEvent.QR_ALBUM_GENERATED)
  }, [open, payload])

  if (!open) return null

  return createPortal(
    <div className='fixed inset-0 z-[60] flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onClose} aria-hidden />
      <div
        role='dialog'
        aria-modal
        aria-labelledby='album-qr-title'
        className='relative z-10 w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl'
      >
        <h2 id='album-qr-title' className='text-lg font-bold text-white mb-2'>
          {t('missing.tradeChecker.qrMyTitle')}
        </h2>
        <p className='text-slate-400 text-xs mb-4 leading-relaxed'>{t('missing.tradeChecker.qrMyHint')}</p>

        {payload
          ? (
            <div className='flex justify-center p-3 rounded-xl bg-white mb-4'>
              <QRCodeSVG value={payload} size={240} level='M' marginSize={1} />
            </div>
          )
          : <p className='text-amber-300/90 text-sm mb-4'>{t('missing.tradeChecker.qrMyEmpty')}</p>}

        <button
          type='button'
          onClick={onClose}
          className='mt-1 w-full py-2 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-800 transition-colors'
        >
          {t('missing.tradeChecker.qrClose')}
        </button>
      </div>
    </div>,
    document.body,
  )
}
