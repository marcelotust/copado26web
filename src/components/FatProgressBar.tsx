type Props = {
  pct: number
  color: string
  track?: string
  label?: string
}

export default function FatProgressBar({ pct, color, track = 'bg-slate-700/60', label }: Props) {
  const clamped = Math.max(0, Math.min(100, pct))
  const pctLabel = `${clamped}%`
  const textLayout = label ? 'justify-between' : 'justify-center'

  return (
    <div className={`relative h-7 rounded-full overflow-hidden ${track}`}>
      {/* Fill with top shine */}
      <div
        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${clamped}%` }}
      >
        <div className='absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent' />
      </div>

      {/* Text layer — white (clipped to filled area) */}
      <div
        className={`absolute inset-0 flex items-center ${textLayout} px-3 gap-2 overflow-hidden pointer-events-none`}
        style={{ clipPath: `inset(0 ${100 - clamped}% 0 0)` }}
      >
        {label && (
          <span className='text-[11px] font-semibold text-white truncate min-w-0 select-none leading-none'>
            {label}
          </span>
        )}
        <span className='text-[11px] font-bold text-white tabular-nums shrink-0 select-none leading-none'>
          {pctLabel}
        </span>
      </div>

      {/* Text layer — muted (clipped to unfilled area) */}
      <div
        className={`absolute inset-0 flex items-center ${textLayout} px-3 gap-2 overflow-hidden pointer-events-none`}
        style={{ clipPath: `inset(0 0 0 ${clamped}%)` }}
      >
        {label && (
          <span className='text-[11px] font-semibold text-slate-400 truncate min-w-0 select-none leading-none'>
            {label}
          </span>
        )}
        <span className='text-[11px] font-bold text-slate-500 tabular-nums shrink-0 select-none leading-none'>
          {pctLabel}
        </span>
      </div>
    </div>
  )
}
