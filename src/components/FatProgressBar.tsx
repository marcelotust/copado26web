type Props = {
  pct: number
  color: string
  track?: string
}

export default function FatProgressBar({ pct, color, track = 'bg-slate-700/60' }: Props) {
  const clamped = Math.max(0, Math.min(100, pct))
  const label = `${clamped}%`

  return (
    <div className={`relative h-6 rounded-full overflow-hidden ${track}`}>
      {/* Fill bar */}
      <div
        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${clamped}%` }}
      />
      {/* Text on fill — white, clipped to filled area */}
      <div
        className='absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none'
        style={{ clipPath: `inset(0 ${100 - clamped}% 0 0)` }}
      >
        <span className='text-[11px] font-bold text-white tabular-nums select-none'>{label}</span>
      </div>
      {/* Text on track — muted, clipped to unfilled area */}
      <div
        className='absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none'
        style={{ clipPath: `inset(0 0 0 ${clamped}%)` }}
      >
        <span className='text-[11px] font-bold text-slate-400 tabular-nums select-none'>{label}</span>
      </div>
    </div>
  )
}
