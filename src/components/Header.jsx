import { useProgress } from '../hooks/useStickers'
import { useI18n } from '../i18n'

export default function Header({ onScanClick, onSwapsClick, view }) {
  const { total, collected, swaps } = useProgress()
  const { t } = useI18n()
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0

  return (
    <header className="shrink-0 flex items-center gap-3 px-4 py-2.5 bg-slate-900/95 backdrop-blur border-b border-slate-800 z-10">
      {/* Title — hidden on mobile since sidebar logo covers it */}
      <div className="hidden md:block shrink-0">
        <span className="text-white font-black text-base tracking-tight">WC 2026</span>
      </div>

      {/* Progress */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <div className="flex-1 bg-slate-800 rounded-full h-2 min-w-[60px]">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-slate-400 text-xs tabular-nums shrink-0">
          <span className="text-white font-semibold">{collected}</span>
          <span className="text-slate-600">/{total}</span>
        </span>
        <span className="text-slate-500 text-xs shrink-0 hidden sm:inline">{pct}%</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onSwapsClick}
          className={[
            'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
            view === 'swaps'
              ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          ].join(' ')}
        >
          🔄
          <span className="hidden sm:inline">{t('header.swaps')}</span>
          {swaps > 0 && (
            <span className="bg-amber-500 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
              {swaps}
            </span>
          )}
        </button>

        <button
          onClick={onScanClick}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
            view === 'scanner'
              ? 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          ].join(' ')}
        >
          📷
          <span className="hidden sm:inline">{t('header.scan')}</span>
        </button>
      </div>
    </header>
  )
}
