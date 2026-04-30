import { useRef, useEffect, useCallback, useState } from 'react'
import Webcam from 'react-webcam'
import { useOCR } from '../hooks/useOCR'
import { incrementByCode } from '../hooks/useStickers'

const VIDEO_CONSTRAINTS = {
  facingMode: 'environment',
  width:  { ideal: 1280 },
  height: { ideal: 720 }
}

const SCAN_INTERVAL_MS = 1000

export default function OcrScanner({ onClose }) {
  const webcamRef    = useRef(null)
  const intervalRef  = useRef(null)
  const [log, setLog]        = useState([])
  const [camError, setCamError] = useState(null)

  const handleMatch = useCallback(async (code) => {
    const id = await incrementByCode(code)
    setLog(prev => [
      { code, id: id || null, ts: Date.now() },
      ...prev.slice(0, 9)
    ])
  }, [])

  const { ready, scanning, scan } = useOCR(handleMatch)

  // Periodic capture
  useEffect(() => {
    if (!ready) return
    intervalRef.current = setInterval(() => {
      if (!webcamRef.current) return
      const img = webcamRef.current.getScreenshot({ width: 640, height: 360 })
      if (img) scan(img)
    }, SCAN_INTERVAL_MS)

    return () => clearInterval(intervalRef.current)
  }, [ready, scan])

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur z-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold">📷 OCR Scanner</span>
          <span className={[
            'text-[10px] font-semibold px-2 py-0.5 rounded-full',
            ready
              ? scanning
                ? 'bg-sky-500/20 text-sky-300 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-300'
              : 'bg-slate-700 text-slate-400'
          ].join(' ')}>
            {ready ? (scanning ? 'Scanning…' : 'Ready') : 'Loading OCR…'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1"
          aria-label="Close scanner"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Camera */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 min-h-0">
        {camError ? (
          <div className="text-center text-red-400">
            <p className="font-semibold">Camera unavailable</p>
            <p className="text-sm text-slate-500 mt-1">{camError}</p>
          </div>
        ) : (
          <div className="relative w-full max-w-lg rounded-2xl overflow-hidden bg-slate-900 shadow-2xl">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.8}
              videoConstraints={VIDEO_CONSTRAINTS}
              onUserMediaError={e => setCamError(e.message ?? String(e))}
              className="w-full block"
            />
            {/* Scan overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={[
                'w-2/3 h-16 border-2 rounded-lg transition-all duration-300',
                scanning ? 'border-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.4)]' : 'border-white/30'
              ].join(' ')} />
            </div>
            {/* Corner brackets */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-sky-400 rounded-tl" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-sky-400 rounded-tr" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-sky-400 rounded-bl" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-sky-400 rounded-br" />
            </div>
          </div>
        )}

        <p className="text-slate-500 text-xs text-center">
          Point at a sticker showing a code like <span className="text-slate-300 font-mono">BRA 10</span>
        </p>

        {/* Log */}
        <div className="w-full max-w-lg space-y-1.5 max-h-40 overflow-y-auto">
          {log.map(entry => (
            <div
              key={entry.ts}
              className={[
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                entry.id
                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                  : 'bg-red-500/10 border border-red-500/20'
              ].join(' ')}
            >
              <span className="text-base">{entry.id ? '✅' : '❌'}</span>
              <span className="font-mono font-semibold text-white">{entry.code}</span>
              {entry.id
                ? <span className="text-emerald-400 text-xs ml-auto">+1 added</span>
                : <span className="text-red-400 text-xs ml-auto">not found</span>
              }
            </div>
          ))}
          {log.length === 0 && (
            <p className="text-center text-slate-700 text-xs py-2">No stickers scanned yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
