import { lazy, Suspense, useState } from 'react'
import { useI18n } from '../i18n'

// Lazy-load the camera scanner — only bundled when the user opens it.
const Scanner = lazy(() =>
  import('@yudiel/react-qr-scanner').then(m => ({ default: m.Scanner })),
)

type Props = {
  /** Raw scanned string (an `mab:` album payload). */
  onDecode: (raw: string) => void
  onClose: () => void
}

/** Camera scanner that hands the raw QR string to the trade checker to decode. */
export default function AlbumQRScanner({ onDecode, onClose }: Props) {
  const { t } = useI18n()
  const [denied, setDenied] = useState(false)
  const [manual, setManual] = useState('')

  function handleScan(results: { rawValue: string }[]) {
    const raw = results[0]?.rawValue
    if (raw) onDecode(raw)
  }

  function handleError(err: unknown) {
    const msg = String(err).toLowerCase()
    if (msg.includes('permission') || msg.includes('denied') || msg.includes('notallowed')) {
      setDenied(true)
    }
  }

  return (
    <div className='flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-950/40 p-3'>
      {denied ? (
        <>
          <p className='text-slate-400 text-xs text-center'>{t('missing.tradeChecker.qrCameraDenied')}</p>
          <input
            type='text'
            value={manual}
            onChange={e => setManual(e.target.value)}
            placeholder='mab:...'
            className='w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 font-mono text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none'
          />
          <button
            type='button'
            onClick={() => manual.trim() && onDecode(manual.trim())}
            disabled={!manual.trim()}
            className='rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-40'
          >
            {t('missing.tradeChecker.qrUse')}
          </button>
        </>
      ) : (
        <Suspense fallback={<p className='py-6 text-center text-xs text-slate-400'>{t('missing.tradeChecker.qrLoading')}</p>}>
          <div className='overflow-hidden rounded-lg'>
            <Scanner
              onScan={handleScan}
              onError={handleError}
              styles={{ container: { maxHeight: 260 } }}
              constraints={{ facingMode: 'environment' }}
            />
          </div>
          <p className='text-center text-[11px] text-slate-500'>{t('missing.tradeChecker.qrScanHint')}</p>
        </Suspense>
      )}
      <button
        type='button'
        onClick={onClose}
        className='self-center text-xs text-slate-400 underline-offset-2 hover:underline'
      >
        {t('missing.tradeChecker.qrCancel')}
      </button>
    </div>
  )
}
