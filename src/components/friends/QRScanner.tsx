import { lazy, Suspense, useState } from 'react'
import { useI18n } from '../../i18n'
import { AnalyticsEvent, telemetry } from '../../lib/telemetry'

// Lazy-load scanner — only bundled when the user opens the QR tab
const Scanner = lazy(() =>
  import('@yudiel/react-qr-scanner').then(m => ({ default: m.Scanner }))
)

type Props = {
  onResult: (nickname: string) => void
}

const NICKNAME_RE = /^[a-z0-9_]{3,20}$/

export function extractNickname(text: string): string | null {
  let candidate: string | null = null
  try {
    const url = new URL(text)
    candidate = url.searchParams.get('code')
  } catch { /* not a URL — fall through to raw text */ }
  if (candidate === null) candidate = text
  const normalized = candidate.trim().toLowerCase()
  return NICKNAME_RE.test(normalized) ? normalized : null
}

export default function QRScanner({ onResult }: Props) {
  const { t } = useI18n()
  const [denied, setDenied] = useState(false)
  const [manualValue, setManualValue] = useState('')

  function handleScan(results: { rawValue: string }[]) {
    const raw = results[0]?.rawValue
    if (!raw) return
    const nickname = extractNickname(raw)
    if (nickname) {
      telemetry.track(AnalyticsEvent.QR_PROFILE_SCANNED)
      onResult(nickname)
    }
  }

  function handleError(err: unknown) {
    const msg = String(err).toLowerCase()
    if (msg.includes('permission') || msg.includes('denied') || msg.includes('notallowed')) {
      setDenied(true)
    }
  }

  if (denied) {
    return (
      <div className='flex flex-col gap-3 py-2'>
        <p className='text-slate-400 text-sm text-center'>{t('friends.qr.cameraDenied')}</p>
        <input
          type='text'
          value={manualValue}
          onChange={e => setManualValue(e.target.value)}
          placeholder={t('friends.qr.pasteLink')}
          className='w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500'
        />
        <button
          type='button'
          onClick={() => {
            const n = extractNickname(manualValue)
            if (n) onResult(n)
          }}
          disabled={!manualValue}
          className='w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50'
        >
          {t('friends.qr.use')}
        </button>
      </div>
    )
  }

  return (
    <Suspense fallback={<div className='text-slate-400 text-sm text-center py-8'>{t('friends.qr.loading')}</div>}>
      <div className='rounded-xl overflow-hidden'>
        <Scanner
          onScan={handleScan}
          onError={handleError}
          styles={{ container: { maxHeight: 280 } }}
          constraints={{ facingMode: 'environment' }}
        />
      </div>
      <p className='text-slate-500 text-xs text-center mt-2'>{t('friends.qr.scanHint')}</p>
    </Suspense>
  )
}
