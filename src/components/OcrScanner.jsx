import { useRef, useEffect, useCallback, useState } from 'react'
import Webcam from 'react-webcam'
import { useOCR } from '../hooks/useOCR'
import { incrementByCode } from '../hooks/useStickers'
import { useI18n } from '../i18n'

const VIDEO_CONSTRAINTS = {
  facingMode: { ideal: 'environment' },
  width:  { ideal: 1920 },
  height: { ideal: 1080 }
}

export default function OcrScanner({ onClose }) {
  const { t } = useI18n()
  const webcamRef             = useRef(null)
  const [log, setLog]         = useState([])
  const [camError, setCamError] = useState(null)
  const [autoScan, setAutoScan] = useState(true)
  const [manualCode, setManualCode] = useState('')
  const [showRaw, setShowRaw] = useState(false)

  const handleMatch = useCallback(async (code) => {
    const id = await incrementByCode(code)
    setLog(prev => [
      { code, id: id || null, ts: Date.now() },
      ...prev.slice(0, 14)
    ])
  }, [])

  const { ready, scanning, rawText, scan } = useOCR(handleMatch)

  const capture = useCallback(() => {
    if (!webcamRef.current) return
    // Capture at full resolution for better OCR accuracy
    const img = webcamRef.current.getScreenshot()
    if (img) scan(img)
  }, [scan])

  // Auto-scan: fires only when previous scan is done (scan guards itself internally)
  useEffect(() => {
    if (!ready || !autoScan) return
    const id = setInterval(capture, 1500)
    return () => clearInterval(id)
  }, [ready, autoScan, capture])

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    const id = await incrementByCode(manualCode.trim())
    setLog(prev => [
      { code: manualCode.trim().toUpperCase(), id: id || null, ts: Date.now() },
      ...prev.slice(0, 14)
    ])
    setManualCode('')
  }

  return (
    <div className="fixed inset-0 bg-slate-950/97 backdrop-blur z-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-bold">📷 {t('scanner.title')}</span>
          <span className={[
            'text-[10px] font-semibold px-2 py-0.5 rounded-full',
            !ready    ? 'bg-slate-700 text-slate-400 animate-pulse'
            : scanning ? 'bg-sky-500/20 text-sky-300'
                       : 'bg-emerald-500/20 text-emerald-300'
          ].join(' ')}>
            {!ready ? t('scanner.ocrLoading') : scanning ? t('scanner.scanning') : t('scanner.ready')}
          </span>
          <button
            onClick={() => setAutoScan(a => !a)}
            className={[
              'text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors',
              autoScan
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-slate-700/50 text-slate-500 border-slate-700'
            ].join(' ')}
          >
            {autoScan ? '⏸ Auto' : '▶ Auto'}
          </button>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1" aria-label="Close">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0 overflow-y-auto">
        {/* Left — camera */}
        <div className="flex flex-col items-center gap-3 lg:flex-1">
          {camError ? (
            <div className="w-full max-w-lg rounded-2xl bg-slate-900 flex items-center justify-center h-48 text-center px-4">
              <div>
                <p className="text-red-400 font-semibold">{t('scanner.camError')}</p>
                <p className="text-slate-500 text-xs mt-1">{camError}</p>
                <p className="text-slate-600 text-xs mt-2">{t('scanner.useManual')}</p>
              </div>
            </div>
          ) : (
            <div className="relative w-full max-w-lg rounded-2xl overflow-hidden bg-slate-900 shadow-2xl">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.92}
                videoConstraints={VIDEO_CONSTRAINTS}
                onUserMediaError={e => setCamError(e.message ?? String(e))}
                className="w-full block"
              />
              {/* Scan target zone */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={[
                  'w-4/5 h-20 border-2 rounded-xl transition-all duration-300',
                  scanning
                    ? 'border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.5)]'
                    : 'border-white/25'
                ].join(' ')} />
              </div>
              {/* Corners */}
              <div className="absolute inset-0 pointer-events-none">
                {[['top-3 left-3 border-t-2 border-l-2 rounded-tl'],
                  ['top-3 right-3 border-t-2 border-r-2 rounded-tr'],
                  ['bottom-3 left-3 border-b-2 border-l-2 rounded-bl'],
                  ['bottom-3 right-3 border-b-2 border-r-2 rounded-br']
                ].map(([cls], i) => (
                  <div key={i} className={`absolute w-6 h-6 border-sky-400 ${cls}`} />
                ))}
              </div>
            </div>
          )}

          {/* Manual capture button */}
          <button
            onClick={capture}
            disabled={!ready || scanning || !!camError}
            className="w-full max-w-lg py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold text-sm transition-colors active:scale-95"
          >
            {scanning ? t('scanner.scanning') : t('scanner.capture')}
          </button>

          <p className="text-slate-600 text-xs text-center">
            {t('scanner.alignHint')} <span className="text-slate-400 font-mono">BRA 10</span>
          </p>

          {/* Raw OCR output (debug) */}
          {rawText && (
            <div className="w-full max-w-lg">
              <button
                onClick={() => setShowRaw(r => !r)}
                className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
              >
                {showRaw ? t('scanner.hideRaw') : t('scanner.showRaw')}
              </button>
              {showRaw && (
                <pre className="mt-1 bg-slate-900 rounded-lg p-2 text-[10px] text-slate-400 font-mono whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                  {rawText}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Right — log + manual input */}
        <div className="flex flex-col gap-3 lg:w-72 shrink-0">
          {/* Manual input */}
          <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
            <p className="text-xs text-slate-400 font-semibold mb-2">{t('scanner.typeLabel')}</p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                value={manualCode}
                onChange={e => setManualCode(e.target.value.toUpperCase())}
                placeholder={t('scanner.placeholder')}
                maxLength={8}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg text-white text-sm font-bold transition-colors"
              >
                {t('scanner.add')}
              </button>
            </form>
          </div>

          {/* Scan log */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 flex-1 flex flex-col min-h-0">
            <p className="text-xs text-slate-500 font-semibold px-3 pt-3 pb-2 border-b border-slate-800">
              {t('scanner.logTitle')}
            </p>
            <div className="overflow-y-auto flex-1 p-2 space-y-1.5">
              {log.length === 0 ? (
                <p className="text-center text-slate-700 text-xs py-4">{t('scanner.empty')}</p>
              ) : log.map(entry => (
                <div
                  key={entry.ts}
                  className={[
                    'flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm',
                    entry.id
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-red-500/10 border border-red-500/20'
                  ].join(' ')}
                >
                  <span>{entry.id ? '✅' : '❌'}</span>
                  <span className="font-mono font-semibold text-white flex-1">{entry.code}</span>
                  <span className={`text-[10px] shrink-0 ${entry.id ? 'text-emerald-400' : 'text-red-400'}`}>
                    {entry.id ? t('scanner.added') : t('scanner.notFound')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
