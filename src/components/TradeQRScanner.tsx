import { lazy, Suspense, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import { logger } from '../lib/logger'

const Scanner = lazy(() =>
  import('@yudiel/react-qr-scanner').then(m => ({ default: m.Scanner }))
)

type Props = {
  onScanned?: () => void
}

export function extractTradePath(text: string): string | null {
  const raw = text.trim()
  if (!raw) return null
  try {
    const url = new URL(raw, typeof window !== 'undefined' ? window.location.origin : 'https://example.invalid')
    if (!url.pathname.endsWith('/trade')) return null
    const d = url.searchParams.get('d')
    if (!d) return null
    return `/trade?d=${encodeURIComponent(d)}`
  } catch {
    return null
  }
}

async function decodeQrFromImage(file: File): Promise<string | null> {
  const { BarcodeDetector } = await import('barcode-detector/pure')
  const detector = new BarcodeDetector({ formats: ['qr_code'] })
  const bitmap = await createImageBitmap(file)
  try {
    const results = await detector.detect(bitmap)
    return results[0]?.rawValue ?? null
  } finally {
    bitmap.close?.()
  }
}

export default function TradeQRScanner({ onScanned }: Props) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [denied, setDenied] = useState(false)
  const [manualValue, setManualValue] = useState('')
  const [invalid, setInvalid] = useState(false)
  const [decoding, setDecoding] = useState(false)

  function consume(raw: string) {
    const path = extractTradePath(raw)
    if (!path) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    telemetry.track(AnalyticsEvent.TRADE_LINK_SCANNED)
    onScanned?.()
    navigate(path)
  }

  function handleScan(results: { rawValue: string }[]) {
    const raw = results[0]?.rawValue
    if (raw) consume(raw)
  }

  function handleError(err: unknown) {
    const msg = String(err).toLowerCase()
    if (msg.includes('permission') || msg.includes('denied') || msg.includes('notallowed')) {
      setDenied(true)
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setDecoding(true)
    setInvalid(false)
    try {
      const raw = await decodeQrFromImage(file)
      if (!raw) {
        setInvalid(true)
        return
      }
      consume(raw)
    } catch (err) {
      logger.warn('trade QR image decode failed', { feature: 'trade', action: 'decode_image' })
      void err
      setInvalid(true)
    } finally {
      setDecoding(false)
    }
  }

  return (
    <div className='flex flex-col gap-3'>
      {denied ? (
        <p className='text-slate-400 text-sm text-center'>{t('trade.scanCameraDenied')}</p>
      ) : (
        <Suspense fallback={<div className='text-slate-400 text-sm text-center py-8'>{t('trade.scanLoading')}</div>}>
          <div className='rounded-xl overflow-hidden'>
            <Scanner
              onScan={handleScan}
              onError={handleError}
              formats={['qr_code']}
              scanDelay={250}
              styles={{ container: { maxHeight: 360 } }}
              constraints={{
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              }}
            />
          </div>
          <p className='text-slate-500 text-xs text-center'>{t('trade.scanHint')}</p>
        </Suspense>
      )}

      <div className='flex items-center gap-2 text-slate-600 text-[10px] uppercase tracking-wider'>
        <span className='h-px flex-1 bg-slate-800' />
        <span>{t('trade.scanOr')}</span>
        <span className='h-px flex-1 bg-slate-800' />
      </div>

      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        className='sr-only'
        onChange={handleFile}
      />
      <button
        type='button'
        onClick={() => fileInputRef.current?.click()}
        disabled={decoding}
        className='w-full py-2.5 rounded-xl border border-slate-600 text-slate-200 text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50'
      >
        {decoding ? t('trade.scanDecoding') : t('trade.scanFromImage')}
      </button>

      <input
        type='text'
        value={manualValue}
        onChange={e => { setManualValue(e.target.value); setInvalid(false) }}
        placeholder={t('trade.scanPastePlaceholder')}
        className='w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500'
      />
      <button
        type='button'
        onClick={() => consume(manualValue)}
        disabled={!manualValue.trim()}
        className='w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors disabled:opacity-50'
      >
        {t('trade.scanUse')}
      </button>
      {invalid && <p className='text-rose-400 text-xs text-center' role='alert'>{t('trade.scanInvalid')}</p>}
    </div>
  )
}
